import type {
  BrandArray,
  CvdType,
  HexColor,
  PaletteInput,
  PaletteOptions,
  SchemeKind,
} from "../index";

export type PaletteConfigFormInputMode = "brand" | "scheme";

export interface PaletteConfigFormValues {
  inputMode: PaletteConfigFormInputMode;
  brandColors: string[];
  schemeKind: SchemeKind;
  schemeBase: string;
  schemeCount: 1 | 2 | 3 | 4;
  spreadDegrees: number;
  secondaryChromaScale: number;
  backgroundLight: string;
  backgroundDark: string;
  foregroundLight: string;
  foregroundDark: string;
  brandTint: boolean;
  neonChromaRolloff: boolean;
  cvdVariants: CvdType[];
}

export type PaletteConfigFormInitialValues = Partial<PaletteConfigFormValues>;

export const SCHEME_KINDS: SchemeKind[] = [
  "monochromatic",
  "adjacent",
  "adjacent+complementary",
  "triad",
  "tetrad",
];

export const CVD_OPTIONS: CvdType[] = [
  "protanopia",
  "deuteranopia",
  "tritanopia",
];

export const DEFAULT_PALETTE_CONFIG_FORM_VALUES: PaletteConfigFormValues = {
  inputMode: "brand",
  brandColors: ["#6366f1"],
  schemeKind: "adjacent",
  schemeBase: "#6366f1",
  schemeCount: 2,
  spreadDegrees: 30,
  secondaryChromaScale: 0.8,
  backgroundLight: "",
  backgroundDark: "",
  foregroundLight: "",
  foregroundDark: "",
  brandTint: true,
  neonChromaRolloff: true,
  cvdVariants: [],
};

const HEX_REGEX = /^#[0-9a-fA-F]{6}$/;

export function parseHex(value: string): HexColor | null {
  const normalized = value.trim();
  if (!normalized) return null;
  const withHash = normalized.startsWith("#") ? normalized : `#${normalized}`;
  return HEX_REGEX.test(withHash) ? (withHash as HexColor) : null;
}

export function toBrandArray(colors: HexColor[]): BrandArray {
  if (colors.length === 1) return [colors[0]];
  if (colors.length === 2) return [colors[0], colors[1]];
  if (colors.length === 3) return [colors[0], colors[1], colors[2]];
  return [colors[0], colors[1], colors[2], colors[3]];
}

function normalizeBrandColors(colors?: string[]): string[] {
  const next = (colors ?? DEFAULT_PALETTE_CONFIG_FORM_VALUES.brandColors)
    .filter((color) => typeof color === "string")
    .slice(0, 4);
  return next.length > 0
    ? next
    : [...DEFAULT_PALETTE_CONFIG_FORM_VALUES.brandColors];
}

function normalizeCvdVariants(values?: CvdType[]): CvdType[] {
  if (!values?.length) return [];
  const allowed = new Set(CVD_OPTIONS);
  return [...new Set(values)].filter((value): value is CvdType =>
    allowed.has(value),
  );
}

export function mergePaletteConfigFormValues(
  initialValues?: PaletteConfigFormInitialValues,
): PaletteConfigFormValues {
  return {
    ...DEFAULT_PALETTE_CONFIG_FORM_VALUES,
    ...initialValues,
    brandColors: normalizeBrandColors(initialValues?.brandColors),
    cvdVariants: normalizeCvdVariants(initialValues?.cvdVariants),
  };
}

function normalizePerMode(lightRaw: string, darkRaw: string) {
  const light = parseHex(lightRaw);
  const dark = parseHex(darkRaw);
  if (!light && !dark) return undefined;
  return {
    ...(light && { light }),
    ...(dark && { dark }),
  };
}

export function valuesToPaletteInput(
  values: PaletteConfigFormValues,
): PaletteInput | null {
  const background = normalizePerMode(
    values.backgroundLight,
    values.backgroundDark,
  );
  const foreground = normalizePerMode(
    values.foregroundLight,
    values.foregroundDark,
  );

  if (values.inputMode === "brand") {
    const brandHexes = values.brandColors
      .map((color) => parseHex(color))
      .filter((color): color is HexColor => color != null);

    if (brandHexes.length < 1) return null;

    return {
      brand: toBrandArray(brandHexes),
      background,
      foreground,
    };
  }

  const schemeBase = parseHex(values.schemeBase);
  if (!schemeBase) return null;

  return {
    scheme: {
      kind: values.schemeKind,
      base: schemeBase,
      count: values.schemeCount,
      spreadDegrees: values.spreadDegrees,
      secondaryChromaScale: values.secondaryChromaScale,
    },
    background,
    foreground,
  };
}

export function valuesToPaletteOptions(
  values: PaletteConfigFormValues,
): PaletteOptions {
  return {
    brandTint: values.brandTint,
    neonChromaRolloff: values.neonChromaRolloff,
    cvdVariants: values.cvdVariants.length > 0 ? values.cvdVariants : undefined,
  };
}
