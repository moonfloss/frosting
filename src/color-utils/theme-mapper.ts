import type { ModePalette, PaletteConfig } from "./types";

type Mode = "light" | "dark";
type Tier = "base" | "alias";

const MODES: readonly Mode[] = ["light", "dark"];

const MUI_STATUS_FALLBACKS = {
  success: "#2e7d32",
  warning: "#ed6c02",
  error: "#d32f2f",
  info: "#0288d1",
} as const;

const SYNONYM_MAP: Record<string, string> = {
  bg: "background",
  fg: "foreground",
  page: "background",
  contrast: "foreground",
};

export interface ThemeSourceToken {
  key: string;
  sourcePath: string;
  value: string;
  mode?: Mode;
  tier: Tier;
}

export interface ThemeSourceIndex {
  tokens: ThemeSourceToken[];
  baseTokens: ThemeSourceToken[];
  aliasTokens: ThemeSourceToken[];
  exact: Map<string, ThemeSourceToken[]>;
}

export interface ThemeMapperFuzzyOptions {
  enabled?: boolean;
  derivedAliases?: boolean;
  minScore?: number;
}

export type ThemeMappingTemplate = Record<string, unknown>;
export type ThemeMappingPathOverrides = Record<string, string>;

export interface ThemeMappingConfig<TTemplate extends ThemeMappingTemplate> {
  template: TTemplate;
  mappings?: ThemeMappingPathOverrides;
  fuzzy?: ThemeMapperFuzzyOptions;
  preserveLiterals?: boolean;
  requiredPaths?: string[];
}

interface ThemeMappingResolution {
  targetPath: string;
  sourceKey: string;
  sourcePath: string;
  value: string;
  reason:
    | "explicit"
    | "exact-base"
    | "exact-alias"
    | "fuzzy-base"
    | "fuzzy-alias";
}

interface ThemeMappingAmbiguous {
  targetPath: string;
  candidates: string[];
}

interface ThemeMappingUnresolved {
  targetPath: string;
  reason: string;
}

export interface ThemeMappingDiagnostics {
  resolved: ThemeMappingResolution[];
  ambiguous: ThemeMappingAmbiguous[];
  unresolved: ThemeMappingUnresolved[];
  missingRequired: string[];
}

