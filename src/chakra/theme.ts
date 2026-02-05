import type { PaletteConfig, SemanticTokens } from "../index";
import { STEPS } from "../index";
import type { ChakraThemeOptions } from "./types";

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

function getSemanticAndRamps(
  config: PaletteConfig,
  mode: Mode,
  variant: string,
): { semantic: SemanticTokens; ramps: PaletteConfig["modes"]["light"]["ramps"] } {
  if (variant === "default") {
    return {
      semantic: config.modes[mode].semantic,
      ramps: config.modes[mode].ramps,
    };
  }
  const v = config.variants?.[variant];
  if (v?.kind === "cvd") {
    return {
      semantic: v.modes[mode].semantic,
      ramps: v.modes[mode].ramps,
    };
  }
  return {
    semantic: config.modes[mode].semantic,
    ramps: config.modes[mode].ramps,
  };
}

function applyPrefix(prefix: string | undefined, key: string): string {
  return prefix ? `${prefix}-${key}` : key;
}

/** Chakra v2 extendTheme-compatible theme extension (colors + semanticTokens). */
export interface ChakraThemeExtension {
  colors: Record<string, Record<number, string>>;
  semanticTokens: {
    colors: Record<
      string,
      { default: string; _dark: string }
    >;
  };
}

/**
 * Returns a plain object suitable for Chakra UI v2 extendTheme().
 * Uses the given CVD variant if options.variant is set; otherwise default mode ramps/semantic.
 */
export function generateChakraTheme(
  config: PaletteConfig,
  options?: ChakraThemeOptions,
): ChakraThemeExtension {
  const variant = options?.variant ?? "default";
  const includeRamps = options?.includeRamps ?? true;
  const includeSemantic = options?.includeSemantic ?? true;
  const prefix = options?.prefix;

  const light = getSemanticAndRamps(config, "light", variant);
  const dark = getSemanticAndRamps(config, "dark", variant);

  const colors: Record<string, Record<number, string>> = {};
  if (includeRamps) {
    for (const rampName of RAMP_NAMES) {
      const ramp = light.ramps[rampName as keyof typeof light.ramps];
      if (!ramp) continue;
      const key = applyPrefix(prefix, rampName);
      const scale: Record<number, string> = {};
      for (const step of STEPS) {
        scale[step] = ramp[step];
      }
      colors[key] = scale;
    }
  }

  const semanticColors: Record<
    string,
    { default: string; _dark: string }
  > = {};
  if (includeSemantic) {
    for (const key of SEMANTIC_KEYS) {
      const themeKey = applyPrefix(prefix, key);
      semanticColors[themeKey] = {
        default: light.semantic[key],
        _dark: dark.semantic[key],
      };
    }
  }

  return {
    colors,
    semanticTokens: {
      colors: semanticColors,
    },
  };
}

/**
 * Returns an object mapping ramp names to their theme color key (for use with colorScheme).
 * Example: { brand1: "brand1", brand2: "brand2" } or with prefix { brand1: "frosting-brand1", ... }.
 */
export function getChakraColorSchemes(
  config: PaletteConfig,
  options?: Pick<ChakraThemeOptions, "prefix">,
): Record<string, string> {
  const prefix = options?.prefix;
  const schemes: Record<string, string> = {};
  const ramps = config.modes.light.ramps;
  for (const rampName of RAMP_NAMES) {
    if (ramps[rampName as keyof typeof ramps]) {
      schemes[rampName] = applyPrefix(prefix, rampName);
    }
  }
  return schemes;
}
