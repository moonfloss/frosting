import type { PaletteConfig, SemanticTokens } from "../index";
import { STEPS } from "../index";
import type { TailwindThemeOptions } from "./types";

const SEMANTIC_KEYS: (keyof SemanticTokens)[] = [
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
];

const RAMP_NAMES = ["brand1", "brand2", "brand3", "brand4", "neutral"] as const;

type Mode = "light" | "dark";

type ShadeObject = Record<number, string>;

function addColorsForMode(
  colors: Record<string, string | ShadeObject>,
  mode: Mode,
  variant: string,
  _semantic: SemanticTokens,
  ramps: PaletteConfig["modes"]["light"]["ramps"],
  options: Required<Pick<TailwindThemeOptions, "includeSemantic" | "includeRamps">>,
): void {
  const prefix = `${mode}-${variant}`;

  if (options.includeSemantic) {
    for (const key of SEMANTIC_KEYS) {
      const themeKey = `${prefix}-${key}`;
      colors[themeKey] = `var(--${prefix}-${key})`;
    }
  }

  if (options.includeRamps) {
    for (const rampName of RAMP_NAMES) {
      const ramp = ramps[rampName as keyof typeof ramps];
      if (!ramp) continue;
      const themeKey = `${prefix}-${rampName}`;
      const shadeObj: ShadeObject = {};
      for (const step of STEPS) {
        shadeObj[step] = `var(--${prefix}-${rampName}-${step})`;
      }
      colors[themeKey] = shadeObj;
    }
  }
}

export function generateTailwindTheme(
  config: PaletteConfig,
  options?: TailwindThemeOptions,
): { colors: Record<string, string | ShadeObject> } {
  const includeRamps = options?.includeRamps ?? true;
  const includeSemantic = options?.includeSemantic ?? true;
  const opts = { includeRamps, includeSemantic };

  const colors: Record<string, string | ShadeObject> = {};

  const defaultVariant = "default";
  addColorsForMode(
    colors,
    "light",
    defaultVariant,
    config.modes.light.semantic,
    config.modes.light.ramps,
    opts,
  );
  addColorsForMode(
    colors,
    "dark",
    defaultVariant,
    config.modes.dark.semantic,
    config.modes.dark.ramps,
    opts,
  );

  if (config.variants) {
    for (const [variantName, variant] of Object.entries(config.variants)) {
      if (variant.kind !== "cvd") continue;
      addColorsForMode(
        colors,
        "light",
        variantName,
        variant.modes.light.semantic,
        variant.modes.light.ramps,
        opts,
      );
      addColorsForMode(
        colors,
        "dark",
        variantName,
        variant.modes.dark.semantic,
        variant.modes.dark.ramps,
        opts,
      );
    }
  }

  return { colors };
}
