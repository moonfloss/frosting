import { useEffect, useMemo, useState } from "react";
import { generatePalette } from "../index";
import type {
  PaletteConfig,
  PaletteInput,
  PaletteOptions,
  HexColor,
  BrandArray,
  SchemeKind,
  CvdType,
} from "../index";
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
import { RampPreview } from "./RampPreview";
import { SemanticPreview } from "./SemanticPreview";

const SCHEME_KINDS: SchemeKind[] = [
  "monochromatic",
  "adjacent",
  "adjacent+complementary",
  "triad",
  "tetrad",
];

const CVD_OPTIONS: CvdType[] = ["protanopia", "deuteranopia", "tritanopia"];

const HEX_REGEX = /^#[0-9a-fA-F]{6}$/;
function parseHex(s: string): HexColor | null {
  const n = s.trim();
  if (!n) return null;
  const withHash = n.startsWith("#") ? n : `#${n}`;
  return HEX_REGEX.test(withHash) ? (withHash as HexColor) : null;
}

function toBrandArray(arr: HexColor[]): BrandArray {
  if (arr.length === 1) return [arr[0]];
  if (arr.length === 2) return [arr[0], arr[1]];
  if (arr.length === 3) return [arr[0], arr[1], arr[2]];
  return [arr[0], arr[1], arr[2], arr[3]];
}

