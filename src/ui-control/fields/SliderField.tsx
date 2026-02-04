import type { FieldRenderProps, FieldWrapperProps } from "./types";

export interface SliderFieldProps extends Omit<FieldWrapperProps<number>, "render"> {
  min: number;
  max: number;
  step?: number;
  render: (props: FieldRenderProps<number> & { min: number; max: number; step: number }) => React.ReactNode;
}

export function SliderField({
  value,
  onChange,
  label,
  description,
  error,
  className = "",
  id,
  min,
  max,
  step = 1,
  render,
}: SliderFieldProps) {
  const fieldState = {
    invalid: Boolean(error),
    error,
  };
  const field = {
    value,
    onChange,
    name: id,
  };
  const stepValue = step;

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
        {render({ field, fieldState, min, max, step: stepValue })}
      </div>
      {error != null && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
