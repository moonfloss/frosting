export interface ChakraThemeOptions {
  /** CVD variant name (e.g. "protanopia"). Default "default". */
  variant?: string;
  /** Include color ramps (brand1, brand2, neutral, etc.). Default true. */
  includeRamps?: boolean;
  /** Include semantic tokens (background, primary, etc.). Default true. */
  includeSemantic?: boolean;
  /** Prefix for color keys (e.g. "frosting" yields frosting-brand1). */
  prefix?: string;
}
