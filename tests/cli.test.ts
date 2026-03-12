import { describe, it, expect, beforeAll } from "vitest";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import fs from "node:fs";

const exec = promisify(execFile);
const CLI = path.resolve(__dirname, "../dist/cli/index.js");
const FIXTURES = path.resolve(__dirname, "fixtures");

function run(args: string[]) {
  return exec("node", [CLI, ...args], { timeout: 10_000 });
}

beforeAll(() => {
  if (!fs.existsSync(CLI)) {
    throw new Error("CLI not built. Run `npm run build` first.");
  }
});

describe("CLI", () => {
  describe("help", () => {
    it("prints help with no args", async () => {
      const { stdout } = await run([]);
      expect(stdout).toContain("frosting v");
      expect(stdout).toContain("wizard");
      expect(stdout).toContain("config:");
    });

    it("prints help with --help", async () => {
      const { stdout } = await run(["--help"]);
      expect(stdout).toContain("frosting v");
    });

    it("prints help with -h", async () => {
      const { stdout } = await run(["-h"]);
      expect(stdout).toContain("frosting v");
    });

    it("prints help with 'help' subcommand", async () => {
      const { stdout } = await run(["help"]);
      expect(stdout).toContain("frosting v");
    });
  });

  describe("version", () => {
    it("prints version with --version", async () => {
      const { stdout } = await run(["--version"]);
      expect(stdout.trim()).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it("prints version with -v", async () => {
      const { stdout } = await run(["-v"]);
      expect(stdout.trim()).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });

  describe("config mode", () => {
    it("generates valid JSON from brand input", async () => {
      const { stdout } = await run([`config:${FIXTURES}/brand-input.json`]);
      const palette = JSON.parse(stdout);
      expect(palette.version).toBe("1.0.0");
      expect(palette.modes.light).toBeDefined();
      expect(palette.modes.dark).toBeDefined();
      expect(palette.modes.light.ramps.brand1[500]).toBe("#7C3AED");
    });

    it("generates valid JSON from scheme input", async () => {
      const { stdout } = await run([`config:${FIXTURES}/scheme-input.json`]);
      const palette = JSON.parse(stdout);
      expect(palette.inputs.schemeUsed).toBeDefined();
      expect(palette.inputs.brand.light.length).toBe(3);
    });

    it("fails with invalid input", async () => {
      await expect(
        run([`config:${FIXTURES}/invalid-input.json`]),
      ).rejects.toThrow();
    });

    it("fails with nonexistent file", async () => {
      await expect(run(["config:nonexistent-file.json"])).rejects.toThrow();
    });

    it("defaults brandTint and neonChromaRolloff to true", async () => {
      const { stdout } = await run([`config:${FIXTURES}/brand-input.json`]);
      const palette = JSON.parse(stdout);
      expect(palette.inputs.optionsUsed.brandTint).toBe(true);
      expect(palette.inputs.optionsUsed.neonChromaRolloff).toBe(true);
    });

    it("no-tint disables brandTint", async () => {
      const { stdout } = await run([
        `config:${FIXTURES}/brand-input.json`,
        "no-tint",
      ]);
      const palette = JSON.parse(stdout);
      expect(palette.inputs.optionsUsed.brandTint).toBe(false);
      expect(palette.inputs.optionsUsed.neonChromaRolloff).toBe(true);
    });

    it("no-rolloff disables neonChromaRolloff", async () => {
      const { stdout } = await run([
        `config:${FIXTURES}/brand-input.json`,
        "no-rolloff",
      ]);
      const palette = JSON.parse(stdout);
      expect(palette.inputs.optionsUsed.brandTint).toBe(true);
      expect(palette.inputs.optionsUsed.neonChromaRolloff).toBe(false);
    });

    it("map: outputs mapped theme JSON when mapping config is provided", async () => {
      const { stdout } = await run([
        `config:${FIXTURES}/brand-input.json`,
        `map:${FIXTURES}/map-config.json`,
      ]);
      const mapped = JSON.parse(stdout);
      expect(mapped.version).toBe(1);
      expect(mapped.light.surface.page).toMatch(/^#[0-9a-f]{6}$/i);
      expect(mapped.light.status.warning).toBe("#ed6c02");
      expect(mapped).not.toHaveProperty("modes");
    });

    it("fails when map config is invalid", async () => {
      await expect(
        run([
          `config:${FIXTURES}/brand-input.json`,
          `map:${FIXTURES}/map-config-invalid.json`,
        ]),
      ).rejects.toThrow(/template/i);
    });

    it("fails with friendly error when map config JSON is malformed", async () => {
      await expect(
        run([
          `config:${FIXTURES}/brand-input.json`,
          `map:${FIXTURES}/map-config-malformed.json`,
        ]),
      ).rejects.toThrow(/Invalid JSON/i);
    });

    it("fails when mappings is an array", async () => {
      await expect(
        run([
          `config:${FIXTURES}/brand-input.json`,
          `map:${FIXTURES}/map-config-mappings-array.json`,
        ]),
      ).rejects.toThrow(/mappings.*object/i);
    });

    it("fails when required mapped paths are unresolved", async () => {
      await expect(
        run([
          `config:${FIXTURES}/brand-input.json`,
          `map:${FIXTURES}/map-config-missing-required.json`,
        ]),
      ).rejects.toThrow(/missing required paths/i);
    });
  });

  describe("version arg", () => {
    it("defaults palette version to 1.0.0", async () => {
      const { stdout } = await run([`config:${FIXTURES}/brand-input.json`]);
      const palette = JSON.parse(stdout);
      expect(palette.version).toBe("1.0.0");
    });

    it("version: sets custom palette version", async () => {
      const { stdout } = await run([
        `config:${FIXTURES}/brand-input.json`,
        "version:2.0.0",
      ]);
      const palette = JSON.parse(stdout);
      expect(palette.version).toBe("2.0.0");
    });

    it("ver: alias sets custom palette version", async () => {
      const { stdout } = await run([
        `config:${FIXTURES}/brand-input.json`,
        "ver:3.1.0",
      ]);
      const palette = JSON.parse(stdout);
      expect(palette.version).toBe("3.1.0");
    });

    it("output does not contain generatedAt", async () => {
      const { stdout } = await run([`config:${FIXTURES}/brand-input.json`]);
      const palette = JSON.parse(stdout);
      expect(palette.generatedAt).toBeUndefined();
    });
  });

  describe("variant filtering", () => {
    it("exclude:dk removes dark mode", async () => {
      const { stdout } = await run([
        `config:${FIXTURES}/brand-input.json`,
        "exclude:dk",
      ]);
      const palette = JSON.parse(stdout);
      expect(palette.modes.light).toBeDefined();
      expect(palette.modes.dark).toBeUndefined();
    });

    it("only:lt keeps only light mode", async () => {
      const { stdout } = await run([
        `config:${FIXTURES}/brand-input.json`,
        "only:lt",
      ]);
      const palette = JSON.parse(stdout);
      expect(palette.modes.light).toBeDefined();
      expect(palette.modes.dark).toBeUndefined();
    });
  });
});
