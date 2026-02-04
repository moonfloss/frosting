import type { FieldWrapperPropsBase, Option } from "./types";

export interface CheckboxGroupFieldProps<T> extends FieldWrapperPropsBase {
  values: T[];
  toggle: (value: T) => void;
  options: Option<T>[];
  render: (props: {
    field: { values: T[]; toggle: (value: T) => void };
    fieldState: { invalid: boolean; error?: string };
    options: Option<T>[];
  }) => React.ReactNode;
}

export function CheckboxGroupField<T>({
  values,
  toggle,
  label,
  description,
  error,
  className = "",
  id,
  options,
  render,
}: CheckboxGroupFieldProps<T>) {
  const fieldState = {
    invalid: Boolean(error),
    error,
  };
  const field = { values, toggle };

  return (
    <div className={className} role="group" aria-labelledby={id ? `${id}-label` : undefined}>
      {label != null && (
        <span
          id={id ? `${id}-label` : undefined}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
        </span>
      )}
      {description != null && (
        <p className="mt-0.5 text-sm text-gray-500">{description}</p>
      )}
      <div className={label != null ? "mt-1" : ""}>
        {render({ field, fieldState, options })}
      </div>
      {error != null && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
