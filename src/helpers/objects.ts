/**
 * Get the first key in the object that has a value that matches
 * the given value
 * @param obj
 * @param value
 */
export function getKeyByValue<K extends string | number | symbol, T>(
  obj: Record<K, T>,
  value: T,
) {
  return Object.keys(obj).find(key => obj[key as K] === value)
}
