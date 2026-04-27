/**
 * CSS-compatible cubic timing curves: y at a given x on the (0,0)–(1,1) cubic Bézier.
 * Control points use the same x1,y1,x2,y2 as `cubic-bezier()` in CSS.
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/easing-function
 */

export type EasingOption =
  | "linear"
  | "ease"
  | "ease-in"
  | "ease-out"
  | "ease-in-out"
  | { type: "cubic-bezier"; x1: number; y1: number; x2: number; y2: number };

/** CSS keyword easings (dropdowns / palette options). */
export const EASING_KEYWORDS = [
  "linear",
  "ease",
  "ease-in",
  "ease-out",
  "ease-in-out",
] as const;

export type EasingKeyword = (typeof EASING_KEYWORDS)[number];

/** Control points (x1, y1, x2, y2) for CSS named cubic easings. */
const KEYWORD_TO_CP: Record<
  Exclude<EasingOption, { type: "cubic-bezier" }>,
  readonly [number, number, number, number]
> = {
  // identity
  linear: [0, 0, 1, 1],
  // default ease in CSS; MDN: cubic-bezier(0.25, 0.1, 0.25, 1)
  ease: [0.25, 0.1, 0.25, 1],
  "ease-in": [0.42, 0, 1, 1],
  "ease-out": [0, 0, 0.58, 1],
  "ease-in-out": [0.42, 0, 0.58, 1],
};

function bezier1D(
  t: number,
  p0: number,
  p1: number,
  p2: number,
  p3: number,
): number {
  const o = 1 - t;
  return o * o * o * p0 + 3 * o * o * t * p1 + 3 * o * t * t * p2 + t * t * t * p3;
}

function bezierX(t: number, x1: number, x2: number): number {
  return bezier1D(t, 0, x1, x2, 1);
}

function bezierY(t: number, y1: number, y2: number): number {
  return bezier1D(t, 0, y1, y2, 1);
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

/**
 * y(x) for a CSS cubic timing function (Bézier from (0,0) to (1,1)).
 * `linear` is handled by callers (identity); this throws or should not be called for pure linear
 * in the [0,0,1,1] case if we use fast path. For [0,0,1,1], y=x.
 */
export function cubicBezierYAtX(
  x: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  const xc = clamp01(x);
  if (xc === 0) return 0;
  if (xc === 1) return 1;
  if (x1 === 0 && y1 === 0 && x2 === 1 && y2 === 1) return xc;

  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 64; i++) {
    const mid = (lo + hi) / 2;
    if (bezierX(mid, x1, x2) < xc) lo = mid;
    else hi = mid;
  }
  const t = (lo + hi) / 2;
  return bezierY(t, y1, y2);
}

export function resolveEasingControlPoints(
  easing: EasingOption,
): readonly [number, number, number, number] {
  if (easing === "linear") {
    return [0, 0, 1, 1] as const;
  }
  if (typeof easing === "object" && easing.type === "cubic-bezier") {
    return [easing.x1, easing.y1, easing.x2, easing.y2] as const;
  }
  return KEYWORD_TO_CP[
    easing as keyof typeof KEYWORD_TO_CP
  ] as readonly [number, number, number, number];
}

/**
 * f(t) = t for linear; else cubic-bezier y at x = t.
 */
export function evaluateEasingY(
  t: number,
  easing: EasingOption,
): number {
  const x = clamp01(t);
  if (easing === "linear") return x;
  const [x1, y1, x2, y2] = resolveEasingControlPoints(easing);
  return cubicBezierYAtX(x, x1, y1, x2, y2);
}

/**
 * Warps the effective progress: weight = f(t) / t (t &gt; 0). For linear, 1.
 */
export function easingWeightAtT(
  t: number,
  easing: EasingOption,
): number {
  if (t <= 0) return 1;
  if (easing === "linear") return 1;
  return evaluateEasingY(t, easing) / t;
}

export function cubicBezier(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): EasingOption {
  return { type: "cubic-bezier", x1, y1, x2, y2 };
}
