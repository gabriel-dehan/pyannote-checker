/*
 * EntityPartial<T> : Allows to create a partial of an object, excluding readonly properties
 * Source: https://stackoverflow.com/questions/52443276/how-to-exclude-getter-only-properties-from-type-in-typescript/52473108#52473108
 */

export type IfEquals<X, Y, A = X, B = never> = (<T>() => T extends X
  ? 1
  : 2) extends <T>() => T extends Y ? 1 : 2
  ? A
  : B;

export type WritableKeys<T> = {
  [P in keyof T]-?: IfEquals<
    { [Q in P]: T[P] },
    { -readonly [Q in P]: T[P] },
    P
  >;
}[keyof T];

export type KeysOfType<T, K> = {
  [I in keyof T]: T[I] extends K ? I : never;
}[keyof T];

export type ReadonlyKeys<T> = {
  [P in keyof T]-?: IfEquals<
    { [Q in P]: T[P] },
    { -readonly [Q in P]: T[P] },
    never,
    P
  >;
}[keyof T];

export type EntityPartial<T> = Partial<Pick<T, WritableKeys<T>>>;
