/**
 * Minimal OKLab/OKLCH conversions (no external deps).
 * Accuracy is good enough for palette generation, but don't use this for space probes.
 */

import { HexColor } from "./types";

export type RGB = { r: number; g: number; b: number }; // 0..1 sRGB (gamma-encoded)
export type OKLab = { L: number; a: number; b: number };
export type OKLCH = { L: number; C: number; h: number }; // h in degrees

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const deg2rad = (d: number) => (d * Math.PI) / 180;
const rad2deg = (r: number) => (r * 180) / Math.PI;

export function hexToRgb(hex: HexColor): RGB {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return { r, g, b };
}

export function rgbToHex(rgb: RGB): HexColor {
  const toByte = (x: number) => Math.round(clamp01(x) * 255);
  const b2 = (n: number) => n.toString(16).padStart(2, "0");
  const r = b2(toByte(rgb.r));
  const g = b2(toByte(rgb.g));
  const b = b2(toByte(rgb.b));
  return `#${r}${g}${b}` as HexColor;
}

// sRGB <-> linear (0–1); exported for CVD simulation
export function srgbToLinear(x: number): number {
  return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
}
export function linearToSrgb(x: number): number {
  return x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
}

// linear sRGB -> OKLab
export function rgbToOklab(rgb: RGB): OKLab {
  const r = srgbToLinear(rgb.r);
  const g = srgbToLinear(rgb.g);
  const b = srgbToLinear(rgb.b);

  // linear sRGB -> LMS
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  return {
    L: 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  };
}

// OKLab -> linear sRGB
export function oklabToRgb(lab: OKLab): RGB {
  const l_ = lab.L + 0.3963377774 * lab.a + 0.2158037573 * lab.b;
  const m_ = lab.L - 0.1055613458 * lab.a - 0.0638541728 * lab.b;
  const s_ = lab.L - 0.0894841775 * lab.a - 1.291485548 * lab.b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  const rLin = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bLin = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  return {
    r: clamp01(linearToSrgb(rLin)),
    g: clamp01(linearToSrgb(gLin)),
    b: clamp01(linearToSrgb(bLin)),
  };
}

export function oklabToOklch(lab: OKLab): OKLCH {
  const C = Math.sqrt(lab.a * lab.a + lab.b * lab.b);
  let h = rad2deg(Math.atan2(lab.b, lab.a));
  if (h < 0) h += 360;
  return { L: lab.L, C, h };
}

export function oklchToOklab(lch: OKLCH): OKLab {
  const a = lch.C * Math.cos(deg2rad(lch.h));
  const b = lch.C * Math.sin(deg2rad(lch.h));
  return { L: lch.L, a, b };
}

export function hexToOklch(hex: HexColor): OKLCH {
  return oklabToOklch(rgbToOklab(hexToRgb(hex)));
}

export function oklchToHex(lch: OKLCH): HexColor {
  return rgbToHex(oklabToRgb(oklchToOklab(lch)));
}

export function rgbInGamut(rgb: RGB): boolean {
  return (
    rgb.r >= 0 &&
    rgb.r <= 1 &&
    rgb.g >= 0 &&
    rgb.g <= 1 &&
    rgb.b >= 0 &&
    rgb.b <= 1
  );
}

export function mixRgb(a: RGB, b: RGB, t: number): RGB {
  const u = 1 - t;
  return { r: a.r * u + b.r * t, g: a.g * u + b.g * t, b: a.b * u + b.b * t };
}
