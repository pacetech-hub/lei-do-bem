import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { despesaRefs, valorConsiderado } from "@/lib/controladoria";
import type { Project } from "@/lib/types";

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (iso: string) => format(new Date(iso), "dd/MM/yyyy", { locale: ptBR });

// Painel de detalhes de uma iniciativa, reutilizado tanto na lista de
// Iniciativas quanto na tela de revisão de agrupamento — abre sem perder o
// contexto de onde foi acionado (não navega para outra rota).
export function IniciativaDetailSheet({
  project,
  open,
  onOpenChange,
}: {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const despesas = project ? despesaRefs(project) : [];

  return (
    <Sheet open={open && !!project} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {project && (
          <>
            <SheetHeader>
              <SheetTitle>{project.name}</SheetTitle>
              <SheetDescription>
                {project.area} · {project.responsible}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-4 space-y-6 px-4 pb-8">
              <section>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Informações gerais
                </h4>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">Diretoria</dt>
                    <dd className="font-medium text-foreground">{project.area}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Responsável</dt>
                    <dd className="font-medium text-foreground">{project.responsible}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Ano de referência</dt>
                    <dd className="font-medium text-foreground">
                      {new Date(project.startDate).getFullYear()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Recebida em</dt>
                    <dd className="font-medium text-foreground">
                      {project.reviewedAt ? fmtDate(project.reviewedAt) : "—"}
                    </dd>
                  </div>
                </dl>
              </section>

              <section>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Objetivo
                </h4>
                <p className="text-sm text-foreground">
                  {project.answers.inov_3?.trim() || "Não informado."}
                </p>
              </section>

              <section>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Descrição
                </h4>
                <p className="text-sm text-foreground">
                  {project.answers.inov_9?.trim() || "Não informado."}
                </p>
              </section>

              <section>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Atividades de inovação
                </h4>
                <p className="text-sm text-foreground">
                  {project.answers.met_2?.trim() || "Não informado."}
                </p>
              </section>

              <section>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Áreas e profissionais envolvidos
                </h4>
                <p className="text-sm text-foreground">
                  {project.area}
                  {project.resources.filter((r) => r.active).length > 0 &&
                    ` — ${project.resources
                      .filter((r) => r.active)
                      .map((r) => r.name)
                      .join(", ")}`}
                </p>
              </section>

              <section>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Despesas e valores
                </h4>
                {despesas.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma despesa lançada.</p>
                ) : (
                  <ul className="space-y-1 text-sm">
                    {despesas.map((d) => (
                      <li key={d.id} className="flex items-center justify-between gap-2">
                        <span className="text-foreground">{d.title}</span>
                        <span className="tabular-nums text-muted-foreground">
                          {d.type === "funcionario" ? `${d.value}h` : brl(d.value)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-2 border-t border-border pt-2 text-sm font-medium text-foreground">
                  Total considerado: {brl(valorConsiderado(project))}
                </p>
              </section>

              <section>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Informações originais encaminhadas pela Controladoria
                </h4>
                {project.controladoriaHistory && project.controladoriaHistory.length > 0 ? (
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {project.controladoriaHistory.map((ev) => (
                      <li key={ev.id}>
                        <span className="text-foreground">{ev.actor}</span> {ev.description} em{" "}
                        {fmtDate(ev.date)}.
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum histórico disponível.</p>
                )}
              </section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
