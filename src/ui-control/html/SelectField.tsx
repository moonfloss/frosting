import type { FieldRenderProps, Option } from "../fields/types";

export function HtmlSelectField<T>({
  field,
  fieldState,
  options,
}: FieldRenderProps<T> & { options: Option<T>[] }) {
  const selectedOption = options.find((opt) => opt.value === field.value);
  const valueStr = selectedOption != null ? String(selectedOption.value) : String(field.value);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const raw = e.target.value;
    const opt = options.find((o) => String(o.value) === raw);
    field.onChange(opt != null ? opt.value : (raw as unknown as T));
  };

  return (
    <select
      id={field.name}
      value={valueStr}
      onChange={handleChange}
      onBlur={field.onBlur}
      ref={field.ref as React.Ref<HTMLSelectElement>}
      className={`w-full rounded border px-2 py-1.5 text-sm ${
        fieldState.invalid
          ? "border-red-500 focus:border-red-500 focus:ring-red-500"
          : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
      }`}
      aria-invalid={fieldState.invalid}
    >
      {options.map((opt) => (
        <option key={String(opt.value)} value={String(opt.value)}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
