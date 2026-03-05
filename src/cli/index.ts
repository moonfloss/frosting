#!/usr/bin/env node
import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import readline from "node:readline/promises";
import { stdin as input, stderr as stderrOut } from "node:process";

import {
  generatePalette,
  STEPS,
  assertBrandArray,
  type PaletteInput,
  type PaletteOptions,
  type BrandArray,
  type HexColor,
  type SchemeKind,
  type PerMode,
  type PaletteConfig,
  type PaletteVariant,
  type ModePalette,
  type Ramp,
  type SemanticTokens,
  type CvdType,
} from "../index";
import { generateCssVars } from "../tailwind";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const PKG_VERSION: string = (require("../../package.json") as { version: string }).version;

const CVD_TYPES: CvdType[] = ["protanopia", "deuteranopia", "tritanopia"];

const SCHEME_KINDS: SchemeKind[] = [
  "monochromatic",
  "adjacent",
  "adjacent+complementary",
  "triad",
  "tetrad",
];

function schemeAnchorCount(kind: SchemeKind): number {
  switch (kind) {
    case "monochromatic":
    case "adjacent":
      return 2;
    case "adjacent+complementary":
    case "triad":
      return 3;
    case "tetrad":
      return 4;
    default:
      return 2;
  }
}

type Mode = "light" | "dark";

const MODES: readonly Mode[] = ["light", "dark"];

function die(msg: string): never {
  console.error(`frosting: ${msg}`);
  process.exit(1);
}

function parseSchemeKind(raw: string): SchemeKind {
  const v = raw.trim().toLowerCase();
  const expanded = SCHEME_SHORTCUTS[v as keyof typeof SCHEME_SHORTCUTS];
  if (expanded) return expanded;
  const n = parseInt(v, 10);
  if (!Number.isNaN(n) && n >= 1 && n <= SCHEME_KINDS.length) {
    return SCHEME_KINDS[n - 1]!;
  }
  const kind = SCHEME_KINDS.find((k) => k === v);
  if (kind) return kind;
  die(
    `Invalid scheme kind "${raw}". Choose 1–${SCHEME_KINDS.length} or a scheme name.`,
  );
}

function schemeKindPrompt(): string {
  const lines = SCHEME_KINDS.map((k, i) => `  ${i + 1}. ${k}`).join("\n");
  return `Scheme kind:\n${lines}\nChoice (1–${SCHEME_KINDS.length} or name): `;
}

function expandCvdName(p: string): CvdType | undefined {
  const v = p.trim().toLowerCase();
  return CVD_SHORTCUTS[v as keyof typeof CVD_SHORTCUTS] ?? (CVD_TYPES.includes(v as CvdType) ? (v as CvdType) : undefined);
}

function parseCvdTypes(raw: string): CvdType[] {
  const v = raw.trim().toLowerCase();
  if (!v) die(`Specify at least one CVD type or "all".`);
  const parts = v
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.some((p) => p === "all" || p === "4")) return [...CVD_TYPES];
  const out: CvdType[] = [];
  for (const p of parts) {
    const n = parseInt(p, 10);
    if (!Number.isNaN(n) && n >= 1 && n <= 3) {
      const t = CVD_TYPES[n - 1]!;
      if (!out.includes(t)) out.push(t);
      continue;
    }
    const t = expandCvdName(p);
    if (t) {
      if (!out.includes(t)) out.push(t);
    } else {
      die(
        `Invalid CVD type "${p}". Choose 1–3, 4 for all, or names: ${CVD_TYPES.join(", ")}.`,
      );
    }
  }
  return out;
}

function cvdTypesPrompt(): string {
  const lines = CVD_TYPES.map((k, i) => `  ${i + 1}. ${k}`).join("\n");
  return `Which?\n${lines}\n  4. all\nChoice (1–4, comma-separated numbers, or names): `;
}

function isHex6(x: string): x is HexColor {
  return /^#[0-9a-fA-F]{6}$/.test(x);
}

function parseHexList(raw: string): HexColor[] {
  const parts = raw
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (parts.length < 1 || parts.length > 4) {
    die(`Expected 1–4 colors, got ${parts.length}`);
  }
  const result: HexColor[] = [];
  for (const p of parts) {
    if (!isHex6(p)) die(`Invalid hex: "${p}" (expected #RRGGBB)`);
    result.push(p);
  }
  return result;
}

