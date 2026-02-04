import type { FieldRenderProps } from "../fields/types";

export function HtmlTextField({ field, fieldState }: FieldRenderProps<string>) {
  return (
    <input
      type="text"
      id={field.name}
      value={field.value}
      onChange={(e) => field.onChange(e.target.value)}
      onBlur={field.onBlur}
      ref={field.ref as React.Ref<HTMLInputElement>}
      className={`w-full rounded border px-2 py-1.5 text-sm ${
        fieldState.invalid
          ? "border-red-500 focus:border-red-500 focus:ring-red-500"
          : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
      }`}
      aria-invalid={fieldState.invalid}
      aria-describedby={fieldState.error ? `${field.name}-error` : undefined}
    />
  );
}
