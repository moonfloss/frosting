import { describe, it, expect } from "vitest";
import { resolveInputs } from "../src/color-utils/resolve.js";
import type { BrandArray, PaletteInput } from "../src/index.js";

const defaultOptions = {
  brandTint: true as const,
  neonChromaRolloff: true as const,
};

describe("resolveInputs", () => {
  describe("brand input", () => {
    it("resolves single brand to both modes", () => {
      const out = resolveInputs(
        { brand: ["#7C3AED", "#F59E0B"] },
        defaultOptions,
      );
      expect(out.brand.light).toEqual(["#7C3AED", "#F59E0B"]);
      expect(out.brand.dark).toEqual(["#7C3AED", "#F59E0B"]);
    });

    it("resolves per-mode brand", () => {
      const out = resolveInputs(
        {
          brand: {
            light: ["#7C3AED"],
            dark: ["#A78BFA"],
          },
        },
        defaultOptions,
      );
      expect(out.brand.light).toEqual(["#7C3AED"]);
      expect(out.brand.dark).toEqual(["#A78BFA"]);
    });

    it("throws when brand is missing", () => {
      expect(() =>
        resolveInputs(
          {
            brand: {
              light: undefined as unknown as BrandArray,
              dark: undefined as unknown as BrandArray,
            },
          } as PaletteInput,
          defaultOptions,
        ),
      ).toThrow(/brand is required/);
    });

    it("throws for invalid hex in brand", () => {
      expect(() =>
        resolveInputs(
          { brand: ["#7C3AED", "#bad"] },
          defaultOptions,
        ),
      ).toThrow(/Invalid brand\.light\[1\]/);
    });

    it("throws for wrong brand array length", () => {
      expect(() =>
        resolveInputs(
          { brand: [] as unknown as BrandArray },
          defaultOptions,
        ),
      ).toThrow(/expected 1–4 brand/);
    });

    it("passes through background and foreground", () => {
      const out = resolveInputs(
        {
          brand: ["#7C3AED"],
          background: "#FFFFFF",
          foreground: { light: "#0a0a0a", dark: "#fafafa" },
        },
        defaultOptions,
      );
      expect(out.background).toEqual({ light: "#FFFFFF", dark: "#FFFFFF" });
      expect(out.foreground).toEqual({ light: "#0a0a0a", dark: "#fafafa" });
    });

    it("throws for invalid background hex", () => {
      expect(() =>
        resolveInputs(
          { brand: ["#7C3AED"], background: "#xxx" },
          defaultOptions,
        ),
      ).toThrow(/Invalid background/);
    });
  });

  describe("scheme input", () => {
    it("derives brand from scheme and returns schemeUsed", () => {
      const out = resolveInputs(
        {
          scheme: { base: "#7C3AED", kind: "triad" },
        },
        defaultOptions,
      );
      expect(out.brand.light.length).toBe(3);
      expect(out.brand.dark.length).toBe(3);
      expect(out.schemeUsed).toBeDefined();
      expect(out.schemeUsed!.light.kind).toBe("triad");
      expect(out.schemeUsed!.light.base).toBe("#7C3AED");
      expect(out.schemeUsed!.dark.base).toBe("#7C3AED");
    });

    it("throws when scheme.base does not resolve to both modes", () => {
      // When both light and dark are undefined, resolution fails
      expect(() =>
        resolveInputs(
          {
            scheme: {
              base: { light: undefined, dark: undefined },
              kind: "triad",
            },
          } as PaletteInput,
          defaultOptions,
        ),
      ).toThrow(/scheme.base must resolve to both light and dark/);
    });

    it("throws for invalid scheme base hex", () => {
      expect(() =>
        resolveInputs(
          { scheme: { base: "#bad", kind: "triad" } },
          defaultOptions,
        ),
      ).toThrow(/Invalid scheme.base/);
    });

    it("respects scheme count and spreadDegrees in schemeUsed", () => {
      const out = resolveInputs(
        {
          scheme: {
            base: "#7C3AED",
            kind: "adjacent",
            count: 3,
            spreadDegrees: 45,
            secondaryChromaScale: 0.7,
          },
        },
        defaultOptions,
      );
      expect(out.schemeUsed!.light.count).toBe(3);
      expect(out.schemeUsed!.light.spreadDegrees).toBe(45);
      expect(out.schemeUsed!.light.secondaryChromaScale).toBe(0.7);
    });
  });
});
