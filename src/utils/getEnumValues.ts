export function getEnumValues<T>(enumObject: Record<string, T>): T[] {
  return Object.keys(enumObject).map((key) => enumObject[key]);
}
