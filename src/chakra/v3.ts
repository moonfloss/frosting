import type { PaletteConfig } from "../index";
import type { ChakraThemeOptions } from "./types";

// TODO: Chakra UI v3 uses createSystem/defineConfig with a different token structure.
// Implement generateChakraV3Config to return a v3-compatible config (value wrappers, base/_dark).
// See Chakra v3 docs for defineConfig and token format.

/**
 * Returns a Chakra UI v3 defineConfig-compatible object.
 * Stub: not yet implemented; use generateChakraTheme for v2.
 */
export function generateChakraV3Config(
  _config: PaletteConfig,
  _options?: ChakraThemeOptions,
): Record<string, unknown> {
  return {};
}
