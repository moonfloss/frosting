import type { FieldRenderProps, Option } from "../fields/types";

export function HtmlRadioGroupField<T>({
  field,
  fieldState,
  options,
}: FieldRenderProps<T> & { options: Option<T>[] }) {
  return (
    <div className="flex gap-4" role="radiogroup" aria-invalid={fieldState.invalid}>
      {options.map((opt) => (
        <label key={String(opt.value)} className="flex cursor-pointer items-center gap-2">
          <input
            type="radio"
            name={field.name}
            checked={field.value === opt.value}
            onChange={() => field.onChange(opt.value)}
            onBlur={field.onBlur}
            ref={field.ref as React.Ref<HTMLInputElement>}
            className="text-indigo-600"
            aria-invalid={fieldState.invalid}
          />
          <span className="text-sm">{opt.label}</span>
        </label>
      ))}
    </div>
  );
}
