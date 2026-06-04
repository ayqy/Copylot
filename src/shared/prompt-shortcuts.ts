import type { Prompt } from './settings-manager';

export type QuickPromptSlot = 1 | 2 | 3;
export type QuickShortcutPlatform = 'default' | 'mac';
export type QuickCommandName =
  | typeof QUICK_CONVERT_COMMAND
  | typeof QUICK_PROMPT_SLOT_1_COMMAND
  | typeof QUICK_PROMPT_SLOT_2_COMMAND
  | typeof QUICK_PROMPT_SLOT_3_COMMAND;

export const QUICK_PROMPT_SLOT_VALUES: QuickPromptSlot[] = [1, 2, 3];

export const QUICK_CONVERT_COMMAND = 'quick-convert';
export const QUICK_PROMPT_SLOT_1_COMMAND = 'quick-prompt-slot-1';
export const QUICK_PROMPT_SLOT_2_COMMAND = 'quick-prompt-slot-2';
export const QUICK_PROMPT_SLOT_3_COMMAND = 'quick-prompt-slot-3';

export const QUICK_COMMAND_DEFAULT_SHORTCUTS: Record<
  QuickCommandName,
  Record<QuickShortcutPlatform, string>
> = {
  [QUICK_CONVERT_COMMAND]: {
    default: 'Alt+C',
    mac: 'Option+C'
  },
  [QUICK_PROMPT_SLOT_1_COMMAND]: {
    default: 'Alt+1',
    mac: 'Option+1'
  },
  [QUICK_PROMPT_SLOT_2_COMMAND]: {
    default: 'Alt+2',
    mac: 'Option+2'
  },
  [QUICK_PROMPT_SLOT_3_COMMAND]: {
    default: 'Alt+3',
    mac: 'Option+3'
  }
};

export function isQuickPromptSlot(value: unknown): value is QuickPromptSlot {
  return value === 1 || value === 2 || value === 3;
}

export function getQuickPromptSlotCommandName(slot: QuickPromptSlot): QuickCommandName {
  switch (slot) {
    case 1:
      return QUICK_PROMPT_SLOT_1_COMMAND;
    case 2:
      return QUICK_PROMPT_SLOT_2_COMMAND;
    case 3:
      return QUICK_PROMPT_SLOT_3_COMMAND;
    default:
      return QUICK_PROMPT_SLOT_1_COMMAND;
  }
}

export function getQuickCommandDefaultShortcut(command: QuickCommandName, platform: QuickShortcutPlatform = 'default'): string {
  return QUICK_COMMAND_DEFAULT_SHORTCUTS[command][platform];
}

export function getQuickPromptSlotFromCommand(command: string): QuickPromptSlot | null {
  switch (command) {
    case QUICK_PROMPT_SLOT_1_COMMAND:
      return 1;
    case QUICK_PROMPT_SLOT_2_COMMAND:
      return 2;
    case QUICK_PROMPT_SLOT_3_COMMAND:
      return 3;
    default:
      return null;
  }
}

export function getQuickPromptBySlot(prompts: Prompt[], slot: QuickPromptSlot): Prompt | null {
  return prompts.find((prompt) => prompt.quickAccessSlot === slot) || null;
}

export function normalizeQuickPromptAssignments(
  prompts: Prompt[],
  isPromptActiveFn: (prompt: Prompt) => boolean
): { prompts: Prompt[]; changed: boolean } {
  const nextPrompts = prompts.map((prompt) => ({ ...prompt }));
  const seenSlots = new Set<QuickPromptSlot>();
  let changed = false;

  nextPrompts.forEach((prompt) => {
    if (!isPromptActiveFn(prompt)) {
      if (prompt.quickAccessSlot !== undefined) {
        delete prompt.quickAccessSlot;
        changed = true;
      }
      return;
    }

    if (!isQuickPromptSlot(prompt.quickAccessSlot)) {
      if (prompt.quickAccessSlot !== undefined) {
        delete prompt.quickAccessSlot;
        changed = true;
      }
      return;
    }

    if (seenSlots.has(prompt.quickAccessSlot)) {
      delete prompt.quickAccessSlot;
      changed = true;
      return;
    }

    seenSlots.add(prompt.quickAccessSlot);
  });

  const activePrompts = nextPrompts.filter(isPromptActiveFn);
  const hasAssignedSlot = activePrompts.some((prompt) => isQuickPromptSlot(prompt.quickAccessSlot));

  if (!hasAssignedSlot) {
    let slotIndex = 0;
    activePrompts.forEach((prompt) => {
      if (slotIndex >= QUICK_PROMPT_SLOT_VALUES.length) {
        return;
      }
      prompt.quickAccessSlot = QUICK_PROMPT_SLOT_VALUES[slotIndex];
      slotIndex += 1;
      changed = true;
    });
  }

  return {
    prompts: nextPrompts,
    changed
  };
}

export function assignQuickPromptSlot(
  prompts: Prompt[],
  promptId: string,
  slot: QuickPromptSlot | null
): Prompt[] {
  return prompts.map((prompt) => {
    const nextPrompt = { ...prompt };

    if (nextPrompt.id === promptId) {
      if (slot === null) {
        delete nextPrompt.quickAccessSlot;
      } else {
        nextPrompt.quickAccessSlot = slot;
      }
      return nextPrompt;
    }

    if (slot !== null && nextPrompt.quickAccessSlot === slot) {
      delete nextPrompt.quickAccessSlot;
    }

    return nextPrompt;
  });
}
