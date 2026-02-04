import { describe, it, expect } from "vitest";
import { deriveBrandFromScheme } from "../src/scheme.js";

describe("deriveBrandFromScheme", () => {
  it("monochromatic returns same-hue anchors with varying chroma", () => {
    const base = "#7C3AED" as const;
    const arr = deriveBrandFromScheme(base, { kind: "monochromatic" });
    expect(arr.length).toBe(2);
    expect(arr[0].toLowerCase()).toBe(base.toLowerCase());
    expect(arr[1]).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("adjacent returns 2 anchors with spread", () => {
    const arr = deriveBrandFromScheme("#7C3AED", {
      kind: "adjacent",
      spreadDegrees: 30,
    });
    expect(arr.length).toBe(2);
    expect(arr[0].toLowerCase()).toBe("#7c3aed");
    expect(arr[1]).toMatch(/^#[0-9a-f]{6}$/i);
    expect(arr[1]).not.toBe(arr[0]);
  });

  it("adjacent+complementary returns 3 anchors", () => {
    const arr = deriveBrandFromScheme("#7C3AED", {
      kind: "adjacent+complementary",
    });
    expect(arr.length).toBe(3);
  });

  it("triad returns 3 anchors 120° apart", () => {
    const arr = deriveBrandFromScheme("#7C3AED", { kind: "triad" });
    expect(arr.length).toBe(3);
  });

  it("tetrad returns 4 anchors", () => {
    const arr = deriveBrandFromScheme("#7C3AED", { kind: "tetrad" });
    expect(arr.length).toBe(4);
  });

  it("respects count override", () => {
    const arr = deriveBrandFromScheme("#7C3AED", {
      kind: "adjacent",
      count: 3,
    });
    expect(arr.length).toBe(3);
  });

  it("respects secondaryChromaScale", () => {
    const arrLow = deriveBrandFromScheme("#7C3AED", {
      kind: "adjacent",
      secondaryChromaScale: 0.5,
    });
    const arrHigh = deriveBrandFromScheme("#7C3AED", {
      kind: "adjacent",
      secondaryChromaScale: 1,
    });
    expect(arrLow.length).toBe(2);
    expect(arrHigh.length).toBe(2);
    // Second color should differ (lower scale = less chroma on secondary)
    expect(arrLow[1]).not.toBe(arrHigh[1]);
  });

  it("all returned values are valid hex", () => {
    const kinds = [
      "monochromatic",
      "adjacent",
      "adjacent+complementary",
      "triad",
      "tetrad",
    ] as const;
    for (const kind of kinds) {
      const arr = deriveBrandFromScheme("#7C3AED", { kind });
      for (const hex of arr) {
        expect(hex).toMatch(/^#[0-9a-f]{6}$/i);
      }
    }
  });
});
