// @ts-ignore: local test harness only; jsdom type package is not required for runtime execution.
import { JSDOM } from 'jsdom';

export interface DomHarness {
  dom: JSDOM;
  clipboard: {
    readText(): Promise<string>;
    writeText(text: string): Promise<void>;
  };
  downloads: Array<{ href: string; download: string }>;
  openedWindows: string[];
  restore(): void;
  tick(ms?: number): Promise<void>;
}

const GLOBAL_KEYS = [
  'window',
  'document',
  'navigator',
  'location',
  'history',
  'Node',
  'Element',
  'HTMLElement',
  'HTMLInputElement',
  'HTMLTextAreaElement',
  'HTMLButtonElement',
  'HTMLAnchorElement',
  'HTMLSelectElement',
  'HTMLDetailsElement',
  'HTMLTableElement',
  'HTMLTableCellElement',
  'HTMLTableRowElement',
  'HTMLImageElement',
  'HTMLVideoElement',
  'HTMLCanvasElement',
  'HTMLPictureElement',
  'HTMLEmbedElement',
  'HTMLObjectElement',
  'HTMLPreElement',
  'HTMLDivElement',
  'Event',
  'MouseEvent',
  'KeyboardEvent',
  'CustomEvent',
  'Blob',
  'URL',
  'URLSearchParams',
  'MutationObserver',
  'DOMParser',
  'File',
  'Range',
  'Selection',
  'SVGElement',
  'SVGSVGElement',
  'EventTarget',
  'sessionStorage',
  'localStorage',
  'requestAnimationFrame',
  'cancelAnimationFrame',
  'getComputedStyle'
] as const;

export function createDomHarness(html: string, url: string): DomHarness {
  const dom = new JSDOM(html, {
    url,
    pretendToBeVisual: true
  });

  const downloads: Array<{ href: string; download: string }> = [];
  const openedWindows: string[] = [];
  const originalGlobals = new Map<string, unknown>();

  for (const key of GLOBAL_KEYS) {
    originalGlobals.set(key, (globalThis as Record<string, unknown>)[key]);
    Object.defineProperty(globalThis, key, {
      configurable: true,
      writable: true,
      value: (dom.window as unknown as Record<string, unknown>)[key]
    });
  }

  originalGlobals.set('chrome', (globalThis as Record<string, unknown>).chrome);

  let clipboardText = '';
  const clipboard = {
    async readText() {
      return clipboardText;
    },
    async writeText(text: string) {
      clipboardText = text;
    }
  };

  Object.defineProperty(dom.window.navigator, 'clipboard', {
    configurable: true,
    value: clipboard
  });

  Object.defineProperty(dom.window.document, 'execCommand', {
    configurable: true,
    value(command: string) {
      if (command !== 'copy') return false;
      const fields = Array.from(
        dom.window.document.querySelectorAll('textarea, input')
      ) as Array<HTMLInputElement | HTMLTextAreaElement>;
      const active = dom.window.document.activeElement as HTMLInputElement | HTMLTextAreaElement | null;
      const candidate = fields.includes(active as HTMLInputElement | HTMLTextAreaElement)
        ? active
        : fields.at(-1) ?? null;
      if (candidate && typeof candidate.value === 'string') {
        const start = typeof candidate.selectionStart === 'number' ? candidate.selectionStart : 0;
        const end = typeof candidate.selectionEnd === 'number' ? candidate.selectionEnd : candidate.value.length;
        clipboardText = candidate.value.slice(start, end) || candidate.value;
        return true;
      }
      return false;
    }
  });

  Object.defineProperty(dom.window.HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value() {
      return undefined;
    }
  });

  const urlApi = dom.window.URL;
  Object.defineProperty(urlApi, 'createObjectURL', {
    configurable: true,
    value(blob: Blob) {
      return `blob:copylot-test/${blob.size}`;
    }
  });
  Object.defineProperty(urlApi, 'revokeObjectURL', {
    configurable: true,
    value() {
      return undefined;
    }
  });

  Object.defineProperty(dom.window.HTMLAnchorElement.prototype, 'click', {
    configurable: true,
    value(this: HTMLAnchorElement) {
      downloads.push({ href: this.href, download: this.download });
    }
  });

  Object.defineProperty(dom.window, 'open', {
    configurable: true,
    value(targetUrl: string) {
      openedWindows.push(targetUrl);
      return null;
    }
  });

  return {
    dom,
    clipboard,
    downloads,
    openedWindows,
    restore() {
      for (const key of GLOBAL_KEYS) {
        const value = originalGlobals.get(key);
      if (typeof value === 'undefined') {
        delete (globalThis as Record<string, unknown>)[key];
      } else {
          Object.defineProperty(globalThis, key, {
            configurable: true,
            writable: true,
            value
          });
      }
    }
      const chromeValue = originalGlobals.get('chrome');
      if (typeof chromeValue === 'undefined') {
        delete (globalThis as Record<string, unknown>).chrome;
      } else {
        Object.defineProperty(globalThis, 'chrome', {
          configurable: true,
          writable: true,
          value: chromeValue
        });
      }
      dom.window.close();
    },
    async tick(ms = 0) {
      await new Promise((resolve) => dom.window.setTimeout(resolve, ms));
      await Promise.resolve();
    }
  };
}
