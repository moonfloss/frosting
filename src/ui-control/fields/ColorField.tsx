import type { HexColor } from "../../index";
import type { FieldRenderProps, FieldWrapperPropsBase } from "./types";

const HEX_REGEX = /^#[0-9a-fA-F]{6}$/;
function isValidHex(s: string): s is HexColor {
  return HEX_REGEX.test(s);
}

export interface ColorFieldController {
  value: string;
  onChange: (hex: HexColor) => void;
  onTextChange?: (raw: string) => void;
  pickerValue: string;
}

export interface ColorFieldRenderProps {
  field: ColorFieldController;
  fieldState: { invalid: boolean; error?: string };
}

export interface ColorFieldProps extends FieldWrapperPropsBase {
  value: string;
  onChange: (hex: HexColor) => void;
  onTextChange?: (raw: string) => void;
  render: (props: ColorFieldRenderProps) => React.ReactNode;
}

export function ColorField({
  value,
  onChange,
  onTextChange,
  label,
  description,
  error,
  className = "",
  id,
  render,
}: ColorFieldProps) {
  const normalized = value.startsWith("#") ? value : value ? `#${value}` : "";
  const valid = normalized ? isValidHex(normalized) : false;
  const pickerValue = valid ? normalized : "#000000";

  const fieldState = {
    invalid: Boolean(error) || (Boolean(value) && !valid),
    error,
  };
  const field: ColorFieldController = {
    value,
    onChange,
    onTextChange,
    pickerValue,
  };

  return (
    <div className={className}>
      {label != null && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      {description != null && (
        <p className="mt-0.5 text-sm text-gray-500">{description}</p>
      )}
      <div className={label != null ? "mt-1" : ""}>
        {render({ field, fieldState })}
      </div>
      {error != null && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
