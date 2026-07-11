export const GROWTH_STATS_KEY = 'copilot_growth_stats';

export type RatingPromptAction = 'rate' | 'later' | 'never';
export type ProPromptAction = 'join' | 'later' | 'never';
export type ReuseEntrySource = 'popup' | 'onboarding';
export type ReuseEntrySlot = 1 | 2 | 3;

export interface GrowthStats {
  installedAt: number;
  successfulCopyCount: number;

  // Funnel milestones (local only, auditable, privacy-safe)
  firstPopupOpenedAt?: number;
  firstSuccessfulCopyAt?: number;
  secondSuccessfulCopyAt?: number;
  lastSuccessfulCopyAt?: number;
  firstPromptUsedAt?: number;
  reusedWithin7DaysAt?: number;
  firstQuickPromptSlotShownAt?: number;
  lastQuickPromptSlotShownAt?: number;
  quickPromptSlotShownCount?: number;
  firstQuickPromptSlotClickedAt?: number;
  lastQuickPromptSlotClickedAt?: number;
  quickPromptSlotClickedCount?: number;
  lastQuickPromptSlotClickedSource?: ReuseEntrySource;
  lastQuickPromptSlotClickedSlot?: ReuseEntrySlot;
  firstQuickPromptSlotUsedAt?: number;
  lastQuickPromptSlotUsedAt?: number;
  quickPromptSlotUsedCount?: number;
  lastQuickPromptSlotUsedSource?: ReuseEntrySource;
  lastQuickPromptSlotUsedSlot?: ReuseEntrySlot;

  ratingPromptShownAt?: number;
  ratingPromptAction?: RatingPromptAction;
  ratingPromptActionAt?: number;

  // Pro waitlist prompt (popup, low-disturb, local only)
  proPromptFirstShownAt?: number;
  proPromptLastShownAt?: number;
  proPromptShownCount?: number;
  proPromptAction?: ProPromptAction;
  proPromptActionAt?: number;
  proPromptSnoozedUntil?: number;
}

export interface GrowthFunnelSummary {
  // Raw milestones (auditable, local only)
  installedAt: number;
  successfulCopyCount: number;
  firstPopupOpenedAt?: number;
  firstSuccessfulCopyAt?: number;
  secondSuccessfulCopyAt?: number;
  firstPromptUsedAt?: number;
  reusedWithin7DaysAt?: number;
  firstQuickPromptSlotShownAt?: number;
  quickPromptSlotShownCount?: number;
  firstQuickPromptSlotClickedAt?: number;
  quickPromptSlotClickedCount?: number;
  lastQuickPromptSlotClickedSource?: ReuseEntrySource;
  lastQuickPromptSlotClickedSlot?: ReuseEntrySlot;
  firstQuickPromptSlotUsedAt?: number;
  quickPromptSlotUsedCount?: number;
  lastQuickPromptSlotUsedSource?: ReuseEntrySource;
  lastQuickPromptSlotUsedSlot?: ReuseEntrySlot;

  // Derived progress flags (must not be persisted)
  isPopupOpened: boolean;
  isActivated: boolean;
  isPromptUsed: boolean;
  isReusedWithin7Days: boolean;
  hasQuickPromptSlotExposure: boolean;
  hasQuickPromptSlotClick: boolean;
  hasQuickPromptSlotUse: boolean;
  isSecondSuccessfulCopyCompleted: boolean;
  isEligibleForWomActions: boolean;
  remainingSuccessfulCopiesForWomActions: number;

  // Activation within 3 minutes from first popup open
  timeFromFirstPopupToFirstCopyMs?: number;
  activatedWithin3MinutesFromFirstPopup?: boolean;
}

export const RATING_PROMPT_MIN_INSTALL_AGE_MS = 48 * 60 * 60 * 1000;
export const RATING_PROMPT_MIN_SUCCESSFUL_COPY_COUNT = 10;
export const WOM_ACTION_MIN_SUCCESSFUL_COPY_COUNT = 2;

const RATING_PROMPT_MIN_SUCCESSFUL_COPY_COUNT_HEAVY_USER = 20;

export const PRO_PROMPT_MIN_INSTALL_AGE_MS = 48 * 60 * 60 * 1000;
export const PRO_PROMPT_MIN_SUCCESSFUL_COPY_COUNT = 20;
export const PRO_PROMPT_SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;
export const PRO_PROMPT_MAX_SHOWN_COUNT = 2;