export interface ThemeMappingResult<TTemplate extends ThemeMappingTemplate> {
  theme: TTemplate;
  diagnostics: ThemeMappingDiagnostics;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value != null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

function normalizeWord(word: string): string {
  const lower = word.toLowerCase();
  return SYNONYM_MAP[lower] ?? lower;
}

function splitWords(value: string): string[] {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(/[^a-zA-Z0-9]+/)
    .map((part) => normalizeWord(part))
    .filter(Boolean);
}

function normalizedKey(value: string): string {
  return splitWords(value).join("");
}

function modeFromTargetPath(targetPath: string): Mode | undefined {
  for (const part of targetPath.split(".")) {
    if (part === "light" || part === "dark") return part;
  }
  return undefined;
}

function addToken(
  exact: Map<string, ThemeSourceToken[]>,
  out: ThemeSourceToken[],
  token: ThemeSourceToken,
) {
  const exactKey = token.key.toLowerCase();
  out.push(token);
  const existing = exact.get(exactKey);
  if (existing) existing.push(token);
  else exact.set(exactKey, [token]);
}

function addSemanticTokens(
  exact: Map<string, ThemeSourceToken[]>,
  out: ThemeSourceToken[],
  mode: Mode,
  modePalette: ModePalette,
) {
  for (const [key, value] of Object.entries(modePalette.semantic)) {
    addToken(exact, out, {
      key: `${mode}.${key}`,
      sourcePath: `modes.${mode}.semantic.${key}`,
      value,
      mode,
      tier: "base",
    });
    addToken(exact, out, {
      key: `${mode}.semantic.${key}`,
      sourcePath: `modes.${mode}.semantic.${key}`,
      value,
      mode,
      tier: "base",
    });
  }
}

function addRampTokens(
  exact: Map<string, ThemeSourceToken[]>,
  out: ThemeSourceToken[],
  mode: Mode,
  modePalette: ModePalette,
) {
  for (const [rampName, rampValue] of Object.entries(modePalette.ramps)) {
    if (!rampValue) continue;
    for (const [step, value] of Object.entries(rampValue)) {
      addToken(exact, out, {
        key: `${mode}.${rampName}.${step}`,
        sourcePath: `modes.${mode}.ramps.${rampName}.${step}`,
        value,
        mode,
        tier: "base",
      });
      addToken(exact, out, {
        key: `${mode}.ramps.${rampName}.${step}`,
        sourcePath: `modes.${mode}.ramps.${rampName}.${step}`,
        value,
        mode,
        tier: "base",
      });
    }
  }
}

function pickStatus(
  modePalette: ModePalette,
  name: keyof typeof MUI_STATUS_FALLBACKS,
): string {
  if (name === "success")
    return modePalette.ramps.brand2?.[500] ?? MUI_STATUS_FALLBACKS.success;
  if (name === "warning")
    return modePalette.ramps.brand3?.[500] ?? MUI_STATUS_FALLBACKS.warning;
  if (name === "error")
    return modePalette.ramps.brand4?.[500] ?? MUI_STATUS_FALLBACKS.error;
  return modePalette.ramps.brand1?.[500] ?? MUI_STATUS_FALLBACKS.info;
}

function addAliasTokens(
  exact: Map<string, ThemeSourceToken[]>,
  out: ThemeSourceToken[],
  mode: Mode,
  modePalette: ModePalette,
) {
  const aliasValues: Record<string, string> = {
    "surface.page": modePalette.semantic.background,
    "surface.card": modePalette.semantic.card,
    "surface.subtle": modePalette.semantic.muted,
    "text.primary": modePalette.semantic.foreground,
    "text.muted": modePalette.semantic["muted-foreground"],
    "text.link": modePalette.semantic.accent,
    "accent.primary": modePalette.semantic.primary,
    "accent.secondary": modePalette.semantic.secondary,
    "accent.contrast": modePalette.semantic["primary-foreground"],
    "status.success": pickStatus(modePalette, "success"),
    "status.warning": pickStatus(modePalette, "warning"),
    "status.error": pickStatus(modePalette, "error"),
    "status.info": pickStatus(modePalette, "info"),
    "decorative.highlight": modePalette.semantic.accent,
    "decorative.neutral": modePalette.ramps.neutral[500],
    "decorative.positive": pickStatus(modePalette, "success"),
    "decorative.negative": pickStatus(modePalette, "error"),
  };

  for (const [alias, value] of Object.entries(aliasValues)) {
    addToken(exact, out, {
      key: `${mode}.${alias}`,
      sourcePath: `modes.${mode}.alias.${alias}`,
      value,
      mode,
      tier: "alias",
    });
  }
}

export function buildThemeSourceIndex(
  palette: PaletteConfig,
  options?: { derivedAliases?: boolean },
): ThemeSourceIndex {
  const exact = new Map<string, ThemeSourceToken[]>();
  const baseTokens: ThemeSourceToken[] = [];
  const aliasTokens: ThemeSourceToken[] = [];

  for (const mode of MODES) {
    const modePalette = palette.modes[mode];
    if (!modePalette) continue;
    addSemanticTokens(exact, baseTokens, mode, modePalette);
    addRampTokens(exact, baseTokens, mode, modePalette);
    if (options?.derivedAliases ?? true) {
      addAliasTokens(exact, aliasTokens, mode, modePalette);
    }
  }

  const tokens = [...baseTokens, ...aliasTokens];
  return { tokens, baseTokens, aliasTokens, exact };
}

function byTier(
  index: ThemeSourceIndex,
  tier: Tier,
  includeAliases: boolean,
): ThemeSourceToken[] {
  if (tier === "base") return index.baseTokens;
  return includeAliases ? index.aliasTokens : [];
}

function scoreMatch(targetPath: string, candidateKey: string): number {
  const target = normalizedKey(targetPath);
  const candidate = normalizedKey(candidateKey);
  if (target === candidate) return 1;
  if (candidate.includes(target)) return 0.88;
  if (target.includes(candidate)) return 0.8;

  const targetWords = splitWords(targetPath);
  const candidateWords = splitWords(candidateKey);
  if (!targetWords.length || !candidateWords.length) return 0;

  const candidateSet = new Set(candidateWords);
  let overlap = 0;
  for (const word of targetWords) {
    if (candidateSet.has(word)) overlap += 1;
  }
  const coverage = overlap / targetWords.length;
  const balance = overlap / Math.max(candidateWords.length, targetWords.length);
  return Math.max(coverage * 0.75 + balance * 0.25, 0);
}

function keyVariants(targetPath: string): string[] {
  const parts = targetPath.split(".").filter(Boolean);
  const variants: string[] = [targetPath];
  const mode = modeFromTargetPath(targetPath);
  if (mode) {
    const i = parts.findIndex((p) => p === mode);
    if (i >= 0) {
      const withoutMode = [...parts.slice(0, i), ...parts.slice(i + 1)].join(
        ".",
      );
      if (withoutMode) variants.push(withoutMode);
    }
  }
  if (parts.length >= 2) variants.push(parts.slice(-2).join("."));
  if (parts.length >= 1) variants.push(parts[parts.length - 1]!);
  return [...new Set(variants)];
}

function chooseByMode(
  targetMode: Mode | undefined,
  matches: ThemeSourceToken[],
): ThemeSourceToken[] {
  if (!targetMode) return matches;
  const byMode = matches.filter((m) => m.mode === targetMode);
  return byMode.length ? byMode : matches;
}

function exactResolve(
  index: ThemeSourceIndex,
  targetPath: string,
  tier: Tier,
  includeAliases: boolean,
): { chosen?: ThemeSourceToken; ambiguous?: ThemeSourceToken[] } {
  const variants = keyVariants(targetPath);
  const allowed = new Set(byTier(index, tier, includeAliases));
  const mode = modeFromTargetPath(targetPath);

  for (const variant of variants) {
    const found = index.exact.get(variant.toLowerCase()) ?? [];
    const tierMatches = found.filter((token) => allowed.has(token));
    if (!tierMatches.length) continue;
    const modeMatches = chooseByMode(mode, tierMatches);
    if (modeMatches.length === 1) return { chosen: modeMatches[0] };
    return { ambiguous: modeMatches };
  }
  return {};
}

function fuzzyResolve(
  index: ThemeSourceIndex,
  targetPath: string,
  tier: Tier,
  includeAliases: boolean,
  minScore: number,
): { chosen?: ThemeSourceToken; ambiguous?: ThemeSourceToken[] } {
  const mode = modeFromTargetPath(targetPath);
  const source = chooseByMode(mode, byTier(index, tier, includeAliases));

  const ranked = source
    .map((token) => ({ token, score: scoreMatch(targetPath, token.key) }))
    .filter((entry) => entry.score >= minScore)
    .sort((a, b) => b.score - a.score);

  if (!ranked.length) return {};
  if (ranked.length === 1) return { chosen: ranked[0]!.token };

  const top = ranked[0]!;
  const second = ranked[1]!;
  if (top.score - second.score <= 0.05) {
    return { ambiguous: ranked.slice(0, 3).map((r) => r.token) };
  }
  return { chosen: top.token };
}

function isLiteralPlaceholder(value: unknown): boolean {
  return value == null || value === "";
}

function shouldKeepLiteral(value: unknown, preserveLiterals: boolean): boolean {
  if (!preserveLiterals) return false;
  return !isLiteralPlaceholder(value);
}

function resolveExplicitMapping(
  mappingSource: string,
  targetPath: string,
  index: ThemeSourceIndex,
): {
  chosen?: ThemeSourceToken;
  unresolved?: string;
  ambiguous?: ThemeSourceToken[];
} {
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(mappingSource)) {
    return {
      chosen: {
        key: mappingSource,
        sourcePath: mappingSource,
        value: mappingSource,
        tier: "base",
      },
    };
  }

