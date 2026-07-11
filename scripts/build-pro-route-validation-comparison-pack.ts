import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';

import { computeFileSha256 } from './cws-publish-evidence-pack.ts';
import {
  buildProRouteValidationComparisonSummary as buildProRouteValidationComparisonSummaryShared,
  formatProRouteValidationComparisonMarkdown as formatProRouteValidationComparisonMarkdownShared,
  PRO_ROUTE_VALIDATION_COMPARISON_FILES,
  type I18nGetMessage,
  type ProRouteValidationComparisonSummary
} from '../src/shared/pro-route-validation-comparison.ts';

export {
  PRO_ROUTE_VALIDATION_COMPARISON_FILES,
  type ProRouteValidationComparisonSummary
} from '../src/shared/pro-route-validation-comparison.ts';

export const DEFAULT_PRO_ROUTE_VALIDATION_COMPARISON_EVIDENCE_DIR = 'docs/evidence/v4-8/comparison-pack' as const;

const defaultComparisonGetMessage: I18nGetMessage = (key, substitutions) => {
  const normalized =
    typeof substitutions === 'string'
      ? [substitutions]
      : Array.isArray(substitutions)
        ? substitutions
        : [];
  const messages: Record<string, string> = {
    proValidationAdvancedTitle: '高级页面清洗验证',
    proValidationBulkTitle: '批量采集与整理验证',
    proValidationStructuredExportTitle: '结构化导出与下游工作流验证',
    proRouteValidationComparisonMdTitle: 'V4-8 三条路线样本比较摘要',
    proRouteValidationComparisonMdSectionInput: '输入',
    proRouteValidationComparisonMdSectionScoreboard: '记分板',
    proRouteValidationComparisonMdSectionDecision: '判断',
    proRouteValidationComparisonInputWindow: '观察窗口',
    proRouteValidationComparisonInputTotalSignals: '总信号',
    proRouteValidationComparisonInputCampaigns: 'campaign',
    proRouteValidationComparisonDecisionNoSignals: '当前没有可比较的路线信号，继续收集真实打开与复制样本。',
    proRouteValidationComparisonDecisionLeading: `当前领先路线：${normalized[0] || '未知'}（领先差值 ${normalized[1] || '0'}）`,
    proRouteValidationComparisonDecisionNextStepCollect: '下一步：继续保留三条路线入口，但先补真实打开与复制样本，不扩新路线。',
    proRouteValidationComparisonDecisionNextStepWriteback: `下一步：优先把 ${normalized[0] || '领先路线'} 的真实任务样本回写到路线页、商店说明和汇总报告。`
  };
  return messages[key] || key;
};

export function buildProRouteValidationComparisonSummary(options: {
  telemetryEvents: unknown;
  telemetryFile: string;
  telemetrySha256: string;
  now: number;
  extensionVersion: string;
  enabled?: boolean;
}): ProRouteValidationComparisonSummary {
  return buildProRouteValidationComparisonSummaryShared({
    enabled: options.enabled ?? true,
    telemetryEvents: options.telemetryEvents,
    telemetryFile: options.telemetryFile,
    telemetrySha256: options.telemetrySha256,
    now: options.now,
    extensionVersion: options.extensionVersion,
    getMessage: defaultComparisonGetMessage
  });
}

export function formatProRouteValidationComparisonMarkdown(
  summary: ProRouteValidationComparisonSummary
): string {
  return formatProRouteValidationComparisonMarkdownShared(summary, defaultComparisonGetMessage);
}

function toPosixPath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

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

async function buildProRouteValidationComparisonPack(args?: { input: string; outDir: string }): Promise<void> {
  const inputRel = args?.input ?? '';
  assert.ok(inputRel, 'Usage: scripts/build-pro-route-validation-comparison-pack.ts <telemetry.json> [outDir]');

  const outDirRel = args?.outDir ?? DEFAULT_PRO_ROUTE_VALIDATION_COMPARISON_EVIDENCE_DIR;
  await ensureDir(outDirRel);

  const telemetryEvents = await readJsonFile(inputRel);
  const inputAbs = path.resolve(process.cwd(), inputRel);
  const telemetrySha256 = await computeFileSha256(inputAbs);
  const summary = buildProRouteValidationComparisonSummary({
    telemetryEvents,
    telemetryFile: toPosixPath(inputRel),
    telemetrySha256,
    now: resolveDeterministicNow(telemetryEvents),
    extensionVersion: 'v4-8-evidence'
  });

  const summaryJsonPath = path.posix.join(outDirRel, PRO_ROUTE_VALIDATION_COMPARISON_FILES.summaryJson);
  const summaryMdPath = path.posix.join(outDirRel, PRO_ROUTE_VALIDATION_COMPARISON_FILES.summaryMd);

  await writeUtf8File(summaryJsonPath, `${JSON.stringify(summary, null, 2)}\n`);
  await writeUtf8File(summaryMdPath, `${formatProRouteValidationComparisonMarkdown(summary).trimEnd()}\n`);
}

const invokedAsScript = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1] as string).href;
if (invokedAsScript) {
  const argv = process.argv.slice(2);
  const input = argv[0] || '';
  const outDir = argv[1] || DEFAULT_PRO_ROUTE_VALIDATION_COMPARISON_EVIDENCE_DIR;

  buildProRouteValidationComparisonPack({ input, outDir }).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
