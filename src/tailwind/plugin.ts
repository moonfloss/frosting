import type { PaletteConfig } from "../index";
import { getCssVarsForAddBase } from "./css";
import { generateTailwindTheme } from "./theme";
import type { FrostingPluginOptions } from "./types";

// Tailwind plugin is CJS; use default import for ESM interop
import tailwindPlugin from "tailwindcss/plugin";

export function frostingPlugin(
  config: PaletteConfig,
  options?: FrostingPluginOptions,
): ReturnType<typeof tailwindPlugin> {
  const pluginOptions = options ?? {};
  const themeExtend = generateTailwindTheme(config, pluginOptions);
  const baseStyles = getCssVarsForAddBase(config, pluginOptions);

  return tailwindPlugin(
    ({ addBase }) => {
      addBase(baseStyles);
    },
    {
      theme: {
        extend: themeExtend,
      },
    },
  );
}
