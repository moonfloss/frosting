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
      await expect(
        run(["config:nonexistent-file.json"]),
      ).rejects.toThrow();
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
