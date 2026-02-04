import {
  PaletteInput,
  PaletteOptions,
  BrandArray,
  HexColor,
  SchemeInput,
} from "./types";
import { assertBrandArray, assertHex6, normalizePerMode } from "./validate";
import { deriveBrandFromScheme } from "./scheme";

export function resolveInputs(
  input: PaletteInput,
  options: Required<Pick<PaletteOptions, "brandTint" | "neonChromaRolloff">>,
): {
  brand: { light: BrandArray; dark: BrandArray };
  background: { light?: HexColor; dark?: HexColor };
  foreground: { light?: HexColor; dark?: HexColor };
  schemeUsed?: {
    light: {
      kind: SchemeInput["kind"];
      base: HexColor;
      count: 1 | 2 | 3 | 4;
      spreadDegrees?: number;
      secondaryChromaScale?: number;
    };
    dark: {
      kind: SchemeInput["kind"];
      base: HexColor;
      count: 1 | 2 | 3 | 4;
      spreadDegrees?: number;
      secondaryChromaScale?: number;
    };
  };
} {
  const bg = normalizePerMode(input.background);
  const fg = normalizePerMode(input.foreground);

  if (bg.light) assertHex6(bg.light, "background.light");
  if (bg.dark) assertHex6(bg.dark, "background.dark");
  if (fg.light) assertHex6(fg.light, "foreground.light");
  if (fg.dark) assertHex6(fg.dark, "foreground.dark");

  if ("brand" in input) {
    const brandPM = normalizePerMode(input.brand);
    const lightArr = (brandPM.light ?? brandPM.dark) as any;
    const darkArr = (brandPM.dark ?? brandPM.light) as any;
    if (!lightArr || !darkArr)
      throw new Error(`brand is required (provide global or both modes)`);

    assertBrandArray(lightArr, "brand.light");
    assertBrandArray(darkArr, "brand.dark");

    return {
      brand: { light: lightArr as BrandArray, dark: darkArr as BrandArray },
      background: bg,
      foreground: fg,
    };
  }

  // scheme mode
  const scheme = input.scheme;
  const basePM = normalizePerMode(scheme.base);

  const lightBase = basePM.light ?? basePM.dark;
  const darkBase = basePM.dark ?? basePM.light;

  if (!lightBase || !darkBase) {
    throw new Error(
      `scheme.base must resolve to both light and dark (provide global or both modes)`,
    );
  }

  assertHex6(lightBase, "scheme.base.light");
  assertHex6(darkBase, "scheme.base.dark");

  const lightBrand = deriveBrandFromScheme(lightBase, scheme);
  const darkBrand = deriveBrandFromScheme(darkBase, scheme);

  return {
    brand: { light: lightBrand, dark: darkBrand },
    background: bg,
    foreground: fg,
    schemeUsed: {
      light: {
        kind: scheme.kind,
        base: lightBase,
        count: scheme.count ?? (lightBrand.length as any),
        spreadDegrees: scheme.spreadDegrees,
        secondaryChromaScale: scheme.secondaryChromaScale,
      },
      dark: {
        kind: scheme.kind,
        base: darkBase,
        count: scheme.count ?? (darkBrand.length as any),
        spreadDegrees: scheme.spreadDegrees,
        secondaryChromaScale: scheme.secondaryChromaScale,
      },
    },
  };
}
