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
| `map:path` / `m:path` | Read mapper config JSON and emit mapped output JSON instead of raw `PaletteConfig`. |
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
frosting config:input.json map:theme-map.json > theme.json
```

---

### Custom theme shape (e.g. StorefrontTheme)

To get output that matches your own types (e.g. `StorefrontThemeRamp` / `StorefrontThemeMode`), use the **map** option with a theme-mapper config:

1. **Palette config** — Your usual frosting input (wizard or `config:path`).
2. **Mapper config** — A JSON file with:
   - **`template`** — Object shape you want. Use `null` (or `""`) for every leaf you want filled from the palette; nested structure is preserved.
   - **`mappings`** — Optional path overrides: `"target.path": "source.path"`. Source paths are like `light.ramps.brand1.500`, `light.semantic.background`, or built-in aliases such as `light.surface.page`, `light.text.primary`, `light.accent.primary`, `light.status.warning`, etc.
   - **`fuzzy`** — Optional `{ "enabled": true, "derivedAliases": true }` so unmapped leaves can be filled by name matching (e.g. `light.surface.page` → alias).

**Example: StorefrontTheme-style output (light/dark, brand ramp 50–900, accent, text, surface, border, status, decorative)**

```bash
frosting config:palette-config.json map:docs/storefront-theme-map.example.json > storefront-theme.json
```

Or with the wizard:

```bash
frosting wizard map:docs/storefront-theme-map.example.json > storefront-theme.json
```

The example mapper config is at `docs/storefront-theme-map.example.json`. It defines a template matching `StorefrontThemeMode` (with optional `brand`, `accent`, `text`, `surface`, `border`, `status`, `decorative`) and maps frosting’s ramps and semantic/alias tokens into it. You can copy and edit that file to add or change mappings (e.g. `surface.elevated`, `border.muted`) or to point to different source paths.

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

## Theme mapping utility

Use the mapper when you need `generatePalette()` output shaped to your own contract, but do not want to fork or replace frosting's base `PaletteConfig`.

### TypeScript API

```ts
import {
  generatePalette,
  mapPaletteToTheme,
  type ThemeMappingConfig,
} from "frosting";

type AppTheme = {
  light: {
    surface: { page: string };
    text: { primary: string };
  };
  dark: {
    surface: { page: string };
    text: { primary: string };
  };
};

const palette = generatePalette({ brand: ["#7C3AED"] });

const config: ThemeMappingConfig<AppTheme> = {
  template: {
    light: { surface: { page: "" }, text: { primary: "" } },
    dark: { surface: { page: "" }, text: { primary: "" } },
  },
  mappings: {
    "light.text.primary": "light.foreground",
    "dark.text.primary": "dark.foreground",
  },
  fuzzy: {
    derivedAliases: true,
  },
};

const { theme, diagnostics } = mapPaletteToTheme(palette, config);

console.log(theme);
console.log(diagnostics.unresolved);
```

### Storefront-style TypeScript example

```ts
import {
  generatePalette,
  mapPaletteToTheme,
  type ThemeMappingConfig,
} from "frosting";

type StorefrontThemeRamp = {
  50?: string;
  100?: string;
  200?: string;
  300?: string;
  400?: string;
  500?: string;
  600?: string;
  700?: string;
  800?: string;
  900?: string;
};

type StorefrontThemeMode = {
  brand?: StorefrontThemeRamp;
  accent?: { primary?: string; secondary?: string; contrast?: string };
  text?: { primary?: string; muted?: string; inverse?: string; link?: string };
  surface?: {
    page?: string;
    card?: string;
    subtle?: string;
    elevated?: string;
    inverse?: string;
  };
  border?: { default?: string; muted?: string; strong?: string; inverse?: string };
  status?: { success?: string; warning?: string; error?: string; info?: string };
};

type StorefrontTheme = {
  version: 1;
  light: StorefrontThemeMode;
  dark?: StorefrontThemeMode;
};

const palette = generatePalette({ brand: ["#7C3AED"] });

