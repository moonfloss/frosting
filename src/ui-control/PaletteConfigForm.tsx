import type { FormEventHandler, ReactNode } from "react";
import { useMemo, useState } from "react";

import { generatePalette } from "../index";
import type {
  CvdType,
  HexColor,
  PaletteConfig,
  PaletteInput,
  PaletteOptions,
  SchemeKind,
} from "../index";
import type { FieldController } from "./fields";
import type {
  PaletteConfigFormInitialValues,
  PaletteConfigFormInputMode,
  PaletteConfigFormValues,
} from "./paletteConfigFormModel";
import {
  mergePaletteConfigFormValues,
  valuesToPaletteInput,
  valuesToPaletteOptions,
} from "./paletteConfigFormModel";

export interface PaletteConfigColorController {
  value: string;
  onChange: (hex: HexColor) => void;
  onTextChange: (raw: string) => void;
}

export interface PaletteConfigCheckboxGroupController<T> {
  values: T[];
  toggle: (value: T) => void;
}

export interface PaletteConfigFormFieldControllers {
  inputMode: FieldController<PaletteConfigFormInputMode>;
  schemeKind: FieldController<SchemeKind>;
  schemeBase: PaletteConfigColorController;
  schemeCount: FieldController<1 | 2 | 3 | 4>;
  spreadDegrees: FieldController<number>;
  secondaryChromaScale: FieldController<number>;
  backgroundLight: PaletteConfigColorController;
  backgroundDark: PaletteConfigColorController;
  foregroundLight: PaletteConfigColorController;
  foregroundDark: PaletteConfigColorController;
  brandTint: FieldController<boolean>;
  neonChromaRolloff: FieldController<boolean>;
  stepDepth: FieldController<number>;
  easing: FieldController<PaletteConfigFormValues["easing"]>;
  cvdVariants: PaletteConfigCheckboxGroupController<CvdType>;
}

export interface PaletteConfigBrandColorField extends PaletteConfigColorController {
  index: number;
}

export interface PaletteConfigBrandColorsController {
  values: string[];
  fields: PaletteConfigBrandColorField[];
  canAdd: boolean;
  canRemove: boolean;
  add: (value?: string) => void;
  remove: (index?: number) => void;
  set: (index: number, value: string) => void;
}

export interface PaletteConfigFormSubmit {
  values: PaletteConfigFormValues;
  input: PaletteInput;
  options: PaletteOptions;
  palette: PaletteConfig | null;
}

export interface PaletteConfigFormRenderProps {
  values: PaletteConfigFormValues;
  fields: PaletteConfigFormFieldControllers;
  brandColors: PaletteConfigBrandColorsController;
  paletteInput: PaletteInput | null;
  paletteOptions: PaletteOptions;
  palette: PaletteConfig | null;
  paletteError: Error | null;
  isValid: boolean;
  submit: () => void;
  handleSubmit: FormEventHandler<HTMLFormElement>;
}

export interface PaletteConfigFormProps {
  initialValues?: PaletteConfigFormInitialValues;
  onSubmit?: (payload: PaletteConfigFormSubmit) => void;
  children?: (props: PaletteConfigFormRenderProps) => ReactNode;
  render?: (props: PaletteConfigFormRenderProps) => ReactNode;
}

function createColorController(
  value: string,
  setValue: (next: string) => void,
): PaletteConfigColorController {
  return {
    value,
    onChange: (hex) => setValue(hex),
    onTextChange: (raw) => setValue(raw),
  };
}

