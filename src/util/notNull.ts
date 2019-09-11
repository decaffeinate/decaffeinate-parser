export default function notNull<T>(value: T | undefined | null): T {
  if (typeof value === 'undefined' || value === null) {
    throw new Error(`expected value not to be null/undefined: ${value}`);
  }

  return value;
}
