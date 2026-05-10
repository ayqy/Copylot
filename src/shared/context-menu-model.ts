import type { Prompt } from './settings-manager';

export interface PromptContextMenuItem {
  id: string;
  title: string;
  parentId: string;
  contexts: chrome.contextMenus.ContextType[];
}

export function buildPromptContextMenuItems(options: {
  prompts: Prompt[];
  parentId: string;
  contexts?: chrome.contextMenus.ContextType[];
}): PromptContextMenuItem[] {
  const contexts = options.contexts ?? ['page', 'selection'];

  return options.prompts.map((prompt) => ({
    id: prompt.id,
    title: prompt.title,
    parentId: options.parentId,
    contexts
  }));
}
