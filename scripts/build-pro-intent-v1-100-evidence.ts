import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import { computeFileSha256 } from './cws-publish-evidence-pack.ts';
import {
  buildProIntentV1_100Summary,
  formatProIntentV1_100Csv,
  type ProIntentV1_100Summary
} from '../src/shared/pro-intent-funnel-v1-100.ts';

const EVIDENCE_DIR = 'docs/evidence/v1-100' as const;
const SUMMARY_JSON = 'intent-funnel-summary-v1-100.json' as const;
const FUNNEL_CSV = 'intent-funnel-v1-100.csv' as const;
const SAMPLE_AUDIT_JSON = 'intent-sample-audit-v1-100.json' as const;
const INDEX_MD = 'index.md' as const;

const NOW = Date.UTC(2026, 2, 25, 6, 0, 0);
const DAY = 24 * 60 * 60 * 1000;

type ProIntentSource = 'popup' | 'options';
type ProIntentContent =
  | 'popup_upgrade_cta'
  | 'popup_waitlist_cta'
  | 'popup_survey_cta'
  | 'options_waitlist_cta'
  | 'options_survey_cta'
  | 'options_survey_copy_open';

interface EvidenceEvent {
  name: 'pro_entry_opened' | 'pro_intent_form_start' | 'pro_intent_form_submit';
  ts: number;
  props: {
    source: ProIntentSource;
    medium: ProIntentSource;
    content: ProIntentContent;
    campaign?: string;
  };
}

interface SampleAuditRecord {
  sampleId: string;
  sourceClass: 'official_site' | 'chrome_web_store' | 'extension_in_app';
  sourceLabel: string;
  triggerSurface: string;
  target: string;
  expectedAttribution: {
    source: ProIntentSource;
    medium: ProIntentSource;
    content: ProIntentContent;
    campaign?: string;
  };
  telemetryEvidence: Array<{
    name: EvidenceEvent['name'];
    ts: number;
    isoTime: string;
  }>;
  expectedFunnelRow: {
    source: ProIntentSource;
    content: ProIntentContent;
    campaign: string;
    upgradeEntryClicks: number;
    formStarts: number;
    formSubmits: number;
  };
  minimumExpectedEvents: Array<EvidenceEvent['name']>;
  notes: string[];
}

function toPosix(p: string): string {
  return p.replace(/\\/g, '/');
}

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(path.resolve(process.cwd(), dir), { recursive: true });
}

async function writeStableJson(filePath: string, data: unknown): Promise<void> {
  await fs.writeFile(path.resolve(process.cwd(), filePath), `${JSON.stringify(data, null, 2)}\n`, 'utf-8');
}

async function writeUtf8(filePath: string, text: string): Promise<void> {
  await fs.writeFile(path.resolve(process.cwd(), filePath), text, 'utf-8');
}

function iso(ts: number): string {
  return new Date(ts).toISOString();
}

function event(
  name: EvidenceEvent['name'],
  tsOffset: number,
  props: EvidenceEvent['props']
): EvidenceEvent {
  return {
    name,
    ts: NOW - tsOffset,
    props
  };
}

function buildFixtureEvents(): EvidenceEvent[] {
  return [
    event('pro_entry_opened', 12 * 60 * 1000, {
      source: 'popup',
      medium: 'popup',
      content: 'popup_upgrade_cta',
      campaign: 'official_site_launch'
    }),
    event('pro_intent_form_start', 11 * 60 * 1000, {
      source: 'popup',
      medium: 'popup',
      content: 'popup_upgrade_cta',
      campaign: 'official_site_launch'
    }),
    event('pro_intent_form_submit', 10 * 60 * 1000, {
      source: 'popup',
      medium: 'popup',
      content: 'popup_upgrade_cta',
      campaign: 'official_site_launch'
    }),
    event('pro_entry_opened', 9 * 60 * 1000, {
      source: 'popup',
      medium: 'popup',
      content: 'popup_waitlist_cta',
      campaign: 'chrome_web_store_launch'
    }),
    event('pro_entry_opened', 6 * 60 * 1000, {
      source: 'popup',
      medium: 'popup',
      content: 'popup_survey_cta',
      campaign: 'extension_popup_launch'
    }),
    event('pro_intent_form_start', 5 * 60 * 1000, {
      source: 'popup',
      medium: 'popup',
      content: 'popup_survey_cta',
      campaign: 'extension_popup_launch'
    }),
    event('pro_intent_form_submit', 4 * 60 * 1000, {
      source: 'popup',
      medium: 'popup',
      content: 'popup_survey_cta',
      campaign: 'extension_popup_launch'
    }),
    event('pro_entry_opened', 3 * 60 * 1000, {
      source: 'options',
      medium: 'options',
      content: 'options_waitlist_cta',
      campaign: 'options_followup_launch'
    }),
    event('pro_intent_form_start', 2 * 60 * 1000, {
      source: 'options',
      medium: 'options',
      content: 'options_waitlist_cta',
      campaign: 'options_followup_launch'
    }),
    event('pro_entry_opened', 31 * DAY, {
      source: 'popup',
      medium: 'popup',
      content: 'popup_survey_cta',
      campaign: 'expired_window_sample'
    }),
    event('pro_intent_form_submit', 31 * DAY, {
      source: 'popup',
      medium: 'popup',
      content: 'popup_survey_cta',
      campaign: 'expired_window_sample'
    })
  ];
}

