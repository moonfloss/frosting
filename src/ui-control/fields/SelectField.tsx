import type { FieldRenderProps, FieldWrapperProps, Option } from "./types";

export interface SelectFieldProps<T> extends Omit<FieldWrapperProps<T>, "render"> {
  options: Option<T>[];
  render: (props: FieldRenderProps<T> & { options: Option<T>[] }) => React.ReactNode;
}

export function SelectField<T>({
  value,
  onChange,
  label,
  description,
  error,
  className = "",
  id,
  options,
  render,
}: SelectFieldProps<T>) {
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
      {label != null && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
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
