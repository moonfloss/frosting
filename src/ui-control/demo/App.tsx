import { useEffect, useState, type SyntheticEvent } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { oneDark } from "@codemirror/theme-one-dark";
import {
  Button,
  type CheckboxProps,
  Checkbox,
  Divider,
  type DropdownProps,
  Dropdown,
  Form,
  Header,
  type InputOnChangeData,
  Input,
  Label,
  Message,
  Segment,
} from "semantic-ui-react";

import {
  CVD_OPTIONS,
  PaletteConfigForm,
  RampPreview,
  SCHEME_KINDS,
  SemanticPreview,
  type PaletteConfigColorController,
  type PaletteConfigFormRenderProps,
  type PaletteConfigFormSubmit,
} from "frosting/ui-control";
import {
  mapPaletteToTheme,
  type CvdType,
  type SchemeKind,
  type ThemeMappingConfig,
  type ThemeMappingTemplate,
} from "frosting";

const DEFAULT_MAPPER_CONFIG_TEXT = JSON.stringify(
  {
    template: {
      version: 1,
      light: {
        surface: { page: "" },
        text: { primary: "" },
        status: { warning: "" },
      },
    },
    mappings: {
      "light.text.primary": "light.foreground",
    },
    fuzzy: {
      derivedAliases: true,
    },
    requiredPaths: ["light.surface.page", "light.status.warning"],
  },
  null,
  2,
);

function parseMapperConfig(
  raw: string,
): ThemeMappingConfig<ThemeMappingTemplate> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid JSON: ${message}`);
  }

  if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Mapper config must be a JSON object.");
  }

  const candidate = parsed as Record<string, unknown>;
  if (
    !("template" in candidate) ||
    candidate.template == null ||
    typeof candidate.template !== "object" ||
    Array.isArray(candidate.template)
  ) {
    throw new Error('Mapper config must include an object "template" field.');
  }

  if (
    "mappings" in candidate &&
    (candidate.mappings == null ||
      typeof candidate.mappings !== "object" ||
      Array.isArray(candidate.mappings))
  ) {
    throw new Error('"mappings" must be an object when provided.');
  }

  return candidate as unknown as ThemeMappingConfig<ThemeMappingTemplate>;
}

interface SemanticColorFieldProps {
  label: string;
  field: PaletteConfigColorController;
}

function SemanticColorField({ label, field }: SemanticColorFieldProps) {
  return (
    <Form.Field>
      <label>{label}</label>
      <div className="semantic-color-field">
        <input
          type="color"
          value={
            field.value.match(/^#[0-9a-fA-F]{6}$/) ? field.value : "#000000"
          }
          onChange={(event) =>
            field.onChange(event.target.value as `#${string}`)
          }
        />
        <Input
          value={field.value}
          onChange={(_event: SyntheticEvent, data: InputOnChangeData) =>
            field.onTextChange(String(data.value ?? ""))
          }
          placeholder="#000000"
        />
      </div>
    </Form.Field>
  );
}

function CustomPaletteForm() {
  const [submitted, setSubmitted] = useState<PaletteConfigFormSubmit | null>(
    null,
  );
  const [previewMode, setPreviewMode] = useState<"light" | "dark">("light");
  const [previewVariant, setPreviewVariant] = useState<"default" | CvdType>(
    "default",
  );

  return (
    <PaletteConfigForm onSubmit={setSubmitted}>
      {(form) => (
        <CustomPaletteFormContent
          form={form}
          previewMode={previewMode}
          previewVariant={previewVariant}
          submitted={submitted}
          onPreviewModeChange={setPreviewMode}
          onPreviewVariantChange={setPreviewVariant}
        />
      )}
    </PaletteConfigForm>
  );
}

interface CustomPaletteFormContentProps {
  form: PaletteConfigFormRenderProps;
  previewMode: "light" | "dark";
  previewVariant: "default" | CvdType;
  submitted: PaletteConfigFormSubmit | null;
  onPreviewModeChange: (mode: "light" | "dark") => void;
  onPreviewVariantChange: (variant: "default" | CvdType) => void;
}

