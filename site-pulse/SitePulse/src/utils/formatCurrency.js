/**
 * Currency formatting utilities.
 */

/**
 * Format a number as a localized currency string.
 * @param {number|string} value - Amount to format.
 * @param {string} [currency='USD'] - ISO 4217 currency code.
 * @param {object} [options]
 * @param {number} [options.maximumFractionDigits=2]
 * @param {number} [options.minimumFractionDigits=0]
 * @returns {string}
 */
export function formatCurrency(value, currency = 'USD', options = {}) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '—';

  const { maximumFractionDigits = 2, minimumFractionDigits = 0 } = options;

  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits,
      minimumFractionDigits,
    }).format(numeric);
  } catch {
    return `${currency} ${numeric.toLocaleString(undefined, {
      maximumFractionDigits: Math.max(0, maximumFractionDigits),
    })}`;
  }
}

export default { formatCurrency };