function toBrandArray(list: HexColor[]): BrandArray {
  assertBrandArray(list, "brand");
  return list;
}

function normalizeYesNo(s: string, defaultYes: boolean): boolean {
  const v = s.trim().toLowerCase();
  if (!v) return defaultYes;
  if (["y", "yes", "true", "1"].includes(v)) return true;
  if (["n", "no", "false", "0"].includes(v)) return false;
  die(`Please answer y/n.`);
}

function hexToRgbTuple(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

// background color block
function swatch(hex: string, text = "      "): string {
  const [r, g, b] = hexToRgbTuple(hex);
  return `\x1b[48;2;${r};${g};${b}m${text}\x1b[0m`;
}

function printRamp(title: string, ramp: Ramp, toStderr = false) {
  const out = toStderr ? console.error : console.log;
  out(`\n${title}`);
  for (const step of STEPS) {
    const hex = ramp[step];
    out(`${String(step).padStart(4)} ${swatch(hex)} ${hex}`);
  }
}

const SEMANTIC_KEYS: (keyof SemanticTokens)[] = [
  "background",
  "foreground",
  "card",
  "card-foreground",
  "muted",
  "muted-foreground",
  "border",
  "input",
  "ring",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "accent",
  "accent-foreground",
];

function printSemantic(
  title: string,
  semantic: SemanticTokens,
  toStderr = false,
) {
  const out = toStderr ? console.error : console.log;
  out(`\n${title}`);
  for (const k of SEMANTIC_KEYS) {
    const v = semantic[k];
    out(`${k.padEnd(20)} ${swatch(v)} ${v}`);
  }
}

/** Minimal shape needed for preview (full config or just modes). */
type PalettePreviewSource = Pick<PaletteConfig, "modes">;

function printPalettePreview(
  palette: PalettePreviewSource,
  mode: Mode,
  toStderr = false,
) {
  const m = palette.modes[mode];
  const out = toStderr ? console.error : console.log;
  out(`\n=== Preview (${mode}) ===`);
  printRamp("brand1", m.ramps.brand1, toStderr);
  if (m.ramps.brand2) printRamp("brand2", m.ramps.brand2, toStderr);
  if (m.ramps.brand3) printRamp("brand3", m.ramps.brand3, toStderr);
  if (m.ramps.brand4) printRamp("brand4", m.ramps.brand4, toStderr);
  printRamp("neutral/gray", m.ramps.neutral, toStderr);
  printSemantic("semantic", m.semantic, toStderr);
  if (m.meta.warnings.length) {
    out(`\nWarnings:`);
    for (const w of m.meta.warnings) out(`- ${w}`);
  }
}

function printVariantPreviews(variant: PaletteVariant, toStderr = false) {
  const out = toStderr ? console.error : console.log;
  out(`\n=== CVD variant: ${variant.type} ===`);
  const preview: PalettePreviewSource = { modes: variant.modes };
  printPalettePreview(preview, "light", toStderr);
  printPalettePreview(preview, "dark", toStderr);
}

function writeFile(p: string, data: string) {
  const abs = path.resolve(process.cwd(), p);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, data, "utf8");
}

function help() {
  console.log(
    `
frosting v${PKG_VERSION}

  wizard / w       Use prompt/answer wizard (if not present, read config from config:filepath).
  config: / c:     Read config from filepath (when not using wizard).
  exclude: / e:    Comma-separated variants to exclude: light, dark, cvd, or cvd:name1,name2.
  only: / o:       Comma-separated variants to include (opposite of exclude).
  css: / css       Write CSS custom properties to filepath (Tailwind theming vars).
  filepath1 > filepath2  file1 is always WRITE TO (config). file2 = result (redirect). Without c: we use wizard (config from prompts); with c:path we READ FROM path.
  no-tint          Disable brand-tinted neutrals (enabled by default).
  no-rolloff       Disable neon chroma rolloff (enabled by default).
  --version / -v   Print version and exit.
  --help / -h      Show this help.

Shortcuts (interchangeable in lists):
  Modes: lt=light, dk=dark.  CVD: p=protanopia, de=deuteranopia, t=tritanopia.
  Schemes: mono=monochromatic, a=adjacent, a+c=adjacent+complementary, tri=triad, tet=tetrad.

Examples:
  frosting w
  frosting w config.json > palette.json
  frosting c:input.json
  frosting c:input.json e:dark o:l
  frosting c:input.json e:cvd
  frosting c:input.json e:cvd:p,de,t
  frosting c:input.json no-tint
  frosting c:input.json no-rolloff
  frosting c:input.json css:palette-vars.css
  frosting c:input.json css palette-vars.css > palette.json
`.trim(),
  );
}

