/**
 * CVD (color vision deficiency) simulation using Brettel et al. 1997–style
 * matrices (adapted from libDaltonLens / jsColorblindSimulator). Transforms
 * colors to approximate how they appear to people with protanopia, deuteranopia,
 * or tritanopia.
 */

import {
  HexColor,
  CvdType,
  ModePalette,
  Ramp,
  SEMANTIC_KEYS,
  SemanticTokens,
} from "./types";
import { hexToRgb, rgbToHex, srgbToLinear, linearToSrgb } from "./okcolor";
import { STEPS, toRamp } from "./ramp";

// Brettel params: separation plane normal + two 3×3 matrices (linear RGB → simulated linear RGB).
// Which matrix is used depends on which side of the separation plane the color lies on.
const BRETTEL_PARAMS: Record<
  "protanopia" | "deuteranopia" | "tritanopia",
  {
    separationPlaneNormal: [number, number, number];
    rgbCvdFromRgb_1: number[];
    rgbCvdFromRgb_2: number[];
  }
> = {
  protanopia: {
    separationPlaneNormal: [0.00048, 0.00416, -0.00464],
    rgbCvdFromRgb_1: [
      0.1451, 1.20165, -0.34675, 0.10447, 0.85316, 0.04237, 0.00429, -0.00603,
      1.00174,
    ],
    rgbCvdFromRgb_2: [
      0.14115, 1.16782, -0.30897, 0.10495, 0.8573, 0.03776, 0.00431, -0.00586,
      1.00155,
    ],
  },
  deuteranopia: {
    separationPlaneNormal: [-0.00293, -0.00645, 0.00938],
    rgbCvdFromRgb_1: [
      0.36198, 0.86755, -0.22953, 0.26099, 0.64512, 0.09389, -0.01975, 0.02686,
      0.99289,
    ],
    rgbCvdFromRgb_2: [
      0.37009, 0.8854, -0.25549, 0.25767, 0.63782, 0.10451, -0.0195, 0.02741,
      0.99209,
    ],
  },
  tritanopia: {
    separationPlaneNormal: [0.0396, -0.02831, -0.01129],
    rgbCvdFromRgb_1: [
      1.01354, 0.14268, -0.15622, -0.01181, 0.87561, 0.13619, 0.07707, 0.81208,
      0.11085,
    ],
    rgbCvdFromRgb_2: [
      0.93337, 0.19999, -0.13336, 0.05809, 0.82565, 0.11626, -0.37923, 1.13825,
      0.24098,
    ],
  },
};

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}

/**
 * Simulate how a color appears to someone with the given CVD type.
 * Uses Brettel-style dichromat projection in linear RGB.
 */
export function simulateCvd(hex: HexColor, type: CvdType): HexColor {
  const params = BRETTEL_PARAMS[type];
  const rgb = hexToRgb(hex);
  const rL = srgbToLinear(rgb.r);
  const gL = srgbToLinear(rgb.g);
  const bL = srgbToLinear(rgb.b);

  const [nx, ny, nz] = params.separationPlaneNormal;
  const dot = rL * nx + gL * ny + bL * nz;
  const m = dot >= 0 ? params.rgbCvdFromRgb_1 : params.rgbCvdFromRgb_2;

  const rCvd = m[0] * rL + m[1] * gL + m[2] * bL;
  const gCvd = m[3] * rL + m[4] * gL + m[5] * bL;
  const bCvd = m[6] * rL + m[7] * gL + m[8] * bL;

  return rgbToHex({
    r: clamp01(linearToSrgb(rCvd)),
    g: clamp01(linearToSrgb(gCvd)),
    b: clamp01(linearToSrgb(bCvd)),
  });
}

function mapRamp(ramp: Ramp, type: CvdType): Ramp {
  const out: Partial<Ramp> = {};
  for (const step of STEPS) {
    out[step] = simulateCvd(ramp[step], type);
  }
  return toRamp(out);
}

function toSemanticTokens(partial: Partial<SemanticTokens>): SemanticTokens {
  return partial as SemanticTokens;
}

function mapSemantic(semantic: SemanticTokens, type: CvdType): SemanticTokens {
  const out: Partial<SemanticTokens> = {};
  for (const k of SEMANTIC_KEYS) {
    out[k] = simulateCvd(semantic[k], type);
  }
  return toSemanticTokens(out);
}

/**
 * Apply CVD simulation to every color in a mode palette. Returns a new
 * ModePalette with the same structure but simulated hex values.
 */
export function applyCvdToModePalette(
  mode: ModePalette,
  type: CvdType,
): ModePalette {
  const ramps: ModePalette["ramps"] = {
    brand1: mapRamp(mode.ramps.brand1, type),
    neutral: mapRamp(mode.ramps.neutral, type),
    gray: mapRamp(mode.ramps.neutral, type),
  };
  if (mode.ramps.brand2) ramps.brand2 = mapRamp(mode.ramps.brand2, type);
  if (mode.ramps.brand3) ramps.brand3 = mapRamp(mode.ramps.brand3, type);
  if (mode.ramps.brand4) ramps.brand4 = mapRamp(mode.ramps.brand4, type);

  return {
    ramps,
    semantic: mapSemantic(mode.semantic, type),
    meta: { ...mode.meta },
  };
}
