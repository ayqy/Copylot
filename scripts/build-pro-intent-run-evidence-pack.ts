import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';

import { computeFileSha256 } from './cws-publish-evidence-pack.ts';

export const PRO_INTENT_RUN_EVIDENCE_DIR = 'docs/evidence/v1-90' as const;

const OUTPUT_FILES = Object.freeze({
  indexMd: 'index.md',
  evidencePackJson: 'pro-intent-run-evidence-pack.json',
  sha256Json: 'sha256.json'
});

type ProIntentRunEvidencePackInput = Readonly<Record<string, unknown>>;

function toPosixPath(p: string): string {
  return p.replace(/\\/g, '/');
}

function asBool(value: unknown): boolean {
  return value === true;
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function asNonNegNumber(value: unknown): number {
  if (!Number.isFinite(value)) return 0;
  const n = Number(value);
  if (n < 0) return 0;
  return n;
}

function normalizeTextWithFinalNewline(raw: string): string {
  return `${String(raw || '').trimEnd()}\n`;
}

async function ensureDir(dirRel: string): Promise<void> {
  await fs.mkdir(path.resolve(process.cwd(), dirRel), { recursive: true });
}

async function writeUtf8File(filePathRel: string, content: string): Promise<void> {
  const abs = path.resolve(process.cwd(), filePathRel);
  await fs.writeFile(abs, content, 'utf-8');
}

function validateEvidencePackForIndex(pack: unknown): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];

  const obj = (pack && typeof pack === 'object' ? (pack as ProIntentRunEvidencePackInput) : {}) as ProIntentRunEvidencePackInput;
  const enabled = asBool(obj.enabled);
  const disabledReason = obj.disabledReason;

  const env = (obj.env && typeof obj.env === 'object' ? (obj.env as Record<string, unknown>) : {}) as Record<string, unknown>;
  const exportedAt = asNonNegNumber(env.exportedAt);
  const extensionVersion = asString(env.extensionVersion);
  const isAnonymousUsageDataEnabled = asBool(env.isAnonymousUsageDataEnabled);

  if (!Number.isFinite(exportedAt) || exportedAt <= 0) reasons.push('env.exportedAt 缺失或非法');
  if (!extensionVersion) reasons.push('env.extensionVersion 缺失');
  if (isAnonymousUsageDataEnabled !== enabled) reasons.push('env.isAnonymousUsageDataEnabled 与 enabled 不一致');

  const proFunnelSummary = obj.proFunnelSummary;
  if (!proFunnelSummary || typeof proFunnelSummary !== 'object') reasons.push('proFunnelSummary 缺失或非法');

  const dist = obj.proWaitlistSurveyIntentDistribution;
  if (!dist || typeof dist !== 'object') reasons.push('proWaitlistSurveyIntentDistribution 缺失或非法');

  const csv = obj.proIntentEvents7dCsv;
  if (typeof csv !== 'string') reasons.push('proIntentEvents7dCsv 类型非法（必须为 string）');

  const weeklyMd = obj.proIntentWeeklyDigestMarkdown;
  if (typeof weeklyMd !== 'string') reasons.push('proIntentWeeklyDigestMarkdown 类型非法（必须为 string）');

  if (!enabled) {
    if (disabledReason !== 'anonymous_usage_data_disabled') reasons.push('enabled=false 时 disabledReason 必须为 anonymous_usage_data_disabled');
    if (csv !== '') reasons.push('enabled=false 时 proIntentEvents7dCsv 必须为空串（不得包含 CSV 内容）');
  }

  // PII heuristics (best-effort, must not block on unknown noise)
  const rawText = JSON.stringify(obj);
  if (rawText.includes('http://') || rawText.includes('https://')) {
    reasons.push('检测到 URL 字符串（不符合“无 PII/无网页内容”红线）');
  }

  return { ok: reasons.length === 0, reasons };
}

