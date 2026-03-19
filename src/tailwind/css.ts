import type { PaletteConfig, SemanticTokens } from "../index";
import { RAMP_NAMES, SEMANTIC_KEYS, STEPS } from "../index";
import type { CssVarOptions } from "./types";

type Mode = "light" | "dark";

function emitVarsForMode(
  mode: Mode,
  variant: string,
  semantic: SemanticTokens,
  ramps: PaletteConfig["modes"]["light"]["ramps"],
  options: Required<Pick<CssVarOptions, "includeSemantic" | "includeRamps">>,
): string[] {
  const lines: string[] = [];
  const prefix = `${mode}-${variant}`;

  if (options.includeSemantic) {
    for (const key of SEMANTIC_KEYS) {
      const varName = `--${prefix}-${key}`;
      lines.push(`  ${varName}: ${semantic[key]};`);
    }
  }

  if (options.includeRamps) {
    for (const rampName of RAMP_NAMES) {
      const ramp = ramps[rampName as keyof typeof ramps];
      if (!ramp) continue;
      for (const step of STEPS) {
        lines.push(`  --${prefix}-${rampName}-${step}: ${ramp[step]};`);
      }
    }
  }

  return lines;
}

export function generateCssVars(
  config: PaletteConfig,
  options?: CssVarOptions,
): string {
  const selector = options?.selector ?? ":root";
  const includeRamps = options?.includeRamps ?? true;
  const includeSemantic = options?.includeSemantic ?? true;
  const opts = { includeRamps, includeSemantic };

  const lines: string[] = [`${selector} {`];

  // Default variant: config.modes.light, config.modes.dark
  const defaultVariant = "default";
  lines.push(
    ...emitVarsForMode(
      "light",
      defaultVariant,
      config.modes.light.semantic,
      config.modes.light.ramps,
      opts,
    ),
  );
  lines.push(
    ...emitVarsForMode(
      "dark",
      defaultVariant,
      config.modes.dark.semantic,
      config.modes.dark.ramps,
      opts,
    ),
  );

  // CVD variants
  if (config.variants) {
    for (const [variantName, variant] of Object.entries(config.variants)) {
      if (variant.kind !== "cvd") continue;
      lines.push(
        ...emitVarsForMode(
          "light",
          variantName,
          variant.modes.light.semantic,
          variant.modes.light.ramps,
          opts,
        ),
      );
      lines.push(
        ...emitVarsForMode(
          "dark",
          variantName,
          variant.modes.dark.semantic,
          variant.modes.dark.ramps,
          opts,
        ),
      );
    }
  }

  lines.push("}");
  return lines.join("\n");
}

/** Returns a style object suitable for Tailwind's addBase({ [selector]: vars }). */
export function getCssVarsForAddBase(
  config: PaletteConfig,
  options?: CssVarOptions,
): Record<string, Record<string, string>> {
  const selector = options?.selector ?? ":root";
  const includeRamps = options?.includeRamps ?? true;
  const includeSemantic = options?.includeSemantic ?? true;
  const opts = { includeRamps, includeSemantic };

  const vars: Record<string, string> = {};

  function addVars(
    mode: Mode,
    variant: string,
    semantic: SemanticTokens,
    ramps: PaletteConfig["modes"]["light"]["ramps"],
  ): void {
    const prefix = `${mode}-${variant}`;
    if (opts.includeSemantic) {
      for (const key of SEMANTIC_KEYS) {
        vars[`--${prefix}-${key}`] = semantic[key];
      }
    }
    if (opts.includeRamps) {
      for (const rampName of RAMP_NAMES) {
        const ramp = ramps[rampName as keyof typeof ramps];
        if (!ramp) continue;
        for (const step of STEPS) {
          vars[`--${prefix}-${rampName}-${step}`] = ramp[step];
        }
      }
    }
  }

  const defaultVariant = "default";
  addVars(
    "light",
    defaultVariant,
    config.modes.light.semantic,
    config.modes.light.ramps,
  );
  addVars(
    "dark",
    defaultVariant,
    config.modes.dark.semantic,
    config.modes.dark.ramps,
  );

  if (config.variants) {
    for (const [variantName, variant] of Object.entries(config.variants)) {
      if (variant.kind !== "cvd") continue;
      addVars(
        "light",
        variantName,
        variant.modes.light.semantic,
        variant.modes.light.ramps,
      );
      addVars(
        "dark",
        variantName,
        variant.modes.dark.semantic,
        variant.modes.dark.ramps,
      );
    }
  }

  return { [selector]: vars };
}
