export type CopyActionErrorCode =
  | 'NO_ACTIVE_TAB'
  | 'CONTENT_SCRIPT_UNAVAILABLE'
  | 'NO_CONTENT'
  | 'SETTINGS_UNAVAILABLE'
  | 'CLIPBOARD_WRITE_FAILED'
  | 'UNKNOWN';

export type CopyActionResult =
  | {
      success: true;
    }
  | {
      success: false;
      code: CopyActionErrorCode;
      error: string;
    };

export function isCopyActionResult(value: unknown): value is CopyActionResult {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const result = value as Record<string, unknown>;
  if (result.success === true) {
    return true;
  }

  return (
    result.success === false &&
    typeof result.code === 'string' &&
    typeof result.error === 'string'
  );
}

export function createCopyActionFailure(
  code: CopyActionErrorCode,
  error: string
): CopyActionResult {
  return {
    success: false,
    code,
    error
  };
}