export function PaletteConfigForm({
  initialValues,
  onSubmit,
  children,
  render,
}: PaletteConfigFormProps) {
  const [values, setValues] = useState<PaletteConfigFormValues>(() =>
    mergePaletteConfigFormValues(initialValues),
  );

  const setValue = <K extends keyof PaletteConfigFormValues>(
    key: K,
    value: PaletteConfigFormValues[K],
  ) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const setBrandColor = (index: number, value: string) => {
    setValues((prev) => {
      const next = [...prev.brandColors];
      next[index] = value;
      return { ...prev, brandColors: next };
    });
  };

  const addBrandColor = (value = "#94a3b8") => {
    setValues((prev) => {
      if (prev.brandColors.length >= 4) return prev;
      return { ...prev, brandColors: [...prev.brandColors, value] };
    });
  };

  const removeBrandColor = (index = values.brandColors.length - 1) => {
    setValues((prev) => {
      if (prev.brandColors.length <= 1) return prev;
      return {
        ...prev,
        brandColors: prev.brandColors.filter(
          (_, itemIndex) => itemIndex !== index,
        ),
      };
    });
  };

  const toggleCvdVariant = (value: CvdType) => {
    setValues((prev) => ({
      ...prev,
      cvdVariants: prev.cvdVariants.includes(value)
        ? prev.cvdVariants.filter((item) => item !== value)
        : [...prev.cvdVariants, value],
    }));
  };

  const paletteInput = useMemo(() => valuesToPaletteInput(values), [values]);
  const paletteOptions = useMemo(
    () => valuesToPaletteOptions(values),
    [values],
  );
  const { palette, paletteError } = useMemo(() => {
    if (!paletteInput) {
      return { palette: null, paletteError: null };
    }
    try {
      return {
        palette: generatePalette(paletteInput, paletteOptions),
        paletteError: null,
      };
    } catch (error) {
      return {
        palette: null,
        paletteError:
          error instanceof Error ? error : new Error(String(error)),
      };
    }
  }, [paletteInput, paletteOptions]);

  const submit = () => {
    if (!paletteInput) return;
    onSubmit?.({
      values,
      input: paletteInput,
      options: paletteOptions,
      palette,
    });
  };

  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    submit();
  };

  const fields = useMemo<PaletteConfigFormFieldControllers>(
    () => ({
      inputMode: {
        value: values.inputMode,
        onChange: (inputMode) => setValue("inputMode", inputMode),
      },
      schemeKind: {
        value: values.schemeKind,
        onChange: (schemeKind) => setValue("schemeKind", schemeKind),
      },
      schemeBase: createColorController(values.schemeBase, (schemeBase) =>
        setValue("schemeBase", schemeBase),
      ),
      schemeCount: {
        value: values.schemeCount,
        onChange: (schemeCount) => setValue("schemeCount", schemeCount),
      },
      spreadDegrees: {
        value: values.spreadDegrees,
        onChange: (spreadDegrees) => setValue("spreadDegrees", spreadDegrees),
      },
      secondaryChromaScale: {
        value: values.secondaryChromaScale,
        onChange: (secondaryChromaScale) =>
          setValue("secondaryChromaScale", secondaryChromaScale),
      },
      backgroundLight: createColorController(
        values.backgroundLight,
        (backgroundLight) => setValue("backgroundLight", backgroundLight),
      ),
      backgroundDark: createColorController(
        values.backgroundDark,
        (backgroundDark) => setValue("backgroundDark", backgroundDark),
      ),
      foregroundLight: createColorController(
        values.foregroundLight,
        (foregroundLight) => setValue("foregroundLight", foregroundLight),
      ),
      foregroundDark: createColorController(
        values.foregroundDark,
        (foregroundDark) => setValue("foregroundDark", foregroundDark),
      ),
      brandTint: {
        value: values.brandTint,
        onChange: (brandTint) => setValue("brandTint", brandTint),
      },
      neonChromaRolloff: {
        value: values.neonChromaRolloff,
        onChange: (neonChromaRolloff) =>
          setValue("neonChromaRolloff", neonChromaRolloff),
      },
      stepDepth: {
        value: values.stepDepth,
        onChange: (stepDepth) => setValue("stepDepth", stepDepth),
      },
      easing: {
        value: values.easing,
        onChange: (easing) => setValue("easing", easing),
      },
      cvdVariants: {
        values: values.cvdVariants,
        toggle: toggleCvdVariant,
      },
    }),
    [values],
  );

  const brandColors = useMemo<PaletteConfigBrandColorsController>(
    () => ({
      values: values.brandColors,
      fields: values.brandColors.map((value, index) => ({
        index,
        value,
        onChange: (hex) => setBrandColor(index, hex),
        onTextChange: (raw) => setBrandColor(index, raw),
      })),
      canAdd: values.brandColors.length < 4,
      canRemove: values.brandColors.length > 1,
      add: addBrandColor,
      remove: removeBrandColor,
      set: setBrandColor,
    }),
    [values.brandColors],
  );

  const renderProps: PaletteConfigFormRenderProps = {
    values,
    fields,
    brandColors,
    paletteInput,
    paletteOptions,
    palette,
    paletteError,
    isValid: paletteInput != null && paletteError == null,
    submit,
    handleSubmit,
  };

  const renderer = render ?? children;
  return renderer ? <>{renderer(renderProps)}</> : null;
}
