/**
 * Converts a number into a human-readable format.
 * @param number - The number to be humanized.
 * @returns The humanized number as a string.
 */
export function humanizeNumber(number: number): string {
  if (number < 1000)
    return number.toFixed(2)

  if (number < 1000000)
    return `${(number / 1000).toFixed(1)}K`

  if (number < 1000000000)
    return `${(number / 1000000).toFixed(1)}M`

  if (number < 1000000000000)
    return `${(number / 1000000000).toFixed(1)}B`

  return `${(number / 1000000000000).toFixed(1)}T`
}

/**
 * Converts a number to Nigerian currency format.
 * @param amount - The number to be converted.
 * @returns The number formatted as Nigerian currency.
 */
export function toNigerianCurrency(amount: number): string {
  return amount.toLocaleString('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })
}
