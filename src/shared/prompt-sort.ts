export type PromptSortMode = 'default' | 'most_used' | 'recent_used';

export interface SortablePrompt {
  title: string;
  usageCount?: number;
  lastUsedAt?: number;
}

export function isPromptSortMode(value: unknown): value is PromptSortMode {
  return value === 'default' || value === 'most_used' || value === 'recent_used';
}

export function parsePromptSortMode(value: unknown): PromptSortMode {
  return isPromptSortMode(value) ? value : 'default';
}

function compareTitleCaseInsensitiveAsc(aTitle: string, bTitle: string): number {
  const a = aTitle.toLowerCase();
  const b = bTitle.toLowerCase();

  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

function getUsageCount(prompt: SortablePrompt): number {
  return typeof prompt.usageCount === 'number' && Number.isFinite(prompt.usageCount)
    ? prompt.usageCount
    : 0;
}

function getLastUsedAt(prompt: SortablePrompt): number {
  return typeof prompt.lastUsedAt === 'number' && Number.isFinite(prompt.lastUsedAt)
    ? prompt.lastUsedAt
    : 0;
}

export function sortPrompts<T extends SortablePrompt>(
  prompts: readonly T[],
  mode: PromptSortMode
): T[] {
  const copied = [...prompts];

  if (mode === 'default') {
    return copied;
  }

  if (mode === 'most_used') {
    copied.sort((a, b) => {
      const usageDiff = getUsageCount(b) - getUsageCount(a);
      if (usageDiff !== 0) return usageDiff;
      return compareTitleCaseInsensitiveAsc(a.title, b.title);
    });
    return copied;
  }

  copied.sort((a, b) => {
    const lastUsedDiff = getLastUsedAt(b) - getLastUsedAt(a);
    if (lastUsedDiff !== 0) return lastUsedDiff;

    const usageDiff = getUsageCount(b) - getUsageCount(a);
    if (usageDiff !== 0) return usageDiff;

    return compareTitleCaseInsensitiveAsc(a.title, b.title);
  });

  return copied;
}

