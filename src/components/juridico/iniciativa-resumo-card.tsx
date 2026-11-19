import { Link } from "@tanstack/react-router";
import { Eye, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getFilial } from "@/components/projects-list";
import { iniciativaValor } from "@/lib/juridico";
import type { Project } from "@/lib/types";

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Resumo completo da iniciativa, na mesma estrutura usada na ficha da
// Controladoria (ver controladoria-ficha.tsx) — informações básicas,
// objetivo, resumo, atividades realizadas e áreas envolvidas. Reutilizado
// tanto na ficha própria da iniciativa quanto na seção "Iniciativas que
// compõem o pré-projeto" (ver escopo do Jurídico, itens 3/12/16).
export function IniciativaResumoCard({ project }: { project: Project }) {
  const resumo = [project.answers.inov_3, project.answers.inov_9].filter(Boolean).join(" ");

  return (
    <div className="space-y-5">
      <div>
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Informações básicas
        </h4>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted-foreground">Diretoria responsável</dt>
            <dd className="text-sm font-medium text-foreground">{project.area}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Filial</dt>
            <dd className="text-sm font-medium text-foreground">{getFilial(project)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Responsável</dt>
            <dd className="text-sm font-medium text-foreground">{project.responsible}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Valor financeiro</dt>
            <dd className="text-sm font-medium text-foreground">{brl(iniciativaValor(project))}</dd>
          </div>
        </dl>
      </div>

      <div>
        <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Objetivo da iniciativa
        </h4>
        <p className="text-sm leading-relaxed text-foreground">
          {project.answers.inov_3?.trim() || "Não informado."}
        </p>
      </div>

      <div>
        <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Resumo da iniciativa
        </h4>
        <p className="text-sm leading-relaxed text-foreground">
          {resumo || "Resumo não disponível — consulte as respostas originais na ficha completa."}
        </p>
      </div>

      <div>
        <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Atividades realizadas
        </h4>
        <p className="text-sm leading-relaxed text-foreground">
          {project.answers.met_2?.trim() || "Não informado."}
        </p>
      </div>

      <div>
        <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Áreas envolvidas
        </h4>
        <p className="text-sm leading-relaxed text-foreground">
          {project.area}
          {project.resources.filter((r) => r.active).length > 0 &&
            ` — ${project.resources
              .filter((r) => r.active)
              .map((r) => r.name)
              .join(", ")}`}
        </p>
      </div>
    </div>
  );
}

// Identificação compacta de uma iniciativa — usada em listas de referência
// (painel de iniciativas do agrupamento, origem do projeto): nome como
// informação principal, área e filial abaixo (sem o nome do responsável), e
// acesso à ficha completa pelo ícone de olhinho (ver escopo do Jurídico,
// itens 2 e 4 — a visualização completa agora é uma página própria, não um
// painel lateral).
export function IniciativaCompactCard({
  project,
  onRemove,
}: {
  project: Project;
  onRemove?: () => void;
}) {
  return (
    <div className="rounded-md border border-border p-3 text-sm">
      <div className="flex items-start justify-between gap-2">
        <span className="font-medium text-foreground">{project.name}</span>
        <div className="flex shrink-0 gap-1">
          <Button size="icon" variant="ghost" className="size-7" aria-label="Ver detalhes" asChild>
            <Link to="/juridico/iniciativas/$id" params={{ id: project.id }}>
              <Eye className="size-3.5" />
            </Link>
          </Button>
          {onRemove && (
            <Button
              size="icon"
              variant="ghost"
              className="size-7 text-muted-foreground hover:text-destructive"
              aria-label="Remover"
              onClick={onRemove}
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </div>
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        {project.area} · {getFilial(project)}
      </div>
      <div className="mt-1 text-xs font-medium text-foreground">
        {brl(iniciativaValor(project))}
      </div>
    </div>
  );
}