const PRO_PROMPT_MIN_SUCCESSFUL_COPY_COUNT_HEAVY_USER = 40;

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

function isValidProPromptAction(value: unknown): value is ProPromptAction {
  return value === 'join' || value === 'later' || value === 'never';
}

function isValidReuseEntrySource(value: unknown): value is ReuseEntrySource {
  return value === 'popup' || value === 'onboarding';
}

function isValidReuseEntrySlot(value: unknown): value is ReuseEntrySlot {
  return value === 1 || value === 2 || value === 3;
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
  const secondSuccessfulCopyAt = isValidTimestamp(raw.secondSuccessfulCopyAt)
    ? raw.secondSuccessfulCopyAt
    : undefined;
  const lastSuccessfulCopyAt = isValidTimestamp(raw.lastSuccessfulCopyAt) ? raw.lastSuccessfulCopyAt : undefined;
  const firstPromptUsedAt = isValidTimestamp(raw.firstPromptUsedAt) ? raw.firstPromptUsedAt : undefined;
  const reusedWithin7DaysAt = isValidTimestamp(raw.reusedWithin7DaysAt) ? raw.reusedWithin7DaysAt : undefined;
  const firstQuickPromptSlotShownAt = isValidTimestamp(raw.firstQuickPromptSlotShownAt)
    ? raw.firstQuickPromptSlotShownAt
    : undefined;
  const lastQuickPromptSlotShownAt = isValidTimestamp(raw.lastQuickPromptSlotShownAt)
    ? raw.lastQuickPromptSlotShownAt
    : undefined;
  const quickPromptSlotShownCount = isValidCount(raw.quickPromptSlotShownCount)
    ? raw.quickPromptSlotShownCount
    : undefined;
  const firstQuickPromptSlotClickedAt = isValidTimestamp(raw.firstQuickPromptSlotClickedAt)
    ? raw.firstQuickPromptSlotClickedAt
    : undefined;
  const lastQuickPromptSlotClickedAt = isValidTimestamp(raw.lastQuickPromptSlotClickedAt)
    ? raw.lastQuickPromptSlotClickedAt
    : undefined;
  const quickPromptSlotClickedCount = isValidCount(raw.quickPromptSlotClickedCount)
    ? raw.quickPromptSlotClickedCount
    : undefined;
  const lastQuickPromptSlotClickedSource = isValidReuseEntrySource(raw.lastQuickPromptSlotClickedSource)
    ? raw.lastQuickPromptSlotClickedSource
    : undefined;
  const lastQuickPromptSlotClickedSlot = isValidReuseEntrySlot(raw.lastQuickPromptSlotClickedSlot)
    ? raw.lastQuickPromptSlotClickedSlot
    : undefined;
  const firstQuickPromptSlotUsedAt = isValidTimestamp(raw.firstQuickPromptSlotUsedAt)
    ? raw.firstQuickPromptSlotUsedAt
    : undefined;
  const lastQuickPromptSlotUsedAt = isValidTimestamp(raw.lastQuickPromptSlotUsedAt)
    ? raw.lastQuickPromptSlotUsedAt
    : undefined;
  const quickPromptSlotUsedCount = isValidCount(raw.quickPromptSlotUsedCount)
    ? raw.quickPromptSlotUsedCount
    : undefined;
  const lastQuickPromptSlotUsedSource = isValidReuseEntrySource(raw.lastQuickPromptSlotUsedSource)
    ? raw.lastQuickPromptSlotUsedSource
    : undefined;
  const lastQuickPromptSlotUsedSlot = isValidReuseEntrySlot(raw.lastQuickPromptSlotUsedSlot)
    ? raw.lastQuickPromptSlotUsedSlot
    : undefined;

  const ratingPromptShownAt = isValidTimestamp(raw.ratingPromptShownAt) ? raw.ratingPromptShownAt : undefined;
  const ratingPromptAction = isValidRatingPromptAction(raw.ratingPromptAction)
    ? raw.ratingPromptAction
    : undefined;
  const ratingPromptActionAt = isValidTimestamp(raw.ratingPromptActionAt) ? raw.ratingPromptActionAt : undefined;

  const proPromptFirstShownAt = isValidTimestamp(raw.proPromptFirstShownAt)
    ? raw.proPromptFirstShownAt
    : undefined;
  const proPromptLastShownAt = isValidTimestamp(raw.proPromptLastShownAt)
    ? raw.proPromptLastShownAt
    : undefined;
  const proPromptShownCount = isValidCount(raw.proPromptShownCount) ? raw.proPromptShownCount : undefined;
  const proPromptAction = isValidProPromptAction(raw.proPromptAction) ? raw.proPromptAction : undefined;
  const proPromptActionAt = isValidTimestamp(raw.proPromptActionAt) ? raw.proPromptActionAt : undefined;
  const proPromptSnoozedUntil = isValidTimestamp(raw.proPromptSnoozedUntil)
    ? raw.proPromptSnoozedUntil
    : undefined;

  const normalized: GrowthStats = {
    installedAt,
    successfulCopyCount
  };

  if (firstPopupOpenedAt) normalized.firstPopupOpenedAt = firstPopupOpenedAt;
  if (firstSuccessfulCopyAt) normalized.firstSuccessfulCopyAt = firstSuccessfulCopyAt;
  if (secondSuccessfulCopyAt) normalized.secondSuccessfulCopyAt = secondSuccessfulCopyAt;
  if (lastSuccessfulCopyAt) normalized.lastSuccessfulCopyAt = lastSuccessfulCopyAt;
  if (firstPromptUsedAt) normalized.firstPromptUsedAt = firstPromptUsedAt;
  if (reusedWithin7DaysAt) normalized.reusedWithin7DaysAt = reusedWithin7DaysAt;
  if (firstQuickPromptSlotShownAt) normalized.firstQuickPromptSlotShownAt = firstQuickPromptSlotShownAt;
  if (lastQuickPromptSlotShownAt) normalized.lastQuickPromptSlotShownAt = lastQuickPromptSlotShownAt;
  if (quickPromptSlotShownCount && quickPromptSlotShownCount > 0) {
    normalized.quickPromptSlotShownCount = quickPromptSlotShownCount;
  }
  if (firstQuickPromptSlotClickedAt) {
    normalized.firstQuickPromptSlotClickedAt = firstQuickPromptSlotClickedAt;
  }
  if (lastQuickPromptSlotClickedAt) {
    normalized.lastQuickPromptSlotClickedAt = lastQuickPromptSlotClickedAt;
  }
  if (quickPromptSlotClickedCount && quickPromptSlotClickedCount > 0) {
    normalized.quickPromptSlotClickedCount = quickPromptSlotClickedCount;
  }
  if (lastQuickPromptSlotClickedSource) {
    normalized.lastQuickPromptSlotClickedSource = lastQuickPromptSlotClickedSource;
  }
  if (lastQuickPromptSlotClickedSlot) {
    normalized.lastQuickPromptSlotClickedSlot = lastQuickPromptSlotClickedSlot;
  }
  if (firstQuickPromptSlotUsedAt) normalized.firstQuickPromptSlotUsedAt = firstQuickPromptSlotUsedAt;
  if (lastQuickPromptSlotUsedAt) normalized.lastQuickPromptSlotUsedAt = lastQuickPromptSlotUsedAt;
  if (quickPromptSlotUsedCount && quickPromptSlotUsedCount > 0) {
    normalized.quickPromptSlotUsedCount = quickPromptSlotUsedCount;
  }
  if (lastQuickPromptSlotUsedSource) {
    normalized.lastQuickPromptSlotUsedSource = lastQuickPromptSlotUsedSource;
  }
  if (lastQuickPromptSlotUsedSlot) {
    normalized.lastQuickPromptSlotUsedSlot = lastQuickPromptSlotUsedSlot;
  }

  if (ratingPromptShownAt) normalized.ratingPromptShownAt = ratingPromptShownAt;
  if (ratingPromptAction) normalized.ratingPromptAction = ratingPromptAction;
  if (ratingPromptActionAt) normalized.ratingPromptActionAt = ratingPromptActionAt;

  if (proPromptFirstShownAt) normalized.proPromptFirstShownAt = proPromptFirstShownAt;
  if (proPromptLastShownAt) normalized.proPromptLastShownAt = proPromptLastShownAt;
  if (proPromptShownCount && proPromptShownCount > 0) normalized.proPromptShownCount = proPromptShownCount;
  if (proPromptAction) normalized.proPromptAction = proPromptAction;
  if (proPromptActionAt) normalized.proPromptActionAt = proPromptActionAt;
  if (proPromptSnoozedUntil) normalized.proPromptSnoozedUntil = proPromptSnoozedUntil;

  return normalized;
}

