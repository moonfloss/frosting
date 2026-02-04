import type { Ramp } from "../index";
import { STEPS } from "../index";

export interface RampPreviewProps {
  ramp: Ramp;
  label: string;
  className?: string;
}

export function RampPreview({ ramp, label, className = "" }: RampPreviewProps) {
  return (
    <div className={className}>
      <div className="mb-1 text-xs font-medium text-gray-600">{label}</div>
      <div className="flex flex-wrap gap-0.5">
        {STEPS.map((step) => (
          <div
            key={step}
            className="h-8 w-8 rounded-sm border border-gray-200 shadow-sm"
            style={{ backgroundColor: ramp[step] }}
            title={`${step}: ${ramp[step]}`}
          />
        ))}
      </div>
    </div>
  );
}
