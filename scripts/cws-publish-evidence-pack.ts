import * as crypto from 'node:crypto';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import type { CwsPreflightReport, CwsProxyReadiness } from './cws-preflight.ts';
import type { CwsProxyDiagnostic } from './cws-proxy.ts';

export const CWS_PUBLISH_EVIDENCE_PACK_VERSION = 'v1-62' as const;

export type CwsPublishEvidenceZip = Readonly<{
  fileName: string;
  filePath: string;
  bytes: number;
  sha256: string;
}>;

export type CwsPublishEvidenceCredentials = Readonly<{
  extensionId: boolean;
  clientId: boolean;
  clientSecret: boolean;
  refreshToken: boolean;
}>;

export type CwsPublishEvidencePublishAttempt = Readonly<{
  uploaded: boolean;
  published: boolean;
  channel: string;
  errorCode: string | null;
  errorMessage: string | null;
}>;

export type CwsPublishEvidencePack = Readonly<{
  packVersion: typeof CWS_PUBLISH_EVIDENCE_PACK_VERSION;
  exportedAt: string;
  dryRun: boolean;
  extensionVersion: string;
  zip: CwsPublishEvidenceZip;
  proxyDiagnostic: CwsProxyDiagnostic;
  preflightReport: CwsPreflightReport;
  preflightFixHints: string[];
  proxyReadiness: CwsProxyReadiness;
  credentials: CwsPublishEvidenceCredentials;
  publishAttempt: CwsPublishEvidencePublishAttempt;
}>;

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

export function formatUtcDateTimeCompact(date: Date): string {
  return [
    `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`,
    `${pad2(date.getUTCHours())}${pad2(date.getUTCMinutes())}${pad2(date.getUTCSeconds())}`
  ].join('-');
}

export function formatCwsPublishEvidencePackFilename(options: {
  extensionVersion: string;
  exportedAt: Date;
  dryRun: boolean;
}): string {
  const dt = formatUtcDateTimeCompact(options.exportedAt);
  const suffix = options.dryRun ? 'dry-run' : 'publish';
  return `copylot-cws-publish-diagnostic-pack-${options.extensionVersion}-${dt}.${suffix}.json`;
}

function toPosixPath(p: string): string {
  return p.split(path.sep).join(path.posix.sep);
}

export async function computeFileSha256(filePath: string): Promise<string> {
  const buf = await fs.readFile(filePath);
  return crypto.createHash('sha256').update(buf).digest('hex');
}

export async function buildCwsPublishEvidenceZip(zipFilePath: string, options?: { cwd?: string }): Promise<CwsPublishEvidenceZip> {
  const cwd = options?.cwd ?? process.cwd();
  const st = await fs.stat(zipFilePath);
  const sha256 = await computeFileSha256(zipFilePath);
  const fileName = path.basename(zipFilePath);
  const relPath = toPosixPath(path.relative(cwd, zipFilePath));

  return {
    fileName,
    filePath: relPath,
    bytes: st.size,
    sha256
  };
}

export function sanitizeEvidenceErrorMessage(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let msg = String(raw);

  // Guardrails: never persist auth headers or token-like fields verbatim.
  msg = msg.replace(/authorization:\s*[^\n\r]+/gi, 'Authorization: [REDACTED]');
  msg = msg.replace(/bearer\s+[a-z0-9._-]+/gi, 'Bearer [REDACTED]');
  msg = msg.replace(/client_secret\s*=\s*[^&\s]+/gi, 'client_secret=[REDACTED]');
  msg = msg.replace(/refresh_token\s*=\s*[^&\s]+/gi, 'refresh_token=[REDACTED]');

  // Avoid huge blobs / raw responses.
  const trimmed = msg.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > 600) return `${trimmed.slice(0, 600)}…`;
  return trimmed;
}

export function buildCwsPublishEvidencePack(input: {
  exportedAt: string;
  dryRun: boolean;
  extensionVersion: string;
  zip: CwsPublishEvidenceZip;
  proxyDiagnostic: CwsProxyDiagnostic;
  preflightReport: CwsPreflightReport;
  preflightFixHints: string[];
  proxyReadiness: CwsProxyReadiness;
  credentials: CwsPublishEvidenceCredentials;
  publishAttempt: CwsPublishEvidencePublishAttempt;
}): CwsPublishEvidencePack {
  return {
    packVersion: CWS_PUBLISH_EVIDENCE_PACK_VERSION,
    exportedAt: input.exportedAt,
    dryRun: input.dryRun,
    extensionVersion: input.extensionVersion,
    zip: {
      fileName: input.zip.fileName,
      filePath: input.zip.filePath,
      bytes: input.zip.bytes,
      sha256: input.zip.sha256
    },
    proxyDiagnostic: input.proxyDiagnostic,
    preflightReport: input.preflightReport,
    preflightFixHints: [...input.preflightFixHints],
    proxyReadiness: {
      status: input.proxyReadiness.status,
      fixCommand: input.proxyReadiness.fixCommand,
      blocking: input.proxyReadiness.blocking
    },
    credentials: {
      extensionId: input.credentials.extensionId,
      clientId: input.credentials.clientId,
      clientSecret: input.credentials.clientSecret,
      refreshToken: input.credentials.refreshToken
    },
    publishAttempt: {
      uploaded: input.publishAttempt.uploaded,
      published: input.publishAttempt.published,
      channel: input.publishAttempt.channel,
      errorCode: input.publishAttempt.errorCode,
      errorMessage: sanitizeEvidenceErrorMessage(input.publishAttempt.errorMessage)
    }
  };
}

export async function writeCwsPublishEvidencePackJsonFile(options: {
  evidenceDir: string;
  fileName: string;
  pack: CwsPublishEvidencePack;
}): Promise<{ filePath: string }> {
  await fs.mkdir(options.evidenceDir, { recursive: true });
  const outPath = path.resolve(options.evidenceDir, options.fileName);
  const json = `${JSON.stringify(options.pack, null, 2)}\n`;
  await fs.writeFile(outPath, json, 'utf-8');
  return { filePath: outPath };
}
