export type CwsItemError = {
  error_code: string | null;
  error_detail: string | null;
};

export type CwsDraftStatus = {
  id: string | null;
  crxVersion: string | null;
  uploadState: string | null;
  itemError: CwsItemError[];
};

export type CwsV2UploadStatus = {
  httpStatus: number;
  name: string | null;
  itemId: string | null;
  crxVersion: string | null;
  uploadState: string | null;
  error: {
    code: number | null;
    status: string | null;
    message: string | null;
  } | null;
};

function optionalText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export function sanitizeCwsDraftStatus(payload: unknown): CwsDraftStatus {
  const record = payload && typeof payload === 'object' && !Array.isArray(payload)
    ? (payload as Record<string, unknown>)
    : {};
  const rawErrors = Array.isArray(record.itemError) ? record.itemError : [];
  const itemError = rawErrors.map((value) => {
    const error = value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
    return {
      error_code: optionalText(error.error_code),
      error_detail: optionalText(error.error_detail)
    };
  });

  return {
    id: optionalText(record.id),
    crxVersion: optionalText(record.crxVersion),
    uploadState: optionalText(record.uploadState),
    itemError
  };
}

export function formatCwsItemErrors(errors: CwsItemError[]): string {
  if (!errors.length) return 'itemError unavailable';
  return errors
    .map((error) => `${error.error_code ?? 'UNKNOWN'}: ${error.error_detail ?? 'no detail'}`)
    .join('; ');
}

export function sanitizeCwsV2UploadStatus(
  httpStatus: number,
  payload: unknown
): CwsV2UploadStatus {
  const record = payload && typeof payload === 'object' && !Array.isArray(payload)
    ? (payload as Record<string, unknown>)
    : {};
  const rawError = record.error && typeof record.error === 'object' && !Array.isArray(record.error)
    ? (record.error as Record<string, unknown>)
    : null;

  return {
    httpStatus,
    name: optionalText(record.name),
    itemId: optionalText(record.itemId),
    crxVersion: optionalText(record.crxVersion),
    uploadState: optionalText(record.uploadState),
    error: rawError
      ? {
          code: typeof rawError.code === 'number' ? rawError.code : null,
          status: optionalText(rawError.status),
          message: optionalText(rawError.message)
        }
      : null
  };
}

export function formatCwsV2UploadFailure(upload: CwsV2UploadStatus): string {
  const state = upload.uploadState ?? 'unknown';
  if (!upload.error) return `uploadState=${state}`;
  return `uploadState=${state}; ${upload.error.status ?? 'UNKNOWN'}: ${upload.error.message ?? 'no detail'}`;
}
