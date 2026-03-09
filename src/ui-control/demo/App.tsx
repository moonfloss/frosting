import { useEffect, useState } from "react";
import {
  Button,
  Checkbox,
  Divider,
  Dropdown,
  Form,
  Header,
  Input,
  Label,
  Message,
  Segment,
  TextArea,
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
import type { CvdType, SchemeKind } from "frosting";

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
          value={field.value.match(/^#[0-9a-fA-F]{6}$/) ? field.value : "#000000"}
          onChange={(event) => field.onChange(event.target.value as `#${string}`)}
        />
        <Input
          value={field.value}
          onChange={(_, data) => field.onTextChange(String(data.value ?? ""))}
          placeholder="#000000"
        />
      </div>
    </Form.Field>
  );
}

function CustomPaletteForm() {
  const [submitted, setSubmitted] = useState<PaletteConfigFormSubmit | null>(null);
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
    ...((palette?.variants ? Object.keys(palette.variants) : []) as CvdType[]).map(
      (variant) => ({
        key: variant,
        text: variant,
        value: variant,
      }),
    ),
  ];

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
                    onChange={(_, data) =>
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
                    onChange={(_, data) =>
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
            <SemanticColorField label="Background light" field={fields.backgroundLight} />
            <SemanticColorField label="Background dark" field={fields.backgroundDark} />
            <SemanticColorField label="Foreground light" field={fields.foregroundLight} />
            <SemanticColorField label="Foreground dark" field={fields.foregroundDark} />

            <Divider />
            <Header as="h4">Options</Header>
            <Form.Field>
              <Checkbox
                label="Brand tint neutrals"
                checked={fields.brandTint.value}
                onChange={(_, data) => fields.brandTint.onChange(Boolean(data.checked))}
              />
            </Form.Field>
            <Form.Field>
              <Checkbox
                label="Neon chroma rolloff"
                checked={fields.neonChromaRolloff.value}
                onChange={(_, data) =>
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
              <Message warning content="Enter at least one valid brand color or a valid scheme base." />
            )}
          </Form>
        </Segment>

        <Segment>
          <Header as="h3">Submitted payload</Header>
          <TextArea
            readOnly
            value={
              submitted
                ? JSON.stringify(
                    {
                      values: submitted.values,
                      input: submitted.input,
                      options: submitted.options,
                    },
                    null,
                    2,
                  )
                : "Submit the form to inspect the normalized payload."
            }
          />
        </Segment>
      </div>

      <div className="semantic-demo-column">
        <Segment>
          <Header as="h3">Live preview</Header>
          {!palette || !modePalette ? (
            <Message info content="Live palette preview appears here once the current values are valid." />
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
                  onChange={(_, data) =>
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
                  <RampPreview ramp={modePalette.ramps.brand2} label="Brand 2" />
                )}
                {modePalette.ramps.brand3 && (
                  <RampPreview ramp={modePalette.ramps.brand3} label="Brand 3" />
                )}
                {modePalette.ramps.brand4 && (
                  <RampPreview ramp={modePalette.ramps.brand4} label="Brand 4" />
                )}
                <RampPreview ramp={modePalette.ramps.neutral} label="Neutral" />
                <SemanticPreview semantic={modePalette.semantic} className="semantic-demo-semantic-preview" />
              </div>
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
