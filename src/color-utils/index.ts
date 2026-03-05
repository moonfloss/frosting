import {
  PaletteConfig,
  PaletteInput,
  PaletteOptions,
  ModePalette,
  Ramp,
  PaletteVariant,
} from "./types";
import { resolveInputs } from "./resolve";
import { generateNeutralRamp, generateRampFromAnchor } from "./ramp";
import { generateSemanticTokens } from "./semantic";
import { applyCvdToModePalette } from "./cvd";

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
    } = {} as {
      brand1: Ramp;
      brand2?: Ramp;
      brand3?: Ramp;
      brand4?: Ramp;
    };

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

    const semantic = generateSemanticTokens({
      mode,
      ramps: { ...brandRamps, neutral: neutralGen.ramp },
      providedBackground: resolved.background[mode],
      providedForeground: resolved.foreground[mode],
    });

    return {
      ramps: {
        ...brandRamps,
        neutral: neutralGen.ramp,
        gray: neutralGen.ramp,
      },
      semantic,
      meta: { warnings, gamutClampsApplied },
    };
  };

  const light = buildMode("light");
  const dark = buildMode("dark");

  const variants: Record<string, PaletteVariant> | undefined =
    options?.cvdVariants?.length ? {} : undefined;

  if (variants) {
    for (const type of options!.cvdVariants!) {
      variants[type] = {
        kind: "cvd",
        type,
        modes: {
          light: applyCvdToModePalette(light, type),
          dark: applyCvdToModePalette(dark, type),
        },
        meta: { notes: [] },
      };
    }
  }

  const out: PaletteConfig = {
    version: options?.version ?? "1.0.0",
    inputs: {
      brand: resolved.brand,
      background: resolved.background,
      foreground: resolved.foreground,
      optionsUsed,
      ...(resolved.schemeUsed ? { schemeUsed: resolved.schemeUsed } : {}),
    },
    modes: { light, dark },
    ...(variants ? { variants } : {}),
  };

  return out;
}

export * from "./types";
export { STEPS } from "./ramp";
export { assertBrandArray } from "./validate";
