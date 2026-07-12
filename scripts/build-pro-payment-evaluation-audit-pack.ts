import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';

import { computeFileSha256 } from './cws-publish-evidence-pack.ts';
import {
  buildProPaymentEvaluationAuditPack as buildProPaymentEvaluationAuditPackShared,
  formatProPaymentEvaluationAuditMarkdown as formatProPaymentEvaluationAuditMarkdownShared,
  PRO_PAYMENT_EVALUATION_AUDIT_FILES,
  type ProPaymentEvaluationAuditPack
} from '../src/shared/pro-payment-evaluation-audit.ts';
import type { ProRouteValidationVerdictPack } from '../src/shared/pro-route-validation-verdict.ts';
import type { I18nGetMessage } from '../src/shared/monetization.ts';

export {
  PRO_PAYMENT_EVALUATION_AUDIT_FILES,
  type ProPaymentEvaluationAuditPack
} from '../src/shared/pro-payment-evaluation-audit.ts';

export const DEFAULT_PRO_PAYMENT_EVALUATION_AUDIT_EVIDENCE_DIR =
  'docs/evidence/v4-12/payment-evaluation-audit-pack' as const;

const defaultAuditGetMessage: I18nGetMessage = (key, substitutions) => {
  const normalized =
    typeof substitutions === 'string'
      ? [substitutions]
      : Array.isArray(substitutions)
        ? substitutions
        : [];
  const messages: Record<string, string> = {
    proPaymentEvaluationAuditMdTitle: 'V4-12 收费评估审计包',
    proPaymentEvaluationAuditMdSectionStatus: '状态',
    proPaymentEvaluationAuditMdSectionChecks: '检查项',
    proPaymentEvaluationAuditMdSectionBlockers: '阻塞项',
    proPaymentEvaluationAuditMdSectionBoundaries: '边界',
    proPaymentEvaluationAuditMdSectionNext: '下一步',
    proPaymentEvaluationAuditMdSectionEvidence: '证据链',
    proPaymentEvaluationAuditDecisionHold: '当前审计结论：继续停留在验证阶段，不进入收费实现。',
    proPaymentEvaluationAuditDecisionEnter:
      '当前审计结论：可以进入收费评估复核，但仍不直接实现支付。',
    proPaymentEvaluationAuditCheckLeaderPassed: `领先路线已对齐：${normalized[0] || 'unknown'}。`,
    proPaymentEvaluationAuditCheckLeaderFailed:
      '领先路线尚未在比较、回写与稳定性摘要之间完成对齐。',
    proPaymentEvaluationAuditCheckStabilityPassed:
      `稳定性 verdict 已进入 ${normalized[0] || 'leader_stable'}。`,
    proPaymentEvaluationAuditCheckStabilityFailed:
      `稳定性 verdict 仍是 ${normalized[0] || 'unknown'}，还不能进入收费评估。`,
    proPaymentEvaluationAuditCheckGatePassed:
      `收费前门槛已进入 ${normalized[0] || 'C'}：${normalized[1] || '可以评估'}。`,
    proPaymentEvaluationAuditCheckGateFailed:
      `收费前门槛仍为 ${normalized[0] || 'A'}：${normalized[1] || '继续收集'}。`,
    proPaymentEvaluationAuditBoundaryNoPaymentImplementation:
      '当前审计只输出判断与证据，不实现支付、收款、订阅或表单。',
    proPaymentEvaluationAuditBoundaryNoMessagingDrift:
      '对外话术必须与当前 verdict 保持一致，不暗示已上线收费或支付。',
    proPaymentEvaluationAuditBoundaryNoSensitiveData:
      '证据只使用本地匿名聚合字段，不包含网页正文、复制内容、URL、标题或联系方式。',
    proPaymentEvaluationAuditNextHoldSamples:
      '继续补跨 campaign 的真实任务样本，先解决 acquisition 偏差。',
    proPaymentEvaluationAuditNextHoldMessaging:
      '继续把对外文案锁在 stay_validation，不提前承诺收费能力。',
    proPaymentEvaluationAuditNextHoldRecheck:
      '仅在三项检查全部通过后，再进入下一轮收费评估复核。',
    proPaymentEvaluationAuditNextEnterReview:
      '先复核价格表达、支付边界与证据链，再决定是否需要单独的收费实现计划。',
    proPaymentEvaluationAuditNextEnterApproval:
      '在进入任何收费实现前，仍需要单独的人类确认与里程碑批准。',
    proPaymentEvaluationAuditNextEnterNoPaymentImplementation:
      '即便审计通过，本轮也只停留在评估与复核，不直接实现支付。',
    proPaymentEvaluationAuditNoBlockers: '当前没有新增阻塞项。'
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

export function buildProPaymentEvaluationAuditPack(params: {
  verdict: ProRouteValidationVerdictPack;
  verdictSource?: { file?: string; sha256?: string };
}): ProPaymentEvaluationAuditPack {
  return buildProPaymentEvaluationAuditPackShared({
    verdict: params.verdict,
    verdictSource: params.verdictSource,
    getMessage: defaultAuditGetMessage
  });
}

export function formatProPaymentEvaluationAuditMarkdown(
  pack: ProPaymentEvaluationAuditPack
): string {
  return formatProPaymentEvaluationAuditMarkdownShared(pack, defaultAuditGetMessage);
}

async function buildProPaymentEvaluationAuditPackCli(args?: {
  verdict: string;
  outDir: string;
}): Promise<void> {
  const verdictRel = args?.verdict ?? '';
  assert.ok(
    verdictRel,
    'Usage: scripts/build-pro-payment-evaluation-audit-pack.ts <verdict.json> [outDir]'
  );

  const outDirRel = args?.outDir ?? DEFAULT_PRO_PAYMENT_EVALUATION_AUDIT_EVIDENCE_DIR;
  await ensureDir(outDirRel);

  const verdict = await readJsonFile<ProRouteValidationVerdictPack>(verdictRel);
  const pack = buildProPaymentEvaluationAuditPack({
    verdict,
    verdictSource: {
      file: verdictRel,
      sha256: await computeFileSha256(path.resolve(process.cwd(), verdictRel))
    }
  });

  const summaryJsonPath = path.posix.join(outDirRel, PRO_PAYMENT_EVALUATION_AUDIT_FILES.summaryJson);
  const summaryMdPath = path.posix.join(outDirRel, PRO_PAYMENT_EVALUATION_AUDIT_FILES.summaryMd);

  await writeUtf8File(summaryJsonPath, `${JSON.stringify(pack, null, 2)}\n`);
  await writeUtf8File(summaryMdPath, `${formatProPaymentEvaluationAuditMarkdown(pack).trimEnd()}\n`);
}

const invokedAsScript =
  Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1] as string).href;
if (invokedAsScript) {
  const argv = process.argv.slice(2);
  const verdict = argv[0] || '';
  const outDir = argv[1] || DEFAULT_PRO_PAYMENT_EVALUATION_AUDIT_EVIDENCE_DIR;

  buildProPaymentEvaluationAuditPackCli({
    verdict,
    outDir
  }).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
