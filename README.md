# 🧁 frosting

**frosting** generates structured, deterministic color palettes from a small set of inputs. You get ramps, semantic tokens, and optional palette variants.

---

## What it does

- Generates design-system-friendly ramps (50–950)
- Produces light and dark mode palettes
- Outputs semantic tokens (background, foreground, primary, etc.)
- Supports 1–4 brand colors
- Optional color-theory-derived palettes
  - monochromatic
  - adjacent
  - adjacent + complementary
  - triad
  - tetrad
- Optional color-vision-deficiency variants
- Deterministic output (same input → same output)
- Pure JSON output

---

## Install

```bash
npm install frosting
```

---

## Quick start

```ts
import { generatePalette } from "frosting";

const palette = generatePalette({
  brand: ["#7C3AED", "#F59E0B"],
});

console.log(palette);
```

You now have:

- brand ramps
- neutral/gray ramps
- semantic tokens
- light/dark modes
- metadata about any adjustments

---

## Basic usage

### Explicit brand colors

```ts
generatePalette({
  brand: ["#7C3AED"],
});
```

1–4 colors allowed. Order matters. First color = primary.

User-provided brand colors are never modified.

---

### Scheme-derived palettes (opt-in)

```ts
generatePalette({
  scheme: {
    base: "#7C3AED",
    kind: "triad",
  },
});
```

Supported schemes:

- monochromatic
- adjacent
- adjacent+complementary
- triad
- tetrad

This only derives the brand anchors. Ramp generation stays consistent.

---

### Per-mode overrides

```ts
generatePalette({
  brand: {
    light: ["#7C3AED"],
    dark: ["#A78BFA"],
  },
  background: {
    light: "#FFFFFF",
    dark: "#0B0B0C",
  },
});
```

If background/foreground aren’t provided, frosting derives them from the primary brand color with a subtle tint.

---

### Color blindness variants

```ts
generatePalette(input, {
  cvdVariants: ["deuteranopia"],
});
```

Supported:

- protanopia
- deuteranopia
- tritanopia

These variants try to keep key colors distinguishable under simulation. Helpful, not perfect.

---

## Output shape (simplified)

```ts
{
  version,
  generatedAt,

  inputs: {...},

  modes: {
    light: {
      ramps: {
        brand1,
        brand2?,
        neutral,
        gray
      },
      semantic: {...},
      meta: {...}
    },
    dark: {...}
  },

  variants?: {...}
}
```

`neutral` and `gray` map to the same ramp by design.
