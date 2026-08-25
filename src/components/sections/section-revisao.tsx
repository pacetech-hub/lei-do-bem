import { useState } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Send, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useProjectsStore } from "@/lib/store";
import type { AdjustmentItem, Project, SectionDef, SectionKey } from "@/lib/types";
import { SECTIONS, SUGGESTED_PROJECT_TAGS } from "@/lib/types";

// Exibição compacta e somente leitura das tags do projeto, reaproveitada no
// cabeçalho da ficha (ver project-ficha.tsx) — a edição em si só existe aqui,
// na Revisão Final, e só para o Revisor.
export function ProjectTagsInline({ tags }: { tags?: string[] }) {
  if (!tags || tags.length === 0) return null;
  return (
    <>
      {tags.map((t) => (
        <span
          key={t}
          className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground"
        >
          <Tag className="size-3" /> {t}
        </span>
      ))}
    </>
  );
}

function ProjectTagsEditor({ project, editable }: { project: Project; editable: boolean }) {
  const updateProject = useProjectsStore((s) => s.updateProject);
  const [input, setInput] = useState("");
  const tags = project.tags ?? [];

  const addTag = (tag: string) => {
    const clean = tag.trim();
    if (!clean || tags.includes(clean)) return;
    updateProject(project.id, { tags: [...tags, clean] });
    setInput("");
  };
  const removeTag = (tag: string) => {
    updateProject(project.id, { tags: tags.filter((t) => t !== tag) });
  };

  const suggestions = SUGGESTED_PROJECT_TAGS.filter((t) => !tags.includes(t));

  return (
    <div className="mb-6 rounded-lg border border-border bg-surface p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Tags do projeto</h3>
        <span className="text-xs text-muted-foreground">Não obrigatório</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.length === 0 && !editable && (
          <span className="text-sm text-muted-foreground">Nenhuma tag atribuída.</span>
        )}
        {tags.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground"
          >
            {t}
            {editable && (
              <button
                type="button"
                onClick={() => removeTag(t)}
                aria-label={`Remover tag ${t}`}
                className="text-secondary-foreground/60 hover:text-secondary-foreground"
              >
                <X className="size-3" />
              </button>
            )}
          </span>
        ))}
      </div>
      {editable && (
        <div className="mt-3 space-y-2">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag(input);
                }
              }}
              placeholder="Digite uma tag e pressione Enter"
              className="h-8 text-sm"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!input.trim()}
              onClick={() => addTag(input)}
            >
              Adicionar
            </Button>
          </div>
          {suggestions.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Sugestões:</span>
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => addTag(s)}
                  className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  + {s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface Props {
  project: Project;
  completion: Record<SectionKey, number>;
  onGoToSection: (s: SectionKey) => void;
  canSubmit: boolean;
  hideSubmitCta?: boolean;
  pendingItems?: AdjustmentItem[];
  mode?: "relator" | "revisor" | "financeiro" | "juridico";
  // Etapas a listar — o Relator não lança despesas, então "Despesas" nem
  // aparece aqui (ver project-ficha.tsx: visibleSections).
  sections?: SectionDef[];
}

export function SectionRevisao({
  project,
  completion,
  onGoToSection,
  canSubmit,
  hideSubmitCta = false,
  pendingItems,
  mode = "relator",
  sections = SECTIONS,
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

      <ProjectTagsEditor project={project} editable={mode === "revisor"} />

      <div className="space-y-3">
        {sections
          .filter((s) => s.key !== "revisao")
          .map((s) => {
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
