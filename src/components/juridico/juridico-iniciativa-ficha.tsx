import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileStack, History } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProjectsStore } from "@/lib/store";
import { getFilial } from "@/components/projects-list";
import { despesaRefs, valorConsiderado } from "@/lib/controladoria";
import { agrupamentoFor, iniciativaValor } from "@/lib/juridico";
import {
  QUESTIONS_BARREIRAS,
  QUESTIONS_INOVADOR,
  QUESTIONS_METODOLOGIA,
  type Project,
} from "@/lib/types";

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (iso: string) => format(new Date(iso), "dd/MM/yyyy", { locale: ptBR });

function QAList({
  questions,
  project,
}: {
  questions: { id: string; label: string }[];
  project: Project;
}) {
  return (
    <dl className="space-y-3">
      {questions.map((q) => {
        const answer = project.answers[q.id];
        return (
          <div key={q.id}>
            <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {q.label}
            </dt>
            <dd className="mt-1 text-sm text-foreground">
              {answer?.trim() ? (
                answer
              ) : (
                <span className="text-muted-foreground">Sem resposta.</span>
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

export function JuridicoIniciativaFicha({ project }: { project: Project }) {
  const agrupamentos = useProjectsStore((s) => s.agrupamentos);
  const agrupamento = agrupamentoFor(agrupamentos, project.id);
  const despesas = despesaRefs(project);
  const resumo = [project.answers.inov_3, project.answers.inov_9].filter(Boolean).join(" ");
  const evidencias = project.attachments._evidencias ?? [];
  const history = [...(project.controladoriaHistory ?? [])].sort(
    (a, b) => +new Date(b.date) - +new Date(a.date),
  );

  return (
    <div>
      <main className="mx-auto max-w-[1400px] px-6 py-8">
        <Link
          to="/juridico/iniciativas"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          Iniciativas
        </Link>

        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">
              {project.name}
            </h1>
          </div>
          {agrupamento && (
            <Link
              to="/juridico/agrupamentos/$id"
              params={{ id: agrupamento.id }}
              className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <FileStack className="size-3.5" /> Agrupamento: {agrupamento.name}
            </Link>
          )}
        </div>

        {/* 1. Informações básicas (30%) + 2. Detalhes das etapas (70%), lado a lado */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-10">
          <section className="rounded-lg border border-border bg-surface p-5 lg:col-span-3">
            <h2 className="mb-4 text-sm font-semibold text-foreground">Informações básicas</h2>
            <dl className="grid gap-4">
              <div>
                <dt className="text-xs text-muted-foreground">Diretoria responsável</dt>
                <dd className="text-sm font-medium text-foreground">{project.area}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Responsável</dt>
                <dd className="text-sm font-medium text-foreground">{project.responsible}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Filial</dt>
                <dd className="text-sm font-medium text-foreground">{getFilial(project)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Período de execução</dt>
                <dd className="text-sm font-medium text-foreground">
                  {fmtDate(project.startDate)} a {fmtDate(project.endDate)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Recebida da Controladoria em</dt>
                <dd className="text-sm font-medium text-foreground">
                  {project.reviewedAt ? fmtDate(project.reviewedAt) : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Valor financeiro considerado</dt>
                <dd className="text-sm font-medium text-foreground">
                  {brl(iniciativaValor(project))}
                </dd>
              </div>
            </dl>

            <div className="mt-4 border-t border-border pt-4">
              <div className="text-xs text-muted-foreground">Objetivo da iniciativa</div>
              <p className="mt-1 text-sm text-foreground">
                {project.answers.inov_3?.trim() || "Não informado."}
              </p>
            </div>

            <div className="mt-4">
              <div className="text-xs text-muted-foreground">Resumo da iniciativa</div>
              <p className="mt-1 text-sm text-foreground">
                {resumo || "Resumo não disponível — consulte as etapas ao lado."}
              </p>
            </div>

            <div className="mt-4">
              <div className="text-xs text-muted-foreground">Atividades de inovação realizadas</div>
              <p className="mt-1 text-sm text-foreground">
                {project.answers.met_2?.trim() || "Não informado."}
              </p>
            </div>

            <div className="mt-4">
              <div className="text-xs text-muted-foreground">Áreas e profissionais envolvidos</div>
              <p className="mt-1 text-sm text-foreground">
                {project.area}
                {project.resources.filter((r) => r.active).length > 0 &&
                  ` — ${project.resources
                    .filter((r) => r.active)
                    .map((r) => r.name)
                    .join(", ")}`}
              </p>
            </div>
          </section>

          <section className="rounded-lg border-2 border-primary/20 bg-surface p-5 lg:col-span-7">
            <h2 className="mb-4 text-base font-semibold text-foreground">Detalhes das etapas</h2>
            <Tabs defaultValue="inovador">
              <TabsList className="mb-4 flex-wrap">
                <TabsTrigger value="inovador">Elemento Inovador</TabsTrigger>
                <TabsTrigger value="barreiras">Barreiras</TabsTrigger>
                <TabsTrigger value="metodologia">Metodologia</TabsTrigger>
                <TabsTrigger value="evidencias">Evidências</TabsTrigger>
                <TabsTrigger value="despesas">Despesas</TabsTrigger>
                <TabsTrigger value="recursos">Recursos</TabsTrigger>
              </TabsList>

              <TabsContent value="inovador">
                <QAList questions={QUESTIONS_INOVADOR} project={project} />
              </TabsContent>

              <TabsContent value="barreiras">
                <QAList questions={QUESTIONS_BARREIRAS} project={project} />
              </TabsContent>

              <TabsContent value="metodologia">
                <QAList questions={QUESTIONS_METODOLOGIA} project={project} />
              </TabsContent>

              <TabsContent value="evidencias">
                {evidencias.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum documento anexado.</p>
                ) : (
                  <ul className="space-y-2">
                    {evidencias.map((a) => (
                      <li key={a.id} className="flex items-center justify-between text-sm">
                        <span className="text-foreground">{a.name}</span>
                        <span className="text-xs text-muted-foreground">
                          enviado por {a.uploadedBy} em {fmtDate(a.uploadedAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </TabsContent>

              <TabsContent value="despesas">
                {despesas.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma despesa lançada.</p>
                ) : (
                  <div className="overflow-hidden rounded-lg border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Despesa</TableHead>
                          <TableHead>Detalhe</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {despesas.map((d) => (
                          <TableRow key={d.id}>
                            <TableCell className="font-medium">{d.title}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {d.detail}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {d.type === "funcionario" ? `${d.value}h` : brl(d.value)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
                <p className="mt-3 text-sm font-medium text-foreground">
                  Total considerado: {brl(valorConsiderado(project))}
                </p>
              </TabsContent>

              <TabsContent value="recursos">
                {project.resources.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum recurso cadastrado.</p>
                ) : (
                  <ul className="space-y-1 text-sm text-foreground">
                    {project.resources.map((r) => (
                      <li key={r.id}>
                        {r.name}
                        {r.role ? ` — ${r.role}` : ""} · {r.area}
                        {!r.active && " (inativo)"}
                      </li>
                    ))}
                  </ul>
                )}
              </TabsContent>
            </Tabs>
          </section>
        </div>

        {/* 3. Histórico */}
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <History className="size-4 text-muted-foreground" /> Histórico
          </h2>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum evento registrado ainda.</p>
          ) : (
            <div className="space-y-2">
              {history.map((ev) => (
                <div key={ev.id} className="rounded-lg border border-border bg-surface p-3 text-sm">
                  <span className="font-medium text-foreground">{ev.actor}</span>{" "}
                  <span className="text-foreground">{ev.description}</span>{" "}
                  <span className="text-muted-foreground">em {fmtDate(ev.date)}.</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
