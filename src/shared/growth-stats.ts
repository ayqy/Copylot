export const GROWTH_STATS_KEY = 'copilot_growth_stats';

export type RatingPromptAction = 'rate' | 'later' | 'never';

export interface GrowthStats {
  installedAt: number;
  successfulCopyCount: number;

  // Funnel milestones (local only, auditable, privacy-safe)
  firstPopupOpenedAt?: number;
  firstSuccessfulCopyAt?: number;
  lastSuccessfulCopyAt?: number;
  firstPromptUsedAt?: number;
  reusedWithin7DaysAt?: number;

  ratingPromptShownAt?: number;
  ratingPromptAction?: RatingPromptAction;
  ratingPromptActionAt?: number;
}

export interface GrowthFunnelSummary {
  // Raw milestones (auditable, local only)
  installedAt: number;
  successfulCopyCount: number;
  firstPopupOpenedAt?: number;
  firstSuccessfulCopyAt?: number;
  firstPromptUsedAt?: number;
  reusedWithin7DaysAt?: number;

  // Derived progress flags (must not be persisted)
  isPopupOpened: boolean;
  isActivated: boolean;
  isPromptUsed: boolean;
  isReusedWithin7Days: boolean;

  // Activation within 3 minutes from first popup open
  timeFromFirstPopupToFirstCopyMs?: number;
  activatedWithin3MinutesFromFirstPopup?: boolean;
}

export const RATING_PROMPT_MIN_INSTALL_AGE_MS = 48 * 60 * 60 * 1000;
export const RATING_PROMPT_MIN_SUCCESSFUL_COPY_COUNT = 10;

const RATING_PROMPT_MIN_SUCCESSFUL_COPY_COUNT_HEAVY_USER = 20;

const REUSE_WITHIN_7_DAYS_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const ACTIVATION_WITHIN_3_MINUTES_MS = 3 * 60 * 1000;

