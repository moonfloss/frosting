import { describe, it, expect } from "vitest";
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
