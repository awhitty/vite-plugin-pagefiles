export function isDefined<T>(val: T | null | undefined): val is T {
  return typeof val !== "undefined" && val !== null;
}

export function expectDefinedOrThrow<T>(
  val: T | null | undefined,
  error: Error = new Error(`Expected value to be defined`)
): asserts val is T {
  if (!isDefined(val)) {
    throw error;
  }
}
