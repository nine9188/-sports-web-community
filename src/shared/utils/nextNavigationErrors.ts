export function isNextRedirectError(error: unknown): boolean {
  return Boolean(
    error &&
    typeof error === 'object' &&
    'digest' in error &&
    typeof (error as { digest?: unknown }).digest === 'string' &&
    String((error as { digest?: unknown }).digest).startsWith('NEXT_REDIRECT')
  );
}

export function isNextNotFoundError(error: unknown): boolean {
  return Boolean(
    error &&
    typeof error === 'object' &&
    'digest' in error &&
    typeof (error as { digest?: unknown }).digest === 'string' &&
    String((error as { digest?: unknown }).digest).includes('NEXT_HTTP_ERROR_FALLBACK;404')
  );
}

export function normalizeRouteSlug(value?: string | null): string {
  const raw = String(value ?? '').trim();
  if (!raw) return '';

  try {
    return decodeURIComponent(raw).trim().toLowerCase().normalize('NFC');
  } catch {
    return raw.toLowerCase().normalize('NFC');
  }
}
