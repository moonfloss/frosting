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
- **Tailwind theming**: CSS custom properties, theme config object, and a Tailwind plugin (see [Tailwind](#tailwind))

---

## Install

```bash
npm install frosting
```

---

## CLI

`frosting` includes a small CLI: use **wizard** for an interactive setup, or **config:filepath** to read a config from a file. Output goes to stdout (use `> file` to save).

```bash
npx frosting
# or
frosting
```

Run `frosting` or `frosting help` to see usage.

**Options**

| Option | What it does |
| ------ | ------------ |
| `wizard` | Use prompt/answer wizard (if not present, read config from `config:filepath`). |
| `config:filepath` | Read config from filepath (when not using wizard). |
| `exclude:list` | Comma-separated variants to exclude: `light`, `dark`, `cvd`, or `cvd:name1,name2`. |
| `only:list` | Comma-separated variants to include (opposite of exclude). |
| `css:path` / `css path` | Write CSS custom properties (Tailwind theming vars) to the given file. |
| `filepath1 > filepath2` | Write config to filepath1, write result to filepath2 (if absent, print only). |

---

### Wizard mode

`frosting wizard` — Interactive guided setup. You answer questions (brand vs scheme, light/dark, options); frosting builds a config, shows the JSON, and previews the palette.

Use **filepath > filepath** to write both: first path = where to write the config, redirect = where to write the palette.

```bash
frosting wizard
frosting wizard config.json > palette.json
frosting wizard exclude:dark only:light
```

---

### Config from file

`frosting config:filepath` — Read config from the given file, generate palette to stdout. Use `> palette.json` to save the result.

```bash
frosting config:input.json
frosting config:input.json > palette.json
frosting config:input.json css palette-vars.css
frosting config:input.json css:palette-vars.css > palette.json
frosting config:input.json exclude:cvd
frosting config:input.json exclude:cvd:protanopia,deuteranopia
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
- all

Pass one or more types in `cvdVariants`; the palette is simulated (Brettel-style) for each type and emitted as `config.variants[type]` (e.g. `config.variants.deuteranopia`), with the same structure as `modes` (light/dark ramps and semantic tokens).

---

## Tailwind

The **frosting/tailwind** export provides Tailwind-themed output from a `PaletteConfig`: CSS custom properties, a theme config object, and a Tailwind plugin. All tokens use prefixed names: `{mode}-{variant}-{token}` (e.g. `light-default-background`, `dark-protanopia-primary`).

**Peer dependency:** `tailwindcss` >= 3.

### CSS custom properties

```ts
import { generatePalette } from "frosting";
import { generateCssVars } from "frosting/tailwind";

const palette = generatePalette({ brand: ["#7C3AED"] });
const css = generateCssVars(palette);
// Write to a file and import in your app, or use the plugin (below)
```

### Tailwind theme config

```ts
import { generateTailwindTheme } from "frosting/tailwind";

const theme = generateTailwindTheme(palette);
// theme.extend in tailwind.config:
export default {
  theme: { extend: theme },
};
```

### Tailwind plugin (CSS vars + theme in one go)

```ts
import { frostingPlugin } from "frosting/tailwind";

export default {
  plugins: [frostingPlugin(palette)],
};
```

Then use utilities like `bg-light-default-background`, `text-dark-default-primary`, or ramp shades like `bg-light-default-brand1-500`.

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
