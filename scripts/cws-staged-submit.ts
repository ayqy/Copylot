#!/usr/bin/env node

import 'dotenv/config';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { setGlobalDispatcher } from 'undici';

import {
  createUndiciProxyDispatcher,
  resolveCwsProxyEnv
} from './cws-proxy.ts';
import {
  formatCwsItemErrors,
  formatCwsV2UploadFailure,
  sanitizeCwsDraftStatus,
  sanitizeCwsV2UploadStatus,
  type CwsDraftStatus,
  type CwsV2UploadStatus
} from './cws-staged-status.ts';

type Command = 'validate' | 'status' | 'submit';

type SubmitConfig = {
  schema_version: 1;
  product: {
    name: string;
    platform: 'cws';
    version: string;
    root: string;
  };
  dashboard: {
    publisher_id: string;
    item_id: string;
  };
  package: {
    path: string;
  };
  dashboard_config_path: string;
  listing_evidence_path: string;
  listing_reuse?: {
    source_version: string;
    materials_unchanged: true;
    reason: string;
  };
};

type DistributionChannel = {
  crxVersion?: string;
  deployPercentage?: number;
};

type RevisionStatus = {
  state?: string;
  distributionChannels?: DistributionChannel[];
};

type FetchStatusResponse = {
  itemId?: string;
  name?: string;
  lastAsyncUploadState?: string;
  submittedItemRevisionStatus?: RevisionStatus;
  publishedItemRevisionStatus?: RevisionStatus;
  takenDown?: boolean;
  warned?: boolean;
  error?: { status?: string; message?: string };
};

type SanitizedStatus = Omit<FetchStatusResponse, 'error'>;

const REQUIRED_ENV = [
  'CWS_EXTENSION_ID',
  'CWS_CLIENT_ID',
  'CWS_CLIENT_SECRET',
  'CWS_REFRESH_TOKEN'
] as const;

function parseArgs(argv: string[]): {
  command: Command;
  configPath: string;
  evidenceDir: string;
} {
  const [commandRaw, configPath, ...rest] = argv;
  if (commandRaw !== 'validate' && commandRaw !== 'status' && commandRaw !== 'submit') {
    throw new Error('usage: cws-staged-submit.ts <validate|status|submit> <config> --evidence-dir <dir>');
  }
  if (!configPath) throw new Error('config path is required');
  const evidenceIndex = rest.indexOf('--evidence-dir');
  const evidenceDir = evidenceIndex >= 0 ? rest[evidenceIndex + 1] : '';
  if (!evidenceDir) throw new Error('--evidence-dir is required');
  return { command: commandRaw, configPath, evidenceDir };
}

