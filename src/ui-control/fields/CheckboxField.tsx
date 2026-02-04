import type { FieldRenderProps, FieldWrapperProps } from "./types";

export interface CheckboxFieldProps extends Omit<FieldWrapperProps<boolean>, "value" | "onChange"> {
  value: boolean;
  onChange: (checked: boolean) => void;
}

export function CheckboxField({
  value,
  onChange,
  label,
  description,
  error,
  className = "",
  id,
  render,
}: CheckboxFieldProps) {
  const fieldState = {
    invalid: Boolean(error),
    error,
  };
  const field = {
    value,
    onChange,
    name: id,
  };

  return (
    <div className={className}>
      {description != null && (
        <p className="mt-0.5 text-sm text-gray-500">{description}</p>
      )}
      {label != null ? (
        <label className="mt-1 flex cursor-pointer items-center gap-2">
          {render({ field, fieldState })}
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </label>
      ) : (
        <div className={label != null ? "mt-1" : ""}>
          {render({ field, fieldState })}
        </div>
      )}
      {error != null && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
