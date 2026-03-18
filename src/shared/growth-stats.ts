export const GROWTH_STATS_KEY = 'copilot_growth_stats';

export type RatingPromptAction = 'rate' | 'later' | 'never';

export interface GrowthStats {
  installedAt: number;
  successfulCopyCount: number;
  ratingPromptShownAt?: number;
  ratingPromptAction?: RatingPromptAction;
  ratingPromptActionAt?: number;
}

export const RATING_PROMPT_MIN_INSTALL_AGE_MS = 72 * 60 * 60 * 1000;
export const RATING_PROMPT_MIN_SUCCESSFUL_COPY_COUNT = 20;

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

function normalizeGrowthStats(stored: unknown, now: number): GrowthStats {
  const raw = (stored || {}) as Partial<GrowthStats>;

  const installedAt = isValidTimestamp(raw.installedAt) ? raw.installedAt : now;
  const successfulCopyCount = isValidCount(raw.successfulCopyCount) ? raw.successfulCopyCount : 0;
  const ratingPromptShownAt = isValidTimestamp(raw.ratingPromptShownAt) ? raw.ratingPromptShownAt : undefined;
  const ratingPromptAction = isValidRatingPromptAction(raw.ratingPromptAction)
    ? raw.ratingPromptAction
    : undefined;
  const ratingPromptActionAt = isValidTimestamp(raw.ratingPromptActionAt) ? raw.ratingPromptActionAt : undefined;

  const normalized: GrowthStats = {
    installedAt,
    successfulCopyCount
  };

  if (ratingPromptShownAt) normalized.ratingPromptShownAt = ratingPromptShownAt;
  if (ratingPromptAction) normalized.ratingPromptAction = ratingPromptAction;
  if (ratingPromptActionAt) normalized.ratingPromptActionAt = ratingPromptActionAt;

  return normalized;
}

export function shouldShowRatingPrompt(stats: GrowthStats, now: number): boolean {
  if (!isValidTimestamp(stats.installedAt)) return false;
  if (!isValidCount(stats.successfulCopyCount)) return false;

  if (stats.ratingPromptShownAt) return false;

  const installedAgeMs = now - stats.installedAt;
  if (installedAgeMs < RATING_PROMPT_MIN_INSTALL_AGE_MS) return false;

  if (stats.successfulCopyCount < RATING_PROMPT_MIN_SUCCESSFUL_COPY_COUNT) return false;

  return true;
}

function shouldPersistNormalizedGrowthStats(stored: unknown): boolean {
  if (!stored || typeof stored !== 'object') return true;
  const raw = stored as Partial<GrowthStats>;

  if (!isValidTimestamp(raw.installedAt)) return true;
  if (!isValidCount(raw.successfulCopyCount)) return true;

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

  const result = await chrome.storage.local.get(GROWTH_STATS_KEY);
  const stored = result[GROWTH_STATS_KEY];
  const normalized = normalizeGrowthStats(stored, now);

  if (shouldPersistNormalizedGrowthStats(stored)) {
    await chrome.storage.local.set({ [GROWTH_STATS_KEY]: normalized });
  }

  return normalized;
}

export async function getGrowthStats(now: number = Date.now()): Promise<GrowthStats> {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) {
    return createDefaultGrowthStats(now);
  }

  const result = await chrome.storage.local.get(GROWTH_STATS_KEY);
  const stored = result[GROWTH_STATS_KEY];
  const normalized = normalizeGrowthStats(stored, now);

  if (shouldPersistNormalizedGrowthStats(stored)) {
    await chrome.storage.local.set({ [GROWTH_STATS_KEY]: normalized });
  }

  return normalized;
}

export async function setGrowthStats(stats: GrowthStats): Promise<void> {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) {
    return;
  }

  await chrome.storage.local.set({ [GROWTH_STATS_KEY]: stats });
}

export async function incrementSuccessfulCopyCount(now: number = Date.now()): Promise<GrowthStats> {
  const stats = await ensureGrowthStatsInitialized(now);
  const next: GrowthStats = {
    ...stats,
    successfulCopyCount: (stats.successfulCopyCount || 0) + 1
  };
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