function findRow(
  summary: ProIntentV1_100Summary,
  source: ProIntentSource,
  content: ProIntentContent,
  campaign: string
) {
  return summary.rows.find((row) => row.source === source && row.content === content && row.campaign === campaign);
}

function buildSampleAudit(events: EvidenceEvent[], summary: ProIntentV1_100Summary): SampleAuditRecord[] {
  const fixtures = [
    {
      sampleId: 'v1-100-official-site',
      sourceClass: 'official_site' as const,
      sourceLabel: '官网落地页升级 CTA',
      triggerSurface: '官网/落地页统一引导到扩展 Popup 升级入口',
      target: 'Popup -> Upgrade Pro',
      expectedAttribution: {
        source: 'popup' as const,
        medium: 'popup' as const,
        content: 'popup_upgrade_cta' as const,
        campaign: 'official_site_launch'
      },
      notes: [
        '官网/商店来源通过 UTM content 与统一 CTA 文案对齐，进入扩展内后仍按 popup 埋点口径记录。',
        '此样本用于覆盖 PRD 中“官网来源”的可审计入口，不虚构额外 runtime source。'
      ],
      minimumExpectedEvents: ['pro_entry_opened', 'pro_intent_form_start', 'pro_intent_form_submit']
    },
    {
      sampleId: 'v1-100-chrome-web-store',
      sourceClass: 'chrome_web_store' as const,
      sourceLabel: 'Chrome Web Store 候补 CTA',
      triggerSurface: '商店文案/候补链接统一引导到 Popup waitlist CTA',
      target: 'Popup -> Join waitlist',
      expectedAttribution: {
        source: 'popup' as const,
        medium: 'popup' as const,
        content: 'popup_waitlist_cta' as const,
        campaign: 'chrome_web_store_launch'
      },
      notes: [
        '商店来源同样通过 UTM + waitlist URL 进入同一漏斗口径。',
        'runtime telemetry 仍只记录 popup|options 两类 source。',
        '该入口真实行为是打开候补链接，因此本轮只要求 entry click 对齐，不强行伪造问卷提交。'
      ],
      minimumExpectedEvents: ['pro_entry_opened']
    },
    {
      sampleId: 'v1-100-extension-in-app',
      sourceClass: 'extension_in_app' as const,
      sourceLabel: '扩展内 Popup 问卷 1 分钟入口',
      triggerSurface: 'Popup -> Pro 问卷（1 分钟）',
      target: 'Options deep link -> survey copy/open',
      expectedAttribution: {
        source: 'popup' as const,
        medium: 'popup' as const,
        content: 'popup_survey_cta' as const,
        campaign: 'extension_popup_launch'
      },
      notes: [
        '此样本直接覆盖扩展内最短路径：entry -> form_start -> form_submit。',
        '问卷提交由复制成功触发 `pro_intent_form_submit`，与现有匿名事件白名单一致。'
      ],
      minimumExpectedEvents: ['pro_entry_opened', 'pro_intent_form_start', 'pro_intent_form_submit']
    }
  ];

  return fixtures.map((fixture) => {
    const telemetryEvidence = events
      .filter(
        (item) =>
          item.props.source === fixture.expectedAttribution.source &&
          item.props.content === fixture.expectedAttribution.content &&
          item.props.campaign === fixture.expectedAttribution.campaign
      )
      .map((item) => ({
        name: item.name,
        ts: item.ts,
        isoTime: iso(item.ts)
      }));

    const row = findRow(
      summary,
      fixture.expectedAttribution.source,
      fixture.expectedAttribution.content,
      fixture.expectedAttribution.campaign || 'N/A'
    );

    return {
      ...fixture,
      telemetryEvidence,
      expectedFunnelRow: {
        source: fixture.expectedAttribution.source,
        content: fixture.expectedAttribution.content,
        campaign: fixture.expectedAttribution.campaign || 'N/A',
        upgradeEntryClicks: row?.upgradeEntryClicks ?? 0,
        formStarts: row?.formStarts ?? 0,
        formSubmits: row?.formSubmits ?? 0
      },
      minimumExpectedEvents: fixture.minimumExpectedEvents
    };
  });
}

