import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("CLI api main()", () => {
  it("uses provided args for --version", async () => {
    vi.stubGlobal("__PKG_VERSION__", "1.0.0-test");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const { main } = await import("../src/cli/api.js");

    await main(["--version"]);

    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledWith("1.0.0-test");
  });

  it("uses provided args for --help", async () => {
    vi.stubGlobal("__PKG_VERSION__", "1.0.0-test");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const { main } = await import("../src/cli/api.js");

    await main(["--help"]);

    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(String(logSpy.mock.calls[0]?.[0])).toContain("frosting v");
  });
});
