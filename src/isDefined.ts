export function isDefined<T>(val: T | null | undefined): val is T {
  return typeof val !== "undefined" && val !== null;
}
