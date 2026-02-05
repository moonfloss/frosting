export interface CssVarOptions {
  selector?: string; // default ":root"
  includeRamps?: boolean; // default true
  includeSemantic?: boolean; // default true
}

export interface TailwindThemeOptions {
  includeRamps?: boolean; // default true
  includeSemantic?: boolean; // default true
}

export interface FrostingPluginOptions
  extends CssVarOptions,
    TailwindThemeOptions {}
