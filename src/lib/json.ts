/**
 * Recursively convert BigInt -> string so values are JSON-serializable.
 * Pass through everything else.
 */
export function jsonable<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_k, v) => (typeof v === "bigint" ? v.toString() : v)),
  );
}
