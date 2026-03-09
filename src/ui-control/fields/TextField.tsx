import type { FieldWrapperProps } from "./types";

export function TextField<T extends string = string>({
  value,
  onChange,
  label,
  description,
  error,
  className = "",
  id,
  render,
}: FieldWrapperProps<T>) {
  const fieldState = {
    invalid: Boolean(error),
    error,
  };
  const field = {
    value,
    onChange: onChange as (value: T) => void,
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
