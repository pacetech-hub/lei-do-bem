import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertTriangle, ArrowLeft, CheckCircle2, History, Send, Undo2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useProjectsStore } from "@/lib/store";
import { getFilial } from "@/components/projects-list";
import { hasPendenciaAberta, todasDespesasDecididas } from "@/lib/controladoria";
import { ControladoriaDespesas } from "@/components/controladoria/controladoria-despesas";
import { ControladoriaStatusBadge } from "@/components/controladoria/controladoria-status-badge";
import {
  QUESTIONS_BARREIRAS,
  QUESTIONS_INOVADOR,
  QUESTIONS_METODOLOGIA,
  ROLE_USERS,
  type Project,
} from "@/lib/types";

function fmtDate(iso: string) {
  return format(new Date(iso), "dd/MM/yyyy", { locale: ptBR });
}

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

export function ControladoriaFicha({ project }: { project: Project }) {
  const navigate = useNavigate();
  const updateProject = useProjectsStore((s) => s.updateProject);
  const [devolverOpen, setDevolverOpen] = useState(false);
  const [enviarOpen, setEnviarOpen] = useState(false);

  const controladoriaStatus = project.controladoriaStatus ?? "aguardando_analise";
  const isActive = controladoriaStatus === "aguardando_analise";
  const hasPendencia = hasPendenciaAberta(project);
  const allDecided = todasDespesasDecididas(project);
  const history = [...(project.controladoriaHistory ?? [])].sort(
    (a, b) => +new Date(b.date) - +new Date(a.date),
  );

  const appendHistory = (description: string) => [
    ...(project.controladoriaHistory ?? []),
    {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      actor: ROLE_USERS.controladoria.name,
      description,
    },
  ];

  const handleDevolver = () => {
    updateProject(project.id, {
      status: "revisao",
      controladoriaStatus: "devolvida_revisor",
      controladoriaHistory: appendHistory(
        "devolveu a iniciativa ao Revisor por pendências identificadas nas despesas",
      ),
    });
    toast.success("Iniciativa devolvida ao Revisor");
    setDevolverOpen(false);
    navigate({ to: "/controladoria/iniciativas" });
  };

  const handleEnviar = () => {
    updateProject(project.id, {
      controladoriaStatus: "enviada_juridico",
      controladoriaHistory: appendHistory("encaminhou a iniciativa para o Jurídico"),
    });
    toast.success("Iniciativa encaminhada para o Jurídico");
    setEnviarOpen(false);
    navigate({ to: "/controladoria/iniciativas" });
  };

  const resumo = [project.answers.inov_3, project.answers.inov_9].filter(Boolean).join(" ");
  const ajustesDaRevisao = project.adjustmentItems ?? [];
  const despesaAdjustments = project.despesaAdjustments ?? [];

  return (
    <div className="pb-32">
      <main className="mx-auto max-w-[1400px] px-6 py-8">
        <Link
          to="/controladoria/iniciativas"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Iniciativas
        </Link>

        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-2">
              <ControladoriaStatusBadge status={controladoriaStatus} />
            </div>
            <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">
              {project.name}
            </h1>
          </div>
        </div>

        {/* 1. Informações básicas (1/3) + 2. Despesas (2/3), lado a lado */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section className="rounded-lg border border-border bg-surface p-5 lg:col-span-1">
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
                {resumo || "Resumo não disponível — consulte as respostas originais abaixo."}
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

          <section className="rounded-lg border-2 border-primary/20 bg-surface p-5 lg:col-span-2">
            <h2 className="mb-4 text-base font-semibold text-foreground">Despesas</h2>
            <ControladoriaDespesas project={project} readOnly={!isActive} />
          </section>
        </div>

        {/* 3. Demais informações */}
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Demais informações</h2>
          <Accordion type="multiple" className="rounded-lg border border-border bg-surface px-5">
            <AccordionItem value="respostas">
              <AccordionTrigger>Respostas do Relator</AccordionTrigger>
              <AccordionContent className="space-y-6">
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Elemento Tecnologicamente Novo ou Inovador
                  </h4>
                  <QAList questions={QUESTIONS_INOVADOR} project={project} />
                </div>
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Barreiras e Desafios Tecnológicos
                  </h4>
                  <QAList questions={QUESTIONS_BARREIRAS} project={project} />
                </div>
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Metodologia e Métodos Utilizados
                  </h4>
                  <QAList questions={QUESTIONS_METODOLOGIA} project={project} />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="anexos">
              <AccordionTrigger>Documentos anexados</AccordionTrigger>
              <AccordionContent>
                {(project.attachments._evidencias ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum documento anexado.</p>
                ) : (
                  <ul className="space-y-2">
                    {(project.attachments._evidencias ?? []).map((a) => (
                      <li key={a.id} className="flex items-center justify-between text-sm">
                        <span className="text-foreground">{a.name}</span>
                        <span className="text-xs text-muted-foreground">
                          enviado por {a.uploadedBy} em {fmtDate(a.uploadedAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="financeiro">
              <AccordionTrigger>Informações financeiras complementares</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Recursos cadastrados pelo Relator
                  </h4>
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
                </div>
                {despesaAdjustments.length > 0 && (
                  <div>
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Ajustes de despesa solicitados durante a revisão
                    </h4>
                    <ul className="space-y-1 text-sm text-foreground">
                      {despesaAdjustments.map((a) => (
                        <li key={a.id}>{a.comment}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="revisao">
              <AccordionTrigger>Revisão do Revisor</AccordionTrigger>
              <AccordionContent className="space-y-3 text-sm">
                <p>
                  <span className="text-muted-foreground">Revisado por:</span>{" "}
                  <span className="font-medium text-foreground">
                    {project.reviewedBy ?? "Não informado"}
                  </span>
                  {project.reviewedAt && <> em {fmtDate(project.reviewedAt)}</>}
                </p>
                {project.tags && project.tags.length > 0 && (
                  <p>
                    <span className="text-muted-foreground">Tags:</span> {project.tags.join(", ")}
                  </p>
                )}
                {ajustesDaRevisao.length > 0 && (
                  <div>
                    <div className="mb-1 text-muted-foreground">
                      Ajustes solicitados ao Relator durante a revisão:
                    </div>
                    <ul className="list-inside list-disc space-y-1">
                      {ajustesDaRevisao.map((a) => (
                        <li key={a.id}>{a.comment}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {!project.tags?.length && ajustesDaRevisao.length === 0 && (
                  <p className="text-muted-foreground">Nenhuma observação adicional do Revisor.</p>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* 4. Histórico */}
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

      {/* Ações de rodapé — variam conforme o cenário das despesas */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-6 py-3">
          {!isActive ? (
            <p className="text-sm text-muted-foreground">
              {controladoriaStatus === "devolvida_revisor"
                ? "Esta iniciativa foi devolvida ao Revisor e não está mais com a Controladoria."
                : "Análise concluída — esta iniciativa já foi encaminhada ao Jurídico."}
            </p>
          ) : hasPendencia ? (
            <>
              <p className="flex items-center gap-2 text-sm text-status-adjust-fg">
                <AlertTriangle className="size-4 shrink-0" /> Existe pendência em aberto nas
                despesas.
              </p>
              <div className="ml-auto">
                <Button variant="outline" className="gap-2" onClick={() => setDevolverOpen(true)}>
                  <Undo2 className="size-4" /> Devolver ao Revisor
                </Button>
              </div>
            </>
          ) : allDecided ? (
            <div className="ml-auto">
              <Button className="gap-2" onClick={() => setEnviarOpen(true)}>
                <Send className="size-4" /> Enviar para Jurídico
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Decida todas as despesas (validar, sinalizar pendência ou excluir) para habilitar o
              encaminhamento.
            </p>
          )}
        </div>
      </div>

      <AlertDialog open={devolverOpen} onOpenChange={setDevolverOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Devolver iniciativa ao Revisor?</AlertDialogTitle>
            <AlertDialogDescription>
              A iniciativa inteira será encaminhada de volta ao Revisor para correção das pendências
              identificadas. As justificativas e decisões já registradas pela Controladoria serão
              preservadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDevolver}>Devolver ao Revisor</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={enviarOpen} onOpenChange={setEnviarOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enviar iniciativa para o Jurídico?</AlertDialogTitle>
            <AlertDialogDescription>
              A análise da Controladoria será concluída e a iniciativa será encaminhada para o
              Jurídico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleEnviar}>
              <CheckCircle2 className="size-4" /> Enviar para Jurídico
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