export function buildGrowthFunnelSummary(stats: GrowthStats, now: number): GrowthFunnelSummary {
  const installedAt = isValidTimestamp(stats.installedAt) ? stats.installedAt : now;
  const successfulCopyCount = isValidCount(stats.successfulCopyCount) ? stats.successfulCopyCount : 0;

  const firstPopupOpenedAt = isValidTimestamp(stats.firstPopupOpenedAt) ? stats.firstPopupOpenedAt : undefined;
  const firstSuccessfulCopyAt = isValidTimestamp(stats.firstSuccessfulCopyAt) ? stats.firstSuccessfulCopyAt : undefined;
  const secondSuccessfulCopyAt = isValidTimestamp(stats.secondSuccessfulCopyAt)
    ? stats.secondSuccessfulCopyAt
    : undefined;
  const firstPromptUsedAt = isValidTimestamp(stats.firstPromptUsedAt) ? stats.firstPromptUsedAt : undefined;
  const reusedWithin7DaysAt = isValidTimestamp(stats.reusedWithin7DaysAt) ? stats.reusedWithin7DaysAt : undefined;
  const firstQuickPromptSlotShownAt = isValidTimestamp(stats.firstQuickPromptSlotShownAt)
    ? stats.firstQuickPromptSlotShownAt
    : undefined;
  const quickPromptSlotShownCount = isValidCount(stats.quickPromptSlotShownCount)
    ? stats.quickPromptSlotShownCount
    : undefined;
  const firstQuickPromptSlotClickedAt = isValidTimestamp(stats.firstQuickPromptSlotClickedAt)
    ? stats.firstQuickPromptSlotClickedAt
    : undefined;
  const quickPromptSlotClickedCount = isValidCount(stats.quickPromptSlotClickedCount)
    ? stats.quickPromptSlotClickedCount
    : undefined;
  const lastQuickPromptSlotClickedSource = isValidReuseEntrySource(stats.lastQuickPromptSlotClickedSource)
    ? stats.lastQuickPromptSlotClickedSource
    : undefined;
  const lastQuickPromptSlotClickedSlot = isValidReuseEntrySlot(stats.lastQuickPromptSlotClickedSlot)
    ? stats.lastQuickPromptSlotClickedSlot
    : undefined;
  const firstQuickPromptSlotUsedAt = isValidTimestamp(stats.firstQuickPromptSlotUsedAt)
    ? stats.firstQuickPromptSlotUsedAt
    : undefined;
  const quickPromptSlotUsedCount = isValidCount(stats.quickPromptSlotUsedCount)
    ? stats.quickPromptSlotUsedCount
    : undefined;
  const lastQuickPromptSlotUsedSource = isValidReuseEntrySource(stats.lastQuickPromptSlotUsedSource)
    ? stats.lastQuickPromptSlotUsedSource
    : undefined;
  const lastQuickPromptSlotUsedSlot = isValidReuseEntrySlot(stats.lastQuickPromptSlotUsedSlot)
    ? stats.lastQuickPromptSlotUsedSlot
    : undefined;

  const isPopupOpened = Boolean(firstPopupOpenedAt);
  const isActivated = Boolean(firstSuccessfulCopyAt) || successfulCopyCount > 0;
  const isPromptUsed = Boolean(firstPromptUsedAt);
  const isReusedWithin7Days = Boolean(reusedWithin7DaysAt);
  const hasQuickPromptSlotExposure = Boolean(firstQuickPromptSlotShownAt);
  const hasQuickPromptSlotClick = Boolean(firstQuickPromptSlotClickedAt);
  const hasQuickPromptSlotUse = Boolean(firstQuickPromptSlotUsedAt);
  const isSecondSuccessfulCopyCompleted = Boolean(secondSuccessfulCopyAt);
  const womActionEligibility = buildWomActionEligibility({
    successfulCopyCount,
    secondSuccessfulCopyAt
  });

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
    secondSuccessfulCopyAt,
    firstPromptUsedAt,
    reusedWithin7DaysAt,
    firstQuickPromptSlotShownAt,
    quickPromptSlotShownCount,
    firstQuickPromptSlotClickedAt,
    quickPromptSlotClickedCount,
    lastQuickPromptSlotClickedSource,
    lastQuickPromptSlotClickedSlot,
    firstQuickPromptSlotUsedAt,
    quickPromptSlotUsedCount,
    lastQuickPromptSlotUsedSource,
    lastQuickPromptSlotUsedSlot,
    isPopupOpened,
    isActivated,
    isPromptUsed,
    isReusedWithin7Days,
    hasQuickPromptSlotExposure,
    hasQuickPromptSlotClick,
    hasQuickPromptSlotUse,
    isSecondSuccessfulCopyCompleted,
    isEligibleForWomActions: womActionEligibility.isEligible,
    remainingSuccessfulCopiesForWomActions: womActionEligibility.remainingSuccessfulCopies,
    timeFromFirstPopupToFirstCopyMs,
    activatedWithin3MinutesFromFirstPopup
  };
}