const config: ThemeMappingConfig<StorefrontTheme> = {
  template: {
    version: 1,
    light: {
      brand: { 50: "", 100: "", 200: "", 300: "", 400: "", 500: "", 600: "", 700: "", 800: "", 900: "" },
      accent: { primary: "", secondary: "", contrast: "" },
      text: { primary: "", muted: "", inverse: "", link: "" },
      surface: { page: "", card: "", subtle: "", elevated: "", inverse: "" },
      border: { default: "", muted: "", strong: "", inverse: "" },
      status: { success: "", warning: "", error: "", info: "" },
    },
    dark: {
      brand: { 50: "", 100: "", 200: "", 300: "", 400: "", 500: "", 600: "", 700: "", 800: "", 900: "" },
      accent: { primary: "", secondary: "", contrast: "" },
      text: { primary: "", muted: "", inverse: "", link: "" },
      surface: { page: "", card: "", subtle: "", elevated: "", inverse: "" },
      border: { default: "", muted: "", strong: "", inverse: "" },
      status: { success: "", warning: "", error: "", info: "" },
    },
  },
  mappings: {
    "light.brand.50": "light.brand1.50",
    "light.brand.100": "light.brand1.100",
    "light.brand.200": "light.brand1.200",
    "light.brand.300": "light.brand1.300",
    "light.brand.400": "light.brand1.400",
    "light.brand.500": "light.brand1.500",
    "light.brand.600": "light.brand1.600",
    "light.brand.700": "light.brand1.700",
    "light.brand.800": "light.brand1.800",
    "light.brand.900": "light.brand1.900",
    "dark.brand.50": "dark.brand1.50",
    "dark.brand.100": "dark.brand1.100",
    "dark.brand.200": "dark.brand1.200",
    "dark.brand.300": "dark.brand1.300",
    "dark.brand.400": "dark.brand1.400",
    "dark.brand.500": "dark.brand1.500",
    "dark.brand.600": "dark.brand1.600",
    "dark.brand.700": "dark.brand1.700",
    "dark.brand.800": "dark.brand1.800",
    "dark.brand.900": "dark.brand1.900",
  },
  fuzzy: {
    derivedAliases: true,
  },
  requiredPaths: ["light.surface.page", "dark.surface.page"],
};

const { theme, diagnostics } = mapPaletteToTheme(palette, config);
if (diagnostics.missingRequired.length) {
  throw new Error(`Missing required paths: ${diagnostics.missingRequired.join(", ")}`);
}
```

### Mapper configuration guidance

- `template`: nested output shape to fill; fields with `""`, `null`, or `undefined` are treated as mapping placeholders.
- `mappings`: explicit `targetPath -> sourceToken` overrides for ambiguous or custom behavior.
- `fuzzy.derivedAliases`: `true` enables friendly aliases like `light.surface.page` and `dark.text.muted`; `false` restricts matching to base semantic/ramp tokens.
- `requiredPaths`: target paths that must resolve; unresolved required paths are returned in `diagnostics.missingRequired`.
- `diagnostics`: inspect `resolved`, `unresolved`, and `ambiguous` entries to tune your mapping config.

### Common source tokens for `mappings`

Use these source token names in your `mappings` object.

| Category | Examples |
| --- | --- |
| Semantic tokens | `light.background`, `light.foreground`, `light.primary`, `light.secondary`, `light.accent`, `dark.background`, `dark.foreground`, `dark.primary` |
| Ramp steps | `light.brand1.500`, `light.brand2.500`, `light.neutral.100`, `light.neutral.900`, `dark.brand1.500`, `dark.neutral.800` |
| Alias tokens (`fuzzy.derivedAliases: true`) | `light.surface.page`, `light.surface.card`, `light.text.primary`, `light.text.muted`, `light.text.link`, `light.accent.primary`, `light.status.warning`, `dark.surface.page`, `dark.text.primary`, `dark.status.error` |
| Literal color override | `#ff0000` (you can map a target path directly to a fixed hex value) |

If you are unsure what to map first, start with semantic tokens (`light.background`, `light.foreground`, `light.primary`) and add explicit ramp mappings only where you need exact scale control.

### CLI mapping

Use `map:path` (or `m:path`) to apply the same mapper config file in the CLI.

```bash
frosting config:input.json map:theme-map.json > theme.json
```

Mapper config example (`theme-map.json`):

```ts
{
  "template": {
    "light": {
      "surface": { "page": "" }
    }
  },
  "mappings": {
    "light.surface.page": "light.background"
  },
  "fuzzy": {
    "derivedAliases": true
  },
  "requiredPaths": ["light.surface.page"],
  "failOnUnresolved": true
}
```

When `failOnUnresolved` is `true`, the CLI exits with an error if any unresolved mapped path remains.

Existing Tailwind, Chakra, CLI defaults, and UI-control integrations continue to use the regular `PaletteConfig` shape unless you explicitly map output.

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
