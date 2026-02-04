import { BrandArray, HexColor, PerMode } from "./types";

export function isValidHex6(input: string): input is HexColor {
  return /^#[0-9a-fA-F]{6}$/.test(input);
}

export function assertHex6(
  input: string,
  label: string,
): asserts input is HexColor {
  if (!isValidHex6(input)) {
    throw new Error(`Invalid ${label}: expected "#RRGGBB", got "${input}"`);
  }
}

export function assertBrandArray(
  arr: readonly string[],
  label: string,
): asserts arr is BrandArray {
  if (arr.length < 1 || arr.length > 4) {
    throw new Error(
      `Invalid ${label}: expected 1–4 brand colors, got ${arr.length}`,
    );
  }
  arr.forEach((c, i) => assertHex6(c, `${label}[${i}]`));
}

export function normalizePerMode<T>(value: T | PerMode<T> | undefined): {
  light?: T;
  dark?: T;
} {
  if (value == null) return {};
  if (
    typeof value === "object" &&
    value &&
    ("light" in (value as any) || "dark" in (value as any))
  ) {
    const v = value as PerMode<T>;
    return { light: v.light, dark: v.dark };
  }
  return { light: value as T, dark: value as T };
}