const argv = process.argv.slice(2);

const COLON_ALIASES: Record<string, string[]> = {
  config: ["c"],
  only: ["o"],
  exclude: ["e"],
  css: [],
};

const MODE_SHORTCUTS: Record<string, Mode> = {
  lt: "light",
  light: "light",
  dk: "dark",
  dark: "dark",
};

const CVD_SHORTCUTS: Record<string, CvdType> = {
  p: "protanopia",
  protanopia: "protanopia",
  de: "deuteranopia",
  deut: "deuteranopia",
  deuteranopia: "deuteranopia",
  t: "tritanopia",
  tritanopia: "tritanopia",
};

const SCHEME_SHORTCUTS: Record<string, SchemeKind> = {
  mono: "monochromatic",
  monochromatic: "monochromatic",
  a: "adjacent",
  adjacent: "adjacent",
  "a+c": "adjacent+complementary",
  "adjacent+complementary": "adjacent+complementary",
  tri: "triad",
  triad: "triad",
  tet: "tetrad",
  tetrad: "tetrad",
};

const RESERVED_ARGS = new Set(["wizard", "w", "no-tint", "no-rolloff", "css"]);
const COLON_PREFIXES = [
  "config:",
  "c:",
  "exclude:",
  "e:",
  "only:",
  "o:",
  "css:",
];

function isPathLikeArg(a: string): boolean {
  return !RESERVED_ARGS.has(a) && !COLON_PREFIXES.some((p) => a.startsWith(p));
}

function getColonArg(prefix: string): string | undefined {
  const keys = [prefix, ...(COLON_ALIASES[prefix] ?? [])];
  for (const p of keys) {
    const key = p.endsWith(":") ? p : `${p}:`;
    const found = argv.find((a) => a.startsWith(key) && a.length > key.length);
    if (found) return found.slice(key.length);
  }
  return undefined;
}

function hasArg(value: string): boolean {
  return argv.includes(value);
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

function getCssPath(): string | undefined {
  const colon = getColonArg("css");
  if (colon) return colon;
  const i = argv.indexOf("css");
  if (i >= 0) {
    const next = argv[i + 1];
    if (next && isPathLikeArg(next)) return next;
  }
  return undefined;
}

/** Variants to exclude or include (only wins if both set). */
interface VariantFilter {
  excludeModes?: Mode[];
  excludeCvdAll?: boolean;
  excludeCvdNames?: CvdType[];
  onlyModes?: Mode[];
  onlyCvdNames?: CvdType[]; // if set, only these cvd variants in output
}

function expandMode(p: string): Mode | undefined {
  const v = p.trim().toLowerCase();
  return MODE_SHORTCUTS[v as keyof typeof MODE_SHORTCUTS];
}

/** Shared parse for exclude/only list: modes, optional cvd (all), optional cvd:name1,name2 */
function parseVariantList(value: string): {
  modes: Mode[];
  cvdAll?: boolean;
  cvdNames?: CvdType[];
} {
  const parts = value.split(",").map((s) => s.trim()).filter(Boolean);
  const modes: Mode[] = [];
  let cvdAll: boolean | undefined;
  let cvdNames: CvdType[] | undefined;
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i]!;
    if (p === "cvd") {
      cvdAll = true;
      continue;
    }
    if (p.startsWith("cvd:")) {
      const cvdList = parts.slice(i).join(",").slice(4);
      const names = cvdList.split(",").map((s) => s.trim()).filter(Boolean);
      const valid = names.map((n) => expandCvdName(n)).filter((t): t is CvdType => t != null);
      if (valid.length) cvdNames = valid;
      break;
    }
    const mode = expandMode(p);
    if (mode) modes.push(mode);
  }
  return { modes, cvdAll, cvdNames };
}

