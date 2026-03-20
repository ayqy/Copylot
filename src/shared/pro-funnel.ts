import type { Settings } from './settings-manager.ts';
import {
  TELEMETRY_MAX_EVENTS,
  sanitizeTelemetryEvents,
  trimTelemetryEvents,
  type TelemetryEvent
} from './telemetry.ts';

export type ProFunnelSource = 'popup' | 'options';

export const PRO_FUNNEL_EVENT_NAMES = [
  'pro_prompt_shown',
  'pro_prompt_action',
  'pro_entry_opened',
  'pro_waitlist_opened',
  'pro_waitlist_copied'
] as const;

export type ProFunnelEventName = (typeof PRO_FUNNEL_EVENT_NAMES)[number];

export interface ProFunnelSourceStats {
  counts: Record<ProFunnelEventName, number>;
  lastTs: Record<ProFunnelEventName, number | null>;
  rates: {
    entry_opened_per_prompt_shown: number | null;
    waitlist_opened_per_prompt_shown: number | null;
    waitlist_opened_per_entry_opened: number | null;
    waitlist_copied_per_waitlist_opened: number | null;
  };
}

export interface ProFunnelSummary {
  enabled: boolean;
  disabledReason?: 'anonymous_usage_data_disabled';
  window: {
    maxEvents: number;
    policy: 'fifo';
    scope: 'current_window_only';
  };
  bySource: Record<ProFunnelSource, ProFunnelSourceStats>;
  overall: ProFunnelSourceStats;
}

export interface ProFunnelSettingsSnapshot {
  isAnonymousUsageDataEnabled: boolean;
}

export interface ProFunnelEvidencePack {
  meta: {
    exportedAt: number;
    extensionVersion: string;
    source: 'options';
  };
  settings: ProFunnelSettingsSnapshot;
  proFunnel: ProFunnelSummary;
  events: TelemetryEvent[];
}

const PRO_SOURCES: ProFunnelSource[] = ['popup', 'options'];

function isProFunnelEventName(name: unknown): name is ProFunnelEventName {
  return typeof name === 'string' && (PRO_FUNNEL_EVENT_NAMES as readonly string[]).includes(name);
}

function isProFunnelSource(value: unknown): value is ProFunnelSource {
  return value === 'popup' || value === 'options';
}

function createEmptySourceStats(): ProFunnelSourceStats {
  return {
    counts: {
      pro_prompt_shown: 0,
      pro_prompt_action: 0,
      pro_entry_opened: 0,
      pro_waitlist_opened: 0,
      pro_waitlist_copied: 0
    },
    lastTs: {
      pro_prompt_shown: null,
      pro_prompt_action: null,
      pro_entry_opened: null,
      pro_waitlist_opened: null,
      pro_waitlist_copied: null
    },
    rates: {
      entry_opened_per_prompt_shown: null,
      waitlist_opened_per_prompt_shown: null,
      waitlist_opened_per_entry_opened: null,
      waitlist_copied_per_waitlist_opened: null
    }
  };
}

function roundTo4(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

function safeRate(numerator: number, denominator: number): number | null {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) return null;
  const value = numerator / denominator;
  if (!Number.isFinite(value) || value < 0) return null;
  return roundTo4(value);
}

export interface BuildProFunnelSummaryParams {
  enabled: boolean;
  telemetryEvents: unknown;
  maxEvents?: number;
}