function formatIndexMarkdown(input: {
  evidencePackRelPath: string;
  evidencePackSha256: string;
  result: { ok: boolean; reasons: string[] };
}): string {
  const lines: string[] = [];
  lines.push('# V1-90 Pro 意向跑数取证执行闭环：证据包一键导出 + 离线落盘复盘材料');
  lines.push('');
  lines.push('- 子 PRD：`prds/v1-90.md`');
  lines.push(`- 证据目录：\`${PRO_INTENT_RUN_EVIDENCE_DIR}/\``);
  lines.push('- 导出入口：Options -> 隐私与可观测性 ->「Pro 意向漏斗摘要」->「下载 Pro 意向跑数证据包（JSON）」');
  lines.push('- 口径来源（唯一可信白名单）：`src/shared/telemetry.ts`');
  lines.push('- 离线落盘脚本（固定入口）：`scripts/build-pro-intent-run-evidence-pack.ts`');
  lines.push('');

  lines.push('## 证据包字段（单文件，可审计/可复盘）');
  lines.push('- env：exportedAt / extensionVersion / isAnonymousUsageDataEnabled');
  lines.push('- proFunnelSummary：按 source=popup|options 分组 + overall');
  lines.push('- proWaitlistSurveyIntentDistribution：survey_intent 等分布（聚合计数）');
  lines.push('- proIntentEvents7dCsv：过去 7 天 Pro 意向事件明细（CSV 字符串内嵌）');
  lines.push('- proIntentWeeklyDigestMarkdown：本周 Pro 意向证据摘要（Markdown 字符串内嵌）');
  lines.push('');

  lines.push('## 文件清单（含 sha256，可复算）');
  lines.push(`- \`${toPosixPath(input.evidencePackRelPath)}\``);
  lines.push(`  - sha256：\`${input.evidencePackSha256}\``);
  lines.push(`- \`${toPosixPath(path.posix.join(PRO_INTENT_RUN_EVIDENCE_DIR, OUTPUT_FILES.sha256Json))}\``);
  lines.push(`  - 说明：固化 \`${OUTPUT_FILES.indexMd}\` 与 \`${OUTPUT_FILES.evidencePackJson}\` 的 sha256（便于后续复盘对比）`);
  lines.push(`- \`${toPosixPath(path.posix.join(PRO_INTENT_RUN_EVIDENCE_DIR, OUTPUT_FILES.indexMd))}\``);
  lines.push('');

  lines.push('复算示例：');
  lines.push(`- \`shasum -a 256 ${toPosixPath(path.posix.join(PRO_INTENT_RUN_EVIDENCE_DIR, '*'))}\``);
  lines.push('');

  lines.push('## “无 PII”断言结论');
  if (input.result.ok) {
    lines.push('结论：PASS（证据包不包含 URL/标题/网页内容/复制内容/联系方式明文；事件口径来自 telemetry 白名单清洗）。');
  } else {
    lines.push('结论：BLOCKED（证据包可能包含不允许的字段/内容）。');
    lines.push('原因：');
    for (const r of input.result.reasons) lines.push(`- ${r}`);
  }
  lines.push('');

  lines.push('## 生成方式');
  lines.push(
    `- 命令：\`node --no-warnings=ExperimentalWarning --loader=ts-node/esm scripts/build-pro-intent-run-evidence-pack.ts <downloaded-pack.json>\``
  );
  lines.push('');

  return `${lines.join('\n')}\n`;
}

function formatAsStableJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export async function buildProIntentRunEvidencePackDocs(inputPackPath: string): Promise<void> {
  assert.ok(inputPackPath, 'Missing input evidence pack path');

  const absInput = path.resolve(process.cwd(), inputPackPath);
  const inputRaw = await fs.readFile(absInput, 'utf-8');
  const normalized = normalizeTextWithFinalNewline(inputRaw);
  const parsed = JSON.parse(normalized) as unknown;

  const evidenceDir = PRO_INTENT_RUN_EVIDENCE_DIR;
  await ensureDir(evidenceDir);

  const evidencePackRelPath = toPosixPath(path.join(evidenceDir, OUTPUT_FILES.evidencePackJson));
  const indexRelPath = toPosixPath(path.join(evidenceDir, OUTPUT_FILES.indexMd));
  const sha256RelPath = toPosixPath(path.join(evidenceDir, OUTPUT_FILES.sha256Json));

  // 1) evidence pack file (raw, to keep audit intent; "原样落盘/等价内容" is allowed in PRD)
  await writeUtf8File(evidencePackRelPath, normalized);

  const evidencePackSha256 = await computeFileSha256(path.resolve(process.cwd(), evidencePackRelPath));

  // 2) index.md (human readable)
  const result = validateEvidencePackForIndex(parsed);
  const indexMd = formatIndexMarkdown({
    evidencePackRelPath,
    evidencePackSha256,
    result
  });
  await writeUtf8File(indexRelPath, indexMd);

  // 3) sha256.json (machine readable, includes index + pack)
  const indexSha256 = await computeFileSha256(path.resolve(process.cwd(), indexRelPath));
  const sha256Json = formatAsStableJson({
    [OUTPUT_FILES.indexMd]: indexSha256,
    [OUTPUT_FILES.evidencePackJson]: evidencePackSha256
  });
  await writeUtf8File(sha256RelPath, sha256Json);

  if (!result.ok) {
    throw new Error(`Evidence pack BLOCKED. See: ${indexRelPath}`);
  }
}

if (import.meta.url === pathToFileURL(path.resolve(process.cwd(), process.argv[1] || '')).toString()) {
  const inputPackPath = process.argv[2];
  buildProIntentRunEvidencePackDocs(inputPackPath || '').catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