function parseExclude(value: string): VariantFilter {
  const { modes, cvdAll, cvdNames } = parseVariantList(value);
  return {
    ...(modes.length ? { excludeModes: modes } : {}),
    ...(cvdAll ? { excludeCvdAll: true } : {}),
    ...(cvdNames?.length ? { excludeCvdNames: cvdNames } : {}),
  };
}

function parseOnly(value: string): VariantFilter {
  const { modes, cvdNames } = parseVariantList(value);
  return {
    ...(modes.length ? { onlyModes: modes } : {}),
    ...(cvdNames?.length ? { onlyCvdNames: cvdNames } : {}),
  };
}

function getFilter(): VariantFilter {
  return mergeFilters(getColonArg("exclude"), getColonArg("only"));
}

function getOptionsFromArgv(): PaletteOptions {
  return {
    brandTint: !hasArg("no-tint"),
    neonChromaRolloff: !hasArg("no-rolloff"),
  };
}

function mergeFilters(
  excludeVal: string | undefined,
  onlyVal: string | undefined,
): VariantFilter {
  const ex = excludeVal ? parseExclude(excludeVal) : {};
  const only = onlyVal ? parseOnly(onlyVal) : {};
  // If only is set, it overrides exclude for scope (we include only what only says)
  if (only.onlyModes?.length || only.onlyCvdNames?.length) {
    return {
      onlyModes: only.onlyModes,
      onlyCvdNames: only.onlyCvdNames,
      excludeModes: ex.excludeModes,
      excludeCvdAll: ex.excludeCvdAll,
      excludeCvdNames: ex.excludeCvdNames,
    };
  }
  return {
    excludeModes: ex.excludeModes,
    excludeCvdAll: ex.excludeCvdAll,
    excludeCvdNames: ex.excludeCvdNames,
  };
}

function fromModeEntries(
  entries: [string, ModePalette][],
): { light: ModePalette; dark: ModePalette } {
  return Object.fromEntries(entries) as {
    light: ModePalette;
    dark: ModePalette;
  };
}

function fromVariantEntries(
  entries: [string, PaletteVariant][],
): Record<string, PaletteVariant> {
  return Object.fromEntries(entries) as Record<string, PaletteVariant>;
}

function applyVariantFilter(
  palette: PaletteConfig,
  filter: VariantFilter,
): PaletteConfig {
  let modes = { ...palette.modes };
  let variants = palette.variants
    ? { ...palette.variants }
    : undefined;

  if (filter.onlyModes?.length) {
    const keep = new Set(filter.onlyModes);
    modes = fromModeEntries(
      Object.entries(modes).filter(([k]) => keep.has(k as Mode)),
    );
  } else if (filter.excludeModes?.length) {
    const remove = new Set(filter.excludeModes);
    modes = fromModeEntries(
      Object.entries(modes).filter(([k]) => !remove.has(k as Mode)),
    );
  }

  if (filter.onlyCvdNames?.length && variants) {
    const keep = new Set(filter.onlyCvdNames);
    variants = fromVariantEntries(
      Object.entries(variants).filter(([k]) => keep.has(k as CvdType)),
    );
    if (Object.keys(variants).length === 0) variants = undefined;
  } else if (filter.excludeCvdAll || filter.excludeCvdNames?.length) {
    if (filter.excludeCvdAll) variants = undefined;
    else if (filter.excludeCvdNames?.length && variants) {
      const remove = new Set(filter.excludeCvdNames);
      variants = fromVariantEntries(
        Object.entries(variants).filter(([k]) => !remove.has(k as CvdType)),
      );
      if (Object.keys(variants).length === 0) variants = undefined;
    }
  }

  return { ...palette, modes, variants };
}