function requireText(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} must be a non-empty string`);
  return value.trim();
}

async function loadConfig(configPathRaw: string): Promise<{
  config: SubmitConfig;
  root: string;
  packagePath: string;
}> {
  const configPath = path.resolve(configPathRaw);
  const config = JSON.parse(await readFile(configPath, 'utf8')) as SubmitConfig;
  if (config.schema_version !== 1) throw new Error('schema_version must be 1');
  if (config.product?.platform !== 'cws') throw new Error('product.platform must be cws');
  requireText(config.product?.name, 'product.name');
  requireText(config.product?.version, 'product.version');
  const root = path.resolve(requireText(config.product?.root, 'product.root'));
  const publisherId = requireText(config.dashboard?.publisher_id, 'dashboard.publisher_id');
  const itemId = requireText(config.dashboard?.item_id, 'dashboard.item_id');
  if (!/^[a-z]{32}$/.test(itemId)) throw new Error('dashboard.item_id is not a CWS extension ID');
  if (!/^[0-9a-f-]{36}$/i.test(publisherId)) throw new Error('dashboard.publisher_id has an unexpected shape');
  const packageRelative = requireText(config.package?.path, 'package.path');
  if (path.isAbsolute(packageRelative)) throw new Error('package.path must be repository-relative');
  const packagePath = path.resolve(root, packageRelative);
  if (packagePath !== root && !packagePath.startsWith(`${root}${path.sep}`)) {
    throw new Error('package.path must stay inside product.root');
  }
  await readFile(packagePath);
  return { config, root, packagePath };
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function requireArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
  return value;
}

async function resolveRepositoryFile(root: string, value: unknown, label: string): Promise<string> {
  const relative = requireText(value, label);
  if (path.isAbsolute(relative)) throw new Error(`${label} must be repository-relative`);
  const resolved = path.resolve(root, relative);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error(`${label} must stay inside product.root`);
  }
  await readFile(resolved);
  return resolved;
}

async function verifyPersistedListingEvidence(
  config: SubmitConfig,
  root: string
): Promise<Record<string, unknown>> {
  const listingSourceVersion = config.listing_reuse
    ? requireText(config.listing_reuse.source_version, 'listing_reuse.source_version')
    : config.product.version;
  const reuseReason = config.listing_reuse
    ? requireText(config.listing_reuse.reason, 'listing_reuse.reason')
    : null;
  if (config.listing_reuse && config.listing_reuse.materials_unchanged !== true) {
    throw new Error('listing_reuse.materials_unchanged must be true when listing reuse is configured');
  }

  const dashboardConfigPath = await resolveRepositoryFile(
    root,
    config.dashboard_config_path,
    'dashboard_config_path'
  );
  const evidencePath = await resolveRepositoryFile(
    root,
    config.listing_evidence_path,
    'listing_evidence_path'
  );
  const dashboardConfig = requireRecord(
    JSON.parse(await readFile(dashboardConfigPath, 'utf8')),
    'dashboard config'
  );
  const dashboardProduct = requireRecord(dashboardConfig.product, 'dashboard config product');
  const dashboardIdentity: Array<[string, string]> = [
    ['name', config.product.name],
    ['platform', config.product.platform],
    ['version', listingSourceVersion]
  ];
  for (const [field, expected] of dashboardIdentity) {
    if (dashboardProduct[field] !== expected) {
      throw new Error(`dashboard config product.${field} does not match listing evidence source`);
    }
  }
  const listing = requireRecord(dashboardConfig.store_listing, 'dashboard config store_listing');
  const assets = requireArray(listing.assets, 'dashboard config store_listing.assets');
  const evidence = requireRecord(JSON.parse(await readFile(evidencePath, 'utf8')), 'listing evidence');

  const exactIdentity: Array<[string, unknown]> = [
    ['action', 'CONFIGURE'],
    ['section', 'store_listing'],
    ['product', config.product.name],
    ['platform', config.product.platform],
    ['version', listingSourceVersion],
    ['publisherId', config.dashboard.publisher_id],
    ['itemId', config.dashboard.item_id],
    ['submittedForReview', false],
    ['publicReleaseTriggered', false]
  ];
  for (const [field, expected] of exactIdentity) {
    if (evidence[field] !== expected) {
      throw new Error(`listing evidence ${field} does not match the authorized release`);
    }
  }

  const afterReload = requireRecord(evidence.afterReload, 'listing evidence afterReload');
  for (const field of ['descriptionMatches', 'supportMatches', 'summaryMatches'] as const) {
    if (afterReload[field] !== true) throw new Error(`listing evidence afterReload.${field} is not true`);
  }
  const category = requireText(listing.category, 'dashboard config store_listing.category');
  if (!requireText(afterReload.categoryText, 'listing evidence afterReload.categoryText').includes(category)) {
    throw new Error('listing evidence category does not match dashboard config');
  }

  const expectedUploads: Array<{ role: string; repositoryPath: string; sha256: string }> = [];
  for (let assetIndex = 0; assetIndex < assets.length; assetIndex += 1) {
    const asset = requireRecord(assets[assetIndex], `dashboard config asset ${assetIndex}`);
    const role = requireText(asset.role, `dashboard config asset ${assetIndex}.role`);
    const paths = requireArray(asset.paths, `dashboard config asset ${assetIndex}.paths`);
    for (let fileIndex = 0; fileIndex < paths.length; fileIndex += 1) {
      const repositoryPath = requireText(paths[fileIndex], `dashboard config asset ${assetIndex}.paths[${fileIndex}]`);
      const filePath = await resolveRepositoryFile(root, repositoryPath, `dashboard asset ${repositoryPath}`);
      expectedUploads.push({ role, repositoryPath, sha256: await sha256(filePath) });
    }
  }

  const uploads = requireArray(evidence.uploads, 'listing evidence uploads').map((value, index) =>
    requireRecord(value, `listing evidence uploads[${index}]`)
  );
  if (uploads.length !== expectedUploads.length) {
    throw new Error(`listing evidence upload count is ${uploads.length}, expected ${expectedUploads.length}`);
  }
  for (const expected of expectedUploads) {
    const matching = uploads.find(
      (upload) =>
        upload.role === expected.role &&
        upload.repositoryPath === expected.repositoryPath &&
        upload.sha256 === expected.sha256 &&
        upload.previewChanged === true
    );
    if (!matching) throw new Error(`listing evidence is missing the current upload: ${expected.repositoryPath}`);
  }

  return {
    path: path.relative(root, evidencePath),
    dashboardConfig: path.relative(root, dashboardConfigPath),
    targetVersion: config.product.version,
    sourceVersion: listingSourceVersion,
    reusedForNewPackage: listingSourceVersion !== config.product.version,
    reuseReason,
    generatedAt: evidence.generatedAt,
    persistedAfterReload: true,
    uploadCount: uploads.length,
    uploadHashes: expectedUploads.map((item) => item.sha256)
  };
}

function setupProxy(): Record<string, unknown> {
  const resolved = resolveCwsProxyEnv(process.env);
  const dispatcher = createUndiciProxyDispatcher(resolved);
  if (dispatcher) setGlobalDispatcher(dispatcher);
  return {
    enabled: resolved.proxyEnabled,
    source: resolved.proxyEnvKey,
    protocol: resolved.proxyUrl?.protocol ?? null,
    dispatcher_installed: Boolean(dispatcher)
  };
}

function requireCredentials(config: SubmitConfig): Record<(typeof REQUIRED_ENV)[number], string> {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length) throw new Error(`missing required environment variables: ${missing.join(', ')}`);
  const credentials = Object.fromEntries(REQUIRED_ENV.map((key) => [key, process.env[key]])) as Record<
    (typeof REQUIRED_ENV)[number],
    string
  >;
  if (credentials.CWS_EXTENSION_ID !== config.dashboard.item_id) {
    throw new Error('CWS_EXTENSION_ID does not match dashboard.item_id');
  }
  return credentials;
}

function requireSubmitAuthorization(config: SubmitConfig): void {
  const expectedIdentity = `${config.product.name}:${config.product.version}`;
  if (process.env.PUB_RELEASE_AUTHORIZED !== 'true') {
    throw new Error('submit requires release.py derived authorization');
  }
  if (process.env.PUB_RELEASE_PHASE !== 'submit') {
    throw new Error('PUB_RELEASE_PHASE must be submit');
  }
  if (process.env.PUB_RELEASE_IDENTITY !== expectedIdentity) {
    throw new Error('PUB_RELEASE_IDENTITY does not match product and version');
  }
}

async function fetchAccessToken(credentials: Record<(typeof REQUIRED_ENV)[number], string>): Promise<string> {
  const body = new URLSearchParams({
    client_id: credentials.CWS_CLIENT_ID,
    client_secret: credentials.CWS_CLIENT_SECRET,
    refresh_token: credentials.CWS_REFRESH_TOKEN,
    grant_type: 'refresh_token'
  });
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body
  });
  const payload = (await response.json()) as { access_token?: string; error?: string };
  if (!response.ok || !payload.access_token) {
    throw new Error(`OAuth refresh failed: HTTP ${response.status} ${payload.error ?? 'unknown'}`);
  }
  return payload.access_token;
}

function itemName(config: SubmitConfig): string {
  return `publishers/${config.dashboard.publisher_id}/items/${config.dashboard.item_id}`;
}

function v2Url(config: SubmitConfig, action: 'fetchStatus' | 'publish'): string {
  return `https://chromewebstore.googleapis.com/v2/${itemName(config)}:${action}`;
}

