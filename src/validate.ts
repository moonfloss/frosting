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

export function isPerMode<T>(
  value: T | PerMode<T> | undefined,
): value is PerMode<T> {
  return (
    value != null &&
    typeof value === "object" &&
    ("light" in value || "dark" in value)
  );
}

export function normalizePerMode<T>(value: T | PerMode<T> | undefined): {
  light?: T;
  dark?: T;
} {
  if (value == null) return {};
  if (isPerMode(value)) {
    return { light: value.light, dark: value.dark };
  }
  const scalar = value as T;
  return { light: scalar, dark: scalar };
}
