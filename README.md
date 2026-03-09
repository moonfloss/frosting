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
- Deterministic output (same input and options → same output); use the config `version` field for versioning
- Pure JSON output
- **Tailwind theming**: CSS custom properties, theme config object, and a Tailwind plugin (see [Tailwind](#tailwind))
- **Chakra UI theming**: Theme extension for v2 with colors and semantic tokens (see [Chakra UI](#chakra-ui))

---

## Install

```bash
npm install frosting
```

---

## CLI

`frosting` includes a small CLI: use **wizard** (or `w`) for an interactive setup, or **config:path** (or `c:path`) to read a config from a file. Output goes to stdout (use `> file` to save).

```bash
npx frosting
# or
frosting
```

Run `frosting` or `frosting help` to see usage.

**Options**

| Option | What it does |
| ------ | ------------ |
| `wizard` / `w` | Use prompt/answer wizard (if not present, read config from `config:path`). |
| `config:path` / `c:path` | Read config from filepath (when not using wizard). |
| `exclude:list` / `e:list` | Comma-separated variants to exclude: `light`, `dark`, `cvd`, or `cvd:name1,name2`. |
| `only:list` / `o:list` | Comma-separated variants to include (opposite of exclude). |
| `css:path` / `css path` | Write CSS custom properties (Tailwind theming vars) to the given file. |
| `version:str` / `ver:str` | Set palette version string (default `"1.0.0"`). |
| `no-tint` | Disable brand-tinted neutrals (enabled by default). |
| `no-rolloff` | Disable neon chroma rolloff (enabled by default). |
| `filepath1 > filepath2` | filepath1 = where to write config; filepath2 = result (redirect). Without `c:path`, config comes from wizard prompts. |
| `--version` / `-v` | Print version and exit. |
| `--help` / `-h` | Show help. |

**Shortcuts** (interchangeable in exclude/only lists and scheme kinds): modes `lt`=light, `dk`=dark; CVD `p`=protanopia, `de`/`deut`=deuteranopia, `t`=tritanopia; schemes `mono`=monochromatic, `a`=adjacent, `a+c`=adjacent+complementary, `tri`=triad, `tet`=tetrad.

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

`frosting config:path` (or `c:path`) — Read config from the given file, generate palette to stdout. Use `> palette.json` to save the result.

```bash
frosting config:input.json
frosting config:input.json > palette.json
frosting config:input.json css palette-vars.css
frosting config:input.json css:palette-vars.css > palette.json
frosting config:input.json exclude:cvd
frosting config:input.json exclude:cvd:protanopia,deuteranopia
frosting config:input.json version:1.2.0
frosting config:input.json no-tint no-rolloff
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

## UI control

The `frosting/ui-control` entrypoint includes the existing `ConfigForm` convenience component plus a lower-level `PaletteConfigForm` wrapper for custom UIs.

### Default form

```tsx
import { ConfigForm } from "frosting/ui-control";

export function PaletteBuilder() {
  return <ConfigForm />;
}
```

### Composable wrapper

`PaletteConfigForm` owns editable values and exposes typed field bindings, normalized `input`/`options`, an optional live `palette`, and a submit handler. This lets you render with your own component library while still producing the same payload that `ConfigForm` uses.

### What you get

`PaletteConfigForm` render props expose:

- `values` - raw editable form values
- `fields` - typed controllers for single-value fields such as `inputMode`, `schemeKind`, `schemeBase`, and overrides/options
- `brandColors` - helpers for repeated brand color inputs: `fields`, `add()`, `remove()`, `set()`, `canAdd`, `canRemove`
- `paletteInput` - normalized `PaletteInput | null`
- `paletteOptions` - normalized `PaletteOptions`
- `palette` - live generated palette when the current values are valid
- `isValid` - whether the current values can be converted into a palette input
- `handleSubmit` and `submit()` - submit helpers for custom forms

This makes it easy to:

- keep the default `ConfigForm` if you want a ready-made UI
- render your own inputs with another component library
- preview live palette output while handling submit separately
- plug the normalized `input` and `options` into your own workflow

```tsx
import { PaletteConfigForm } from "frosting/ui-control";

export function CustomPaletteBuilder() {
  return (
    <PaletteConfigForm
      onSubmit={({ input, options }) => {
        console.log(input, options);
      }}
    >
      {(form) => (
        <form onSubmit={form.handleSubmit}>
          <button
            type="button"
            onClick={() => form.fields.inputMode.onChange("scheme")}
          >
            Use scheme
          </button>
          <input
            value={form.fields.schemeBase.value}
            onChange={(event) =>
              form.fields.schemeBase.onTextChange(event.target.value)
            }
          />
          <button type="submit" disabled={!form.isValid}>
            Submit
          </button>
        </form>
      )}
    </PaletteConfigForm>
  );
}
```

### Custom UI example

You can render your own controls while still using frosting's normalization and preview logic:

```tsx
import { PaletteConfigForm, SCHEME_KINDS } from "frosting/ui-control";

export function CustomPaletteBuilder() {
  return (
    <PaletteConfigForm
      initialValues={{
        inputMode: "scheme",
        schemeKind: "triad",
        cvdVariants: ["deuteranopia"],
      }}
      onSubmit={({ values, input, options, palette }) => {
        console.log(values);
        console.log(input, options);
        console.log(palette);
      }}
    >
      {(form) => (
        <form onSubmit={form.handleSubmit}>
          <select
            value={form.fields.inputMode.value}
            onChange={(event) =>
              form.fields.inputMode.onChange(
                event.target.value as "brand" | "scheme",
              )
            }
          >
            <option value="brand">Brand colors</option>
            <option value="scheme">Scheme</option>
          </select>

          {form.values.inputMode === "brand" ? (
            <>
              {form.brandColors.fields.map((field) => (
                <input
                  key={field.index}
                  value={field.value}
                  onChange={(event) =>
                    field.onTextChange(event.target.value)
                  }
                  placeholder="#000000"
                />
              ))}
              <button
                type="button"
                onClick={() => form.brandColors.add()}
                disabled={!form.brandColors.canAdd}
              >
                Add color
              </button>
            </>
          ) : (
            <>
              <select
                value={form.fields.schemeKind.value}
                onChange={(event) =>
                  form.fields.schemeKind.onChange(
                    event.target.value as (typeof SCHEME_KINDS)[number],
                  )
                }
              >
                {SCHEME_KINDS.map((kind) => (
                  <option key={kind} value={kind}>
                    {kind}
                  </option>
                ))}
              </select>
              <input
                value={form.fields.schemeBase.value}
                onChange={(event) =>
                  form.fields.schemeBase.onTextChange(event.target.value)
                }
                placeholder="#000000"
              />
            </>
          )}

          {!form.isValid && <p>Enter a valid brand color or scheme base.</p>}
          {form.palette && <pre>{JSON.stringify(form.paletteInput, null, 2)}</pre>}

          <button type="submit" disabled={!form.isValid}>
            Submit
          </button>
        </form>
      )}
    </PaletteConfigForm>
  );
}
```

### Helper exports

If you want to build your own state layer instead of using the wrapper, `frosting/ui-control` also exports:

- `DEFAULT_PALETTE_CONFIG_FORM_VALUES`
- `mergePaletteConfigFormValues()`
- `valuesToPaletteInput()`
- `valuesToPaletteOptions()`
- `parseHex()`
- `toBrandArray()`
- `SCHEME_KINDS`
- `CVD_OPTIONS`

These are useful if you want to keep state in another form library but still reuse frosting's normalization rules.

The repo demo under `src/ui-control/demo` shows the wrapper rendered with `semantic-ui-react`.

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

## Chakra UI

The **frosting/chakra** export generates a Chakra UI v2–compatible theme from a `PaletteConfig`: color scales (brand1, brand2, neutral, etc.) and semantic tokens with built-in light/dark mode. Use it with `extendTheme` and `<ChakraProvider>`.

### Basic setup

```ts
import { generatePalette } from "frosting";
import { generateChakraTheme } from "frosting/chakra";
import { extendTheme, ChakraProvider } from "@chakra-ui/react";

const palette = generatePalette({ brand: ["#7C3AED", "#F59E0B"] });
const theme = extendTheme(generateChakraTheme(palette));

<ChakraProvider theme={theme}>
  <App />
</ChakraProvider>
```

The theme adds:

- **colors** — Ramps as scales: `brand1`, `brand2`, `neutral` (e.g. `brand1.500`). Use them with `colorScheme="brand1"` on components like `Button`.
- **semanticTokens.colors** — Tokens such as `background`, `foreground`, `primary`, `primary-foreground`, `card`, `muted`, `border`, `ring`, etc., with `default` and `_dark` so Chakra’s color mode works automatically.

### Options

```ts
generateChakraTheme(palette, {
  variant: "protanopia",   // CVD variant (default: "default")
  includeRamps: true,     // include color scales (default: true)
  includeSemantic: true,  // include semantic tokens (default: true)
  prefix: "frosting",     // prefix keys, e.g. frosting-brand1
});
```

### CVD variants

For color-vision-deficiency variants, generate a theme per variant and pass that theme to `ChakraProvider`. When the user picks a variant, swap the theme.

```ts
const palette = generatePalette(
  { brand: ["#7C3AED"] },
  { cvdVariants: ["protanopia", "deuteranopia", "tritanopia"] },
);

const defaultTheme = extendTheme(generateChakraTheme(palette));
const cvdTheme = extendTheme(generateChakraTheme(palette, { variant: "protanopia" }));

// Use defaultTheme or cvdTheme in ChakraProvider depending on user choice.
```

### Color scheme helpers

```ts
import { getChakraColorSchemes } from "frosting/chakra";

const schemes = getChakraColorSchemes(palette);
// { brand1: "brand1", brand2: "brand2", neutral: "neutral" }

<Button colorScheme={schemes.brand1}>Primary</Button>
```

With `prefix: "frosting"`, the values are `"frosting-brand1"`, etc.

### Demo

From the repo root, run the Chakra demo:

```bash
npm run demo:chakra
```

---

## Output shape (simplified)

```ts
{
  version,

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