function v1DraftUrl(config: SubmitConfig): string {
  return `https://www.googleapis.com/chromewebstore/v1.1/items/${config.dashboard.item_id}?projection=DRAFT`;
}

function v2UploadUrl(config: SubmitConfig): string {
  return `https://chromewebstore.googleapis.com/upload/v2/${itemName(config)}:upload`;
}

async function fetchStatus(config: SubmitConfig, accessToken: string): Promise<FetchStatusResponse> {
  const response = await fetch(v2Url(config, 'fetchStatus'), {
    headers: { authorization: `Bearer ${accessToken}` }
  });
  const payload = (await response.json()) as FetchStatusResponse;
  if (!response.ok) {
    throw new Error(`CWS fetchStatus failed: HTTP ${response.status} ${payload.error?.status ?? 'unknown'}`);
  }
  if (payload.itemId !== config.dashboard.item_id || payload.name !== itemName(config)) {
    throw new Error('CWS fetchStatus identity mismatch');
  }
  return payload;
}

async function fetchDraftStatus(config: SubmitConfig, accessToken: string): Promise<CwsDraftStatus> {
  const response = await fetch(v1DraftUrl(config), {
    headers: { authorization: `Bearer ${accessToken}` }
  });
  const payload = (await response.json()) as unknown;
  const status = sanitizeCwsDraftStatus(payload);
  if (!response.ok) {
    throw new Error(`CWS draft status failed: HTTP ${response.status}`);
  }
  if (status.id !== config.dashboard.item_id) {
    throw new Error('CWS draft status identity mismatch');
  }
  return status;
}

