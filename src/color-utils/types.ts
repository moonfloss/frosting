export type HexColor = `#${string}`;

export type Step =
  | 50
  | 100
  | 200
  | 300
  | 400
  | 500
  | 600
  | 700
  | 800
  | 900
  | 950;

export type Ramp = Record<Step, HexColor>;

export type BrandArray =
  | [HexColor]
  | [HexColor, HexColor]
  | [HexColor, HexColor, HexColor]
  | [HexColor, HexColor, HexColor, HexColor];

/** Length of a BrandArray (1–4). */
export type BrandCount = 1 | 2 | 3 | 4;

export type PerMode<T> = {
  light?: T;
  dark?: T;
};

export type SchemeKind =
  | "monochromatic"
  | "adjacent"
  | "adjacent+complementary"
  | "triad"
  | "tetrad";

export interface SchemeInput {
  base: HexColor | PerMode<HexColor>;
  kind: SchemeKind;
  count?: 1 | 2 | 3 | 4;
  spreadDegrees?: number; // default 30 for adjacent schemes
  secondaryChromaScale?: number; // default 0.8
}

export type CvdType = "protanopia" | "deuteranopia" | "tritanopia";

export type PaletteInput =
  | {
      brand: BrandArray | PerMode<BrandArray>;
      background?: HexColor | PerMode<HexColor>;
      foreground?: HexColor | PerMode<HexColor>;
      scheme?: never;
    }
  | {
      scheme: SchemeInput;
      background?: HexColor | PerMode<HexColor>;
      foreground?: HexColor | PerMode<HexColor>;
      brand?: never;
    };

export interface PaletteOptions {
  brandTint?: boolean; // default true
  neonChromaRolloff?: boolean; // default true
  cvdVariants?: CvdType[]; // protanopia, deuteranopia, tritanopia — simulated palettes in config.variants
  version?: string; // user-controlled palette version, defaults to "1.0.0"
}

export interface SemanticTokens {
  background: HexColor;
  foreground: HexColor;

  card: HexColor;
  "card-foreground": HexColor;

  muted: HexColor;
  "muted-foreground": HexColor;

  border: HexColor;
  input: HexColor;
  ring: HexColor;

  primary: HexColor;
  "primary-foreground": HexColor;

  secondary: HexColor;
  "secondary-foreground": HexColor;

  accent: HexColor;
  "accent-foreground": HexColor;
}

export interface ModePalette {
  ramps: {
    brand1: Ramp;
    brand2?: Ramp;
    brand3?: Ramp;
    brand4?: Ramp;

    neutral: Ramp;
    gray: Ramp; // same values as neutral
  };

  semantic: SemanticTokens;

  meta: {
    warnings: string[];
    gamutClampsApplied: number;
  };
}

export interface PaletteVariant {
  kind: "cvd";
  type: CvdType;
  modes: { light: ModePalette; dark: ModePalette };
  meta: { notes: string[] };
}

export interface PaletteConfig {
  version: string;

  inputs: {
    brand: { light: BrandArray; dark: BrandArray };
    background: { light?: HexColor; dark?: HexColor };
    foreground: { light?: HexColor; dark?: HexColor };
    optionsUsed: Required<
      Pick<PaletteOptions, "brandTint" | "neonChromaRolloff">
    >;
    schemeUsed?: {
      light: {
        kind: SchemeKind;
        base: HexColor;
        count: 1 | 2 | 3 | 4;
        spreadDegrees?: number;
        secondaryChromaScale?: number;
      };
      dark: {
        kind: SchemeKind;
        base: HexColor;
        count: 1 | 2 | 3 | 4;
        spreadDegrees?: number;
        secondaryChromaScale?: number;
      };
    };
  };

  modes: { light: ModePalette; dark: ModePalette };

  variants?: Record<string, PaletteVariant>;
}
