import { HexColor, Ramp, SemanticTokens, Step } from "./types";
import { hexToRgb, mixRgb, rgbToHex } from "./okcolor";

function pickRamp(r: Ramp, step: Step): HexColor {
  return r[step];
}

function deriveBgFromPrimary(
  primary500: HexColor,
  mode: "light" | "dark",
): HexColor {
  const p = hexToRgb(primary500);
  const white = { r: 1, g: 1, b: 1 };
  const black = { r: 0, g: 0, b: 0 };
  // tiny tint, per our earlier policy
  const t = mode === "light" ? 0.06 : 0.1;
  const mixed = mode === "light" ? mixRgb(white, p, t) : mixRgb(black, p, t);
  return rgbToHex(mixed);
}

function deriveFgFromBg(
  _bg: HexColor,
  neutral: Ramp,
  mode: "light" | "dark",
): HexColor {
  // pragmatic: use neutral extremes. Tailwind-style.
  return mode === "light" ? pickRamp(neutral, 950) : pickRamp(neutral, 50);
}

export function generateSemanticTokens(params: {
  mode: "light" | "dark";
  ramps: {
    brand1: Ramp;
    brand2?: Ramp;
    brand3?: Ramp;
    brand4?: Ramp;
    neutral: Ramp;
  };
  providedBackground?: HexColor;
  providedForeground?: HexColor;
}): SemanticTokens {
  const { mode, ramps } = params;
  const neutral = ramps.neutral;

  const background =
    params.providedBackground ?? deriveBgFromPrimary(ramps.brand1[500], mode);
  const foreground =
    params.providedForeground ?? deriveFgFromBg(background, neutral, mode);

  const card =
    mode === "light" ? pickRamp(neutral, 50) : pickRamp(neutral, 900);
  const cardForeground = foreground;

  const muted =
    mode === "light" ? pickRamp(neutral, 100) : pickRamp(neutral, 800);
  const mutedForeground =
    mode === "light" ? pickRamp(neutral, 600) : pickRamp(neutral, 300);

  const border =
    mode === "light" ? pickRamp(neutral, 200) : pickRamp(neutral, 800);
  const input = border;

  const primary =
    mode === "light"
      ? pickRamp(ramps.brand1, 600)
      : pickRamp(ramps.brand1, 500);
  const primaryForeground =
    mode === "light" ? pickRamp(neutral, 50) : pickRamp(neutral, 950);

  const secondaryRamp = ramps.brand2 ?? ramps.brand1;
  const secondary =
    mode === "light"
      ? pickRamp(secondaryRamp, 600)
      : pickRamp(secondaryRamp, 500);
  const secondaryForeground = primaryForeground;

  // accent prefers brand2 then brand3 then brand4 then brand1
  const accentRamp =
    ramps.brand2 ?? ramps.brand3 ?? ramps.brand4 ?? ramps.brand1;
  const accent =
    mode === "light" ? pickRamp(accentRamp, 500) : pickRamp(accentRamp, 400);
  const accentForeground = primaryForeground;

  const ring =
    mode === "light"
      ? pickRamp(ramps.brand1, 400)
      : pickRamp(ramps.brand1, 300);

  return {
    background,
    foreground,

    card,
    "card-foreground": cardForeground,

    muted,
    "muted-foreground": mutedForeground,

    border,
    input,
    ring,

    primary,
    "primary-foreground": primaryForeground,

    secondary,
    "secondary-foreground": secondaryForeground,

    accent,
    "accent-foreground": accentForeground,
  };
}