function isValidTimestamp(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function isValidCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isValidRatingPromptAction(value: unknown): value is RatingPromptAction {
  return value === 'rate' || value === 'later' || value === 'never';
}

function createDefaultGrowthStats(now: number): GrowthStats {
  return {
    installedAt: now,
    successfulCopyCount: 0
  };
}

export function normalizeGrowthStatsValue(stored: unknown, now: number): GrowthStats {
  const raw = (stored || {}) as Partial<GrowthStats>;

  const installedAt = isValidTimestamp(raw.installedAt) ? raw.installedAt : now;
  const successfulCopyCount = isValidCount(raw.successfulCopyCount) ? raw.successfulCopyCount : 0;

  const firstPopupOpenedAt = isValidTimestamp(raw.firstPopupOpenedAt) ? raw.firstPopupOpenedAt : undefined;
  const firstSuccessfulCopyAt = isValidTimestamp(raw.firstSuccessfulCopyAt) ? raw.firstSuccessfulCopyAt : undefined;
  const lastSuccessfulCopyAt = isValidTimestamp(raw.lastSuccessfulCopyAt) ? raw.lastSuccessfulCopyAt : undefined;
  const firstPromptUsedAt = isValidTimestamp(raw.firstPromptUsedAt) ? raw.firstPromptUsedAt : undefined;
  const reusedWithin7DaysAt = isValidTimestamp(raw.reusedWithin7DaysAt) ? raw.reusedWithin7DaysAt : undefined;

  const ratingPromptShownAt = isValidTimestamp(raw.ratingPromptShownAt) ? raw.ratingPromptShownAt : undefined;
  const ratingPromptAction = isValidRatingPromptAction(raw.ratingPromptAction)
    ? raw.ratingPromptAction
    : undefined;
  const ratingPromptActionAt = isValidTimestamp(raw.ratingPromptActionAt) ? raw.ratingPromptActionAt : undefined;

  const normalized: GrowthStats = {
    installedAt,
    successfulCopyCount
  };

  if (firstPopupOpenedAt) normalized.firstPopupOpenedAt = firstPopupOpenedAt;
  if (firstSuccessfulCopyAt) normalized.firstSuccessfulCopyAt = firstSuccessfulCopyAt;
  if (lastSuccessfulCopyAt) normalized.lastSuccessfulCopyAt = lastSuccessfulCopyAt;
  if (firstPromptUsedAt) normalized.firstPromptUsedAt = firstPromptUsedAt;
  if (reusedWithin7DaysAt) normalized.reusedWithin7DaysAt = reusedWithin7DaysAt;

  if (ratingPromptShownAt) normalized.ratingPromptShownAt = ratingPromptShownAt;
  if (ratingPromptAction) normalized.ratingPromptAction = ratingPromptAction;
  if (ratingPromptActionAt) normalized.ratingPromptActionAt = ratingPromptActionAt;

  return normalized;
}

export function buildGrowthFunnelSummary(stats: GrowthStats, now: number): GrowthFunnelSummary {
  const installedAt = isValidTimestamp(stats.installedAt) ? stats.installedAt : now;
  const successfulCopyCount = isValidCount(stats.successfulCopyCount) ? stats.successfulCopyCount : 0;

  const firstPopupOpenedAt = isValidTimestamp(stats.firstPopupOpenedAt) ? stats.firstPopupOpenedAt : undefined;
  const firstSuccessfulCopyAt = isValidTimestamp(stats.firstSuccessfulCopyAt) ? stats.firstSuccessfulCopyAt : undefined;
  const firstPromptUsedAt = isValidTimestamp(stats.firstPromptUsedAt) ? stats.firstPromptUsedAt : undefined;
  const reusedWithin7DaysAt = isValidTimestamp(stats.reusedWithin7DaysAt) ? stats.reusedWithin7DaysAt : undefined;

  const isPopupOpened = Boolean(firstPopupOpenedAt);
  const isActivated = Boolean(firstSuccessfulCopyAt) || successfulCopyCount > 0;
  const isPromptUsed = Boolean(firstPromptUsedAt);
  const isReusedWithin7Days = Boolean(reusedWithin7DaysAt);

  let timeFromFirstPopupToFirstCopyMs: number | undefined;
  let activatedWithin3MinutesFromFirstPopup: boolean | undefined;

  if (firstPopupOpenedAt && firstSuccessfulCopyAt) {
    const delta = firstSuccessfulCopyAt - firstPopupOpenedAt;
    if (Number.isFinite(delta) && delta >= 0) {
      timeFromFirstPopupToFirstCopyMs = delta;
      activatedWithin3MinutesFromFirstPopup = delta <= ACTIVATION_WITHIN_3_MINUTES_MS;
    }
  }

  return {
    installedAt,
    successfulCopyCount,
    firstPopupOpenedAt,
    firstSuccessfulCopyAt,
    firstPromptUsedAt,
    reusedWithin7DaysAt,
    isPopupOpened,
    isActivated,
    isPromptUsed,
    isReusedWithin7Days,
    timeFromFirstPopupToFirstCopyMs,
    activatedWithin3MinutesFromFirstPopup
  };
}

export interface ApplySuccessfulCopyOptions {
  now: number;
  isPromptUsed?: boolean;
}

export function applySuccessfulCopyToGrowthStats(
  stats: GrowthStats,
  options: ApplySuccessfulCopyOptions
): GrowthStats {
  const now = options.now;
  const prevCount = stats.successfulCopyCount || 0;
  const nextCount = prevCount + 1;

  const nextFirstSuccessfulCopyAt = stats.firstSuccessfulCopyAt || now;

  const next: GrowthStats = {
    ...stats,
    successfulCopyCount: nextCount,
    firstSuccessfulCopyAt: nextFirstSuccessfulCopyAt,
    lastSuccessfulCopyAt: now
  };

  if (options.isPromptUsed && !stats.firstPromptUsedAt) {
    next.firstPromptUsedAt = now;
  }

  if (!stats.reusedWithin7DaysAt && prevCount === 1) {
    const within7Days = now - nextFirstSuccessfulCopyAt <= REUSE_WITHIN_7_DAYS_WINDOW_MS;
    if (within7Days) {
      next.reusedWithin7DaysAt = now;
    }
  }

  return next;
}

export function shouldShowRatingPrompt(stats: GrowthStats, now: number): boolean {
  if (!isValidTimestamp(stats.installedAt)) return false;
  if (!isValidCount(stats.successfulCopyCount)) return false;

  if (stats.ratingPromptShownAt) return false;

  const installedAgeMs = now - stats.installedAt;
  if (installedAgeMs < RATING_PROMPT_MIN_INSTALL_AGE_MS) return false;

  if (stats.successfulCopyCount < RATING_PROMPT_MIN_SUCCESSFUL_COPY_COUNT) return false;

  // Precision guard: only show for users who have either used Prompt at least once,
  // or are heavy pure-copy users (still eligible even without prompt usage).
  const hasUsedPrompt = isValidTimestamp(stats.firstPromptUsedAt);
  const isHeavyCopyUser = stats.successfulCopyCount >= RATING_PROMPT_MIN_SUCCESSFUL_COPY_COUNT_HEAVY_USER;
  if (!hasUsedPrompt && !isHeavyCopyUser) return false;

  return true;
}

function shouldPersistNormalizedGrowthStats(stored: unknown): boolean {
  if (!stored || typeof stored !== 'object') return true;
  const raw = stored as Partial<GrowthStats>;

  if (!isValidTimestamp(raw.installedAt)) return true;
  if (!isValidCount(raw.successfulCopyCount)) return true;

  if ('firstPopupOpenedAt' in raw && raw.firstPopupOpenedAt !== undefined && !isValidTimestamp(raw.firstPopupOpenedAt)) {
    return true;
  }

  if (
    'firstSuccessfulCopyAt' in raw &&
    raw.firstSuccessfulCopyAt !== undefined &&
    !isValidTimestamp(raw.firstSuccessfulCopyAt)
  ) {
    return true;
  }

  if ('lastSuccessfulCopyAt' in raw && raw.lastSuccessfulCopyAt !== undefined && !isValidTimestamp(raw.lastSuccessfulCopyAt)) {
    return true;
  }

  if ('firstPromptUsedAt' in raw && raw.firstPromptUsedAt !== undefined && !isValidTimestamp(raw.firstPromptUsedAt)) {
    return true;
  }

  if (
    'reusedWithin7DaysAt' in raw &&
    raw.reusedWithin7DaysAt !== undefined &&
    !isValidTimestamp(raw.reusedWithin7DaysAt)
  ) {
    return true;
  }

  if ('ratingPromptShownAt' in raw && raw.ratingPromptShownAt !== undefined && !isValidTimestamp(raw.ratingPromptShownAt)) {
    return true;
  }

  if ('ratingPromptAction' in raw && raw.ratingPromptAction !== undefined && !isValidRatingPromptAction(raw.ratingPromptAction)) {
    return true;
  }

  if ('ratingPromptActionAt' in raw && raw.ratingPromptActionAt !== undefined && !isValidTimestamp(raw.ratingPromptActionAt)) {
    return true;
  }

  return false;
}

export async function ensureGrowthStatsInitialized(now: number = Date.now()): Promise<GrowthStats> {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) {
    return createDefaultGrowthStats(now);
  }

  try {
    const result = await chrome.storage.local.get(GROWTH_STATS_KEY);
    const stored = result[GROWTH_STATS_KEY];
    const normalized = normalizeGrowthStatsValue(stored, now);

    if (shouldPersistNormalizedGrowthStats(stored)) {
      try {
        await chrome.storage.local.set({ [GROWTH_STATS_KEY]: normalized });
      } catch (error) {
        console.warn('Failed to persist normalized growth stats:', error);
      }
    }

    return normalized;
  } catch (error) {
    console.warn('Failed to ensure growth stats initialized:', error);
    return createDefaultGrowthStats(now);
  }
}