async function wizard(
  modeChoice: "light" | "dark" | "both",
): Promise<{ input: PaletteInput; options: PaletteOptions }> {
  // Use stderr so prompts stay on terminal when stdout is redirected (e.g. > full-palette.json)
  const rl = readline.createInterface({ input, output: stderrOut });

  const ask = async (q: string) => (await rl.question(q)).trim();

  console.error(`\n🧁 frosting init (interactive)\n`);

  const useScheme = normalizeYesNo(
    await ask(`Use color-scheme derived anchors? (y/N) `),
    false,
  );

  // Options
  const brandTint = normalizeYesNo(
    await ask(`Brand-tinted neutrals? (Y/n) `),
    true,
  );
  const neonRolloff = normalizeYesNo(
    await ask(`Neon chroma rolloff? (Y/n) `),
    true,
  );

  let cvdVariants: CvdType[] | undefined;
  const wantCvd = normalizeYesNo(
    await ask(`Generate color-blindness variants? (y/N) `),
    false,
  );
  if (wantCvd) {
    const cvdRaw = await ask(cvdTypesPrompt());
    cvdVariants = parseCvdTypes(cvdRaw);
  }

  const options: PaletteOptions = {
    brandTint,
    neonChromaRolloff: neonRolloff,
    ...(cvdVariants?.length ? { cvdVariants } : {}),
  };

  const perModeBase: PerMode<HexColor> = {};
  const perModeBrands: PerMode<BrandArray> = {};
  const perModeBg: PerMode<HexColor> = {};
  const perModeFg: PerMode<HexColor> = {};

  const modes: Mode[] =
    modeChoice === "both" ? ["light", "dark"] : [modeChoice];

  if (useScheme) {
    const kindRaw = await ask(schemeKindPrompt());
    const kind = parseSchemeKind(kindRaw);
    const n = schemeAnchorCount(kind);

    for (const m of modes) {
      const base = await ask(
        `[${m}] Base color (#RRGGBB) — we derive ${n} brand anchor${n > 1 ? "s" : ""} for ${kind}: `,
      );
      if (!isHex6(base)) die(`Invalid base hex: ${base}`);
      perModeBase[m] = base;

      const bg = await ask(
        `[${m}] Background override? (#RRGGBB or leave blank for auto): `,
      );
      if (bg) {
        if (!isHex6(bg)) die(`Invalid background hex: ${bg}`);
        perModeBg[m] = bg;
      }

      const fg = await ask(
        `[${m}] Foreground override? (#RRGGBB or leave blank for auto): `,
      );
      if (fg) {
        if (!isHex6(fg)) die(`Invalid foreground hex: ${fg}`);
        perModeFg[m] = fg;
      }
    }

    rl.close();

    const inputObj: PaletteInput = {
      scheme: {
        base:
          modeChoice === "both"
            ? perModeBase
            : (perModeBase[modes[0]] as HexColor),
        kind,
      },
      ...(Object.keys(perModeBg).length
        ? {
            background: modeChoice === "both" ? perModeBg : perModeBg[modes[0]],
          }
        : {}),
      ...(Object.keys(perModeFg).length
        ? {
            foreground: modeChoice === "both" ? perModeFg : perModeFg[modes[0]],
          }
        : {}),
    };

    return { input: inputObj, options };
  }

  // explicit brand anchors
  for (const m of modes) {
    const raw = await ask(
      `[${m}] Brand colors (1–4) as "#RRGGBB #RRGGBB" or comma-separated: `,
    );
    const list = parseHexList(raw);
    perModeBrands[m] = toBrandArray(list);

    const bg = await ask(
      `[${m}] Background override? (#RRGGBB or leave blank for auto): `,
    );
    if (bg) {
      if (!isHex6(bg)) die(`Invalid background hex: ${bg}`);
      perModeBg[m] = bg;
    }

    const fg = await ask(
      `[${m}] Foreground override? (#RRGGBB or leave blank for auto): `,
    );
    if (fg) {
      if (!isHex6(fg)) die(`Invalid foreground hex: ${fg}`);
      perModeFg[m] = fg;
    }
  }

  rl.close();

  const inputObj: PaletteInput = {
    brand:
      modeChoice === "both"
        ? perModeBrands
        : (perModeBrands[modes[0]] as BrandArray),
    ...(Object.keys(perModeBg).length
      ? { background: modeChoice === "both" ? perModeBg : perModeBg[modes[0]] }
      : {}),
    ...(Object.keys(perModeFg).length
      ? { foreground: modeChoice === "both" ? perModeFg : perModeFg[modes[0]] }
      : {}),
  };

  return { input: inputObj, options };
}

