import {
  PaletteConfig,
  PaletteInput,
  PaletteOptions,
  ModePalette,
  Ramp,
} from "./types";
import { resolveInputs } from "./resolve";
import { generateNeutralRamp, generateRampFromAnchor } from "./ramp";
import { generateSemanticTokens } from "./semantic";

export function generatePalette(
  input: PaletteInput,
  options?: PaletteOptions,
): PaletteConfig {
  const optionsUsed = {
    brandTint: options?.brandTint ?? true,
    neonChromaRolloff: options?.neonChromaRolloff ?? true,
  } as const;

  const resolved = resolveInputs(input, optionsUsed);

  const buildMode = (mode: "light" | "dark"): ModePalette => {
    const anchors = resolved.brand[mode];
    const warnings: string[] = [];
    let gamutClampsApplied = 0;

    const brandRamps: {
      brand1: Ramp;
      brand2?: Ramp;
      brand3?: Ramp;
      brand4?: Ramp;
    } = {} as any;

    const r1 = generateRampFromAnchor(anchors[0], mode, {
      neonChromaRolloff: optionsUsed.neonChromaRolloff,
    });
    brandRamps.brand1 = r1.ramp;
    gamutClampsApplied += r1.gamutClampsApplied;

    if (anchors[1]) {
      const r2 = generateRampFromAnchor(anchors[1], mode, {
        neonChromaRolloff: optionsUsed.neonChromaRolloff,
      });
      brandRamps.brand2 = r2.ramp;
      gamutClampsApplied += r2.gamutClampsApplied;
    }
    if (anchors[2]) {
      const r3 = generateRampFromAnchor(anchors[2], mode, {
        neonChromaRolloff: optionsUsed.neonChromaRolloff,
      });
      brandRamps.brand3 = r3.ramp;
      gamutClampsApplied += r3.gamutClampsApplied;
    }
    if (anchors[3]) {
      const r4 = generateRampFromAnchor(anchors[3], mode, {
        neonChromaRolloff: optionsUsed.neonChromaRolloff,
      });
      brandRamps.brand4 = r4.ramp;
      gamutClampsApplied += r4.gamutClampsApplied;
    }

    const neutralGen = generateNeutralRamp(anchors[0], mode, {
      brandTint: optionsUsed.brandTint,
      neonChromaRolloff: optionsUsed.neonChromaRolloff,
    });
    gamutClampsApplied += neutralGen.gamutClampsApplied;

    // semantic tokens
    const semantic = generateSemanticTokens({
      mode,
      ramps: { ...brandRamps, neutral: neutralGen.ramp },
      providedBackground: resolved.background[mode],
      providedForeground: resolved.foreground[mode],
    });

    // CVD variants: accepted but skipped (v1)
    if (options?.cvdVariants?.length) {
      warnings.push(
        `cvdVariants requested (${options.cvdVariants.join(", ")}), but not implemented in v1 — skipping.`,
      );
    }

    return {
      ramps: {
        ...brandRamps,
        neutral: neutralGen.ramp,
        gray: neutralGen.ramp, // alias values
      },
      semantic,
      meta: { warnings, gamutClampsApplied },
    };
  };

  const light = buildMode("light");
  const dark = buildMode("dark");

  const out: PaletteConfig = {
    version: "1.0.0",
    generatedAt: new Date().toISOString(),
    inputs: {
      brand: resolved.brand,
      background: resolved.background,
      foreground: resolved.foreground,
      optionsUsed,
      ...(resolved.schemeUsed ? { schemeUsed: resolved.schemeUsed } : {}),
    },
    modes: { light, dark },
  };

  // NOTE: not emitting `variants` yet; we warned above if requested.
  return out;
}

export * from "./types";
