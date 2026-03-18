import type { Settings } from './settings-manager';

// Keep in sync with src/shared/settings-manager.ts
const SETTINGS_STORAGE_KEY = 'copilot_settings';

export const TELEMETRY_EVENTS_KEY = 'copilot_telemetry_events';
export const TELEMETRY_MAX_EVENTS = 100;

export type TelemetryEventName =
  | 'popup_opened'
  | 'copy_success'
  | 'prompt_used'
  | 'onboarding_shown'
  | 'onboarding_completed'
  | 'rating_prompt_shown'
  | 'rating_prompt_action'
  | 'wom_feedback_opened'
  | 'wom_share_opened'
  | 'wom_share_copied'
  | 'wom_rate_opened';

export type TelemetryPropPrimitive = string | number | boolean;

export interface TelemetryEvent {
  name: TelemetryEventName;
  ts: number;
  props?: Record<string, TelemetryPropPrimitive>;
}

const TELEMETRY_EVENT_PROP_ALLOWLIST: Record<TelemetryEventName, readonly string[]> = {
  popup_opened: [],
  copy_success: [],
  prompt_used: [],
  onboarding_shown: ['source'],
  onboarding_completed: ['source', 'action'],
  rating_prompt_shown: [],
  rating_prompt_action: ['action'],
  wom_feedback_opened: [],
  wom_share_opened: [],
  wom_share_copied: [],
  wom_rate_opened: []
};

function isTelemetryEventName(value: unknown): value is TelemetryEventName {
  return typeof value === 'string' && value in TELEMETRY_EVENT_PROP_ALLOWLIST;
}

function isValidTimestamp(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function isAllowedPropValue(value: unknown): value is TelemetryPropPrimitive {
  return (
    typeof value === 'string' ||
    (typeof value === 'number' && Number.isFinite(value)) ||
    typeof value === 'boolean'
  );
}

function sanitizeProps(
  eventName: TelemetryEventName,
  props: unknown
): Record<string, TelemetryPropPrimitive> | undefined {
  const allowlist = TELEMETRY_EVENT_PROP_ALLOWLIST[eventName];
  if (!props || typeof props !== 'object') return undefined;

  const raw = props as Record<string, unknown>;
  const sanitized: Record<string, TelemetryPropPrimitive> = {};

  for (const key of allowlist) {
    if (!(key in raw)) continue;
    const value = raw[key];
    if (!isAllowedPropValue(value)) continue;
    sanitized[key] = value;
  }

  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}

/**
 * 纯函数：对事件做白名单过滤，保证只保留 name/ts/props(白名单)。
 * - 未知事件名 -> null
 * - ts 非法 -> null
 * - props 只保留该事件的 allowlist key 且值为 string|number|boolean
 */
export function sanitizeTelemetryEvent(input: unknown): TelemetryEvent | null {
  if (!input || typeof input !== 'object') return null;
  const raw = input as Partial<TelemetryEvent> & { name?: unknown; ts?: unknown; props?: unknown };

  if (!isTelemetryEventName(raw.name)) return null;
  if (!isValidTimestamp(raw.ts)) return null;

  const sanitized: TelemetryEvent = {
    name: raw.name,
    ts: raw.ts
  };

  const sanitizedProps = sanitizeProps(raw.name, raw.props);
  if (sanitizedProps) sanitized.props = sanitizedProps;

  return sanitized;
}

/**
 * 纯函数：保留最近 max 条事件，超出丢弃最旧（FIFO）。
 */
export function trimTelemetryEvents(events: TelemetryEvent[], max: number = TELEMETRY_MAX_EVENTS): TelemetryEvent[] {
  if (!Array.isArray(events)) return [];
  if (!Number.isFinite(max) || max <= 0) return [];
  if (events.length <= max) return [...events];
  return events.slice(events.length - max);
}

function normalizeStoredTelemetryEvents(stored: unknown): TelemetryEvent[] {
  if (!Array.isArray(stored)) return [];
  const sanitized: TelemetryEvent[] = [];
  for (const item of stored) {
    const next = sanitizeTelemetryEvent(item);
    if (next) sanitized.push(next);
  }
  return sanitized;
}

function appendTelemetryEvent(events: TelemetryEvent[], next: TelemetryEvent): TelemetryEvent[] {
  return trimTelemetryEvents([...events, next], TELEMETRY_MAX_EVENTS);
}

let cachedIsEnabled: boolean | null = null;
let enabledInitPromise: Promise<boolean> | null = null;
let enabledListenerInstalled = false;

async function readIsEnabledFromSync(): Promise<boolean> {
  if (typeof chrome === 'undefined' || !chrome.storage?.sync) return false;

  try {
    const result = await chrome.storage.sync.get(SETTINGS_STORAGE_KEY);
    const rawSettings = result[SETTINGS_STORAGE_KEY] as Partial<Settings> | undefined;
    return Boolean(rawSettings?.isAnonymousUsageDataEnabled);
  } catch (error) {
    console.warn('Failed to read anonymous usage data setting:', error);
    return false;
  }
}

function installEnabledListener() {
  if (enabledListenerInstalled) return;
  if (typeof chrome === 'undefined' || !chrome.storage?.onChanged) return;

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'sync') return;
    const settingsChange = changes[SETTINGS_STORAGE_KEY];
    if (!settingsChange) return;

    const nextSettings = settingsChange.newValue as Partial<Settings> | undefined;
    const nextEnabled = Boolean(nextSettings?.isAnonymousUsageDataEnabled);
    const prevEnabled = cachedIsEnabled;
    cachedIsEnabled = nextEnabled;

    if (prevEnabled && !nextEnabled) {
      void clearTelemetryEvents();
    }
  });

  enabledListenerInstalled = true;
}

async function isTelemetryEnabled(): Promise<boolean> {
  if (cachedIsEnabled !== null) return cachedIsEnabled;
  if (enabledInitPromise) return enabledInitPromise;

  enabledInitPromise = (async () => {
    const enabled = await readIsEnabledFromSync();
    cachedIsEnabled = enabled;
    installEnabledListener();
    return enabled;
  })();

  return enabledInitPromise;
}

export async function clearTelemetryEvents(): Promise<void> {
  try {
    if (typeof chrome === 'undefined' || !chrome.storage?.local) return;
    await chrome.storage.local.remove(TELEMETRY_EVENTS_KEY);
  } catch (error) {
    console.warn('Failed to clear telemetry events:', error);
  }
}

/**
 * 记录本地匿名事件（仅本地，不联网）。
 * - 开关关闭：不写入/不更新 key
 * - 开关关闭后：由监听器/设置页触发清空
 * - 写入失败：吞掉错误，不影响主流程
 */
export async function recordTelemetryEvent(
  name: TelemetryEventName,
  props?: Record<string, TelemetryPropPrimitive>
): Promise<void> {
  try {
    const enabled = await isTelemetryEnabled();
    if (!enabled) return;

    if (typeof chrome === 'undefined' || !chrome.storage?.local) return;

    const event = sanitizeTelemetryEvent({ name, ts: Date.now(), props });
    if (!event) return;

    const result = await chrome.storage.local.get(TELEMETRY_EVENTS_KEY);
    const existing = normalizeStoredTelemetryEvents(result[TELEMETRY_EVENTS_KEY]);
    const nextEvents = appendTelemetryEvent(existing, event);
    await chrome.storage.local.set({ [TELEMETRY_EVENTS_KEY]: nextEvents });
  } catch (error) {
    console.warn('Failed to record telemetry event:', error);
  }
}
