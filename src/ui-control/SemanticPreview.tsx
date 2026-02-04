import type { SemanticTokens } from "../index";

const SEMANTIC_KEYS: (keyof SemanticTokens)[] = [
  "background",
  "foreground",
  "card",
  "card-foreground",
  "muted",
  "muted-foreground",
  "border",
  "input",
  "ring",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "accent",
  "accent-foreground",
];

export interface SemanticPreviewProps {
  semantic: SemanticTokens;
  className?: string;
}

export function SemanticPreview({
  semantic,
  className = "",
}: SemanticPreviewProps) {
  return (
    <div className={className}>
      <div className="mb-2 text-xs font-medium text-gray-600">
        Semantic tokens
      </div>
      <div className="grid grid-cols-[auto_1fr_auto] gap-x-3 gap-y-1.5 text-sm">
        {SEMANTIC_KEYS.map((key) => (
          <div key={key} className="contents">
            <span className="text-gray-600">{key}</span>
            <div
              className="rounded border border-gray-200"
              style={{ backgroundColor: semantic[key] }}
              title={semantic[key]}
            />
            <span className="font-mono text-gray-500">{semantic[key]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
