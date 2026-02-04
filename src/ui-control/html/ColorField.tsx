import type { ColorFieldRenderProps } from "../fields/ColorField";

export function HtmlColorField({ field, fieldState }: ColorFieldRenderProps) {
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    field.onTextChange?.(raw);
    const trimmed = raw.trim();
    const withHash = trimmed.startsWith("#") ? trimmed : trimmed ? `#${trimmed}` : "";
    if (/^#[0-9a-fA-F]{6}$/.test(withHash)) {
      field.onChange(withHash as `#${string}`);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={field.pickerValue}
        onChange={(e) => field.onChange(e.target.value as `#${string}`)}
        className="h-9 w-12 cursor-pointer rounded border border-gray-300 bg-transparent p-0"
        aria-label="Color picker"
      />
      <input
        type="text"
        value={field.value}
        onChange={handleTextChange}
        placeholder="#000000"
        className={`w-24 rounded border px-2 py-1 font-mono text-sm ${
          fieldState.invalid
            ? "border-red-500 focus:border-red-500 focus:ring-red-500"
            : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
        }`}
        aria-invalid={fieldState.invalid}
      />
    </div>
  );
}
