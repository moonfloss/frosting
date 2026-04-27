import type { EasingOption } from "./easing";
import { easingWeightAtT } from "./easing";
import { HexColor, Ramp, Step } from "./types";
import {
  hexToOklch,
  oklchToHex,
  oklchToOklab,
  oklabToRgb,
  rgbInGamut,
  OKLCH,
} from "./okcolor";

export const STEPS: Step[] = [
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
];

/** Build a Ramp from a partial that has every step filled (by construction). */
export function toRamp(partial: Partial<Ramp>): Ramp {
  for (const step of STEPS) {
    if (partial[step] == null) {
      throw new Error(`Missing ramp step: ${step}`);
    }
  }
  return partial as Ramp;
}

// Tailwind-ish lightness targets (per mode) for nice UI ramps.
// These are "taste defaults," not the One True Curve™.
const LIGHT_L: Record<Step, number> = {
  50: 0.985,
  100: 0.965,
  200: 0.93,
  300: 0.885,
  400: 0.83,
  500: 0.7,
  600: 0.6,
  700: 0.5,
  800: 0.4,
  900: 0.3,
  950: 0.22,
};

const DARK_L: Record<Step, number> = {
  50: 0.96,
  100: 0.93,
  200: 0.86,
  300: 0.78,
  400: 0.7,
  500: 0.62,
  600: 0.54,
  700: 0.46,
  800: 0.38,
  900: 0.3,
  950: 0.22,
};

function rolloffFactor(step: Step): number {
  // Reduce chroma toward extremes so neons don't clip into oblivion.
  // 500 -> 1.0, far steps -> smaller.
  const idx = STEPS.indexOf(step);
  const center = STEPS.indexOf(500);
  const d = Math.abs(idx - center) / center; // 0..1-ish
  // smooth-ish curve
  return Math.max(0.35, 1 - 0.85 * d * d);
}

function clampToGamutByReducingChroma(
  lch: OKLCH,
  maxIter = 24,
): { lch: OKLCH; clamped: boolean } {
  // If out of gamut, binary-search chroma down until in gamut.
  const rgb0 = oklabToRgb(oklchToOklab(lch));
  if (rgbInGamut(rgb0)) return { lch, clamped: false };

  let lo = 0;
  let hi = lch.C;
  let best = { ...lch, C: 0 };

  for (let i = 0; i < maxIter; i++) {
    const mid = (lo + hi) / 2;
    const test = { ...lch, C: mid };
    const rgb = oklabToRgb(oklchToOklab(test));
    if (rgbInGamut(rgb)) {
      best = test;
      lo = mid;
    } else {
      hi = mid;
    }
  }

  return { lch: best, clamped: true };
}

// OKLCH L is defined on roughly (0, 1); keep a small margin for hex round-trip.
const L_EPS = 1e-4;

function clampOklchLightness(L: number): number {
  return Math.min(1 - L_EPS, Math.max(L_EPS, L));
}

/** Normalized index distance 500 → edge: t=1 at 50 or 950, (0,1) between. */
function legProgressTFrom500(step: Step): number {
  const i = STEPS.indexOf(step);
  const i500 = STEPS.indexOf(500);
  if (i < i500) return (i500 - i) / i500;
  if (i > i500) {
    return (i - i500) / (STEPS.length - 1 - i500);
  }
  return 0;
}

export type RampFromAnchorOpts = {
  neonChromaRolloff: boolean;
  stepDepth?: number;
  easing?: EasingOption;
};

export function generateRampFromAnchor(
  anchor: HexColor,
  mode: "light" | "dark",
  opts: RampFromAnchorOpts,
): { ramp: Ramp; gamutClampsApplied: number } {
  const stepDepth = opts.stepDepth ?? 1;
  const easing = opts.easing ?? "linear";
  const base = hexToOklch(anchor);
  const Lmap = mode === "light" ? LIGHT_L : DARK_L;
  // Center the L ladder on the anchor: same step-to-step deltas as Lmap, but
  // 400/600/etc. are offset from base.L, not Lmap[500] (rarely equal to the hex).
  const Lref = Lmap[500];

  let gamutClampsApplied = 0;
  const out: Partial<Ramp> = {};

  for (const step of STEPS) {
    if (step === 500) {
      out[step] = anchor; // sacred anchor
      continue;
    }

    const t = legProgressTFrom500(step);
    const w = easingWeightAtT(t, easing);

    // Affine shift so neighbors match design-system L gaps from the *actual* 500.
    // Very light/dark anchors can push L out of (0,1); clamping may compress an end
    // of the ramp (steps pile at min/max L) but keeps valid colors.
    const targetL = clampOklchLightness(
      base.L + (Lmap[step] - Lref) * stepDepth * w,
    );
    let C = base.C;

    if (opts.neonChromaRolloff) {
      C = C * rolloffFactor(step);
    }

    const lch: OKLCH = { L: targetL, C, h: base.h };
    const { lch: clamped, clamped: didClamp } =
      clampToGamutByReducingChroma(lch);

    if (didClamp) gamutClampsApplied++;

    out[step] = oklchToHex(clamped);
  }

  return { ramp: toRamp(out), gamutClampsApplied };
}

export type NeutralRampOpts = {
  brandTint: boolean;
  neonChromaRolloff: boolean;
  stepDepth?: number;
  easing?: EasingOption;
};

export function generateNeutralRamp(
  primaryAnchor: HexColor,
  mode: "light" | "dark",
  opts: NeutralRampOpts,
): { ramp: Ramp; gamutClampsApplied: number } {
  const stepDepth = opts.stepDepth ?? 1;
  const easing = opts.easing ?? "linear";
  const p = hexToOklch(primaryAnchor);
  const Lmap = mode === "light" ? LIGHT_L : DARK_L;
  const LrefN = Lmap[500];

  // Neutral chroma should be tiny.
  const neutralHue = p.h;
  const baseC = opts.brandTint ? Math.min(0.03, p.C * 0.12) : 0;

  let gamutClampsApplied = 0;
  const out: Partial<Ramp> = {};

  for (const step of STEPS) {
    const t = legProgressTFrom500(step);
    const w = easingWeightAtT(t, easing);
    const targetL = clampOklchLightness(
      LrefN + (Lmap[step] - LrefN) * stepDepth * w,
    );
    // For neutrals, we keep chroma minimal and slightly roll off further at extremes.
    const C = baseC * (opts.neonChromaRolloff ? rolloffFactor(step) : 1);
    const lch: OKLCH = { L: targetL, C, h: neutralHue };
    const { lch: clamped, clamped: didClamp } =
      clampToGamutByReducingChroma(lch);
    if (didClamp) gamutClampsApplied++;
    out[step] = oklchToHex(clamped);
  }

  return { ramp: toRamp(out), gamutClampsApplied };
}