function CustomPaletteFormContent({
  form,
  previewMode,
  previewVariant,
  submitted,
  onPreviewModeChange,
  onPreviewVariantChange,
}: CustomPaletteFormContentProps) {
  const { fields, brandColors, palette, values } = form;
  const [mapperConfigText, setMapperConfigText] = useState(
    DEFAULT_MAPPER_CONFIG_TEXT,
  );
  const [parsedMapperConfig, setParsedMapperConfig] =
    useState<ThemeMappingConfig<ThemeMappingTemplate> | null>(null);
  const [mappedOutputText, setMappedOutputText] = useState<string | null>(null);
  const [mappedDiagnosticsText, setMappedDiagnosticsText] = useState<
    string | null
  >(null);
  const [mapperError, setMapperError] = useState<string | null>(null);

  useEffect(() => {
    if (
      previewVariant !== "default" &&
      (!palette?.variants || !(previewVariant in palette.variants))
    ) {
      onPreviewVariantChange("default");
    }
  }, [onPreviewVariantChange, palette?.variants, previewVariant]);

  const modePalette =
    palette &&
    (previewVariant === "default"
      ? palette.modes[previewMode]
      : (palette.variants?.[previewVariant]?.modes[previewMode] ??
        palette.modes[previewMode]));

  const variantOptions = [
    { key: "default", text: "Default", value: "default" },
    ...(
      (palette?.variants ? Object.keys(palette.variants) : []) as CvdType[]
    ).map((variant) => ({
      key: variant,
      text: variant,
      value: variant,
    })),
  ];
  const applyMapperConfig = () => {
    if (!palette) {
      setMapperError(
        "Live palette is not available yet. Enter valid palette inputs first.",
      );
      return;
    }

    try {
      const config = parseMapperConfig(mapperConfigText);
      const { theme, diagnostics } = mapPaletteToTheme(palette, config);

      setParsedMapperConfig(config);
      setMappedOutputText(JSON.stringify(theme, null, 2));
      setMappedDiagnosticsText(JSON.stringify(diagnostics, null, 2));
      setMapperError(null);
    } catch (error) {
      setParsedMapperConfig(null);
      setMapperError(
        error instanceof Error
          ? error.message
          : "Failed to apply mapper config.",
      );
    }
  };

  return (
    <div className="semantic-demo-shell">
      <div className="semantic-demo-column">
        <Segment>
          <Header as="h1">Composable `PaletteConfigForm` demo</Header>
          <p>
            This example uses <code>PaletteConfigForm</code> directly with
            custom Semantic UI controls, while submit output is handled
            separately from the live preview.
          </p>
        </Segment>

        <Segment>
          <Form onSubmit={form.handleSubmit}>
            <Form.Field>
              <label>Input mode</label>
              <Button.Group>
                <Button
                  primary={values.inputMode === "brand"}
                  type="button"
                  onClick={() => fields.inputMode.onChange("brand")}
                >
                  Brand colors
                </Button>
                <Button
                  primary={values.inputMode === "scheme"}
                  type="button"
                  onClick={() => fields.inputMode.onChange("scheme")}
                >
                  Scheme
                </Button>
              </Button.Group>
            </Form.Field>

            {values.inputMode === "brand" && (
              <>
                <Header as="h4">Brand colors</Header>
                {brandColors.fields.map((field) => (
                  <SemanticColorField
                    key={field.index}
                    label={`Brand ${field.index + 1}`}
                    field={field}
                  />
                ))}
                <div className="semantic-demo-actions">
                  <Button
                    type="button"
                    onClick={() => brandColors.add()}
                    disabled={!brandColors.canAdd}
                  >
                    Add color
                  </Button>
                  <Button
                    type="button"
                    onClick={() => brandColors.remove()}
                    disabled={!brandColors.canRemove}
                  >
                    Remove color
                  </Button>
                </div>
              </>
            )}

            {values.inputMode === "scheme" && (
              <>
                <Header as="h4">Scheme</Header>
                <Form.Field>
                  <label>Kind</label>
                  <Dropdown
                    fluid
                    selection
                    options={SCHEME_KINDS.map((kind) => ({
                      key: kind,
                      text: kind,
                      value: kind,
                    }))}
                    value={fields.schemeKind.value}
                    onChange={(_event: SyntheticEvent, data: DropdownProps) =>
                      fields.schemeKind.onChange(data.value as SchemeKind)
                    }
                  />
                </Form.Field>
                <SemanticColorField label="Base" field={fields.schemeBase} />
                <Form.Field>
                  <label>Count</label>
                  <Dropdown
                    fluid
                    selection
                    options={[1, 2, 3, 4].map((count) => ({
                      key: count,
                      text: String(count),
                      value: count,
                    }))}
                    value={fields.schemeCount.value}
                    onChange={(_event: SyntheticEvent, data: DropdownProps) =>
                      fields.schemeCount.onChange(data.value as 1 | 2 | 3 | 4)
                    }
                  />
                </Form.Field>
                <Form.Field>
                  <label>Spread degrees: {fields.spreadDegrees.value}</label>
                  <input
                    type="range"
                    min={0}
                    max={90}
                    step={1}
                    value={fields.spreadDegrees.value}
                    onChange={(event) =>
                      fields.spreadDegrees.onChange(Number(event.target.value))
                    }
                  />
                </Form.Field>
                <Form.Field>
                  <label>
                    Secondary chroma scale:{" "}
                    {fields.secondaryChromaScale.value.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={fields.secondaryChromaScale.value}
                    onChange={(event) =>
                      fields.secondaryChromaScale.onChange(
                        Number(event.target.value),
                      )
                    }
                  />
                </Form.Field>
              </>
            )}

            <Divider />
            <Header as="h4">Overrides</Header>
            <SemanticColorField
              label="Background light"
              field={fields.backgroundLight}
            />
            <SemanticColorField
              label="Background dark"
              field={fields.backgroundDark}
            />
            <SemanticColorField
              label="Foreground light"
              field={fields.foregroundLight}
            />
            <SemanticColorField
              label="Foreground dark"
              field={fields.foregroundDark}
            />

            <Divider />
            <Header as="h4">Options</Header>
            <Form.Field>
              <Checkbox
                label="Brand tint neutrals"
                checked={fields.brandTint.value}
                onChange={(_event: SyntheticEvent, data: CheckboxProps) =>
                  fields.brandTint.onChange(Boolean(data.checked))
                }
              />
            </Form.Field>
            <Form.Field>
              <Checkbox
                label="Neon chroma rolloff"
                checked={fields.neonChromaRolloff.value}
                onChange={(_event: SyntheticEvent, data: CheckboxProps) =>
                  fields.neonChromaRolloff.onChange(Boolean(data.checked))
                }
              />
            </Form.Field>
            <Form.Field>
              <label>CVD variants</label>
              <div className="semantic-demo-checkboxes">
                {CVD_OPTIONS.map((cvd) => (
                  <Checkbox
                    key={cvd}
                    label={cvd}
                    checked={fields.cvdVariants.values.includes(cvd)}
                    onChange={() => fields.cvdVariants.toggle(cvd)}
                  />
                ))}
              </div>
            </Form.Field>

            <Divider />
            <Button primary type="submit" disabled={!form.isValid}>
              Submit normalized payload
            </Button>
            {!form.isValid && (
              <Message
                warning
                content="Enter at least one valid brand color or a valid scheme base."
              />
            )}
          </Form>
        </Segment>

        <Segment>
          <Header as="h3">Submitted payload</Header>
          <pre className="semantic-demo-code-block">
            <code>
              {submitted
                ? JSON.stringify(
                    {
                      values: submitted.values,
                      input: submitted.input,
                      options: submitted.options,
                    },
                    null,
                    2,
                  )
                : "Submit the form to inspect the normalized payload."}
            </code>
          </pre>
        </Segment>
      </div>

      <div className="semantic-demo-column">
        <Segment>
          <Header as="h3">Live preview</Header>
          {!palette || !modePalette ? (
            <Message
              info
              content="Live palette preview appears here once the current values are valid."
            />
          ) : (
            <>
              <div className="semantic-demo-preview-toolbar">
                <Button.Group>
                  <Button
                    primary={previewMode === "light"}
                    type="button"
                    onClick={() => onPreviewModeChange("light")}
                  >
                    Light
                  </Button>
                  <Button
                    primary={previewMode === "dark"}
                    type="button"
                    onClick={() => onPreviewModeChange("dark")}
                  >
                    Dark
                  </Button>
                </Button.Group>
                <Dropdown
                  selection
                  options={variantOptions}
                  value={previewVariant}
                  onChange={(_event: SyntheticEvent, data: DropdownProps) =>
                    onPreviewVariantChange(data.value as "default" | CvdType)
                  }
                />
              </div>

              <div
                className="semantic-demo-preview-surface"
                style={{
                  backgroundColor: modePalette.semantic.background,
                  color: modePalette.semantic.foreground,
                }}
              >
                <div className="semantic-demo-labels">
                  <Label>{previewMode}</Label>
                  <Label>{previewVariant}</Label>
                </div>
                <RampPreview ramp={modePalette.ramps.brand1} label="Brand 1" />
                {modePalette.ramps.brand2 && (
                  <RampPreview
                    ramp={modePalette.ramps.brand2}
                    label="Brand 2"
                  />
                )}
                {modePalette.ramps.brand3 && (
                  <RampPreview
                    ramp={modePalette.ramps.brand3}
                    label="Brand 3"
                  />
                )}
                {modePalette.ramps.brand4 && (
                  <RampPreview
                    ramp={modePalette.ramps.brand4}
                    label="Brand 4"
                  />
                )}
                <RampPreview ramp={modePalette.ramps.neutral} label="Neutral" />
                <SemanticPreview
                  semantic={modePalette.semantic}
                  className="semantic-demo-semantic-preview"
                />
              </div>
            </>
          )}
        </Segment>

        <Segment>
          <Header as="h3">Mapper config (JSON)</Header>
          <details className="semantic-demo-disclosure">
            <summary>Edit mapper config</summary>
            <p>
              Edit this object and click apply to map the current live palette
              into your target shape.
            </p>
            <CodeMirror
              value={mapperConfigText}
              onChange={(value) => setMapperConfigText(value)}
              extensions={[json()]}
              theme={oneDark}
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                highlightActiveLine: true,
                bracketMatching: true,
              }}
              className="semantic-demo-code-editor"
            />
            <div className="semantic-demo-actions">
              <Button
                primary
                type="button"
                onClick={applyMapperConfig}
                disabled={!palette}
              >
                Apply mapper config
              </Button>
            </div>
            {!palette && (
              <Message
                info
                content="Enter valid palette inputs first so the mapper can run."
              />
            )}
            {mapperError && <Message negative content={mapperError} />}
            {parsedMapperConfig && !mapperError && (
              <Message positive content="Mapper config parsed and applied." />
            )}
          </details>
        </Segment>

        <Segment>
          <Header as="h3">Mapped output</Header>
          {!mappedOutputText ? (
            <Message
              info
              content="Apply a mapper config to inspect output for your desired shape."
            />
          ) : (
            <>
              <pre className="semantic-demo-code-block">
                <code>{mappedOutputText}</code>
              </pre>
              <Divider />
              <Header as="h4">Mapping diagnostics</Header>
              <pre className="semantic-demo-code-block">
                <code>
                  {mappedDiagnosticsText ?? "No diagnostics available."}
                </code>
              </pre>
            </>
          )}
        </Segment>
      </div>
    </div>
  );
}

export default function App() {
  return <CustomPaletteForm />;
}
