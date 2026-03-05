import { describe, it, expect } from "vitest";
import { generateSemanticTokens } from "../src/color-utils/semantic.js";
import { generateRampFromAnchor, generateNeutralRamp } from "../src/color-utils/ramp.js";

function makeRamps(anchor: string) {
  const brand1 = generateRampFromAnchor(anchor as `#${string}`, "light", {
    neonChromaRolloff: true,
  }).ramp;
  const neutral = generateNeutralRamp(anchor as `#${string}`, "light", {
    brandTint: true,
    neonChromaRolloff: true,
  }).ramp;
  return { brand1, neutral };
}

describe("generateSemanticTokens", () => {
  const semanticKeys = [
    "background",
    "foreground",
    "card",
    "card-foreground",
    "muted",
    "muted-foreground",
    "border",
    "input",
    "ring",
    "primary",
    "primary-foreground",
    "secondary",
    "secondary-foreground",
    "accent",
    "accent-foreground",
  ] as const;

  it("returns all semantic keys for light mode", () => {
    const ramps = makeRamps("#7C3AED");
    const tokens = generateSemanticTokens({
      mode: "light",
      ramps,
    });
    for (const key of semanticKeys) {
      expect(tokens[key]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it("returns all semantic keys for dark mode", () => {
    const brand1 = generateRampFromAnchor("#7C3AED", "dark", {
      neonChromaRolloff: true,
    }).ramp;
    const neutral = generateNeutralRamp("#7C3AED", "dark", {
      brandTint: true,
      neonChromaRolloff: true,
    }).ramp;
    const tokens = generateSemanticTokens({
      mode: "dark",
      ramps: { brand1, neutral },
    });
    for (const key of semanticKeys) {
      expect(tokens[key]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it("uses provided background and foreground when given", () => {
    const ramps = makeRamps("#7C3AED");
    const tokens = generateSemanticTokens({
      mode: "light",
      ramps,
      providedBackground: "#FFFFFF",
      providedForeground: "#171717",
    });
    // Provided values are used as-is (no normalization)
    expect(tokens.background).toBe("#FFFFFF");
    expect(tokens.foreground).toBe("#171717");
  });

  it("input equals border", () => {
    const ramps = makeRamps("#7C3AED");
    const tokens = generateSemanticTokens({ mode: "light", ramps });
    expect(tokens.input).toBe(tokens.border);
  });

  it("card-foreground equals foreground", () => {
    const ramps = makeRamps("#7C3AED");
    const tokens = generateSemanticTokens({ mode: "light", ramps });
    expect(tokens["card-foreground"]).toBe(tokens.foreground);
  });

  it("uses brand2 for secondary when present", () => {
    const ramps = makeRamps("#7C3AED");
    const brand2 = generateRampFromAnchor("#F59E0B", "light", {
      neonChromaRolloff: true,
    }).ramp;
    const tokens = generateSemanticTokens({
      mode: "light",
      ramps: { ...ramps, brand2 },
    });
    expect(tokens.secondary).toBeDefined();
  });

  it("accent falls through brand2 > brand3 > brand4 > brand1", () => {
    const ramps = makeRamps("#7C3AED");
    const brand3 = generateRampFromAnchor("#10B981", "light", {
      neonChromaRolloff: true,
    }).ramp;

    const withBrand3 = generateSemanticTokens({
      mode: "light",
      ramps: { ...ramps, brand3 },
    });
    expect(withBrand3.accent).toBe(brand3[500]);

    const withoutExtra = generateSemanticTokens({
      mode: "light",
      ramps,
    });
    expect(withoutExtra.accent).toBe(ramps.brand1[500]);
  });

  it("dark mode with provided overrides uses them", () => {
    const brand1 = generateRampFromAnchor("#7C3AED", "dark", {
      neonChromaRolloff: true,
    }).ramp;
    const neutral = generateNeutralRamp("#7C3AED", "dark", {
      brandTint: true,
      neonChromaRolloff: true,
    }).ramp;
    const tokens = generateSemanticTokens({
      mode: "dark",
      ramps: { brand1, neutral },
      providedBackground: "#0A0A0A",
      providedForeground: "#FAFAFA",
    });
    expect(tokens.background).toBe("#0A0A0A");
    expect(tokens.foreground).toBe("#FAFAFA");
  });
});
