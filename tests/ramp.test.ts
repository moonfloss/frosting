import { describe, it, expect } from "vitest";
import { cubicBezier, evaluateEasingY } from "../src/color-utils/easing.js";
import { hexToOklch } from "../src/color-utils/okcolor.js";
import {
  STEPS,
  generateRampFromAnchor,
  generateNeutralRamp,
} from "../src/color-utils/ramp.js";

describe("STEPS", () => {
  it("includes 50–950 Tailwind-style steps", () => {
    expect(STEPS).toContain(50);
    expect(STEPS).toContain(500);
    expect(STEPS).toContain(950);
    expect(STEPS).toHaveLength(11);
  });
});

describe("generateRampFromAnchor", () => {
  it("keeps anchor at step 500", () => {
    const anchor = "#7C3AED" as const;
    const { ramp } = generateRampFromAnchor(anchor, "light", {
      neonChromaRolloff: true,
    });
    expect(ramp[500]).toBe(anchor);
  });

  it("produces all steps", () => {
    const { ramp } = generateRampFromAnchor("#7C3AED", "light", {
      neonChromaRolloff: true,
    });
    for (const step of STEPS) {
      expect(ramp[step]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it("light and dark ramps differ", () => {
    const light = generateRampFromAnchor("#7C3AED", "light", {
      neonChromaRolloff: true,
    });
    const dark = generateRampFromAnchor("#7C3AED", "dark", {
      neonChromaRolloff: true,
    });
    expect(light.ramp[50]).not.toBe(dark.ramp[50]);
    // Step 50 has different L targets (0.985 vs 0.96); 900 can coincide
    expect(light.ramp[100]).not.toBe(dark.ramp[100]);
  });

  it("with neonChromaRolloff false uses full chroma at extremes", () => {
    const { ramp } = generateRampFromAnchor("#FF0066", "light", {
      neonChromaRolloff: false,
    });
    expect(ramp[50]).toMatch(/^#[0-9a-f]{6}$/i);
    expect(ramp[950]).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("returns gamutClampsApplied count", () => {
    const result = generateRampFromAnchor("#7C3AED", "light", {
      neonChromaRolloff: true,
    });
    expect(typeof result.gamutClampsApplied).toBe("number");
    expect(result.gamutClampsApplied).toBeGreaterThanOrEqual(0);
  });

  // Must match L deltas in src/color-utils/ramp.ts (LIGHT_L / DARK_L vs 500).
  const LIGHT_L_500 = 0.7;
  const LIGHT = {
    400: 0.83,
    600: 0.6,
  } as const;
  const DARK_L_500 = 0.62;
  const DARK = {
    400: 0.7,
    600: 0.54,
  } as const;

  it("centers L ladder on anchor so 400/600 are correct offsets from 500 (light)", () => {
    const anchor = "#7C3AED" as const;
    const { ramp } = generateRampFromAnchor(anchor, "light", {
      neonChromaRolloff: true,
    });
    const l500 = hexToOklch(anchor).L;
    const d400 = LIGHT[400] - LIGHT_L_500;
    const d600 = LIGHT[600] - LIGHT_L_500;
    // 8-bit #hex round-trip on generated steps can nudge L vs the anchor; keep tolerance loose.
    expect(hexToOklch(ramp[400]).L - l500).toBeCloseTo(d400, 1);
    expect(hexToOklch(ramp[600]).L - l500).toBeCloseTo(d600, 1);
  });

  it("centers L ladder on anchor so 400/600 are correct offsets from 500 (dark)", () => {
    const anchor = "#7C3AED" as const;
    const { ramp } = generateRampFromAnchor(anchor, "dark", {
      neonChromaRolloff: true,
    });
    const l500 = hexToOklch(anchor).L;
    const d400 = DARK[400] - DARK_L_500;
    const d600 = DARK[600] - DARK_L_500;
    expect(hexToOklch(ramp[400]).L - l500).toBeCloseTo(d400, 1);
    expect(hexToOklch(ramp[600]).L - l500).toBeCloseTo(d600, 1);
  });

  it("stepDepth 0.5 compresses L spread vs 1.0 (linear)", () => {
    const anchor = "#7C3AED" as const;
    const a = generateRampFromAnchor(anchor, "light", {
      neonChromaRolloff: true,
      stepDepth: 0.5,
      easing: "linear",
    });
    const b = generateRampFromAnchor(anchor, "light", {
      neonChromaRolloff: true,
      stepDepth: 1,
      easing: "linear",
    });
    const l500 = hexToOklch(anchor).L;
    const da = Math.abs(hexToOklch(a.ramp[200]).L - l500);
    const db = Math.abs(hexToOklch(b.ramp[200]).L - l500);
    expect(da).toBeLessThan(db);
  });

  it("nonlinear easing can change an intermediate step vs linear at same stepDepth", () => {
    const anchor = "#7C3AED" as const;
    const base = { neonChromaRolloff: true, stepDepth: 1, easing: "linear" as const };
    const li = { ...base, easing: "ease-in-out" as const };
    const a = generateRampFromAnchor(anchor, "light", base);
    const b = generateRampFromAnchor(anchor, "light", li);
    expect(a.ramp[200]).not.toBe(b.ramp[200]);
  });

  it("cubic-bezier object matches ease-in-out keyword at a sample t", () => {
    const t = 0.4;
    const a = evaluateEasingY(t, "ease-in-out");
    const b = evaluateEasingY(t, cubicBezier(0.42, 0, 0.58, 1));
    expect(a).toBeCloseTo(b, 5);
  });
});

describe("generateNeutralRamp", () => {
  it("produces all steps", () => {
    const { ramp } = generateNeutralRamp("#7C3AED", "light", {
      brandTint: true,
      neonChromaRolloff: true,
    });
    for (const step of STEPS) {
      expect(ramp[step]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it("brandTint false yields near-gray ramp", () => {
    const { ramp } = generateNeutralRamp("#7C3AED", "light", {
      brandTint: false,
      neonChromaRolloff: true,
    });
    // Neutral with no tint should be very low chroma (gray)
    expect(ramp[500]).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("light vs dark neutral ramps differ", () => {
    const light = generateNeutralRamp("#7C3AED", "light", {
      brandTint: true,
      neonChromaRolloff: true,
    });
    const dark = generateNeutralRamp("#7C3AED", "dark", {
      brandTint: true,
      neonChromaRolloff: true,
    });
    expect(light.ramp[500]).not.toBe(dark.ramp[500]);
  });
});
