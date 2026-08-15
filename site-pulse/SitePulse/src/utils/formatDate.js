/**
 * Date formatting utilities.
 * Centralized locale-aware helpers used across pages.
 */

/**
 * Format a date to a localized string.
 * @param {string|number|Date} value - Date-like value.
 * @param {object} [options]
 * @param {boolean} [options.includeTime=false] - Append a short time.
 * @param {string} [options.dateStyle='medium'] - Intl dateStyle.
 * @returns {string}
 */
export function formatDate(value, options = {}) {
  if (value === null || value === undefined || value === '') return '—';

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  const { includeTime = false, dateStyle = 'medium' } = options;
  try {
    if (includeTime) {
      return new Intl.DateTimeFormat(undefined, {
        dateStyle,
        timeStyle: 'short',
      }).format(date);
    }
    return new Intl.DateTimeFormat(undefined, { dateStyle }).format(date);
  } catch {
    return date.toLocaleDateString();
  }
}

/**
 * Format a date plus a short time.
 * @param {string|number|Date} value
 * @returns {string}
 */
export function formatDateTime(value) {
  return formatDate(value, { includeTime: true });
}

/**
 * Human-friendly relative time, e.g. "just now", "5 minutes ago".
 * @param {string|number|Date} value
 * @returns {string}
 */
export function formatRelative(value) {
  if (value === null || value === undefined || value === '') return '—';

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const abs = Math.abs(seconds);

  if (abs < 60) return 'just now';

  const minutes = Math.round(abs / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;

  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;

  return formatDate(value);
}

export default { formatDate, formatDateTime, formatRelative };