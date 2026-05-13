export function formatDate(iso: string): string {
  if (!iso) return 'Unknown date';
  return new Date(iso).toLocaleString();
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}
