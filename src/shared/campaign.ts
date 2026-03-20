export const CAMPAIGN_MAX_LENGTH = 32;

const CAMPAIGN_REGEX = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

/**
 * 渠道（campaign）只允许短且可审计的安全字符串：
 * - trim 后非空
 * - <= CAMPAIGN_MAX_LENGTH
 * - 仅允许 [A-Za-z0-9._-]，且必须以字母/数字开头
 */
export function sanitizeCampaign(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > CAMPAIGN_MAX_LENGTH) return null;
  if (!CAMPAIGN_REGEX.test(trimmed)) return null;
  return trimmed;
}

/**
 * 用于 i18n 模板中的“可选行”占位符：
 * - 有效 campaign：返回 "\n- campaign: <value>"
 * - 无效/为空：返回 ""
 */
export function formatCampaignLineForTemplate(value: unknown): string {
  const sanitized = sanitizeCampaign(value);
  return sanitized ? `\n- campaign: ${sanitized}` : '';
}

