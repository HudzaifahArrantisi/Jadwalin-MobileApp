const NETWORK_ERROR_PATTERNS = [
  'network',
  'offline',
  'unavailable',
  'failed to fetch',
  'network request failed',
  'webchannelconnection',
  'could not reach cloud firestore backend',
];

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message?: unknown }).message ?? '');
  }

  return 'Terjadi kesalahan tidak dikenal';
}

export function isNetworkError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  const code =
    error && typeof error === 'object' && 'code' in error
      ? String((error as { code?: unknown }).code).toLowerCase()
      : '';

  return NETWORK_ERROR_PATTERNS.some(
    (pattern) => message.includes(pattern) || code.includes(pattern)
  );
}

export function getUserFriendlyError(error: unknown): string {
  if (isNetworkError(error)) {
    return 'Koneksi bermasalah. Data terakhir tetap ditampilkan dan akan sinkron lagi saat online.';
  }

  return getErrorMessage(error);
}
