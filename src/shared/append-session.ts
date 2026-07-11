export const APPEND_SESSION_KEY = 'copilot_append_session';

export type AppendSessionLastAction = 'append' | 'clear' | 'single_copy';
export type AppendSessionWorkflowState = 'idle' | 'collecting';

export interface AppendSessionState {
  clipCount: number;
  workflowState?: AppendSessionWorkflowState;
  startedAt?: number;
  lastAppendedAt?: number;
  lastClearedAt?: number;
  lastClearedClipCount?: number;
  lastAction?: AppendSessionLastAction;
  sessionCompleted?: boolean;
  sessionsStarted?: number;
  sessionsCompleted?: number;
  sessionsCleared?: number;
  totalCollectedClips?: number;
  maxClipsPerSession?: number;
  lastCompletedAt?: number;
  lastCompletedClipCount?: number;
}

export interface AppendSessionAudit {
  clipCount: number;
  workflowState: AppendSessionWorkflowState;
  startedAt?: number;
  lastAppendedAt?: number;
  lastClearedAt?: number;
  lastClearedClipCount?: number;
  lastAction?: AppendSessionLastAction;
  sessionCompleted: boolean;
  sessionsStarted: number;
  sessionsCompleted: number;
  sessionsCleared: number;
  totalCollectedClips: number;
  maxClipsPerSession: number;
  lastCompletedAt?: number;
  lastCompletedClipCount?: number;
  isActive: boolean;
  hasMultipleClips: boolean;
  isPrivacySafe: boolean;
}

