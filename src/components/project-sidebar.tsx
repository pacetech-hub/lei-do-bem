import { Check, Circle, CircleDot } from "lucide-react";
import { cn } from "@/lib/utils";
import { SECTIONS, type SectionKey } from "@/lib/types";
import { Progress } from "@/components/ui/progress";

interface Props {
  active: SectionKey;
  onChange: (s: SectionKey) => void;
  completion: Record<SectionKey, number>; // 0..100
  overall: number;
}

export function ProjectSidebar({ active, onChange, completion, overall }: Props) {
  return (
    <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-64 shrink-0 border-r border-border bg-sidebar lg:block">
      <div className="flex h-full flex-col">
        <div className="border-b border-border p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Progresso geral
            </span>
            <span className="text-sm font-semibold text-foreground">{overall}%</span>
          </div>
          <Progress value={overall} className="h-1.5" />
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          {SECTIONS.map((s, idx) => {
            const pct = completion[s.key] ?? 0;
            const state: "done" | "active" | "pending" =
              s.key === active ? "active" : pct >= 100 ? "done" : "pending";
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => onChange(s.key)}
                className={cn(
                  "group flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors",
                  state === "active"
                    ? "bg-primary/8 text-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                )}
              >
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center">
                  {state === "done" ? (
                    <span className="grid size-5 place-items-center rounded-full bg-status-ready-fg/15 text-status-ready-fg">
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                  ) : state === "active" ? (
                    <CircleDot className="size-5 text-primary" />
                  ) : (
                    <Circle className="size-5 text-muted-foreground/50" />
                  )}
                </span>
                <span className="flex-1">
                  <span className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80">
                    Etapa {idx + 1}
                  </span>
                  <span
                    className={cn(
                      "block text-[13px] leading-tight",
                      state === "active" && "font-semibold text-foreground",
                    )}
                  >
                    {s.label}
                  </span>
                  {pct > 0 && pct < 100 && (
                    <span className="mt-1 block text-[11px] text-muted-foreground">
                      {pct}% preenchido
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