async function runWizard(configWritePath?: string, cssPath?: string) {
  const filter = getFilter();
  const { input: paletteInput, options: wizardOptions } = await wizard("both");
  const options: PaletteOptions = {
    ...wizardOptions,
    ...(hasArg("no-tint") ? { brandTint: false } : {}),
    ...(hasArg("no-rolloff") ? { neonChromaRolloff: false } : {}),
  };

  const inputJson = JSON.stringify(paletteInput, null, 2);
  console.error(`\n--- PaletteInput (copy/paste JSON) ---\n${inputJson}`);
  console.error(`\n--- PaletteOptions ---\n${JSON.stringify(options, null, 2)}`);

  let palette = generatePalette(paletteInput, options);
  palette = applyVariantFilter(palette, filter);

  if (cssPath) {
    writeFile(cssPath, generateCssVars(palette) + "\n");
    console.error(`\n✅ wrote CSS vars to ${cssPath}`);
  }

  for (const mode of MODES) {
    if (palette.modes[mode]) printPalettePreview(palette, mode, true);
  }
  if (palette.variants && Object.keys(palette.variants).length > 0) {
    for (const v of Object.values(palette.variants)) {
      printVariantPreviews(v, true);
    }
  }
  console.error(`\n--- Generated palette (full JSON) ---\n`);
  process.stdout.write(JSON.stringify(palette, null, 2) + "\n");

  if (configWritePath) {
    writeFile(configWritePath, inputJson + "\n");
    console.error(`\n✅ wrote config to ${configWritePath}`);
  } else {
    console.error(
      `\n(use: frosting wizard config.json > palette.json to write both)`,
    );
  }
}

function isPaletteInput(parsed: unknown): parsed is PaletteInput {
  if (parsed == null || typeof parsed !== "object") return false;
  const o = parsed as Record<string, unknown>;
  const hasBrand = "brand" in o;
  const hasScheme = "scheme" in o;
  if (hasBrand && hasScheme) return false;
  if (!hasBrand && !hasScheme) return false;
  if (hasScheme) {
    const s = o.scheme;
    return (
      s != null &&
      typeof s === "object" &&
      "kind" in s &&
      "base" in (s as object)
    );
  }
  return true;
}

function parsePaletteInput(raw: string): PaletteInput {
  const parsed: unknown = JSON.parse(raw);
  if (!isPaletteInput(parsed)) {
    die("Config must be a JSON object with either 'brand' or 'scheme'.");
  }
  return parsed;
}

async function runFromFile(
  configPath: string,
  configWritePath?: string,
  cssPath?: string,
) {
  const filter = getFilter();
  const options = getOptionsFromArgv();

  const raw = await fsPromises.readFile(
    path.resolve(process.cwd(), configPath),
    "utf8",
  );
  const paletteInput = parsePaletteInput(raw);

  if (configWritePath) {
    writeFile(configWritePath, JSON.stringify(paletteInput, null, 2) + "\n");
    console.error(`✅ wrote config to ${configWritePath}`);
  }

  let palette = generatePalette(paletteInput, options);
  palette = applyVariantFilter(palette, filter);

  if (cssPath) {
    writeFile(cssPath, generateCssVars(palette) + "\n");
    console.error(`✅ wrote CSS vars to ${cssPath}`);
  }

  process.stdout.write(JSON.stringify(palette, null, 2) + "\n");
}

async function main() {
  if (hasFlag("version") || argv.includes("-v")) {
    console.log(PKG_VERSION);
    return;
  }

  if (argv.length === 0 || argv[0] === "help" || hasFlag("help") || argv.includes("-h")) {
    help();
    return;
  }

  const wizardMode = argv.includes("wizard") || argv.includes("w");
  const configPath = getColonArg("config");

  if (wizardMode) {
    const cssPath = getCssPath();
    const configWritePath = argv.find(
      (a) => isPathLikeArg(a) && a !== cssPath,
    );
    return runWizard(configWritePath ?? undefined, cssPath);
  }

  if (configPath) {
    const cssPath = getCssPath();
    const configWritePath = argv.find(
      (a) => isPathLikeArg(a) && a !== cssPath,
    );
    return runFromFile(configPath, configWritePath, cssPath);
  }

  die(
    `Provide "wizard" or "config:filepath" (e.g. frosting wizard config.json > palette.json or frosting config:input.json > palette.json).`,
  );
}

main().catch((e) => die(e instanceof Error ? e.message : String(e)));
