import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';

import { computeFileSha256 } from './cws-publish-evidence-pack.ts';
import {
  buildProRouteValidationVerdictPack as buildProRouteValidationVerdictPackShared,
  formatProRouteValidationVerdictMarkdown as formatProRouteValidationVerdictMarkdownShared,
  PRO_ROUTE_VALIDATION_VERDICT_FILES,
  type ProRouteValidationVerdictPack
} from '../src/shared/pro-route-validation-verdict.ts';
import type { ProRouteValidationComparisonSummary } from '../src/shared/pro-route-validation-comparison.ts';
import type { ProRouteValidationWritebackPack } from '../src/shared/pro-route-validation-writeback.ts';
import type { ProRouteValidationStabilitySummary } from '../src/shared/pro-route-validation-stability.ts';
import type { ProIntentDecisionPackSummary } from '../src/shared/pro-intent-decision-pack.ts';
import type { I18nGetMessage } from '../src/shared/monetization.ts';

export {
  PRO_ROUTE_VALIDATION_VERDICT_FILES,
  type ProRouteValidationVerdictPack
} from '../src/shared/pro-route-validation-verdict.ts';

export const DEFAULT_PRO_ROUTE_VALIDATION_VERDICT_EVIDENCE_DIR =
  'docs/evidence/v4-11/verdict-pack' as const;

const defaultVerdictGetMessage: I18nGetMessage = (key, substitutions) => {
  const normalized =
    typeof substitutions === 'string'
      ? [substitutions]
      : Array.isArray(substitutions)
        ? substitutions
        : [];
  const messages: Record<string, string> = {
    proRouteValidationVerdictMdTitle: 'V4-11 Pro 路线融合判断摘要',
    proRouteValidationVerdictMdSectionInputs: '输入',
    proRouteValidationVerdictMdSectionChecks: '检查项',
    proRouteValidationVerdictMdSectionDecision: '结论',
    proRouteValidationVerdictDecisionStay: '当前结论：继续验证，不进入支付评估。',
    proRouteValidationVerdictDecisionEnter: '当前结论：可以进入收费评估，但仍不直接实现支付。',
    proRouteValidationVerdictReasonLeaderAligned: `当前领先路线已对齐：${normalized[0] || '未知路线'}（recent_7d signal_gap=${normalized[1] || '0'}）。`,
    proRouteValidationVerdictReasonLeaderMismatch: '路线比较、回写包和稳定性摘要的 leader 还没有对齐。',
    proRouteValidationVerdictReasonStabilityBlocked: `稳定性 verdict 仍是 ${normalized[0] || 'unknown'}，还不满足收费评估前置条件。`,
    proRouteValidationVerdictReasonStabilityReady: `稳定性 verdict 已进入 ${normalized[0] || 'unknown'}，路线稳定性前置条件已满足。`,
    proRouteValidationVerdictReasonGateBlocked: `收费前门槛仍为 ${normalized[0] || 'A'}：${normalized[1] || '继续收集'}。`,
    proRouteValidationVerdictReasonGateReady: `收费前门槛已进入 ${normalized[0] || 'C'}：${normalized[1] || '可以评估'}。`,
    proRouteValidationVerdictNextStay: '下一步：继续补跨 campaign 样本，并把当前判断固化成收费评估审计包，但仍不做支付实现。',
    proRouteValidationVerdictNextEnter: '下一步：在不做支付实现的前提下，进入收费评估审计与边界复核。'
  };
  return messages[key] || key;
};

async function readJsonFile<T>(filePathRel: string): Promise<T> {
  const abs = path.resolve(process.cwd(), filePathRel);
  const raw = await fs.readFile(abs, 'utf-8');
  return JSON.parse(raw) as T;
}

async function ensureDir(dirRel: string): Promise<void> {
  await fs.mkdir(path.resolve(process.cwd(), dirRel), { recursive: true });
}

async function writeUtf8File(filePathRel: string, content: string): Promise<void> {
  const abs = path.resolve(process.cwd(), filePathRel);
  await fs.writeFile(abs, content, 'utf-8');
}

export function buildProRouteValidationVerdictPack(params: {
  comparison: ProRouteValidationComparisonSummary;
  writeback: ProRouteValidationWritebackPack;
  stability: ProRouteValidationStabilitySummary;
  decision: ProIntentDecisionPackSummary;
}): ProRouteValidationVerdictPack {
  return buildProRouteValidationVerdictPackShared({
    comparison: params.comparison,
    writeback: params.writeback,
    stability: params.stability,
    decision: params.decision,
    getMessage: defaultVerdictGetMessage
  });
}

export function formatProRouteValidationVerdictMarkdown(pack: ProRouteValidationVerdictPack): string {
  return formatProRouteValidationVerdictMarkdownShared(pack, defaultVerdictGetMessage);
}

async function buildProRouteValidationVerdictPackCli(args?: {
  comparison: string;
  writeback: string;
  stability: string;
  decision: string;
  outDir: string;
}): Promise<void> {
  const comparisonRel = args?.comparison ?? '';
  const writebackRel = args?.writeback ?? '';
  const stabilityRel = args?.stability ?? '';
  const decisionRel = args?.decision ?? '';
  assert.ok(
    comparisonRel && writebackRel && stabilityRel && decisionRel,
    'Usage: scripts/build-pro-route-validation-verdict-pack.ts <comparison.json> <writeback.json> <stability.json> <decision.json> [outDir]'
  );

  const outDirRel = args?.outDir ?? DEFAULT_PRO_ROUTE_VALIDATION_VERDICT_EVIDENCE_DIR;
  await ensureDir(outDirRel);

  const comparison = await readJsonFile<ProRouteValidationComparisonSummary>(comparisonRel);
  const writeback = await readJsonFile<ProRouteValidationWritebackPack>(writebackRel);
  const stability = await readJsonFile<ProRouteValidationStabilitySummary>(stabilityRel);
  const decision = await readJsonFile<ProIntentDecisionPackSummary>(decisionRel);
  const pack = buildProRouteValidationVerdictPack({
    comparison: {
      ...comparison,
      telemetryFile: comparisonRel,
      telemetrySha256: await computeFileSha256(path.resolve(process.cwd(), comparisonRel))
    },
    writeback: {
      ...writeback,
      sourceSummaryFile: writebackRel,
      sourceSummarySha256: await computeFileSha256(path.resolve(process.cwd(), writebackRel))
    },
    stability: {
      ...stability,
      telemetryFile: stabilityRel,
      telemetrySha256: await computeFileSha256(path.resolve(process.cwd(), stabilityRel))
    },
    decision
  });

  const summaryJsonPath = path.posix.join(outDirRel, PRO_ROUTE_VALIDATION_VERDICT_FILES.summaryJson);
  const summaryMdPath = path.posix.join(outDirRel, PRO_ROUTE_VALIDATION_VERDICT_FILES.summaryMd);

  await writeUtf8File(summaryJsonPath, `${JSON.stringify(pack, null, 2)}\n`);
  await writeUtf8File(summaryMdPath, `${formatProRouteValidationVerdictMarkdown(pack).trimEnd()}\n`);
}

const invokedAsScript =
  Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1] as string).href;
if (invokedAsScript) {
  const argv = process.argv.slice(2);
  const comparison = argv[0] || '';
  const writeback = argv[1] || '';
  const stability = argv[2] || '';
  const decision = argv[3] || '';
  const outDir = argv[4] || DEFAULT_PRO_ROUTE_VALIDATION_VERDICT_EVIDENCE_DIR;

  buildProRouteValidationVerdictPackCli({
    comparison,
    writeback,
    stability,
    decision,
    outDir
  }).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