export interface ApplySuccessfulCopyOptions {
  now: number;
  isPromptUsed?: boolean;
  reuseSource?: ReuseEntrySource;
  quickPromptSlot?: ReuseEntrySlot;
}

export interface WomActionEligibility {
  minSuccessfulCopyCount: number;
  successfulCopyCount: number;
  secondSuccessfulCopyAt?: number;
  isSecondSuccessfulCopyCompleted: boolean;
  isEligible: boolean;
  remainingSuccessfulCopies: number;
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

  if (!stats.secondSuccessfulCopyAt && prevCount === 1) {
    next.secondSuccessfulCopyAt = now;
  }

  if (options.isPromptUsed && !stats.firstPromptUsedAt) {
    next.firstPromptUsedAt = now;
  }

  if (options.reuseSource && options.quickPromptSlot) {
    next.firstQuickPromptSlotUsedAt = stats.firstQuickPromptSlotUsedAt || now;
    next.lastQuickPromptSlotUsedAt = now;
    next.quickPromptSlotUsedCount = (stats.quickPromptSlotUsedCount || 0) + 1;
    next.lastQuickPromptSlotUsedSource = options.reuseSource;
    next.lastQuickPromptSlotUsedSlot = options.quickPromptSlot;
  }

  if (!stats.reusedWithin7DaysAt && prevCount === 1) {
    const within7Days = now - nextFirstSuccessfulCopyAt <= REUSE_WITHIN_7_DAYS_WINDOW_MS;
    if (within7Days) {
      next.reusedWithin7DaysAt = now;
    }
  }

