import type { PaletteConfig, SemanticTokens } from "../index";
import { STEPS } from "../index";

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

/**
 * Returns a style object mapping --active-* to var(--{mode}-{variant}-*)
 * for use on the root element when toggling mode/variant.
 */
export function getActiveVarStyle(
  mode: Mode,
  variant: string,
  config: PaletteConfig,
): Record<string, string> {
  const { ramps } = getSemanticAndRamps(config, mode, variant);
  const prefix = `${mode}-${variant}`;
  const style: Record<string, string> = {};

  for (const key of SEMANTIC_KEYS) {
    style[`--active-${key}`] = `var(--${prefix}-${key})`;
  }

  for (const rampName of RAMP_NAMES) {
    const ramp = ramps[rampName as keyof typeof ramps];
    if (!ramp) continue;
    for (const step of STEPS) {
      style[`--active-${rampName}-${step}`] = `var(--${prefix}-${rampName}-${step})`;
    }
  }

  return style;
}

type ShadeObject = Record<number, string>;

/**
 * Returns a Tailwind theme.extend.colors object for active-* so that
 * classes like bg-active-background, text-active-primary, bg-active-brand1-500 work.
 */
export function getActiveColorTheme(): Record<string, string | ShadeObject> {
  const colors: Record<string, string | ShadeObject> = {};

  for (const key of SEMANTIC_KEYS) {
    colors[`active-${key}`] = `var(--active-${key})`;
  }

  for (const rampName of RAMP_NAMES) {
    const shadeObj: ShadeObject = {};
    for (const step of STEPS) {
      shadeObj[step] = `var(--active-${rampName}-${step})`;
    }
    colors[`active-${rampName}`] = shadeObj;
  }

  return colors;
}
