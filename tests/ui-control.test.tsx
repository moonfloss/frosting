import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  ConfigForm,
  PaletteConfigForm,
  type PaletteConfigFormSubmit,
} from "../src/ui-control/index.js";

describe("PaletteConfigForm", () => {
  it("supports custom rendering, repeated brand-color helpers, and submit payloads", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn<(payload: PaletteConfigFormSubmit) => void>();

    render(
      <PaletteConfigForm onSubmit={onSubmit}>
        {(form) => (
          <form onSubmit={form.handleSubmit}>
            <div data-testid="brand-count">{form.brandColors.values.length}</div>
            <button type="button" onClick={() => form.brandColors.add()}>
              Add color
            </button>
            <button type="button" onClick={() => form.brandColors.remove()}>
              Remove color
            </button>
            <button
              type="button"
              onClick={() => form.fields.inputMode.onChange("scheme")}
            >
              Use scheme
            </button>
            <label>
              Scheme base
              <input
                value={form.fields.schemeBase.value}
                onChange={(event) =>
                  form.fields.schemeBase.onTextChange(event.target.value)
                }
              />
            </label>
            <div data-testid="is-valid">{String(form.isValid)}</div>
            <button type="submit">Submit</button>
          </form>
        )}
      </PaletteConfigForm>,
    );

    expect(screen.getByTestId("brand-count")).toHaveTextContent("1");

    await user.click(screen.getByRole("button", { name: "Add color" }));
    expect(screen.getByTestId("brand-count")).toHaveTextContent("2");

    await user.click(screen.getByRole("button", { name: "Remove color" }));
    expect(screen.getByTestId("brand-count")).toHaveTextContent("1");

    await user.click(screen.getByRole("button", { name: "Use scheme" }));

    const schemeBaseInput = screen.getByLabelText("Scheme base");
    await user.clear(schemeBaseInput);
    expect(screen.getByTestId("is-valid")).toHaveTextContent("false");

    await user.click(screen.getByRole("button", { name: "Submit" }));
    expect(onSubmit).not.toHaveBeenCalled();

    await user.type(schemeBaseInput, "#f59e0b");
    expect(screen.getByTestId("is-valid")).toHaveTextContent("true");

    await user.click(screen.getByRole("button", { name: "Submit" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0]?.[0].input).toEqual({
      scheme: {
        kind: "adjacent",
        base: "#f59e0b",
        count: 2,
        spreadDegrees: 30,
        secondaryChromaScale: 0.8,
      },
    });
  });
});

describe("ConfigForm", () => {
  it("renders the default preview for the initial valid state", () => {
    render(<ConfigForm />);

    expect(screen.getByText("Config")).toBeInTheDocument();
    expect(screen.getByText("Preview")).toBeInTheDocument();
    expect(screen.getByText("Brand 1")).toBeInTheDocument();
    expect(screen.getByText("Neutral")).toBeInTheDocument();
    expect(screen.getByText("Semantic tokens")).toBeInTheDocument();
  });

  it("shows the invalid-input preview message when the last brand color is cleared", async () => {
    const user = userEvent.setup();
    const { container } = render(<ConfigForm />);

    const firstTextInput = container.querySelector('input[type="text"]');
    if (!(firstTextInput instanceof HTMLInputElement)) {
      throw new Error("Expected ConfigForm to render a brand color text input.");
    }

    await user.clear(firstTextInput);

    expect(
      screen.getByText(
        "Enter at least one valid brand color or a valid scheme base to see the palette.",
      ),
    ).toBeInTheDocument();
  });
});