  return next;
}

export function buildWomActionEligibility(
  stats: Pick<GrowthStats, 'successfulCopyCount' | 'secondSuccessfulCopyAt'>
): WomActionEligibility {
  const successfulCopyCount = isValidCount(stats.successfulCopyCount) ? stats.successfulCopyCount : 0;
  const secondSuccessfulCopyAt = isValidTimestamp(stats.secondSuccessfulCopyAt)
    ? stats.secondSuccessfulCopyAt
    : undefined;
  const isSecondSuccessfulCopyCompleted =
    Boolean(secondSuccessfulCopyAt) || successfulCopyCount >= WOM_ACTION_MIN_SUCCESSFUL_COPY_COUNT;
  const remainingSuccessfulCopies = Math.max(0, WOM_ACTION_MIN_SUCCESSFUL_COPY_COUNT - successfulCopyCount);
  const isEligible =
    successfulCopyCount >= WOM_ACTION_MIN_SUCCESSFUL_COPY_COUNT && isSecondSuccessfulCopyCompleted;

  return {
    minSuccessfulCopyCount: WOM_ACTION_MIN_SUCCESSFUL_COPY_COUNT,
    successfulCopyCount,
    secondSuccessfulCopyAt,
    isSecondSuccessfulCopyCompleted,
    isEligible,
    remainingSuccessfulCopies
  };
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

export function shouldShowProPrompt(stats: GrowthStats, now: number): boolean {
  if (!isValidTimestamp(stats.installedAt)) return false;
  if (!isValidCount(stats.successfulCopyCount)) return false;

  // If user explicitly decided, never show again.
  if (stats.proPromptAction === 'never' || stats.proPromptAction === 'join') return false;

  const shownCount = isValidCount(stats.proPromptShownCount) ? stats.proPromptShownCount : 0;
  if (shownCount >= PRO_PROMPT_MAX_SHOWN_COUNT) return false;

  // If already shown once, only re-prompt when user clicked "later" and snooze passed.
  if (shownCount > 0) {
    if (stats.proPromptAction !== 'later') return false;
    if (!isValidTimestamp(stats.proPromptSnoozedUntil)) return false;
    if (now < stats.proPromptSnoozedUntil) return false;
  }

  const installedAgeMs = now - stats.installedAt;
  if (installedAgeMs < PRO_PROMPT_MIN_INSTALL_AGE_MS) return false;
  if (stats.successfulCopyCount < PRO_PROMPT_MIN_SUCCESSFUL_COPY_COUNT) return false;

  // Precision guard: only show for users who have either used Prompt at least once,
  // or are heavy pure-copy users.
  const hasUsedPrompt = isValidTimestamp(stats.firstPromptUsedAt);
  const isHeavyCopyUser = stats.successfulCopyCount >= PRO_PROMPT_MIN_SUCCESSFUL_COPY_COUNT_HEAVY_USER;
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

  if (
    'secondSuccessfulCopyAt' in raw &&
    raw.secondSuccessfulCopyAt !== undefined &&
    !isValidTimestamp(raw.secondSuccessfulCopyAt)
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

  if (
    'firstQuickPromptSlotShownAt' in raw &&
    raw.firstQuickPromptSlotShownAt !== undefined &&
    !isValidTimestamp(raw.firstQuickPromptSlotShownAt)
  ) {
    return true;
  }

  if (
    'lastQuickPromptSlotShownAt' in raw &&
    raw.lastQuickPromptSlotShownAt !== undefined &&
    !isValidTimestamp(raw.lastQuickPromptSlotShownAt)
  ) {
    return true;
  }

  if (
    'quickPromptSlotShownCount' in raw &&
    raw.quickPromptSlotShownCount !== undefined &&
    !isValidCount(raw.quickPromptSlotShownCount)
  ) {
    return true;
  }

  if (
    'firstQuickPromptSlotClickedAt' in raw &&
    raw.firstQuickPromptSlotClickedAt !== undefined &&
    !isValidTimestamp(raw.firstQuickPromptSlotClickedAt)
  ) {
    return true;
  }

  if (
    'lastQuickPromptSlotClickedAt' in raw &&
    raw.lastQuickPromptSlotClickedAt !== undefined &&
    !isValidTimestamp(raw.lastQuickPromptSlotClickedAt)
  ) {
    return true;
  }

  if (
    'quickPromptSlotClickedCount' in raw &&
    raw.quickPromptSlotClickedCount !== undefined &&
    !isValidCount(raw.quickPromptSlotClickedCount)
  ) {
    return true;
  }

  if (
    'lastQuickPromptSlotClickedSource' in raw &&
    raw.lastQuickPromptSlotClickedSource !== undefined &&
    !isValidReuseEntrySource(raw.lastQuickPromptSlotClickedSource)
  ) {
    return true;
  }

  if (
    'lastQuickPromptSlotClickedSlot' in raw &&
    raw.lastQuickPromptSlotClickedSlot !== undefined &&
    !isValidReuseEntrySlot(raw.lastQuickPromptSlotClickedSlot)
  ) {
    return true;
  }

  if (
    'firstQuickPromptSlotUsedAt' in raw &&
    raw.firstQuickPromptSlotUsedAt !== undefined &&
    !isValidTimestamp(raw.firstQuickPromptSlotUsedAt)
  ) {
    return true;
  }

  if (
    'lastQuickPromptSlotUsedAt' in raw &&
    raw.lastQuickPromptSlotUsedAt !== undefined &&
    !isValidTimestamp(raw.lastQuickPromptSlotUsedAt)
  ) {
    return true;
  }

  if (
    'quickPromptSlotUsedCount' in raw &&
    raw.quickPromptSlotUsedCount !== undefined &&
    !isValidCount(raw.quickPromptSlotUsedCount)
  ) {
    return true;
  }

  if (
    'lastQuickPromptSlotUsedSource' in raw &&
    raw.lastQuickPromptSlotUsedSource !== undefined &&
    !isValidReuseEntrySource(raw.lastQuickPromptSlotUsedSource)
  ) {
    return true;
  }

  if (
    'lastQuickPromptSlotUsedSlot' in raw &&
    raw.lastQuickPromptSlotUsedSlot !== undefined &&
    !isValidReuseEntrySlot(raw.lastQuickPromptSlotUsedSlot)
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

  if (
    'proPromptFirstShownAt' in raw &&
    raw.proPromptFirstShownAt !== undefined &&
    !isValidTimestamp(raw.proPromptFirstShownAt)
  ) {
    return true;
  }

  if (
    'proPromptLastShownAt' in raw &&
    raw.proPromptLastShownAt !== undefined &&
    !isValidTimestamp(raw.proPromptLastShownAt)
  ) {
    return true;
  }

  if ('proPromptShownCount' in raw && raw.proPromptShownCount !== undefined && !isValidCount(raw.proPromptShownCount)) {
    return true;
  }

  if ('proPromptAction' in raw && raw.proPromptAction !== undefined && !isValidProPromptAction(raw.proPromptAction)) {
    return true;
  }

  if (
    'proPromptActionAt' in raw &&
    raw.proPromptActionAt !== undefined &&
    !isValidTimestamp(raw.proPromptActionAt)
  ) {
    return true;
  }

  if (
    'proPromptSnoozedUntil' in raw &&
    raw.proPromptSnoozedUntil !== undefined &&
    !isValidTimestamp(raw.proPromptSnoozedUntil)
  ) {
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
  reuseSource?: ReuseEntrySource;
  quickPromptSlot?: ReuseEntrySlot;
}

export async function incrementSuccessfulCopyCount(
  context: IncrementSuccessfulCopyContext = {}
): Promise<GrowthStats> {
  const now = typeof context.now === 'number' ? context.now : Date.now();
  const stats = await ensureGrowthStatsInitialized(now);
  const next = applySuccessfulCopyToGrowthStats(stats, {
    now,
    isPromptUsed: context.isPromptUsed,
    reuseSource: context.reuseSource,
    quickPromptSlot: context.quickPromptSlot
  });
  await setGrowthStats(next);
  return next;
}

export async function markQuickPromptSlotShown(shownAt: number = Date.now()): Promise<GrowthStats> {
  const stats = await ensureGrowthStatsInitialized(shownAt);
  const next: GrowthStats = {
    ...stats,
    firstQuickPromptSlotShownAt: stats.firstQuickPromptSlotShownAt || shownAt,
    lastQuickPromptSlotShownAt: shownAt,
    quickPromptSlotShownCount: (stats.quickPromptSlotShownCount || 0) + 1
  };
  await setGrowthStats(next);
  return next;
}

export interface MarkQuickPromptSlotClickedContext {
  now?: number;
  source: ReuseEntrySource;
  slot: ReuseEntrySlot;
}

export async function markQuickPromptSlotClicked(
  context: MarkQuickPromptSlotClickedContext
): Promise<GrowthStats> {
  const now = typeof context.now === 'number' ? context.now : Date.now();
  const stats = await ensureGrowthStatsInitialized(now);
  const next: GrowthStats = {
    ...stats,
    firstQuickPromptSlotClickedAt: stats.firstQuickPromptSlotClickedAt || now,
    lastQuickPromptSlotClickedAt: now,
    quickPromptSlotClickedCount: (stats.quickPromptSlotClickedCount || 0) + 1,
    lastQuickPromptSlotClickedSource: context.source,
    lastQuickPromptSlotClickedSlot: context.slot
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

export async function markProPromptShown(shownAt: number = Date.now()): Promise<GrowthStats> {
  const stats = await ensureGrowthStatsInitialized(shownAt);

  const prevCount = isValidCount(stats.proPromptShownCount) ? stats.proPromptShownCount : 0;
  const nextCount = prevCount + 1;

  const next: GrowthStats = {
    ...stats,
    proPromptFirstShownAt: stats.proPromptFirstShownAt || shownAt,
    proPromptLastShownAt: shownAt,
    proPromptShownCount: nextCount
  };

  await setGrowthStats(next);
  return next;
}

export async function setProPromptAction(
  action: ProPromptAction,
  actionAt: number = Date.now()
): Promise<GrowthStats> {
  const stats = await ensureGrowthStatsInitialized(actionAt);
  const next: GrowthStats = { ...stats, proPromptAction: action, proPromptActionAt: actionAt };

  if (action === 'later') {
    next.proPromptSnoozedUntil = actionAt + PRO_PROMPT_SNOOZE_MS;
  } else {
    next.proPromptSnoozedUntil = undefined;
  }

  await setGrowthStats(next);
  return next;
}
