import type { Option } from "../fields/types";

interface HtmlCheckboxGroupFieldProps<T> {
  field: { values: T[]; toggle: (value: T) => void };
  fieldState: { invalid: boolean; error?: string };
  options: Option<T>[];
}

export function HtmlCheckboxGroupField<T>({
  field,
  fieldState,
  options,
}: HtmlCheckboxGroupFieldProps<T>) {
  return (
    <div className="flex flex-wrap gap-3" role="group" aria-invalid={fieldState.invalid}>
      {options.map((opt) => (
        <label key={String(opt.value)} className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={field.values.includes(opt.value)}
            onChange={() => field.toggle(opt.value)}
            className="rounded text-indigo-600"
          />
          <span className="text-sm capitalize">{opt.label}</span>
        </label>
      ))}
    </div>
  );
}
