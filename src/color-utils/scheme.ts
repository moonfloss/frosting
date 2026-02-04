import { BrandArray, HexColor, SchemeInput, SchemeKind } from "./types";
import { hexToOklch, oklchToHex, OKLCH } from "./okcolor";

function normHue(h: number): number {
  let x = h % 360;
  if (x < 0) x += 360;
  return x;
}

function defaultCount(kind: SchemeKind): 1 | 2 | 3 | 4 {
  switch (kind) {
    case "monochromatic":
      return 2;
    case "adjacent":
      return 2;
    case "adjacent+complementary":
      return 3;
    case "triad":
      return 3;
    case "tetrad":
      return 4;
    default:
      return 2;
  }
}

export function deriveBrandFromScheme(
  base: HexColor,
  scheme: SchemeInput,
): BrandArray {
  const lch = hexToOklch(base);
  const count = scheme.count ?? defaultCount(scheme.kind);
  const spread = scheme.spreadDegrees ?? 30;
  const chromaScale = scheme.secondaryChromaScale ?? 0.8;

  const offsets: number[] = (() => {
    switch (scheme.kind) {
      case "monochromatic":
        return [0, 0, 0, 0]; // hue same; we'll vary chroma a bit below
      case "adjacent":
        return [0, spread, -spread, 2 * spread];
      case "adjacent+complementary":
        return [0, spread, 180, -spread];
      case "triad":
        return [0, 120, 240, 0];
      case "tetrad":
        // rectangle tetrad: 0, +60, +180, +240
        return [0, 60, 180, 240];
      default:
        return [0, 0, 0, 0];
    }
  })();

  const anchors: HexColor[] = [];

  for (let i = 0; i < count; i++) {
    const off = offsets[i] ?? 0;
    const out: OKLCH = { ...lch, h: normHue(lch.h + off) };

    // dominance rule: primary stays strongest chroma
    if (i > 0) out.C = out.C * chromaScale;

    // monochromatic: same hue but different chroma "intensity"
    if (scheme.kind === "monochromatic") {
      const monoScales = [1.0, 0.85, 0.7, 0.55];
      out.C = out.C * (monoScales[i] ?? 0.7);
    }

    anchors.push(oklchToHex(out));
  }

  return toBrandArray(anchors);
}

function toBrandArray(colors: HexColor[]): BrandArray {
  if (colors.length < 1 || colors.length > 4) {
    throw new Error(`Expected 1–4 colors, got ${colors.length}`);
  }
  return colors as BrandArray;
}