export function buildProFunnelSummary(params: BuildProFunnelSummaryParams): ProFunnelSummary {
  const maxEvents = Number.isFinite(params.maxEvents) && (params.maxEvents as number) > 0
    ? (params.maxEvents as number)
    : TELEMETRY_MAX_EVENTS;

  const bySource: Record<ProFunnelSource, ProFunnelSourceStats> = {
    popup: createEmptySourceStats(),
    options: createEmptySourceStats()
  };

  const overall: ProFunnelSourceStats = createEmptySourceStats();

  const window = {
    maxEvents,
    policy: 'fifo' as const,
    scope: 'current_window_only' as const
  };

  if (!params.enabled) {
    return {
      enabled: false,
      disabledReason: 'anonymous_usage_data_disabled',
      window,
      bySource,
      overall
    };
  }

  const sanitized = sanitizeTelemetryEvents(params.telemetryEvents);
  const trimmed = trimTelemetryEvents(sanitized, maxEvents);

  for (const event of trimmed) {
    if (!isProFunnelEventName(event.name)) continue;
    const source = event.props?.source;
    if (!isProFunnelSource(source)) continue;

    const stats = bySource[source];
    stats.counts[event.name] += 1;

    const prev = stats.lastTs[event.name];
    if (prev === null || event.ts > prev) {
      stats.lastTs[event.name] = event.ts;
    }
  }

  for (const source of PRO_SOURCES) {
    const stats = bySource[source];
    stats.rates.entry_opened_per_prompt_shown = safeRate(
      stats.counts.pro_entry_opened,
      stats.counts.pro_prompt_shown
    );
    stats.rates.waitlist_opened_per_prompt_shown = safeRate(
      stats.counts.pro_waitlist_opened,
      stats.counts.pro_prompt_shown
    );
    stats.rates.waitlist_opened_per_entry_opened = safeRate(
      stats.counts.pro_waitlist_opened,
      stats.counts.pro_entry_opened
    );
    stats.rates.waitlist_copied_per_waitlist_opened = safeRate(
      stats.counts.pro_waitlist_copied,
      stats.counts.pro_waitlist_opened
    );
  }

  for (const source of PRO_SOURCES) {
    const stats = bySource[source];
    for (const name of PRO_FUNNEL_EVENT_NAMES) {
      overall.counts[name] += stats.counts[name];
      const ts = stats.lastTs[name];
      const prev = overall.lastTs[name];
      if (ts !== null && (prev === null || ts > prev)) {
        overall.lastTs[name] = ts;
      }
    }
  }

  overall.rates.entry_opened_per_prompt_shown = safeRate(
    overall.counts.pro_entry_opened,
    overall.counts.pro_prompt_shown
  );
  overall.rates.waitlist_opened_per_prompt_shown = safeRate(
    overall.counts.pro_waitlist_opened,
    overall.counts.pro_prompt_shown
  );
  overall.rates.waitlist_opened_per_entry_opened = safeRate(
    overall.counts.pro_waitlist_opened,
    overall.counts.pro_entry_opened
  );
  overall.rates.waitlist_copied_per_waitlist_opened = safeRate(
    overall.counts.pro_waitlist_copied,
    overall.counts.pro_waitlist_opened
  );

  return {
    enabled: true,
    window,
    bySource,
    overall
  };
}

export function buildProFunnelSettingsSnapshot(settings: Settings): ProFunnelSettingsSnapshot {
  return {
    isAnonymousUsageDataEnabled: Boolean(settings?.isAnonymousUsageDataEnabled)
  };
}

export interface BuildProFunnelEvidencePackParams {
  exportedAt: number;
  extensionVersion: string;
  settings: Settings;
  telemetryEvents: unknown;
  maxEvents?: number;
}

export function buildProFunnelEvidencePack(params: BuildProFunnelEvidencePackParams): ProFunnelEvidencePack {
  const settingsSnapshot = buildProFunnelSettingsSnapshot(params.settings);
  const enabled = settingsSnapshot.isAnonymousUsageDataEnabled;

  const maxEvents = Number.isFinite(params.maxEvents) && (params.maxEvents as number) > 0
    ? (params.maxEvents as number)
    : TELEMETRY_MAX_EVENTS;

  const sanitized = sanitizeTelemetryEvents(params.telemetryEvents);
  const trimmed = trimTelemetryEvents(sanitized, maxEvents);
  const proEvents = trimmed.filter((event) => isProFunnelEventName(event.name));

  const safeProEvents = enabled ? trimTelemetryEvents(sanitizeTelemetryEvents(proEvents), maxEvents) : [];

  return {
    meta: {
      exportedAt: params.exportedAt,
      extensionVersion: params.extensionVersion || '',
      source: 'options'
    },
    settings: settingsSnapshot,
    proFunnel: buildProFunnelSummary({
      enabled,
      telemetryEvents: enabled ? trimmed : [],
      maxEvents
    }),
    events: safeProEvents
  };
}
