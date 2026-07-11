import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';

import { computeFileSha256 } from './cws-publish-evidence-pack.ts';
import {
  buildProIntentDecisionPackSummary as buildProIntentDecisionPackSummaryShared,
  formatProIntentDecisionPackMarkdown as formatProIntentDecisionPackMarkdownShared,
  PRO_INTENT_DECISION_SUMMARY_FILES,
  type I18nGetMessage,
  type ProIntentDecisionPackSummary
} from '../src/shared/pro-intent-decision-pack.ts';

export {
  DEFAULT_PRO_INTENT_DECISION_THRESHOLDS,
  PRO_INTENT_DECISION_PACK_VERSION,
  PRO_INTENT_DECISION_SUMMARY_FILES,
  PRO_INTENT_DECISION_THRESHOLDS_VERSION,
  sanitizeProWaitlistSurveyIntentDistribution,
  type ProIntentDecisionCode,
  type ProIntentDecisionThresholds,
  type SanitizedProWaitlistSurveyIntentDistribution
} from '../src/shared/pro-intent-decision-pack.ts';
export type { ProIntentDecisionPackSummary } from '../src/shared/pro-intent-decision-pack.ts';

export const DEFAULT_PRO_INTENT_DECISION_EVIDENCE_DIR = 'docs/evidence/v1-81' as const;

const defaultDecisionPackGetMessage: I18nGetMessage = (key) => {
  const messages: Record<string, string> = {
    proIntentDecisionConclusionADataOff: '继续收集（匿名使用数据未开启/无可用事件）',
    proIntentDecisionConclusionASampleInsufficient: '继续收集（样本量不足）',
    proIntentDecisionConclusionBHighIntentInsufficient: '先迭代价值表达与能力包（高意向占比不足）',
    proIntentDecisionConclusionBPriceInsufficient: '先迭代价值表达与能力包（价格区间不集中/不稳定）',
    proIntentDecisionConclusionCGo: '可推进收款/订阅链路最小实现（样本与意向达到门槛）',
    proIntentDecisionMdTitle: 'V1-81 Pro 意向决策摘要（可审计）',
    proIntentDecisionMdSectionInput: '输入',
    proIntentDecisionMdSectionMetrics: '指标',
    proIntentDecisionMdSectionDecision: '结论（A/B/C）'
  };
  return messages[key] || key;
};

export function buildProIntentDecisionPackSummary(options: {
  rawDistribution: unknown;
  distributionFile: string;
  distributionSha256: string;
  thresholds?: import('../src/shared/pro-intent-decision-pack.ts').ProIntentDecisionThresholds;
}): ProIntentDecisionPackSummary {
  return buildProIntentDecisionPackSummaryShared({
    ...options,
    getMessage: defaultDecisionPackGetMessage
  });
}

export function formatProIntentDecisionPackMarkdown(summary: ProIntentDecisionPackSummary): string {
  return formatProIntentDecisionPackMarkdownShared(summary, defaultDecisionPackGetMessage);
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

async function buildProIntentDecisionPack(args?: { input: string; outDir: string }): Promise<void> {
  const inputRel = args?.input ?? '';
  assert.ok(inputRel, 'Usage: scripts/build-pro-intent-decision-pack.ts <distribution.json> [outDir]');

  const outDirRel = args?.outDir ?? DEFAULT_PRO_INTENT_DECISION_EVIDENCE_DIR;
  await ensureDir(outDirRel);

  const rawDistribution = await readJsonFile(inputRel);
  const inputAbs = path.resolve(process.cwd(), inputRel);
  const distributionSha256 = await computeFileSha256(inputAbs);
  const summary: ProIntentDecisionPackSummary = buildProIntentDecisionPackSummary({
    rawDistribution,
    distributionFile: toPosixPath(inputRel),
    distributionSha256
  });

  const summaryJsonPath = path.posix.join(outDirRel, PRO_INTENT_DECISION_SUMMARY_FILES.summaryJson);
  const summaryMdPath = path.posix.join(outDirRel, PRO_INTENT_DECISION_SUMMARY_FILES.summaryMd);

  await writeUtf8File(summaryJsonPath, `${JSON.stringify(summary, null, 2)}\n`);
  await writeUtf8File(summaryMdPath, `${formatProIntentDecisionPackMarkdown(summary).trimEnd()}\n`);
}

const invokedAsScript = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1] as string).href;
if (invokedAsScript) {
  const argv = process.argv.slice(2);
  const input = argv[0] || '';
  const outDir = argv[1] || DEFAULT_PRO_INTENT_DECISION_EVIDENCE_DIR;

  buildProIntentDecisionPack({ input, outDir }).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