  const mode = modeFromTargetPath(targetPath);
  const found = index.exact.get(mappingSource.toLowerCase()) ?? [];
  if (!found.length) {
    return {
      unresolved: `explicit mapping "${mappingSource}" did not match any source token`,
    };
  }

  const modeMatches = chooseByMode(mode, found);
  if (modeMatches.length === 1) return { chosen: modeMatches[0] };
  return { ambiguous: modeMatches };
}

export function mapPaletteToTheme<TTemplate extends ThemeMappingTemplate>(
  palette: PaletteConfig,
  config: ThemeMappingConfig<TTemplate>,
): ThemeMappingResult<TTemplate> {
  const includeAliases = config.fuzzy?.derivedAliases ?? true;
  const fuzzyEnabled = config.fuzzy?.enabled ?? true;
  const minScore = config.fuzzy?.minScore ?? 0.45;
  const preserveLiterals = config.preserveLiterals ?? true;

  const index = buildThemeSourceIndex(palette, {
    derivedAliases: includeAliases,
  });

  const diagnostics: ThemeMappingDiagnostics = {
    resolved: [],
    ambiguous: [],
    unresolved: [],
    missingRequired: [],
  };

  const unresolvedPaths = new Set<string>();

  const mapNode = (node: unknown, path: string[]): unknown => {
    if (Array.isArray(node)) {
      return node.map((item, i) => mapNode(item, [...path, String(i)]));
    }
    if (isPlainObject(node)) {
      const out: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(node)) {
        out[key] = mapNode(value, [...path, key]);
      }
      return out;
    }

    const targetPath = path.join(".");
    const explicit = config.mappings?.[targetPath];
    if (!explicit && shouldKeepLiteral(node, preserveLiterals)) {
      return node;
    }

    if (explicit) {
      const resolved = resolveExplicitMapping(explicit, targetPath, index);
      if (resolved.chosen) {
        diagnostics.resolved.push({
          targetPath,
          sourceKey: resolved.chosen.key,
          sourcePath: resolved.chosen.sourcePath,
          value: resolved.chosen.value,
          reason: "explicit",
        });
        return resolved.chosen.value;
      }
      if (resolved.ambiguous) {
        diagnostics.ambiguous.push({
          targetPath,
          candidates: resolved.ambiguous.map((t) => t.key),
        });
      } else {
        diagnostics.unresolved.push({
          targetPath,
          reason:
            resolved.unresolved ?? "explicit mapping could not be resolved",
        });
      }
      unresolvedPaths.add(targetPath);
      return node;
    }

    for (const [tier, reason] of [
      ["base", "exact-base"],
      ["alias", "exact-alias"],
    ] as const) {
      const resolved = exactResolve(index, targetPath, tier, includeAliases);
      if (resolved.chosen) {
        diagnostics.resolved.push({
          targetPath,
          sourceKey: resolved.chosen.key,
          sourcePath: resolved.chosen.sourcePath,
          value: resolved.chosen.value,
          reason,
        });
        return resolved.chosen.value;
      }
      if (resolved.ambiguous) {
        diagnostics.ambiguous.push({
          targetPath,
          candidates: resolved.ambiguous.map((t) => t.key),
        });
        unresolvedPaths.add(targetPath);
        return node;
      }
    }

    if (fuzzyEnabled) {
      for (const [tier, reason] of [
        ["base", "fuzzy-base"],
        ["alias", "fuzzy-alias"],
      ] as const) {
        const resolved = fuzzyResolve(
          index,
          targetPath,
          tier,
          includeAliases,
          minScore,
        );
        if (resolved.chosen) {
          diagnostics.resolved.push({
            targetPath,
            sourceKey: resolved.chosen.key,
            sourcePath: resolved.chosen.sourcePath,
            value: resolved.chosen.value,
            reason,
          });
          return resolved.chosen.value;
        }
        if (resolved.ambiguous) {
          diagnostics.ambiguous.push({
            targetPath,
            candidates: resolved.ambiguous.map((t) => t.key),
          });
          unresolvedPaths.add(targetPath);
          return node;
        }
      }
    }

    diagnostics.unresolved.push({
      targetPath,
      reason: "no matching source token",
    });
    unresolvedPaths.add(targetPath);
    return node;
  };

  const theme = mapNode(config.template, []) as TTemplate;
  const required = config.requiredPaths ?? [];
  diagnostics.missingRequired = required.filter((path) =>
    unresolvedPaths.has(path),
  );
  return { theme, diagnostics };
}
