import type { Settings } from './settings-manager.ts';
import {
  TELEMETRY_MAX_EVENTS,
  sanitizeTelemetryEvents,
  trimTelemetryEvents,
  type TelemetryEvent
} from './telemetry.ts';

export type WomSource = 'popup' | 'options' | 'rating_prompt';

export const WOM_EVENT_NAMES = [
  'wom_feedback_opened',
  'wom_share_opened',
  'wom_share_copied',
  'wom_rate_opened',
  'rating_prompt_shown',
  'rating_prompt_action'
] as const;

export type WomEventName = (typeof WOM_EVENT_NAMES)[number];

export interface WomSourceStats {
  counts: Record<WomEventName, number>;
  lastTs: Record<WomEventName, number | null>;
  rates: {
    share_copied_per_share_opened: number | null;
    rating_prompt_rate_clicked_per_prompt_shown: number | null;
  };
}

export interface WomSummary {
  enabled: boolean;
  disabledReason?: 'anonymous_usage_data_disabled';
  window: {
    maxEvents: number;
    policy: 'fifo';
    scope: 'current_window_only';
  };
  bySource: Record<WomSource, WomSourceStats>;
}

export interface WomSettingsSnapshot {
  isAnonymousUsageDataEnabled: boolean;
}

export interface WomEvidencePack {
  meta: {
    exportedAt: number;
    extensionVersion: string;
    source: 'options';
  };
  settings: WomSettingsSnapshot;
  womSummary: WomSummary;
  events: TelemetryEvent[];
}

const WOM_SOURCES: WomSource[] = ['popup', 'options', 'rating_prompt'];

function isWomEventName(name: unknown): name is WomEventName {
  return typeof name === 'string' && (WOM_EVENT_NAMES as readonly string[]).includes(name);
}

function isWomSource(value: unknown): value is WomSource {
  return value === 'popup' || value === 'options' || value === 'rating_prompt';
}

function createEmptySourceStats(): WomSourceStats {
  return {
    counts: {
      wom_feedback_opened: 0,
      wom_share_opened: 0,
      wom_share_copied: 0,
      wom_rate_opened: 0,
      rating_prompt_shown: 0,
      rating_prompt_action: 0
    },
    lastTs: {
      wom_feedback_opened: null,
      wom_share_opened: null,
      wom_share_copied: null,
      wom_rate_opened: null,
      rating_prompt_shown: null,
      rating_prompt_action: null
    },
    rates: {
      share_copied_per_share_opened: null,
      rating_prompt_rate_clicked_per_prompt_shown: null
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

export interface BuildWomSummaryParams {
  enabled: boolean;
  telemetryEvents: unknown;
  maxEvents?: number;
}

export function buildWomSummary(params: BuildWomSummaryParams): WomSummary {
  const maxEvents =
    Number.isFinite(params.maxEvents) && (params.maxEvents as number) > 0
      ? (params.maxEvents as number)
      : TELEMETRY_MAX_EVENTS;

  const bySource: Record<WomSource, WomSourceStats> = {
    popup: createEmptySourceStats(),
    options: createEmptySourceStats(),
    rating_prompt: createEmptySourceStats()
  };

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
      bySource
    };
  }

  const sanitized = sanitizeTelemetryEvents(params.telemetryEvents);
  const trimmed = trimTelemetryEvents(sanitized, maxEvents);

  const ratingPromptRateClicksBySource: Record<WomSource, number> = {
    popup: 0,
    options: 0,
    rating_prompt: 0
  };

  for (const event of trimmed) {
    if (!isWomEventName(event.name)) continue;

    const source = event.props?.source;
    if (!isWomSource(source)) continue;

    const stats = bySource[source];
    stats.counts[event.name] += 1;

    const prev = stats.lastTs[event.name];
    if (prev === null || event.ts > prev) {
      stats.lastTs[event.name] = event.ts;
    }

    if (event.name === 'rating_prompt_action' && event.props?.action === 'rate') {
      ratingPromptRateClicksBySource[source] += 1;
    }
  }

  for (const source of WOM_SOURCES) {
    const stats = bySource[source];
    stats.rates.share_copied_per_share_opened = safeRate(
      stats.counts.wom_share_copied,
      stats.counts.wom_share_opened
    );
    stats.rates.rating_prompt_rate_clicked_per_prompt_shown = safeRate(
      ratingPromptRateClicksBySource[source],
      stats.counts.rating_prompt_shown
    );
  }

  return {
    enabled: true,
    window,
    bySource
  };
}

export function buildWomSettingsSnapshot(settings: Settings): WomSettingsSnapshot {
  return {
    isAnonymousUsageDataEnabled: Boolean(settings?.isAnonymousUsageDataEnabled)
  };
}

export interface BuildWomEvidencePackParams {
  exportedAt: number;
  extensionVersion: string;
  settings: Settings;
  telemetryEvents: unknown;
  maxEvents?: number;
}

export function buildWomEvidencePack(params: BuildWomEvidencePackParams): WomEvidencePack {
  const settingsSnapshot = buildWomSettingsSnapshot(params.settings);
  const enabled = settingsSnapshot.isAnonymousUsageDataEnabled;

  const maxEvents =
    Number.isFinite(params.maxEvents) && (params.maxEvents as number) > 0
      ? (params.maxEvents as number)
      : TELEMETRY_MAX_EVENTS;

  const sanitized = sanitizeTelemetryEvents(params.telemetryEvents);
  const trimmed = trimTelemetryEvents(sanitized, maxEvents);
  const womEvents = trimmed.filter((event) => isWomEventName(event.name));

  const safeWomEvents = enabled ? trimTelemetryEvents(sanitizeTelemetryEvents(womEvents), maxEvents) : [];

  return {
    meta: {
      exportedAt: params.exportedAt,
      extensionVersion: params.extensionVersion || '',
      source: 'options'
    },
    settings: settingsSnapshot,
    womSummary: buildWomSummary({
      enabled,
      telemetryEvents: enabled ? trimmed : [],
      maxEvents
    }),
    events: safeWomEvents
  };
}

