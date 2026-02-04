#!/usr/bin/env node
import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import { generatePalette } from "./index";
import { STEPS } from "./ramp";
import type {
  PaletteInput,
  PaletteOptions,
  BrandArray,
  HexColor,
  SchemeKind,
  PerMode,
  PaletteConfig,
  Ramp,
  SemanticTokens,
} from "./types";

const SCHEME_KINDS: SchemeKind[] = [
  "monochromatic",
  "adjacent",
  "adjacent+complementary",
  "triad",
  "tetrad",
];

type Mode = "light" | "dark";

function die(msg: string): never {
  console.error(`frosting: ${msg}`);
  process.exit(1);
}

function parseSchemeKind(raw: string): SchemeKind {
  const v = raw.trim().toLowerCase();
  const kind = SCHEME_KINDS.find((k) => k === v);
  if (kind) return kind;
  die(`Invalid scheme kind "${raw}". Choose: ${SCHEME_KINDS.join(", ")}`);
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
  for (const p of parts) {
    if (!isHex6(p)) die(`Invalid hex: "${p}" (expected #RRGGBB)`);
  }
  return parts as HexColor[];
}

function toBrandArray(list: HexColor[]): BrandArray {
  if (list.length < 1 || list.length > 4) die(`brand must have 1–4 colors`);
  return list as BrandArray;
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

function printPalettePreview(
  palette: PaletteConfig,
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

function writeFile(p: string, data: string) {
  const abs = path.resolve(process.cwd(), p);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, data, "utf8");
}

function help() {
  console.log(
    `
frosting

Commands:
  frosting init [--out <file.json>] [--mode light|dark|both]
  frosting gen  --input <file.json> [--out <file.json>] [--pretty] [--swatches] [--only light|dark]

Examples:
  frosting init --out examples/input.json
  frosting gen --input examples/input.json --out palette.json --pretty --swatches
`.trim(),
  );
}

function getArg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : undefined;
}
function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

async function wizard(
  modeChoice: "light" | "dark" | "both",
): Promise<{ input: PaletteInput; options: PaletteOptions }> {
  const rl = readline.createInterface({ input, output });

  const ask = async (q: string) => (await rl.question(q)).trim();

  console.log(`\n🧁 frosting init (interactive)\n`);

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

  const options: PaletteOptions = {
    brandTint,
    neonChromaRolloff: neonRolloff,
  };

  const perModeBase: PerMode<HexColor> = {};
  const perModeBrands: PerMode<BrandArray> = {};
  const perModeBg: PerMode<HexColor> = {};
  const perModeFg: PerMode<HexColor> = {};

  const modes: Mode[] =
    modeChoice === "both" ? ["light", "dark"] : [modeChoice];

  if (useScheme) {
    const kindRaw = await ask(
      `Scheme kind (monochromatic|adjacent|adjacent+complementary|triad|tetrad): `,
    );
    const kind = parseSchemeKind(kindRaw);

    for (const m of modes) {
      const base = await ask(`[${m}] Base color (#RRGGBB): `);
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
        `[${m}] Foreground override? (#RRGGBB or leave blank for auto: `,
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

async function runInit() {
  const outPath = getArg("out"); // optional: write the *input config* somewhere
  const modeArg = (getArg("mode") ?? "both") as "light" | "dark" | "both";

  const { input: paletteInput, options } = await wizard(modeArg);

  // 1) output config for confirmation
  const inputJson = JSON.stringify(paletteInput, null, 2);
  console.log(`\n--- PaletteInput (copy/paste JSON) ---\n${inputJson}`);

  const optsJson = JSON.stringify(options, null, 2);
  console.log(`\n--- PaletteOptions ---\n${optsJson}`);

  // 2) generate palette
  const palette = generatePalette(paletteInput, options);

  // 3) preview with swatches (only for chosen mode(s))
  const modesToPreview: Mode[] =
    modeArg === "both" ? ["light", "dark"] : [modeArg];
  for (const mode of modesToPreview) {
    printPalettePreview(palette, mode);
  }

  // 4) optionally write config file (just the input config, per your plan)
  if (outPath) {
    writeFile(outPath, inputJson + "\n");
    console.error(`\n✅ wrote config to ${outPath}`);
  } else {
    console.log(`\n(no --out provided; nothing written)`);
  }
}

async function runGen() {
  const inputFile = getArg("input");
  if (!inputFile) die(`gen requires --input <file.json>`);

  const outPath = getArg("out");
  const pretty = hasFlag("pretty");
  const swatchesOn = hasFlag("swatches");
  const only = getArg("only") as Mode | undefined;

  const raw = await fsPromises.readFile(
    path.resolve(process.cwd(), inputFile),
    "utf8",
  );
  const paletteInput = JSON.parse(raw) as PaletteInput;

  const options: PaletteOptions = {};
  const palette = generatePalette(paletteInput, options);

  const outJson = JSON.stringify(palette, null, pretty ? 2 : 0) + "\n";

  if (outPath) {
    writeFile(outPath, outJson);
  }
  process.stdout.write(outJson);

  if (swatchesOn) {
    const mode: Mode = only ?? "light";
    printPalettePreview(palette, mode, true);
  }
}

async function main() {
  const cmd = process.argv[2];

  if (!cmd || cmd === "help" || hasFlag("help")) {
    help();
    return;
  }

  if (cmd === "init") return runInit();
  if (cmd === "gen") return runGen();

  die(`unknown command "${cmd}"`);
}

main().catch((e) => die((e as Error).message));
