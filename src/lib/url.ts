export function normalizeApiBaseUrl(url?: string): string {
  const value = (url || '').trim();
  if (!value) return '';
  return value.replace(/\/+$/, '');
}
