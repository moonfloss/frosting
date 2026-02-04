import { describe, it, expect } from "vitest";
import {
  isValidHex6,
  assertHex6,
  assertBrandArray,
  normalizePerMode,
} from "../src/color-utils/validate.js";

describe("isValidHex6", () => {
  it("accepts valid 6-digit hex", () => {
    expect(isValidHex6("#000000")).toBe(true);
    expect(isValidHex6("#FFFFFF")).toBe(true);
    expect(isValidHex6("#7C3AED")).toBe(true);
    expect(isValidHex6("#a1b2c3")).toBe(true);
  });

  it("rejects invalid hex", () => {
    expect(isValidHex6("#000")).toBe(false);
    expect(isValidHex6("#0000000")).toBe(false);
    expect(isValidHex6("000000")).toBe(false);
    expect(isValidHex6("#gggggg")).toBe(false);
    expect(isValidHex6("")).toBe(false);
  });
});

describe("assertHex6", () => {
  it("does not throw for valid hex", () => {
    expect(() => assertHex6("#7C3AED", "brand")).not.toThrow();
  });

  it("throws for invalid hex", () => {
    expect(() => assertHex6("#xxx", "brand")).toThrow(
      /Invalid brand: expected "#RRGGBB"/,
    );
  });
});

describe("assertBrandArray", () => {
  it("accepts 1–4 valid hex colors", () => {
    expect(() => assertBrandArray(["#7C3AED"], "brand")).not.toThrow();
    expect(() =>
      assertBrandArray(["#7C3AED", "#F59E0B"], "brand"),
    ).not.toThrow();
  });

  it("throws for wrong length", () => {
    expect(() => assertBrandArray([], "brand")).toThrow(/expected 1–4 brand/);
    expect(() =>
      assertBrandArray(
        ["#a", "#b", "#c", "#d", "#e"],
        "brand",
      ),
    ).toThrow(/expected 1–4 brand/);
  });

  it("throws when any color is invalid", () => {
    expect(() =>
      assertBrandArray(["#7C3AED", "#bad"], "brand"),
    ).toThrow(/Invalid brand\[1\]/);
  });
});

describe("normalizePerMode", () => {
  it("spreads single value to both modes", () => {
    expect(normalizePerMode("#7C3AED")).toEqual({
      light: "#7C3AED",
      dark: "#7C3AED",
    });
  });

  it("returns empty object for null/undefined", () => {
    expect(normalizePerMode(null)).toEqual({});
    expect(normalizePerMode(undefined)).toEqual({});
  });

  it("passes through { light, dark } object", () => {
    expect(
      normalizePerMode({ light: "#fff", dark: "#000" }),
    ).toEqual({ light: "#fff", dark: "#000" });
  });
});