function revisionVersions(revision: RevisionStatus | undefined): string[] {
  return (revision?.distributionChannels ?? [])
    .map((channel) => channel.crxVersion)
    .filter((version): version is string => Boolean(version));
}

function hasExpectedSubmittedState(config: SubmitConfig, status: FetchStatusResponse): boolean {
  const state = status.submittedItemRevisionStatus?.state;
  const versions = revisionVersions(status.submittedItemRevisionStatus);
  return versions.includes(config.product.version) && ['PENDING_REVIEW', 'STAGED'].includes(state ?? '');
}

function sanitizeStatus(status: FetchStatusResponse): SanitizedStatus {
  return {
    name: status.name,
    itemId: status.itemId,
    lastAsyncUploadState: status.lastAsyncUploadState,
    submittedItemRevisionStatus: status.submittedItemRevisionStatus,
    publishedItemRevisionStatus: status.publishedItemRevisionStatus,
    takenDown: status.takenDown,
    warned: status.warned
  };
}

async function uploadPackage(
  config: SubmitConfig,
  packagePath: string,
  accessToken: string
): Promise<CwsV2UploadStatus> {
  const response = await fetch(v2UploadUrl(config), {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/octet-stream'
    },
    body: createReadStream(packagePath),
    duplex: 'half'
  } as RequestInit & { duplex: 'half' });
  const payload = (await response.json()) as unknown;
  return sanitizeCwsV2UploadStatus(response.status, payload);
}

async function pollUploadState(
  config: SubmitConfig,
  accessToken: string,
  timeoutMs = 120_000
): Promise<FetchStatusResponse> {
  const deadline = Date.now() + timeoutMs;
  let latest = await fetchStatus(config, accessToken);
  while (latest.lastAsyncUploadState === 'IN_PROGRESS' && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 5_000));
    latest = await fetchStatus(config, accessToken);
  }
  return latest;
}

async function publishStaged(config: SubmitConfig, accessToken: string): Promise<Record<string, unknown>> {
  const response = await fetch(v2Url(config, 'publish'), {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      publishType: 'STAGED_PUBLISH',
      skipReview: false,
      blockOnWarnings: true
    })
  });
  const payload = (await response.json()) as {
    itemId?: string;
    name?: string;
    state?: string;
    warningInfo?: unknown;
    error?: { status?: string; message?: string };
  };
  if (!response.ok) {
    throw new Error(`CWS staged publish failed: HTTP ${response.status} ${payload.error?.status ?? 'unknown'}`);
  }
  if (payload.itemId !== config.dashboard.item_id || payload.name !== itemName(config)) {
    throw new Error('CWS staged publish identity mismatch');
  }
  return {
    itemId: payload.itemId,
    name: payload.name,
    state: payload.state,
    warningInfo: payload.warningInfo ?? null,
    publishType: 'STAGED_PUBLISH',
    skipReview: false,
    publicReleaseTriggered: false
  };
}

async function pollSubmittedState(
  config: SubmitConfig,
  accessToken: string,
  timeoutMs = 120_000
): Promise<FetchStatusResponse> {
  const deadline = Date.now() + timeoutMs;
  let latest = await fetchStatus(config, accessToken);
  while (!hasExpectedSubmittedState(config, latest) && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 5_000));
    latest = await fetchStatus(config, accessToken);
  }
  if (!hasExpectedSubmittedState(config, latest)) {
    const state = latest.submittedItemRevisionStatus?.state ?? 'missing';
    const versions = revisionVersions(latest.submittedItemRevisionStatus).join(',') || 'missing';
    throw new Error(`target version did not reach PENDING_REVIEW/STAGED: state=${state} versions=${versions}`);
  }
  return latest;
}

async function sha256(filePath: string): Promise<string> {
  return createHash('sha256').update(await readFile(filePath)).digest('hex');
}