export function ConfigForm() {
  const [inputMode, setInputMode] = useState<"brand" | "scheme">("brand");
  const [brandColors, setBrandColors] = useState<string[]>(["#6366f1"]);
  const [schemeKind, setSchemeKind] = useState<SchemeKind>("adjacent");
  const [schemeBase, setSchemeBase] = useState("#6366f1");
  const [schemeCount, setSchemeCount] = useState<1 | 2 | 3 | 4>(2);
  const [spreadDegrees, setSpreadDegrees] = useState(30);
  const [secondaryChromaScale, setSecondaryChromaScale] = useState(0.8);
  const [backgroundLight, setBackgroundLight] = useState("");
  const [backgroundDark, setBackgroundDark] = useState("");
  const [foregroundLight, setForegroundLight] = useState("");
  const [foregroundDark, setForegroundDark] = useState("");
  const [brandTint, setBrandTint] = useState(true);
  const [neonChromaRolloff, setNeonChromaRolloff] = useState(true);
  const [cvdVariants, setCvdVariants] = useState<CvdType[]>([]);
  const [previewMode, setPreviewMode] = useState<"light" | "dark">("light");
  const [previewVariant, setPreviewVariant] = useState<"default" | CvdType>(
    "default",
  );

  const input: PaletteInput | null = useMemo(() => {
    const bgLight = parseHex(backgroundLight);
    const bgDark = parseHex(backgroundDark);
    const fgLight = parseHex(foregroundLight);
    const fgDark = parseHex(foregroundDark);
    const bg =
      bgLight || bgDark
        ? {
            ...(bgLight && { light: bgLight }),
            ...(bgDark && { dark: bgDark }),
          }
        : undefined;
    const fg =
      fgLight || fgDark
        ? {
            ...(fgLight && { light: fgLight }),
            ...(fgDark && { dark: fgDark }),
          }
        : undefined;

    if (inputMode === "brand") {
      const hexes = brandColors
        .map((c) => parseHex(c))
        .filter((h): h is HexColor => h != null);
      if (hexes.length < 1) return null;
      return {
        brand: toBrandArray(hexes),
        background: bg,
        foreground: fg,
      };
    }
    const baseHex = parseHex(schemeBase);
    if (!baseHex) return null;
    return {
      scheme: {
        kind: schemeKind,
        base: baseHex,
        count: schemeCount,
        spreadDegrees,
        secondaryChromaScale,
      },
      background: bg,
      foreground: fg,
    };
  }, [
    inputMode,
    brandColors,
    schemeKind,
    schemeBase,
    schemeCount,
    spreadDegrees,
    secondaryChromaScale,
    backgroundLight,
    backgroundDark,
    foregroundLight,
    foregroundDark,
  ]);

  const options: PaletteOptions = useMemo(
    () => ({
      brandTint,
      neonChromaRolloff,
      cvdVariants: cvdVariants.length ? cvdVariants : undefined,
    }),
    [brandTint, neonChromaRolloff, cvdVariants],
  );

  const palette: PaletteConfig | null = useMemo(() => {
    if (!input) return null;
    try {
      return generatePalette(input, options);
    } catch {
      return null;
    }
  }, [input, options]);

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
  }, [palette?.variants, previewVariant]);

  const setBrandColor = (index: number, value: string) => {
    setBrandColors((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const addBrandColor = () => {
    if (brandColors.length >= 4) return;
    setBrandColors((prev) => [...prev, "#94a3b8"]);
  };

  const removeBrandColor = () => {
    if (brandColors.length <= 1) return;
    setBrandColors((prev) => prev.slice(0, -1));
  };

  const toggleCvd = (cvd: CvdType) => {
    setCvdVariants((prev) =>
      prev.includes(cvd) ? prev.filter((x) => x !== cvd) : [...prev, cvd],
    );
  };

  return (
    <div className="flex min-h-screen flex-col gap-6 bg-gray-100 p-6 md:flex-row">
      <aside className="w-full shrink-0 rounded-lg border border-gray-200 bg-white p-4 shadow-sm md:w-80">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">Config</h2>

        <div className="mb-4">
          <RadioGroupField<"brand" | "scheme">
            value={inputMode}
            onChange={setInputMode}
            label="Input mode"
            options={[
              { value: "brand", label: "Brand colors" },
              { value: "scheme", label: "Scheme" },
            ]}
            render={(props) => <HtmlRadioGroupField {...props} />}
          />
        </div>

        {inputMode === "brand" && (
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Brand colors (1–4)
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={addBrandColor}
                  disabled={brandColors.length >= 4}
                  className="rounded bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                >
                  + Add
                </button>
                <button
                  type="button"
                  onClick={removeBrandColor}
                  disabled={brandColors.length <= 1}
                  className="rounded bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                >
                  − Remove
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {brandColors.map((color, i) => (
                <ColorField
                  key={i}
                  value={color}
                  onChange={(hex) => setBrandColor(i, hex)}
                  onTextChange={(raw) => setBrandColor(i, raw)}
                  render={(props) => <HtmlColorField {...props} />}
                />
              ))}
            </div>
          </div>
        )}

        {inputMode === "scheme" && (
          <div className="mb-4 space-y-3">
            <SelectField<SchemeKind>
              value={schemeKind}
              onChange={setSchemeKind}
              label="Kind"
              options={SCHEME_KINDS.map((k) => ({ value: k, label: k }))}
              render={(props) => <HtmlSelectField {...props} />}
            />
            <ColorField
              value={schemeBase}
              onChange={setSchemeBase}
              onTextChange={setSchemeBase}
              label="Base"
              className="mt-1"
              render={(props) => <HtmlColorField {...props} />}
            />
            <SelectField<1 | 2 | 3 | 4>
              value={schemeCount}
              onChange={setSchemeCount}
              label="Count"
              options={([1, 2, 3, 4] as const).map((n) => ({
                value: n,
                label: String(n),
              }))}
              render={(props) => <HtmlSelectField {...props} />}
            />
            <SliderField
              value={spreadDegrees}
              onChange={setSpreadDegrees}
              label="Spread degrees"
              min={0}
              max={90}
              step={1}
              render={(props) => <HtmlSliderField {...props} />}
            />
            <SliderField
              value={secondaryChromaScale}
              onChange={setSecondaryChromaScale}
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
              value={backgroundLight}
              onChange={setBackgroundLight}
              onTextChange={setBackgroundLight}
              label="Bg light"
              render={(props) => <HtmlColorField {...props} />}
            />
            <ColorField
              value={backgroundDark}
              onChange={setBackgroundDark}
              onTextChange={setBackgroundDark}
              label="Bg dark"
              render={(props) => <HtmlColorField {...props} />}
            />
            <ColorField
              value={foregroundLight}
              onChange={setForegroundLight}
              onTextChange={setForegroundLight}
              label="Fg light"
              render={(props) => <HtmlColorField {...props} />}
            />
            <ColorField
              value={foregroundDark}
              onChange={setForegroundDark}
              onTextChange={setForegroundDark}
              label="Fg dark"
              render={(props) => <HtmlColorField {...props} />}
            />
          </div>
        </div>

        <div className="mb-4 border-t border-gray-200 pt-4">
          <span className="text-sm font-medium text-gray-700">Options</span>
          <div className="mt-2 space-y-2">
            <CheckboxField
              value={brandTint}
              onChange={setBrandTint}
              label="Brand tint neutrals"
              render={(props) => <HtmlCheckboxField {...props} />}
            />
            <CheckboxField
              value={neonChromaRolloff}
              onChange={setNeonChromaRolloff}
              label="Neon chroma rolloff"
              render={(props) => <HtmlCheckboxField {...props} />}
            />
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <CheckboxGroupField<CvdType>
            values={cvdVariants}
            toggle={toggleCvd}
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