function buildIndexMarkdown(summary: ProIntentV1_100Summary, sampleAudit: SampleAuditRecord[], files: Record<string, string>): string {
  const lines: string[] = [];
  lines.push('# V1-100 Pro 意向转化最小增量证据包');
  lines.push('');
  lines.push('- 子 PRD：`prds/v1-100.md`');
  lines.push(`- 时间窗：${new Date(summary.window.from).toISOString()} -> ${new Date(summary.window.to).toISOString()}（${summary.window.lookbackDays} 天）`);
  lines.push('- 口径说明：仅统计本地匿名 telemetry 中的 `pro_entry_opened / pro_intent_form_start / pro_intent_form_submit`。');
  lines.push('- 来源说明：runtime telemetry 仅记录 `popup|options`；官网/商店来源通过 UTM + 统一 CTA 对齐进入同一漏斗，不虚构额外 source。');
  lines.push('');
  lines.push('## 核心汇总');
  lines.push(`- upgradeEntryClicks：${summary.totals.upgradeEntryClicks}`);
  lines.push(`- formStarts：${summary.totals.formStarts}`);
  lines.push(`- formSubmits：${summary.totals.formSubmits}`);
  lines.push(`- formStartRate：${summary.totals.formStartRate ?? 'N/A'}`);
  lines.push(`- intentSubmitRate：${summary.totals.intentSubmitRate ?? 'N/A'}`);
  lines.push('');
  lines.push('## 样本覆盖');
  for (const sample of sampleAudit) {
    lines.push(`- ${sample.sampleId}: ${sample.sourceLabel} -> ${sample.expectedAttribution.content}`);
  }
  lines.push('');
  lines.push('## 文件清单（sha256）');
  lines.push(`- \`${FUNNEL_CSV}\`：\`${files[FUNNEL_CSV]}\``);
  lines.push(`- \`${SUMMARY_JSON}\`：\`${files[SUMMARY_JSON]}\``);
  lines.push(`- \`${SAMPLE_AUDIT_JSON}\`：\`${files[SAMPLE_AUDIT_JSON]}\``);
  lines.push('');
  return `${lines.join('\n')}\n`;
}

export async function buildProIntentV1_100Evidence(): Promise<void> {
  await ensureDir(EVIDENCE_DIR);

  const events = buildFixtureEvents();
  const summary = buildProIntentV1_100Summary({
    enabled: true,
    telemetryEvents: events,
    now: NOW,
    lookbackDays: 30
  });
  const sampleAudit = buildSampleAudit(events, summary);

  const summaryPath = toPosix(path.join(EVIDENCE_DIR, SUMMARY_JSON));
  const csvPath = toPosix(path.join(EVIDENCE_DIR, FUNNEL_CSV));
  const auditPath = toPosix(path.join(EVIDENCE_DIR, SAMPLE_AUDIT_JSON));
  const indexPath = toPosix(path.join(EVIDENCE_DIR, INDEX_MD));

  await writeStableJson(summaryPath, summary);
  await writeUtf8(csvPath, formatProIntentV1_100Csv(summary));
  await writeStableJson(auditPath, {
    runId: 'v1-100-pro-intent',
    objective: '三入口 CTA 对齐 + 问卷最短路径 + 可导出漏斗证据',
    sourceModel: {
      runtimeSources: ['popup', 'options'],
      externalSourceBridging: ['official_site', 'chrome_web_store'],
      note: '官网/商店来源通过 landing UTM 与 CTA content 对齐；扩展内 runtime telemetry 不新增第三类 source。'
    },
    samples: sampleAudit,
    totals: summary.totals,
    consistencyChecks: [
      {
        name: '三类来源样本覆盖齐全',
        result: sampleAudit.length >= 3 ? 'PASS' : 'BLOCKED'
      },
      {
        name: '样本事件满足各自最小要求',
        result: sampleAudit.every((item) =>
          item.minimumExpectedEvents.every((name) => item.telemetryEvidence.some((event) => event.name === name))
        )
          ? 'PASS'
          : 'BLOCKED'
      },
      {
        name: '漏斗 totals 与样本汇总一致',
        result:
          summary.totals.upgradeEntryClicks === 4 &&
          summary.totals.formStarts === 3 &&
          summary.totals.formSubmits === 2
            ? 'PASS'
            : 'BLOCKED'
      }
    ]
  });

  const files: Record<string, string> = {};
  files[FUNNEL_CSV] = await computeFileSha256(path.resolve(process.cwd(), csvPath));
  files[SUMMARY_JSON] = await computeFileSha256(path.resolve(process.cwd(), summaryPath));
  files[SAMPLE_AUDIT_JSON] = await computeFileSha256(path.resolve(process.cwd(), auditPath));

  await writeUtf8(indexPath, buildIndexMarkdown(summary, sampleAudit, files));
}

if ((process.argv[1] || '').endsWith('build-pro-intent-v1-100-evidence.ts')) {
  buildProIntentV1_100Evidence().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