function isValidTimestamp(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function isValidCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isValidLastAction(value: unknown): value is AppendSessionLastAction {
  return value === 'append' || value === 'clear' || value === 'single_copy';
}

function isValidWorkflowState(value: unknown): value is AppendSessionWorkflowState {
  return value === 'idle' || value === 'collecting';
}

function createDefaultAppendSessionState(): AppendSessionState {
  return {
    clipCount: 0
  };
}

export function normalizeAppendSessionValue(stored: unknown): AppendSessionState {
  const raw = (stored || {}) as Partial<AppendSessionState>;
  const clipCount = isValidCount(raw.clipCount) ? raw.clipCount : 0;
  const workflowState = isValidWorkflowState(raw.workflowState) ? raw.workflowState : 'idle';
  const startedAt = isValidTimestamp(raw.startedAt) ? raw.startedAt : undefined;
  const lastAppendedAt = isValidTimestamp(raw.lastAppendedAt) ? raw.lastAppendedAt : undefined;
  const lastClearedAt = isValidTimestamp(raw.lastClearedAt) ? raw.lastClearedAt : undefined;
  const lastClearedClipCount = isValidCount(raw.lastClearedClipCount) ? raw.lastClearedClipCount : undefined;
  const lastAction = isValidLastAction(raw.lastAction) ? raw.lastAction : undefined;
  const sessionsStarted = isValidCount(raw.sessionsStarted) ? raw.sessionsStarted : 0;
  const sessionsCompleted = isValidCount(raw.sessionsCompleted) ? raw.sessionsCompleted : 0;
  const sessionsCleared = isValidCount(raw.sessionsCleared) ? raw.sessionsCleared : 0;
  const totalCollectedClips = isValidCount(raw.totalCollectedClips) ? raw.totalCollectedClips : 0;
  const maxClipsPerSession = isValidCount(raw.maxClipsPerSession) ? raw.maxClipsPerSession : 0;
  const lastCompletedAt = isValidTimestamp(raw.lastCompletedAt) ? raw.lastCompletedAt : undefined;
  const lastCompletedClipCount = isValidCount(raw.lastCompletedClipCount) ? raw.lastCompletedClipCount : undefined;

  const normalized: AppendSessionState = {
    clipCount,
    workflowState: clipCount > 0 && workflowState === 'collecting' ? 'collecting' : 'idle',
    sessionCompleted: Boolean(raw.sessionCompleted && clipCount > 0),
    sessionsStarted,
    sessionsCompleted,
    sessionsCleared,
    totalCollectedClips,
    maxClipsPerSession
  };

  if (clipCount > 0 && startedAt) {
    normalized.startedAt = startedAt;
  }
  if (clipCount > 0 && lastAppendedAt) {
    normalized.lastAppendedAt = lastAppendedAt;
  }
  if (lastClearedAt) {
    normalized.lastClearedAt = lastClearedAt;
  }
  if (lastClearedClipCount && lastClearedClipCount > 0) {
    normalized.lastClearedClipCount = lastClearedClipCount;
  }
  if (lastAction) {
    normalized.lastAction = lastAction;
  }
  if (lastCompletedAt) {
    normalized.lastCompletedAt = lastCompletedAt;
  }
  if (lastCompletedClipCount && lastCompletedClipCount > 0) {
    normalized.lastCompletedClipCount = lastCompletedClipCount;
  }

  return normalized;
}

export function applyAppendToAppendSession(
  state: AppendSessionState,
  appendedAt: number = Date.now()
): AppendSessionState {
  const clipCount = (isValidCount(state.clipCount) ? state.clipCount : 0) + 1;
  const sessionsStarted = isValidCount(state.sessionsStarted) ? state.sessionsStarted : 0;
  const sessionsCompleted = isValidCount(state.sessionsCompleted) ? state.sessionsCompleted : 0;
  const totalCollectedClips = isValidCount(state.totalCollectedClips) ? state.totalCollectedClips : 0;
  const maxClipsPerSession = isValidCount(state.maxClipsPerSession) ? state.maxClipsPerSession : 0;
  const isNewSession = !state.clipCount;
  const alreadyCompleted = Boolean(state.sessionCompleted);

  const next: AppendSessionState = {
    ...state,
    clipCount,
    workflowState: 'collecting',
    startedAt: state.startedAt || appendedAt,
    lastAppendedAt: appendedAt,
    lastAction: 'append',
    sessionCompleted: alreadyCompleted,
    sessionsStarted: isNewSession ? sessionsStarted + 1 : sessionsStarted,
    sessionsCompleted,
    totalCollectedClips: totalCollectedClips + 1,
    maxClipsPerSession: Math.max(maxClipsPerSession, clipCount)
  };

  if (clipCount >= 2 && !alreadyCompleted) {
    next.sessionCompleted = true;
    next.sessionsCompleted = sessionsCompleted + 1;
    next.lastCompletedAt = appendedAt;
    next.lastCompletedClipCount = clipCount;
  } else if (clipCount >= 2) {
    next.lastCompletedClipCount = Math.max(state.lastCompletedClipCount || 0, clipCount);
  }

  return next;
}

export function applyClearToAppendSession(
  state: AppendSessionState,
  clearedAt: number = Date.now(),
  action: AppendSessionLastAction = 'clear'
): AppendSessionState {
  const clipCount = isValidCount(state.clipCount) ? state.clipCount : 0;
  const sessionsCleared = isValidCount(state.sessionsCleared) ? state.sessionsCleared : 0;
  const next: AppendSessionState = {
    clipCount: 0,
    workflowState: 'idle',
    lastAction: action,
    sessionCompleted: false,
    sessionsStarted: isValidCount(state.sessionsStarted) ? state.sessionsStarted : 0,
    sessionsCompleted: isValidCount(state.sessionsCompleted) ? state.sessionsCompleted : 0,
    sessionsCleared: clipCount > 0 ? sessionsCleared + 1 : sessionsCleared,
    totalCollectedClips: isValidCount(state.totalCollectedClips) ? state.totalCollectedClips : 0,
    maxClipsPerSession: isValidCount(state.maxClipsPerSession) ? state.maxClipsPerSession : 0,
    lastCompletedAt: state.lastCompletedAt,
    lastCompletedClipCount: state.lastCompletedClipCount
  };

  if (clipCount > 0) {
    next.lastClearedAt = clearedAt;
    next.lastClearedClipCount = clipCount;
  } else if (state.lastClearedAt) {
    next.lastClearedAt = state.lastClearedAt;
  }

  if (state.lastClearedClipCount && state.lastClearedClipCount > 0) {
    next.lastClearedClipCount = state.lastClearedClipCount;
  }

  if (clipCount > 0) {
    next.lastClearedClipCount = clipCount;
  }

  return next;
}

export function buildAppendSessionAudit(state: AppendSessionState): AppendSessionAudit {
  const normalized = normalizeAppendSessionValue(state);
  return {
    clipCount: normalized.clipCount,
    workflowState: normalized.workflowState || 'idle',
    startedAt: normalized.startedAt,
    lastAppendedAt: normalized.lastAppendedAt,
    lastClearedAt: normalized.lastClearedAt,
    lastClearedClipCount: normalized.lastClearedClipCount,
    lastAction: normalized.lastAction,
    sessionCompleted: Boolean(normalized.sessionCompleted),
    sessionsStarted: normalized.sessionsStarted || 0,
    sessionsCompleted: normalized.sessionsCompleted || 0,
    sessionsCleared: normalized.sessionsCleared || 0,
    totalCollectedClips: normalized.totalCollectedClips || 0,
    maxClipsPerSession: normalized.maxClipsPerSession || 0,
    lastCompletedAt: normalized.lastCompletedAt,
    lastCompletedClipCount: normalized.lastCompletedClipCount,
    isActive: normalized.clipCount > 0,
    hasMultipleClips: normalized.clipCount > 1,
    isPrivacySafe: true
  };
}

function shouldPersistNormalizedAppendSession(stored: unknown): boolean {
  if (!stored || typeof stored !== 'object') return true;

  const raw = stored as Partial<AppendSessionState>;
  if (!isValidCount(raw.clipCount)) return true;
  if ('workflowState' in raw && raw.workflowState !== undefined && !isValidWorkflowState(raw.workflowState)) {
    return true;
  }
  if ('startedAt' in raw && raw.startedAt !== undefined && !isValidTimestamp(raw.startedAt)) return true;
  if ('lastAppendedAt' in raw && raw.lastAppendedAt !== undefined && !isValidTimestamp(raw.lastAppendedAt)) {
    return true;
  }
  if ('lastClearedAt' in raw && raw.lastClearedAt !== undefined && !isValidTimestamp(raw.lastClearedAt)) {
    return true;
  }
  if (
    'lastClearedClipCount' in raw &&
    raw.lastClearedClipCount !== undefined &&
    !isValidCount(raw.lastClearedClipCount)
  ) {
    return true;
  }
  if ('lastAction' in raw && raw.lastAction !== undefined && !isValidLastAction(raw.lastAction)) {
    return true;
  }
  if ('sessionsStarted' in raw && raw.sessionsStarted !== undefined && !isValidCount(raw.sessionsStarted)) return true;
  if ('sessionsCompleted' in raw && raw.sessionsCompleted !== undefined && !isValidCount(raw.sessionsCompleted)) {
    return true;
  }
  if ('sessionsCleared' in raw && raw.sessionsCleared !== undefined && !isValidCount(raw.sessionsCleared)) {
    return true;
  }
  if ('totalCollectedClips' in raw && raw.totalCollectedClips !== undefined && !isValidCount(raw.totalCollectedClips)) {
    return true;
  }
  if ('maxClipsPerSession' in raw && raw.maxClipsPerSession !== undefined && !isValidCount(raw.maxClipsPerSession)) {
    return true;
  }
  if ('lastCompletedAt' in raw && raw.lastCompletedAt !== undefined && !isValidTimestamp(raw.lastCompletedAt)) {
    return true;
  }
  if (
    'lastCompletedClipCount' in raw &&
    raw.lastCompletedClipCount !== undefined &&
    !isValidCount(raw.lastCompletedClipCount)
  ) {
    return true;
  }

  return false;
}

export async function getAppendSessionState(): Promise<AppendSessionState> {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) {
    return createDefaultAppendSessionState();
  }

  try {
    const result = await chrome.storage.local.get(APPEND_SESSION_KEY);
    const stored = result[APPEND_SESSION_KEY];
    const normalized = normalizeAppendSessionValue(stored);
    if (shouldPersistNormalizedAppendSession(stored)) {
      await chrome.storage.local.set({ [APPEND_SESSION_KEY]: normalized });
    }
    return normalized;
  } catch (error) {
    console.warn('Failed to get append session state:', error);
    return createDefaultAppendSessionState();
  }
}

export async function setAppendSessionState(state: AppendSessionState): Promise<void> {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) {
    return;
  }

  try {
    await chrome.storage.local.set({ [APPEND_SESSION_KEY]: normalizeAppendSessionValue(state) });
  } catch (error) {
    console.warn('Failed to set append session state:', error);
  }
}

export async function recordAppendSessionClip(appendedAt: number = Date.now()): Promise<AppendSessionState> {
  const state = await getAppendSessionState();
  const next = applyAppendToAppendSession(state, appendedAt);
  await setAppendSessionState(next);
  return next;
}

export async function clearAppendSessionState(
  clearedAt: number = Date.now(),
  action: AppendSessionLastAction = 'clear'
): Promise<AppendSessionState> {
  const state = await getAppendSessionState();
  const next = applyClearToAppendSession(state, clearedAt, action);
  await setAppendSessionState(next);
  return next;
}
