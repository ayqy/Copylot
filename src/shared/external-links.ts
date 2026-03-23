import { sanitizeCampaign } from './campaign.ts';

export const OFFICIAL_SITE_ROOT_URL = 'https://copy.useai.online/';

// Canonical Chrome Web Store landing page (used for external promotion).
export const CHROME_WEB_STORE_CANONICAL_URL =
  'https://chromewebstore.google.com/detail/ai-copilot-%E2%80%93-magiccopy/ehfglnbhoefcdedpkcdnainiifpflbic';

export const EXTERNAL_LINKS_UTM_SOURCE = 'copylot-ext';

export type ExternalUtmMedium = 'popup' | 'options' | 'distribution_toolkit' | 'rating_prompt';

export interface BuildExternalLinkParams {
  medium: ExternalUtmMedium | (string & {});
  campaign?: unknown;
}

export interface ProWaitlistEnvironmentInfo {
  extensionVersion?: unknown;
  extensionId?: unknown;
  navigatorLanguage?: unknown;
  uiLanguage?: unknown;
}

export type SanitizedProWaitlistEnv = Partial<{
  extensionVersion: string;
  extensionId: string;
  navigatorLanguage: string;
  uiLanguage: string;
}>;

const MEDIUM_MAX_LENGTH = 32;
const ENV_VALUE_MAX_LENGTH = 64;

const MEDIUM_REGEX = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

function sanitizeMedium(value: unknown): string {
  if (typeof value !== 'string') return 'unknown';
  const trimmed = value.trim();
  if (!trimmed) return 'unknown';
  if (trimmed.length > MEDIUM_MAX_LENGTH) return 'unknown';
  if (!MEDIUM_REGEX.test(trimmed)) return 'unknown';
  return trimmed;
}

function sanitizeEnvValue(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > ENV_VALUE_MAX_LENGTH) return null;
  return trimmed;
}

export function sanitizeProWaitlistEnv(env: unknown): SanitizedProWaitlistEnv {
  if (!env || typeof env !== 'object') return {};
  const raw = env as Record<string, unknown>;
  const sanitized: SanitizedProWaitlistEnv = {};

  const extensionVersion = sanitizeEnvValue(raw.extensionVersion);
  if (extensionVersion) sanitized.extensionVersion = extensionVersion;

  const extensionId = sanitizeEnvValue(raw.extensionId);
  if (extensionId) sanitized.extensionId = extensionId;

  const navigatorLanguage = sanitizeEnvValue(raw.navigatorLanguage);
  if (navigatorLanguage) sanitized.navigatorLanguage = navigatorLanguage;

  const uiLanguage = sanitizeEnvValue(raw.uiLanguage);
  if (uiLanguage) sanitized.uiLanguage = uiLanguage;

  return sanitized;
}

function buildUtmSearchParams(params: BuildExternalLinkParams): URLSearchParams {
  const medium = sanitizeMedium(params.medium);
  const campaign = sanitizeCampaign(params.campaign);

  const search = new URLSearchParams();
  search.set('utm_source', EXTERNAL_LINKS_UTM_SOURCE);
  search.set('utm_medium', medium);
  if (campaign) search.set('utm_campaign', campaign);
  return search;
}

export function buildOfficialSiteUrl(params: BuildExternalLinkParams): string {
  const url = new URL(OFFICIAL_SITE_ROOT_URL);
  url.search = buildUtmSearchParams(params).toString();
  return url.toString();
}

export function buildChromeWebStoreUrl(params: BuildExternalLinkParams): string {
  const url = new URL(CHROME_WEB_STORE_CANONICAL_URL);
  url.search = buildUtmSearchParams(params).toString();
  return url.toString();
}

function appendProWaitlistEnvParams(search: URLSearchParams, env: unknown): void {
  const sanitized = sanitizeProWaitlistEnv(env);
  if (sanitized.extensionVersion) search.set('ext_version', sanitized.extensionVersion);
  if (sanitized.extensionId) search.set('ext_id', sanitized.extensionId);
  if (sanitized.navigatorLanguage) search.set('nav_lang', sanitized.navigatorLanguage);
  if (sanitized.uiLanguage) search.set('ui_lang', sanitized.uiLanguage);
}

export interface BuildProWaitlistUrlParams extends BuildExternalLinkParams {
  env?: unknown;
}

/**
 * 官网 Pro 候补落地页（默认使用官网根页 + `#pro` 锚点，避免 404 风险）。
 *
 * 隐私红线：
 * - 仅允许写入可审计环境字段：扩展版本/扩展ID/语言
 * - 不得写入网页 URL/标题/复制内容
 */
export function buildProWaitlistUrl(params: BuildProWaitlistUrlParams): string {
  const url = new URL(OFFICIAL_SITE_ROOT_URL);
  url.hash = '#pro';

  const search = buildUtmSearchParams(params);
  appendProWaitlistEnvParams(search, params.env);
  url.search = search.toString();

  return url.toString();
}

