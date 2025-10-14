export interface NormalizedLink {
  raw: string;
  href: string;
  drop: boolean;
}

function getDocumentBaseURI(): string | undefined {
  try {
    return typeof document !== 'undefined' ? document.baseURI : undefined;
  } catch {
    return undefined;
  }
}

function getWindowLocation(): string | undefined {
  try {
    return typeof window !== 'undefined' ? window.location.href : undefined;
  } catch {
    return undefined;
  }
}

export function isRootPath(url: string): boolean {
  const trimmed = (url || '').trim();
  return trimmed === '/';
}

export function isSameOriginRoot(url: string, origin: string | undefined): boolean {
  if (!origin) return false;
  try {
    const parsed = new URL(url);
    return parsed.origin === origin && parsed.pathname === '/' && !parsed.search && !parsed.hash;
  } catch {
    return false;
  }
}

export function isRelativeLike(url: string): boolean {
  if (!url) return false;
  if (/^(\/|\.\/|\.\.\/)/.test(url)) {
    return true;
  }
  if (url.includes('/') && !url.includes('://') && !url.startsWith('//')) {
    return true;
  }
  return false;
}

export function normalizeLink(
  rawHref: string,
  baseHref?: string,
  windowLocation?: string
): NormalizedLink {
  const raw = (rawHref || '').trim();
  if (!raw) {
    return { raw, href: '', drop: true };
  }

  if (isRootPath(raw)) {
    return { raw, href: '', drop: true };
  }

  if (/^(javascript:|void\(0\)|about:blank)/i.test(raw)) {
    return { raw, href: '', drop: true };
  }

  const effectiveBase =
    baseHref || getDocumentBaseURI() || windowLocation || getWindowLocation() || undefined;

  try {
    if (/^(data:|blob:)/i.test(raw)) {
      return { raw, href: raw, drop: false };
    }

    if (effectiveBase) {
      const resolved = new URL(raw, effectiveBase).href;
      if (isSameOriginRoot(resolved, new URL(effectiveBase).origin)) {
        return { raw, href: '', drop: true };
      }
      return { raw, href: resolved, drop: false };
    }

    const resolved = new URL(raw).href;
    return { raw, href: resolved, drop: false };
  } catch {
    if (isRelativeLike(raw)) {
      return { raw, href: raw, drop: false };
    }
    return { raw, href: '', drop: true };
  }
}
