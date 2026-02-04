import type { HexColor } from "../index";
import { ColorField } from "./fields";
import { HtmlColorField } from "./html";

export interface ColorInputProps {
  value: string;
  onChange: (hex: HexColor) => void;
  onTextChange?: (raw: string) => void;
  label?: string;
  id?: string;
  className?: string;
}

export function ColorInput({
  value,
  onChange,
  onTextChange,
  label,
  id,
  className = "",
}: ColorInputProps) {
  return (
    <ColorField
      value={value}
      onChange={onChange}
      onTextChange={onTextChange}
      label={label}
      id={id}
      className={className}
      render={(props) => <HtmlColorField {...props} />}
    />
  );
}
