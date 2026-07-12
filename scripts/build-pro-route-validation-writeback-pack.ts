import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';

import { computeFileSha256 } from './cws-publish-evidence-pack.ts';
import {
  buildProRouteValidationWritebackPack as buildProRouteValidationWritebackPackShared,
  formatProRouteValidationWritebackMarkdown as formatProRouteValidationWritebackMarkdownShared,
  PRO_ROUTE_VALIDATION_WRITEBACK_FILES,
  type ProRouteValidationWritebackPack
} from '../src/shared/pro-route-validation-writeback.ts';
import type { I18nGetMessage } from '../src/shared/monetization.ts';
import type { ProRouteValidationComparisonSummary } from '../src/shared/pro-route-validation-comparison.ts';

export {
  PRO_ROUTE_VALIDATION_WRITEBACK_FILES,
  type ProRouteValidationWritebackPack
} from '../src/shared/pro-route-validation-writeback.ts';

export const DEFAULT_PRO_ROUTE_VALIDATION_WRITEBACK_EVIDENCE_DIR = 'docs/evidence/v4-9/writeback-pack' as const;

const defaultWritebackGetMessage: I18nGetMessage = (key, substitutions) => {
  const normalized =
    typeof substitutions === 'string'
      ? [substitutions]
      : Array.isArray(substitutions)
        ? substitutions
        : [];
  const messages: Record<string, string> = {
    proRouteValidationWritebackMdTitle: 'V4-9 领先路线回写包',
    proRouteValidationWritebackMdSectionRoutePage: '路线页',
    proRouteValidationWritebackMdSectionStore: '商店说明',
    proRouteValidationWritebackMdSectionSummary: '汇总',
    proRouteValidationWritebackNoLeader: '当前还没有可回写的领先路线，继续收集真实样本。',
    proRouteValidationWritebackScenarioAdvanced: '长文、评论区和推荐位噪声明显的页面',
    proRouteValidationWritebackScenarioBulk: '需要跨页面整理资料、竞品片段和研究笔记的场景',
    proRouteValidationWritebackScenarioStructured: '需要把复制结果继续送进 Notion、表格或知识库的场景',
    proRouteValidationWritebackValueAdvanced: '减少广告/评论区/推荐位干扰，让复制结果更快进入 AI 工作流',
    proRouteValidationWritebackValueBulk: '减少多页面来回切换与手工整理，把分散资料更快拼成可复用输入',
    proRouteValidationWritebackValueStructured: '减少下游重排成本，让复制结果更快进入表格、知识库或 AI 工作流',
    proRouteValidationWritebackFocusAdvanced: '更少返工的页面清洗价值',
    proRouteValidationWritebackFocusBulk: '更完整的采集整理工作流价值',
    proRouteValidationWritebackFocusStructured: '更顺畅的结构化下游衔接价值',
    proRouteValidationWritebackRouteHeadline: `当前优先验证路线：${normalized[0] || '未知路线'}，面向 ${normalized[1] || '真实任务场景'}`,
    proRouteValidationWritebackRouteProof: `recent_7d total_signals=${normalized[0] || '0'}，signal_gap=${normalized[1] || '0'}，route_opened=${normalized[2] || '0'}，total_copies=${normalized[3] || '0'}`,
    proRouteValidationWritebackBoundary: '继续保留验证入口，不承诺已上线支付或订阅。',
    proRouteValidationWritebackStoreShort: `当前优先验证路线：${normalized[0] || '未知路线'}，适合 ${normalized[1] || '真实任务场景'}。`,
    proRouteValidationWritebackStoreBullet: `核心价值：${normalized[0] || '继续验证真实需求。'}`,
    proRouteValidationWritebackStoreBoundary: '仍处于路线验证阶段，不承诺已上线收费功能。',
    proRouteValidationWritebackSummaryJudgement: `${normalized[0] || '未知路线'} 当前处于验证领先位，说明用户更愿意为 ${normalized[1] || '真实价值'} 带走路线说明与验证素材。`,
    proRouteValidationWritebackSummaryNext: '下一步：把真实任务样本回写到路线页、商店说明和下一轮汇总，并继续用门槛摘要复核是否进入收费评估。'
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

export function buildProRouteValidationWritebackPack(
  summary: ProRouteValidationComparisonSummary
): ProRouteValidationWritebackPack {
  return buildProRouteValidationWritebackPackShared(summary, defaultWritebackGetMessage);
}

export function formatProRouteValidationWritebackMarkdown(
  pack: ProRouteValidationWritebackPack
): string {
  return formatProRouteValidationWritebackMarkdownShared(pack, defaultWritebackGetMessage);
}

function toPosixPath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

async function buildProRouteValidationWritebackPackCli(args?: { input: string; outDir: string }): Promise<void> {
  const inputRel = args?.input ?? '';
  assert.ok(inputRel, 'Usage: scripts/build-pro-route-validation-writeback-pack.ts <comparison-summary.json> [outDir]');

  const outDirRel = args?.outDir ?? DEFAULT_PRO_ROUTE_VALIDATION_WRITEBACK_EVIDENCE_DIR;
  await ensureDir(outDirRel);

  const summary = (await readJsonFile(inputRel)) as ProRouteValidationComparisonSummary;
  const inputAbs = path.resolve(process.cwd(), inputRel);
  const sourceSha256 = await computeFileSha256(inputAbs);
  const pack = buildProRouteValidationWritebackPack({
    ...summary,
    telemetryFile: toPosixPath(inputRel),
    telemetrySha256: sourceSha256
  });

  const summaryJsonPath = path.posix.join(outDirRel, PRO_ROUTE_VALIDATION_WRITEBACK_FILES.summaryJson);
  const summaryMdPath = path.posix.join(outDirRel, PRO_ROUTE_VALIDATION_WRITEBACK_FILES.summaryMd);

  await writeUtf8File(summaryJsonPath, `${JSON.stringify(pack, null, 2)}\n`);
  await writeUtf8File(summaryMdPath, `${formatProRouteValidationWritebackMarkdown(pack).trimEnd()}\n`);
}

const invokedAsScript = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1] as string).href;
if (invokedAsScript) {
  const argv = process.argv.slice(2);
  const input = argv[0] || '';
  const outDir = argv[1] || DEFAULT_PRO_ROUTE_VALIDATION_WRITEBACK_EVIDENCE_DIR;

  buildProRouteValidationWritebackPackCli({ input, outDir }).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
