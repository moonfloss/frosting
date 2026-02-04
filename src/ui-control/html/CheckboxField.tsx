import type { FieldRenderProps } from "../fields/types";

export function HtmlCheckboxField({ field, fieldState }: FieldRenderProps<boolean>) {
  return (
    <input
      type="checkbox"
      name={field.name}
      checked={field.value}
      onChange={(e) => field.onChange(e.target.checked)}
      onBlur={field.onBlur}
      ref={field.ref as React.Ref<HTMLInputElement>}
      className="rounded text-indigo-600"
      aria-invalid={fieldState.invalid}
    />
  );
}
