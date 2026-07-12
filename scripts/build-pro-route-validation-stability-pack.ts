import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';

import { computeFileSha256 } from './cws-publish-evidence-pack.ts';
import {
  buildProRouteValidationStabilitySummary as buildProRouteValidationStabilitySummaryShared,
  formatProRouteValidationStabilityMarkdown as formatProRouteValidationStabilityMarkdownShared,
  PRO_ROUTE_VALIDATION_STABILITY_FILES,
  type ProRouteValidationStabilitySummary
} from '../src/shared/pro-route-validation-stability.ts';
import type { I18nGetMessage } from '../src/shared/monetization.ts';

export {
  PRO_ROUTE_VALIDATION_STABILITY_FILES,
  type ProRouteValidationStabilitySummary
} from '../src/shared/pro-route-validation-stability.ts';

export const DEFAULT_PRO_ROUTE_VALIDATION_STABILITY_EVIDENCE_DIR =
  'docs/evidence/v4-10/stability-pack' as const;

const defaultStabilityGetMessage: I18nGetMessage = (key) => {
  const messages: Record<string, string> = {
    proValidationAdvancedTitle: '高级页面清洗验证',
    proValidationBulkTitle: '批量采集与整理验证',
    proValidationStructuredExportTitle: '结构化导出与下游工作流验证',
    proRouteValidationStabilityMdTitle: 'V4-10 领先路线稳定性摘要',
    proRouteValidationStabilityMdSectionInput: '输入',
    proRouteValidationStabilityMdSectionWindows: '窗口判断',
    proRouteValidationStabilityMdSectionCampaigns: 'campaign 支撑',
    proRouteValidationStabilityMdSectionDecision: '结论',
    proRouteValidationStabilityNoSignals: '当前没有足够的路线验证信号，继续收集真实打开与复制样本。',
    proRouteValidationStabilityVerdictStable:
      '7d 与 14d 的领先路线一致，且当前 supporting campaign 已具备基础集中度，可以继续强化同一路线文案。',
    proRouteValidationStabilityVerdictCampaignThin:
      '7d 与 14d 的领先路线一致，但 supporting campaign 仍然太薄，暂时不能把一次领先当成长期需求。',
    proRouteValidationStabilityVerdictCampaignSplit:
      '7d 与 14d 的领先路线一致，但不同 campaign 仍然分裂，说明领先路线还没有跨渠道稳定成立。',
    proRouteValidationStabilityVerdictWindowUnstable:
      '7d 与 14d 的领先路线不一致，当前领先还不稳定。',
    proRouteValidationStabilityNextCollect:
      '下一步：继续收集真实任务样本，并保持“不做支付实现”的边界。',
    proRouteValidationStabilityNextCrossCampaign:
      '下一步：优先补跨 campaign 的真实任务样本，再用回写包和门槛摘要一起复核。',
    proRouteValidationStabilityNextStrengthen:
      '下一步：可以继续强化当前领先路线文案，但仍需先经过收费前门槛复核，不能直接进入支付实现。'
  };
  return messages[key] || key;
};

async function readJsonFile(filePathRel: string): Promise<unknown> {
  const abs = path.resolve(process.cwd(), filePathRel);
  const raw = await fs.readFile(abs, 'utf-8');
  return JSON.parse(raw) as unknown;
}

async function ensureDir(dirRel: string): Promise<void> {
  await fs.mkdir(path.resolve(process.cwd(), dirRel), { recursive: true });
}

async function writeUtf8File(filePathRel: string, content: string): Promise<void> {
  const abs = path.resolve(process.cwd(), filePathRel);
  await fs.writeFile(abs, content, 'utf-8');
}

function toPosixPath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

function resolveDeterministicNow(telemetryEvents: unknown): number {
  if (!Array.isArray(telemetryEvents)) {
    return 0;
  }

  let maxTs = 0;
  for (const event of telemetryEvents) {
    if (!event || typeof event !== 'object') continue;
    const value = (event as { ts?: unknown }).ts;
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) continue;
    if (value > maxTs) {
      maxTs = value;
    }
  }
  return maxTs;
}

export function buildProRouteValidationStabilitySummary(options: {
  telemetryEvents: unknown;
  telemetryFile: string;
  telemetrySha256: string;
  now: number;
  extensionVersion: string;
  enabled?: boolean;
}): ProRouteValidationStabilitySummary {
  return buildProRouteValidationStabilitySummaryShared({
    enabled: options.enabled ?? true,
    telemetryEvents: options.telemetryEvents,
    telemetryFile: options.telemetryFile,
    telemetrySha256: options.telemetrySha256,
    now: options.now,
    extensionVersion: options.extensionVersion,
    getMessage: defaultStabilityGetMessage
  });
}

export function formatProRouteValidationStabilityMarkdown(
  summary: ProRouteValidationStabilitySummary
): string {
  return formatProRouteValidationStabilityMarkdownShared(summary, defaultStabilityGetMessage);
}

async function buildProRouteValidationStabilityPack(args?: {
  input: string;
  outDir: string;
}): Promise<void> {
  const inputRel = args?.input ?? '';
  assert.ok(inputRel, 'Usage: scripts/build-pro-route-validation-stability-pack.ts <telemetry.json> [outDir]');

  const outDirRel = args?.outDir ?? DEFAULT_PRO_ROUTE_VALIDATION_STABILITY_EVIDENCE_DIR;
  await ensureDir(outDirRel);

  const telemetryEvents = await readJsonFile(inputRel);
  const inputAbs = path.resolve(process.cwd(), inputRel);
  const telemetrySha256 = await computeFileSha256(inputAbs);
  const summary = buildProRouteValidationStabilitySummary({
    telemetryEvents,
    telemetryFile: toPosixPath(inputRel),
    telemetrySha256,
    now: resolveDeterministicNow(telemetryEvents),
    extensionVersion: 'v4-10-evidence'
  });

  const summaryJsonPath = path.posix.join(outDirRel, PRO_ROUTE_VALIDATION_STABILITY_FILES.summaryJson);
  const summaryMdPath = path.posix.join(outDirRel, PRO_ROUTE_VALIDATION_STABILITY_FILES.summaryMd);

  await writeUtf8File(summaryJsonPath, `${JSON.stringify(summary, null, 2)}\n`);
  await writeUtf8File(summaryMdPath, `${formatProRouteValidationStabilityMarkdown(summary).trimEnd()}\n`);
}

const invokedAsScript =
  Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1] as string).href;
if (invokedAsScript) {
  const argv = process.argv.slice(2);
  const input = argv[0] || '';
  const outDir = argv[1] || DEFAULT_PRO_ROUTE_VALIDATION_STABILITY_EVIDENCE_DIR;

  buildProRouteValidationStabilityPack({ input, outDir }).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
