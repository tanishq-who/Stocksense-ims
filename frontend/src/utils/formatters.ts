/**
 * Utility functions for date, string, and status formatting.
 */

export function formatDate(dateString: string): string {
  if (!dateString) return '—';
  // If already formatted like '26 Sep 2026', return directly
  if (dateString.includes(' ') && !dateString.includes('T')) return dateString;

  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function getInitials(name: string): string {
  if (!name) return 'OP';
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}