export async function getGrowthStats(now: number = Date.now()): Promise<GrowthStats> {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) {
    return createDefaultGrowthStats(now);
  }

  try {
    const result = await chrome.storage.local.get(GROWTH_STATS_KEY);
    const stored = result[GROWTH_STATS_KEY];
    const normalized = normalizeGrowthStatsValue(stored, now);

    if (shouldPersistNormalizedGrowthStats(stored)) {
      try {
        await chrome.storage.local.set({ [GROWTH_STATS_KEY]: normalized });
      } catch (error) {
        console.warn('Failed to persist normalized growth stats:', error);
      }
    }

    return normalized;
  } catch (error) {
    console.warn('Failed to get growth stats:', error);
    return createDefaultGrowthStats(now);
  }
}

export async function setGrowthStats(stats: GrowthStats): Promise<void> {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) {
    return;
  }

  try {
    await chrome.storage.local.set({ [GROWTH_STATS_KEY]: stats });
  } catch (error) {
    console.warn('Failed to set growth stats:', error);
  }
}

export async function markFirstPopupOpened(now: number = Date.now()): Promise<GrowthStats> {
  const stats = await ensureGrowthStatsInitialized(now);
  if (stats.firstPopupOpenedAt) return stats;

  const next: GrowthStats = { ...stats, firstPopupOpenedAt: now };
  await setGrowthStats(next);
  return next;
}

export interface IncrementSuccessfulCopyContext {
  now?: number;
  isPromptUsed?: boolean;
}

export async function incrementSuccessfulCopyCount(
  context: IncrementSuccessfulCopyContext = {}
): Promise<GrowthStats> {
  const now = typeof context.now === 'number' ? context.now : Date.now();
  const stats = await ensureGrowthStatsInitialized(now);
  const next = applySuccessfulCopyToGrowthStats(stats, { now, isPromptUsed: context.isPromptUsed });
  await setGrowthStats(next);
  return next;
}

export async function markRatingPromptShown(shownAt: number = Date.now()): Promise<GrowthStats> {
  const stats = await ensureGrowthStatsInitialized(shownAt);
  if (stats.ratingPromptShownAt) return stats;

  const next: GrowthStats = { ...stats, ratingPromptShownAt: shownAt };
  await setGrowthStats(next);
  return next;
}

export async function setRatingPromptAction(
  action: RatingPromptAction,
  actionAt: number = Date.now()
): Promise<GrowthStats> {
  const stats = await ensureGrowthStatsInitialized(actionAt);
  const next: GrowthStats = { ...stats, ratingPromptAction: action, ratingPromptActionAt: actionAt };
  await setGrowthStats(next);
  return next;
}
