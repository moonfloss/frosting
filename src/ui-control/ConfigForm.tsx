import { useEffect, useState } from "react";
import type { CvdType, SchemeKind } from "../index";
import {
  RadioGroupField,
  ColorField,
  SelectField,
  SliderField,
  CheckboxField,
  CheckboxGroupField,
} from "./fields";
import {
  HtmlRadioGroupField,
  HtmlColorField,
  HtmlSelectField,
  HtmlSliderField,
  HtmlCheckboxField,
  HtmlCheckboxGroupField,
} from "./html";
import {
  PaletteConfigForm,
  type PaletteConfigFormRenderProps,
} from "./PaletteConfigForm";
import { RampPreview } from "./RampPreview";
import { SemanticPreview } from "./SemanticPreview";
import { CVD_OPTIONS, SCHEME_KINDS } from "./paletteConfigFormModel";

function ConfigFormContent({
  form,
}: {
  form: PaletteConfigFormRenderProps;
}) {
  const [previewMode, setPreviewMode] = useState<"light" | "dark">("light");
  const [previewVariant, setPreviewVariant] = useState<"default" | CvdType>(
    "default",
  );
  const { fields, brandColors, palette, values } = form;

  const modePalette =
    palette &&
    (previewVariant === "default"
      ? palette.modes[previewMode]
      : (palette.variants?.[previewVariant]?.modes[previewMode] ??
        palette.modes[previewMode]));

  useEffect(() => {
    if (
      previewVariant !== "default" &&
      (!palette?.variants || !(previewVariant in palette.variants))
    ) {
      setPreviewVariant("default");
    }
  }, [palette?.variants, previewVariant, setPreviewVariant]);

  return (
    <div className="flex min-h-screen flex-col gap-6 bg-gray-100 p-6 md:flex-row">
      <aside className="w-full shrink-0 rounded-lg border border-gray-200 bg-white p-4 shadow-sm md:w-80">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">Config</h2>

        <div className="mb-4">
          <RadioGroupField<"brand" | "scheme">
            value={fields.inputMode.value}
            onChange={fields.inputMode.onChange}
            label="Input mode"
            options={[
              { value: "brand", label: "Brand colors" },
              { value: "scheme", label: "Scheme" },
            ]}
            render={(props) => <HtmlRadioGroupField {...props} />}
          />
        </div>

        {values.inputMode === "brand" && (
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Brand colors (1–4)
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => brandColors.add()}
                  disabled={!brandColors.canAdd}
                  className="rounded bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                >
                  + Add
                </button>
                <button
                  type="button"
                  onClick={() => brandColors.remove()}
                  disabled={!brandColors.canRemove}
                  className="rounded bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                >
                  − Remove
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {brandColors.fields.map((field) => (
                <ColorField
                  key={field.index}
                  value={field.value}
                  onChange={field.onChange}
                  onTextChange={field.onTextChange}
                  render={(props) => <HtmlColorField {...props} />}
                />
              ))}
            </div>
          </div>
        )}

        {values.inputMode === "scheme" && (
          <div className="mb-4 space-y-3">
            <SelectField<SchemeKind>
              value={fields.schemeKind.value}
              onChange={fields.schemeKind.onChange}
              label="Kind"
              options={SCHEME_KINDS.map((k) => ({ value: k, label: k }))}
              render={(props) => <HtmlSelectField {...props} />}
            />
            <ColorField
              value={fields.schemeBase.value}
              onChange={fields.schemeBase.onChange}
              onTextChange={fields.schemeBase.onTextChange}
              label="Base"
              className="mt-1"
              render={(props) => <HtmlColorField {...props} />}
            />
            <SelectField<1 | 2 | 3 | 4>
              value={fields.schemeCount.value}
              onChange={fields.schemeCount.onChange}
              label="Count"
              options={([1, 2, 3, 4] as const).map((n) => ({
                value: n,
                label: String(n),
              }))}
              render={(props) => <HtmlSelectField {...props} />}
            />
            <SliderField
              value={fields.spreadDegrees.value}
              onChange={fields.spreadDegrees.onChange}
              label="Spread degrees"
              min={0}
              max={90}
              step={1}
              render={(props) => <HtmlSliderField {...props} />}
            />
            <SliderField
              value={fields.secondaryChromaScale.value}
              onChange={fields.secondaryChromaScale.onChange}
              label="Secondary chroma scale"
              min={0}
              max={1}
              step={0.05}
              render={(props) => <HtmlSliderField {...props} />}
            />
          </div>
        )}

        <div className="mb-4 border-t border-gray-200 pt-4">
          <span className="text-sm font-medium text-gray-700">Overrides</span>
          <div className="mt-2 space-y-2">
            <ColorField
              value={fields.backgroundLight.value}
              onChange={fields.backgroundLight.onChange}
              onTextChange={fields.backgroundLight.onTextChange}
              label="Bg light"
              render={(props) => <HtmlColorField {...props} />}
            />
            <ColorField
              value={fields.backgroundDark.value}
              onChange={fields.backgroundDark.onChange}
              onTextChange={fields.backgroundDark.onTextChange}
              label="Bg dark"
              render={(props) => <HtmlColorField {...props} />}
            />
            <ColorField
              value={fields.foregroundLight.value}
              onChange={fields.foregroundLight.onChange}
              onTextChange={fields.foregroundLight.onTextChange}
              label="Fg light"
              render={(props) => <HtmlColorField {...props} />}
            />
            <ColorField
              value={fields.foregroundDark.value}
              onChange={fields.foregroundDark.onChange}
              onTextChange={fields.foregroundDark.onTextChange}
              label="Fg dark"
              render={(props) => <HtmlColorField {...props} />}
            />
          </div>
        </div>

        <div className="mb-4 border-t border-gray-200 pt-4">
          <span className="text-sm font-medium text-gray-700">Options</span>
          <div className="mt-2 space-y-2">
            <CheckboxField
              value={fields.brandTint.value}
              onChange={fields.brandTint.onChange}
              label="Brand tint neutrals"
              render={(props) => <HtmlCheckboxField {...props} />}
            />
            <CheckboxField
              value={fields.neonChromaRolloff.value}
              onChange={fields.neonChromaRolloff.onChange}
              label="Neon chroma rolloff"
              render={(props) => <HtmlCheckboxField {...props} />}
            />
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <CheckboxGroupField<CvdType>
            values={fields.cvdVariants.values}
            toggle={fields.cvdVariants.toggle}
            label="CVD variants"
            options={CVD_OPTIONS.map((cvd) => ({ value: cvd, label: cvd }))}
            render={(props) => <HtmlCheckboxGroupField {...props} />}
          />
        </div>
      </aside>

      <main className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">Preview</h2>
        {!palette && (
          <p className="text-sm text-amber-600">
            Enter at least one valid brand color or a valid scheme base to see
            the palette.
          </p>
        )}
        {palette && modePalette && (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="mr-2 text-sm font-medium text-gray-600">
                Mode:
              </span>
              <button
                type="button"
                onClick={() => setPreviewMode("light")}
                className={`rounded px-3 py-1.5 text-sm font-medium ${
                  previewMode === "light"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Light
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode("dark")}
                className={`rounded px-3 py-1.5 text-sm font-medium ${
                  previewMode === "dark"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Dark
              </button>
              <div className="ml-2 flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">
                  Variant:
                </span>
                <SelectField<"default" | CvdType>
                  value={previewVariant}
                  onChange={setPreviewVariant}
                  className="w-36"
                  options={[
                    { value: "default", label: "Default" },
                    ...(palette.variants
                      ? (Object.keys(palette.variants) as CvdType[]).map(
                          (cvd) => ({
                            value: cvd,
                            label: cvd.charAt(0).toUpperCase() + cvd.slice(1),
                          }),
                        )
                      : []),
                  ]}
                  render={(props) => <HtmlSelectField {...props} />}
                />
              </div>
            </div>
            <div
              className="mb-6 rounded-lg border border-gray-200 p-4"
              style={{
                backgroundColor: modePalette.semantic.background,
                color: modePalette.semantic.foreground,
              }}
            >
              <div className="space-y-4">
                <RampPreview
                  ramp={modePalette.ramps.brand1}
                  label="Brand 1"
                  className="mb-4"
                />
                {modePalette.ramps.brand2 && (
                  <RampPreview
                    ramp={modePalette.ramps.brand2}
                    label="Brand 2"
                    className="mb-4"
                  />
                )}
                {modePalette.ramps.brand3 && (
                  <RampPreview
                    ramp={modePalette.ramps.brand3}
                    label="Brand 3"
                    className="mb-4"
                  />
                )}
                {modePalette.ramps.brand4 && (
                  <RampPreview
                    ramp={modePalette.ramps.brand4}
                    label="Brand 4"
                    className="mb-4"
                  />
                )}
                <RampPreview
                  ramp={modePalette.ramps.neutral}
                  label="Neutral"
                  className="mb-4"
                />
              </div>
              <SemanticPreview
                semantic={modePalette.semantic}
                className="mt-6"
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export function ConfigForm() {
  return <PaletteConfigForm>{(form) => <ConfigFormContent form={form} />}</PaletteConfigForm>;
}
