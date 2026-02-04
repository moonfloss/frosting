import type { FieldRenderProps } from "../fields/types";

interface HtmlSliderFieldProps
  extends FieldRenderProps<number> {
  min: number;
  max: number;
  step: number;
}

export function HtmlSliderField({ field, fieldState, min, max, step }: HtmlSliderFieldProps) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="range"
        id={field.name}
        min={min}
        max={max}
        step={step}
        value={field.value}
        onChange={(e) => field.onChange(Number(e.target.value))}
        onBlur={field.onBlur}
        ref={field.ref as React.Ref<HTMLInputElement>}
        className="w-full"
        aria-invalid={fieldState.invalid}
      />
      <span className="text-sm text-gray-500">{field.value}</span>
    </div>
  );
}
