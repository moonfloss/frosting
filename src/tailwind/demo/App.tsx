import { useState } from "react";
import { getActiveVarStyle } from "frosting/tailwind";
import palette from "./palette.js";

type Mode = "light" | "dark";
type Variant = "default" | "protanopia" | "deuteranopia" | "tritanopia";

const MODES: Mode[] = ["light", "dark"];
const VARIANTS: Variant[] = ["default", "protanopia", "deuteranopia", "tritanopia"];

const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

export default function App() {
  const [mode, setMode] = useState<Mode>("light");
  const [variant, setVariant] = useState<Variant>("default");

  const activeStyle = getActiveVarStyle(mode, variant, palette);
  const styleObj = Object.fromEntries(
    Object.entries(activeStyle).map(([k, v]) => [k, v]),
  ) as React.CSSProperties;

  return (
    <div
      className="min-h-screen bg-active-background text-active-foreground"
      style={styleObj}
    >
      <div className="mx-auto max-w-4xl space-y-8 p-6">
        <header className="border-active-border border-b pb-4">
          <h1 className="text-active-foreground text-2xl font-bold">
            Frosting Tailwind Demo
          </h1>
          <p className="text-active-muted-foreground mt-1 text-sm">
            Toggle mode and CVD variant to see the palette update.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-active-foreground text-sm font-semibold uppercase tracking-wide">
            Toolbar
          </h2>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex gap-2">
              <span className="text-active-muted-foreground text-sm">Mode:</span>
              {MODES.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                    mode === m
                      ? "bg-active-primary text-active-primary-foreground"
                      : "bg-active-muted text-active-muted-foreground hover:bg-active-muted/80"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <span className="text-active-muted-foreground text-sm">
                Variant:
              </span>
              {VARIANTS.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVariant(v)}
                  className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                    variant === v
                      ? "bg-active-primary text-active-primary-foreground"
                      : "bg-active-muted text-active-muted-foreground hover:bg-active-muted/80"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-active-foreground text-sm font-semibold uppercase tracking-wide">
            Semantic token showcase
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="bg-active-card text-active-card-foreground border-active-border rounded-lg border p-4 shadow-sm">
              <p className="font-medium">Card</p>
              <p className="text-active-muted-foreground mt-1 text-sm">
                Uses card and card-foreground.
              </p>
            </div>
            <div className="bg-active-muted text-active-muted-foreground rounded-lg p-4">
              <p className="font-medium">Muted block</p>
              <p className="mt-1 text-sm opacity-90">Uses muted tokens.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="bg-active-primary text-active-primary-foreground rounded-md px-4 py-2 text-sm font-medium hover:opacity-90"
            >
              Primary
            </button>
            <button
              type="button"
              className="bg-active-secondary text-active-secondary-foreground rounded-md px-4 py-2 text-sm font-medium hover:opacity-90"
            >
              Secondary
            </button>
            <button
              type="button"
              className="bg-active-accent text-active-accent-foreground rounded-md px-4 py-2 text-sm font-medium hover:opacity-90"
            >
              Accent
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="bg-active-primary text-active-primary-foreground rounded-full px-2.5 py-0.5 text-xs font-medium">
              Badge primary
            </span>
            <span className="bg-active-ring text-active-foreground rounded-full px-2.5 py-0.5 text-xs font-medium">
              Badge ring
            </span>
          </div>
          <input
            type="text"
            placeholder="Input (border-active-border)"
            className="border-active-border bg-active-background text-active-foreground placeholder:text-active-muted-foreground w-full max-w-xs rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-active-ring"
          />
        </section>

        <section className="space-y-3">
          <h2 className="text-active-foreground text-sm font-semibold uppercase tracking-wide">
            Ramp display
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-active-muted-foreground mb-2 text-xs font-medium">
                brand1
              </p>
              <div className="flex flex-wrap gap-0.5">
                {STEPS.map((step) => (
                  <div
                    key={step}
                    className="h-10 w-10 rounded sm:w-12"
                    style={{
                      backgroundColor: `var(--active-brand1-${step})`,
                    }}
                    title={`${step}`}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="text-active-muted-foreground mb-2 text-xs font-medium">
                brand2
              </p>
              <div className="flex flex-wrap gap-0.5">
                {STEPS.map((step) => (
                  <div
                    key={step}
                    className="h-10 w-10 rounded sm:w-12"
                    style={{
                      backgroundColor: `var(--active-brand2-${step})`,
                    }}
                    title={`${step}`}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="text-active-muted-foreground mb-2 text-xs font-medium">
                neutral
              </p>
              <div className="flex flex-wrap gap-0.5">
                {STEPS.map((step) => (
                  <div
                    key={step}
                    className="h-10 w-10 rounded sm:w-12"
                    style={{
                      backgroundColor: `var(--active-neutral-${step})`,
                    }}
                    title={`${step}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
