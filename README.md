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

## CLI

`frosting` includes a small CLI for building and previewing palettes without writing code either by providing a JSON config or using the interactive prompt/answer method. The output prints to the console with color swatches with the option to write to an output file.

Run it with:

```bash
npx frosting
# or
frosting
```

```
frosting <command> [options]
```

---

### Commands

| Command | What it does                                                  |
| ------- | ------------------------------------------------------------- |
| `init`  | Interactive wizard to create a palette config and preview it. |
| `gen`   | Generate a palette from a JSON config.                        |
| `help`  | Show usage.                                                   |

---

## `frosting init`

Guided setup for a palette.  
You answer a few questions (brand vs scheme, light/dark, options), and frosting:

- builds a valid config
- shows you the JSON
- previews the palette with real terminal colors

You can optionally save the config for later.

**Options**

- `--out <file.json>` — Save the **input config** for reuse.
- `--mode light|dark|both` — Configure only certain modes (default: `both`).

**Examples**

```bash
frosting init
frosting init --out palette-input.json
frosting init --mode light --out light.json
```

---

## `frosting gen`

Generate a full palette from a saved config.

Prints JSON to stdout so you can pipe it into other tools.

**Options**

- `--input <file.json>` — (required) Input config file.
- `--out <file.json>` — Also write palette JSON to a file.
- `--pretty` — Pretty-print JSON.
- `--swatches` — Show a color preview in your terminal.
- `--only light|dark` — Limit swatch preview to one mode.

**Examples**

```bash
frosting gen --input palette-input.json
frosting gen --input palette-input.json --swatches
frosting gen --input palette-input.json --out palette.json --pretty
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
