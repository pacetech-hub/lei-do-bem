import { CheckCircle2, AlertCircle, AlertTriangle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { AdjustmentItem, Project, SectionKey } from "@/lib/types";
import { SECTIONS } from "@/lib/types";

interface Props {
  project: Project;
  completion: Record<SectionKey, number>;
  onGoToSection: (s: SectionKey) => void;
  canSubmit: boolean;
  hideSubmitCta?: boolean;
  pendingItems?: AdjustmentItem[];
}

export function SectionRevisao({
  project,
  completion,
  onGoToSection,
  canSubmit,
  hideSubmitCta = false,
  pendingItems,
}: Props) {
  const totalExpenses =
    project.employees.length + project.thirdParties.length + project.materials.length;
  const totalEvidences = (project.attachments["_evidencias"] ?? []).length;

  return (
    <div className="max-w-3xl">
      <header className="mb-6">
        <h2 className="text-lg font-semibold tracking-tight">Revisão Final</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Confira o preenchimento de cada seção antes de enviar o projeto para revisão.
        </p>
      </header>

      {pendingItems && pendingItems.length > 0 && (
        <div className="mb-6 flex items-start gap-2 rounded-lg border border-status-adjust-fg/40 bg-status-adjust/5 p-4 text-sm text-status-adjust-fg">
          <AlertTriangle className="mt-1 size-4 shrink-0" />
          <div className="space-y-1">
            {pendingItems.map((item) => (
              <p key={item.id}>Ajuste solicitado: {item.comment}</p>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6 rounded-lg border border-border bg-surface p-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Evidências" value={String(totalEvidences)} />
          <Stat label="Despesas registradas" value={String(totalExpenses)} />
          <Stat
            label="Respostas preenchidas"
            value={`${Object.values(project.answers).filter((v) => v.trim().length >= 40).length}`}
          />
        </div>
      </div>

      <div className="space-y-3">
        {SECTIONS.filter((s) => s.key !== "revisao").map((s) => {
          const pct = completion[s.key];
          const done = pct >= 80;
          return (
            <div
              key={s.key}
              className="flex items-center gap-4 rounded-lg border border-border bg-surface p-4"
            >
              <div
                className={`grid size-9 place-items-center rounded-full ${done ? "bg-status-ready-fg/15 text-status-ready-fg" : "bg-status-adjust-fg/15 text-status-adjust-fg"}`}
              >
                {done ? <CheckCircle2 className="size-5" /> : <AlertCircle className="size-5" />}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{s.label}</div>
                <div className="mt-1 flex items-center gap-2">
                  <Progress value={pct} className="h-1.5 flex-1" />
                  <span className="text-xs tabular-nums text-muted-foreground">{pct}%</span>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => onGoToSection(s.key)}>
                {done ? "Revisar" : "Completar"}
              </Button>
            </div>
          );
        })}
      </div>

      {!hideSubmitCta && (
        <div className="mt-8 rounded-lg border border-primary/20 bg-primary/5 p-5">
          <div className="flex items-start gap-3">
            <Send className="mt-1 size-5 shrink-0 text-primary" />
            <div className="flex-1">
              <div className="text-sm font-semibold">Enviar para revisão</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Use o botão em destaque "Enviar para Revisão" no rodapé da página. O projeto será
                avaliado pela equipe responsável e você poderá continuar editando caso ele retorne
                com status "Ajuste solicitado".
              </p>
            </div>
          </div>
          {!canSubmit && (
            <p className="mt-3 text-xs text-muted-foreground">
              Complete pelo menos 80% das seções de conteúdo obrigatórias antes de enviar.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
