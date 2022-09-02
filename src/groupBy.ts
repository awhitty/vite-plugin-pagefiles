export function groupBy<T, K>(array: T[], keyFn: (item: T) => K): Map<K, T[]> {
  const result = new Map<K, T[]>();
  array.forEach((item) => {
    const key = keyFn(item);
    const arr = result.get(key);
    if (arr) {
      arr.push(item);
    } else {
      result.set(key, [item]);
    }
  });
  return result;
}
