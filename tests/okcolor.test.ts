import { describe, it, expect } from "vitest";
import {
  hexToRgb,
  rgbToHex,
  rgbToOklab,
  oklabToRgb,
  oklabToOklch,
  oklchToOklab,
  hexToOklch,
  oklchToHex,
  rgbInGamut,
  mixRgb,
  srgbToLinear,
  linearToSrgb,
} from "../src/color-utils/okcolor.js";

describe("hexToRgb", () => {
  it("parses hex to 0–1 RGB", () => {
    expect(hexToRgb("#000000")).toEqual({ r: 0, g: 0, b: 0 });
    expect(hexToRgb("#FFFFFF")).toEqual({ r: 1, g: 1, b: 1 });
    expect(hexToRgb("#7C3AED")).toEqual({
      r: 124 / 255,
      g: 58 / 255,
      b: 237 / 255,
    });
  });
});

describe("rgbToHex", () => {
  it("clamps and formats RGB to hex", () => {
    expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe("#000000");
    expect(rgbToHex({ r: 1, g: 1, b: 1 })).toBe("#ffffff");
    expect(rgbToHex({ r: 1.5, g: -0.1, b: 0.5 })).toBe("#ff0080");
  });
});

describe("hex round-trip", () => {
  it("hex -> RGB -> hex preserves value", () => {
    const hex = "#7C3AED" as const;
    expect(rgbToHex(hexToRgb(hex))).toBe("#7c3aed");
  });
});

describe("rgbToOklab / oklabToRgb", () => {
  it("round-trips through OKLab", () => {
    const rgb = { r: 0.5, g: 0.2, b: 0.9 };
    const lab = rgbToOklab(rgb);
    expect(lab).toHaveProperty("L");
    expect(lab).toHaveProperty("a");
    expect(lab).toHaveProperty("b");
    const back = oklabToRgb(lab);
    expect(back.r).toBeCloseTo(rgb.r, 5);
    expect(back.g).toBeCloseTo(rgb.g, 5);
    expect(back.b).toBeCloseTo(rgb.b, 5);
  });
});

describe("oklabToOklch / oklchToOklab", () => {
  it("round-trips LCH", () => {
    const lab = { L: 0.6, a: 0.1, b: -0.05 };
    const lch = oklabToOklch(lab);
    expect(lch).toHaveProperty("L", 0.6);
    expect(lch).toHaveProperty("C");
    expect(lch).toHaveProperty("h");
    const back = oklchToOklab(lch);
    expect(back.L).toBeCloseTo(lab.L, 10);
    expect(back.a).toBeCloseTo(lab.a, 10);
    expect(back.b).toBeCloseTo(lab.b, 10);
  });

  it("normalizes hue to 0–360 when negative", () => {
    const lab = { L: 0.5, a: -0.2, b: 0 };
    const lch = oklabToOklch(lab);
    expect(lch.h).toBeGreaterThanOrEqual(0);
    expect(lch.h).toBeLessThanOrEqual(360);
  });
});

describe("hexToOklch / oklchToHex", () => {
  it("round-trips hex through OKLCH", () => {
    const hex = "#7C3AED" as const;
    const lch = hexToOklch(hex);
    expect(lch.L).toBeGreaterThan(0);
    expect(lch.C).toBeGreaterThan(0);
    const back = oklchToHex(lch);
    expect(back).toMatch(/^#[0-9a-f]{6}$/);
    expect(hexToRgb(back).r).toBeCloseTo(hexToRgb(hex).r, 4);
    expect(hexToRgb(back).g).toBeCloseTo(hexToRgb(hex).g, 4);
    expect(hexToRgb(back).b).toBeCloseTo(hexToRgb(hex).b, 4);
  });
});

describe("rgbInGamut", () => {
  it("returns true for 0–1 RGB", () => {
    expect(rgbInGamut({ r: 0, g: 0, b: 0 })).toBe(true);
    expect(rgbInGamut({ r: 1, g: 1, b: 1 })).toBe(true);
    expect(rgbInGamut({ r: 0.5, g: 0.5, b: 0.5 })).toBe(true);
  });

  it("returns false for out-of-gamut", () => {
    expect(rgbInGamut({ r: 1.1, g: 0, b: 0 })).toBe(false);
    expect(rgbInGamut({ r: -0.1, g: 0, b: 0 })).toBe(false);
    expect(rgbInGamut({ r: 0, g: 2, b: 0 })).toBe(false);
  });
});

describe("mixRgb", () => {
  it("interpolates between two RGB values", () => {
    const white = { r: 1, g: 1, b: 1 };
    const black = { r: 0, g: 0, b: 0 };
    expect(mixRgb(black, white, 0)).toEqual(black);
    expect(mixRgb(black, white, 1)).toEqual(white);
    const mid = mixRgb(black, white, 0.5);
    expect(mid.r).toBe(0.5);
    expect(mid.g).toBe(0.5);
    expect(mid.b).toBe(0.5);
  });
});

describe("srgbToLinear / linearToSrgb", () => {
  it("round-trips through linear and back", () => {
    for (const v of [0, 0.01, 0.04045, 0.1, 0.5, 0.9, 1.0]) {
      expect(linearToSrgb(srgbToLinear(v))).toBeCloseTo(v, 5);
    }
  });

  it("srgbToLinear maps 0 to 0 and 1 to 1", () => {
    expect(srgbToLinear(0)).toBe(0);
    expect(srgbToLinear(1)).toBeCloseTo(1, 10);
  });

  it("linearToSrgb maps 0 to 0 and 1 to 1", () => {
    expect(linearToSrgb(0)).toBe(0);
    expect(linearToSrgb(1)).toBeCloseTo(1, 10);
  });

  it("srgbToLinear is monotonic", () => {
    let prev = -1;
    for (let i = 0; i <= 10; i++) {
      const v = srgbToLinear(i / 10);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
  });
});