async function writeEvidence(evidenceDirRaw: string, filename: string, payload: unknown): Promise<string> {
  const evidenceDir = path.resolve(evidenceDirRaw);
  await mkdir(evidenceDir, { recursive: true });
  const output = path.join(evidenceDir, filename);
  await writeFile(output, `${JSON.stringify(payload, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
  return output;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const { config, root, packagePath } = await loadConfig(args.configPath);
  if (args.command === 'submit') requireSubmitAuthorization(config);
  const listingEvidence =
    args.command === 'validate' || args.command === 'submit'
      ? await verifyPersistedListingEvidence(config, root)
      : null;

  if (args.command === 'validate') {
    const payload = {
      ok: true,
      action: 'VALIDATE',
      externalMutation: false,
      product: config.product,
      package: {
        path: path.relative(config.product.root, packagePath),
        sha256: await sha256(packagePath)
      },
      listingEvidence,
      checkedAt: new Date().toISOString()
    };
    const output = await writeEvidence(args.evidenceDir, 'cws-submit-inputs.json', payload);
    process.stdout.write(`${JSON.stringify({ ...payload, evidence: output }, null, 2)}\n`);
    return;
  }

  const proxy = setupProxy();
  const credentials = requireCredentials(config);
  const accessToken = await fetchAccessToken(credentials);
  const before = await fetchStatus(config, accessToken);

  if (args.command === 'status') {
    const draft = await fetchDraftStatus(config, accessToken);
    const payload = {
      ok: true,
      action: 'STATUS',
      externalMutation: false,
      product: config.product,
      publisherId: config.dashboard.publisher_id,
      itemId: config.dashboard.item_id,
      proxy,
      status: sanitizeStatus(before),
      draft,
      checkedAt: new Date().toISOString()
    };
    const output = await writeEvidence(args.evidenceDir, 'cws-status.json', payload);
    process.stdout.write(`${JSON.stringify({ ...payload, evidence: output }, null, 2)}\n`);
    return;
  }

  const upload = await uploadPackage(config, packagePath, accessToken);
  const asyncUploadStatus =
    upload.uploadState === 'IN_PROGRESS' ? await pollUploadState(config, accessToken) : null;
  const uploadSucceeded =
    upload.uploadState === 'SUCCEEDED' || asyncUploadStatus?.lastAsyncUploadState === 'SUCCEEDED';
  if (
    upload.httpStatus < 200 ||
    upload.httpStatus >= 300 ||
    upload.itemId !== config.dashboard.item_id ||
    upload.name !== itemName(config) ||
    !uploadSucceeded
  ) {
    let draft: CwsDraftStatus | null = null;
    let draftReadError: string | null = null;
    try {
      draft = await fetchDraftStatus(config, accessToken);
    } catch (error) {
      draftReadError = error instanceof Error ? error.message : String(error);
    }
    const failurePayload = {
      ok: false,
      action: 'UPLOAD',
      externalMutation: true,
      product: config.product,
      publisherId: config.dashboard.publisher_id,
      itemId: config.dashboard.item_id,
      package: {
        path: path.relative(config.product.root, packagePath),
        sha256: await sha256(packagePath)
      },
      upload,
      asyncUploadStatus: asyncUploadStatus ? sanitizeStatus(asyncUploadStatus) : null,
      draft,
      draftReadError,
      failedAt: new Date().toISOString()
    };
    const output = await writeEvidence(args.evidenceDir, 'cws-upload-failure.json', failurePayload);
    const draftErrors = draft?.itemError.length ? `; ${formatCwsItemErrors(draft.itemError)}` : '';
    throw new Error(
      `CWS upload did not reach SUCCEEDED: ${formatCwsV2UploadFailure(upload)}${draftErrors}; evidence=${output}`
    );
  }
  const publish = await publishStaged(config, accessToken);
  const after = await pollSubmittedState(config, accessToken);
  const payload = {
    ok: true,
    action: 'SUBMIT',
    authorizedScope: {
      product: config.product.name,
      platform: config.product.platform,
      version: config.product.version,
      action: 'submit'
    },
    publisherId: config.dashboard.publisher_id,
    itemId: config.dashboard.item_id,
    package: {
      path: path.relative(config.product.root, packagePath),
      sha256: await sha256(packagePath)
    },
    listingEvidence,
    proxy,
    before: sanitizeStatus(before),
    upload,
    asyncUploadStatus: asyncUploadStatus ? sanitizeStatus(asyncUploadStatus) : null,
    publish,
    after: sanitizeStatus(after),
    terminalState: after.submittedItemRevisionStatus?.state,
    submittedVersion: config.product.version,
    publicReleaseTriggered: false,
    completedAt: new Date().toISOString()
  };
  const output = await writeEvidence(args.evidenceDir, 'cws-submit.json', payload);
  process.stdout.write(`${JSON.stringify({ ...payload, evidence: output }, null, 2)}\n`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[CWS staged submit] ${message}`);
  process.exitCode = 1;
});
