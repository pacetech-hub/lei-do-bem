import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Save, Send, CloudUpload, ArrowLeft, GitFork, Wrench } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

import { AppHeader } from "@/components/app-header";
import { ProjectSidebar } from "@/components/project-sidebar";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { getFilial, quarterLabel } from "@/components/projects-list";
import {
  ALL_REQUIRED_QUESTIONS,
  CURRENT_USER,
  QUESTIONS_BARREIRAS,
  QUESTIONS_INOVADOR,
  QUESTIONS_METODOLOGIA,
  SECTIONS,
  STATUS_LABEL,
  type Project,
  type SectionKey,
} from "@/lib/types";

import { SectionGerais } from "@/components/sections/section-gerais";
import { SectionQuestions } from "@/components/sections/section-questions";
import { SectionEvidencias } from "@/components/sections/section-evidencias";
import { SectionDespesas } from "@/components/sections/section-despesas";
import { SectionRevisao } from "@/components/sections/section-revisao";

interface ProjectFichaProps {
  project: Project;
  mode: "relator" | "revisor";
  masterProject?: Project;
}

export function ProjectFicha({ project, mode, masterProject }: ProjectFichaProps) {
  const navigate = useNavigate();
  const setStatus = useProjectsStore((s) => s.setStatus);
  const updateProject = useProjectsStore((s) => s.updateProject);
  const [section, setSection] = useState<SectionKey>("gerais");
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustNote, setAdjustNote] = useState("");
  const [approveOpen, setApproveOpen] = useState(false);

  const isRevisor = mode === "revisor";
  const fichaRoute = isRevisor ? "/revisor/projetos/$id" : "/projetos/$id";
  const canReview = isRevisor && project.status === "revisao";

  const completion = useMemo(() => {
    const answered = (ids: string[]) =>
      ids.filter((q) => (project.answers[q] ?? "").trim().length >= 40).length;

    const inovPct = Math.round(
      (answered(QUESTIONS_INOVADOR.map((q) => q.id)) / QUESTIONS_INOVADOR.length) * 100,
    );
    const barrPct = Math.round(
      (answered(QUESTIONS_BARREIRAS.map((q) => q.id)) / QUESTIONS_BARREIRAS.length) * 100,
    );
    const metPct = Math.round(
      (answered(QUESTIONS_METODOLOGIA.map((q) => q.id)) / QUESTIONS_METODOLOGIA.length) * 100,
    );

    const evidenceCount = (project.attachments["_evidencias"] ?? []).length;
    const evPct = Math.min(100, evidenceCount * 25);

    const despCount =
      project.employees.length + project.thirdParties.length + project.materials.length;
    const despPct = Math.min(100, despCount * 33);

    const revPct = ALL_REQUIRED_QUESTIONS.every(
      (q) => (project.answers[q] ?? "").trim().length >= 40,
    )
      ? 100
      : 0;

    return {
      gerais: 100,
      inovador: inovPct,
      barreiras: barrPct,
      metodologia: metPct,
      evidencias: evPct,
      despesas: despPct,
      revisao: revPct,
    } as Record<SectionKey, number>;
  }, [project]);

  const overall = Math.round(
    Object.values(completion).reduce((a, b) => a + b, 0) / SECTIONS.length,
  );

  const canSubmit =
    completion.inovador >= 80 && completion.barreiras >= 80 && completion.metodologia >= 80;

  const handleSaveDraft = () => {
    toast.success("Rascunho salvo", { description: "As alterações foram registradas." });
  };
  const handleSubmit = () => {
    if (!canSubmit) {
      toast.warning("Complete as seções obrigatórias antes de enviar para revisão.");
      return;
    }
    setStatus(project.id, "revisao");
    toast.success("Projeto enviado para revisão");
  };

  const handleRequestAdjustment = () => {
    if (!adjustNote.trim()) {
      toast.error("Descreva o que precisa ser corrigido.");
      return;
    }
    updateProject(project.id, { status: "ajustes", lastAdjustmentNote: adjustNote.trim() });
    toast.success("Ajustes solicitados", { description: "O projeto foi devolvido ao Relator." });
    setAdjustOpen(false);
    setAdjustNote("");
    navigate({ to: "/revisor" });
  };

  const handleApprove = () => {
    updateProject(project.id, {
      status: "pronto",
      legalStatus: "aguardando_juridico",
      reviewedBy: CURRENT_USER.name,
      reviewedAt: new Date().toISOString(),
    });
    toast.success("Projeto encaminhado ao Jurídico");
    setApproveOpen(false);
    navigate({ to: "/revisor" });
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader current={project.name} />

      <div className="mx-auto flex max-w-[1440px]">
        <ProjectSidebar
          active={section}
          onChange={setSection}
          completion={completion}
          overall={overall}
        />

        <main className="flex-1 pb-32">
          {/* Ficha header */}
          <div className="border-b border-border bg-surface">
            <div className="px-6 py-5 lg:px-10">
              {isRevisor && (
                <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg border border-border bg-surface-muted/60 px-4 py-3 text-xs text-muted-foreground">
                  <span>
                    Status:{" "}
                    <span className="font-medium text-foreground">
                      {STATUS_LABEL[project.status]}
                    </span>
                  </span>
                  <span>
                    Relator:{" "}
                    <span className="font-medium text-foreground">{project.responsible}</span>
                  </span>
                  <span>
                    Área: <span className="font-medium text-foreground">{project.area}</span>
                  </span>
                  <span>
                    Filial:{" "}
                    <span className="font-medium text-foreground">{getFilial(project)}</span>
                  </span>
                  <span>
                    Trimestre:{" "}
                    <span className="font-medium text-foreground">
                      {quarterLabel(project.updatedAt)}
                    </span>
                  </span>
                </div>
              )}

              {project.projectType === "dependente" && (
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                    <GitFork className="size-3.5" /> Projeto Dependente
                  </span>
                  {masterProject && (
                    <>
                      <span className="text-xs text-muted-foreground">
                        Projeto Mestre:{" "}
                        <span className="font-medium text-foreground">{masterProject.name}</span>
                      </span>
                      <Link
                        to={fichaRoute}
                        params={{ id: masterProject.id }}
                        className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <ArrowLeft className="size-3.5" /> Voltar para Projeto Mestre
                      </Link>
                    </>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <StatusBadge status={project.status} />
                    <span className="text-xs text-muted-foreground">
                      Atualizado há{" "}
                      {formatDistanceToNow(new Date(project.updatedAt), { locale: ptBR })}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-status-ready-fg">
                      <CloudUpload className="size-3.5" /> Salvo automaticamente
                    </span>
                  </div>
                  <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">
                    {project.name}
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {project.area} · Responsável: {project.responsible}
                  </p>
                </div>
                <div className="flex min-w-[220px] flex-col items-end gap-1.5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Progresso da ficha</span>
                    <span className="font-semibold text-foreground">{overall}%</span>
                  </div>
                  <Progress value={overall} className="h-1.5 w-[220px]" />
                  {isRevisor && (
                    <div className="mt-1.5 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        disabled={!canReview}
                        onClick={() => setAdjustOpen(true)}
                      >
                        <Wrench className="size-3.5" /> Solicitar ajustes
                      </Button>
                      <Button
                        size="sm"
                        className="gap-1.5"
                        disabled={!canReview}
                        onClick={() => setApproveOpen(true)}
                      >
                        <CheckCircle2 className="size-3.5" /> Aprovar e encaminhar
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section pills (mobile) */}
            <div className="scrollbar-thin flex gap-1 overflow-x-auto border-t border-border px-6 py-2 lg:hidden">
              {SECTIONS.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setSection(s.key)}
                  className={
                    "shrink-0 rounded-md px-3 py-1.5 text-xs font-medium " +
                    (section === s.key
                      ? "bg-primary text-primary-foreground"
                      : "bg-surface-muted text-muted-foreground")
                  }
                >
                  {s.short}
                </button>
              ))}
            </div>
          </div>

          {/* Section body */}
          <div className="px-6 py-8 lg:px-10">
            {section === "gerais" && <SectionGerais project={project} />}
            {section === "inovador" && (
              <SectionQuestions
                project={project}
                title="Elemento Tecnologicamente Novo ou Inovador"
                description="Descreva com riqueza de detalhes a novidade tecnológica do projeto, seus objetivos e o cenário que motivou o desenvolvimento."
                questions={QUESTIONS_INOVADOR}
              />
            )}
            {section === "barreiras" && (
              <SectionQuestions
                project={project}
                title="Barreiras e Desafios Tecnológicos"
                description="Documente os desafios enfrentados, competências mobilizadas e estratégias adotadas para superá-los."
                questions={QUESTIONS_BARREIRAS}
              />
            )}
            {section === "metodologia" && (
              <SectionQuestions
                project={project}
                title="Metodologia e Métodos Utilizados"
                description="Detalhe a metodologia empregada, o passo a passo e os resultados esperados e alcançados."
                questions={QUESTIONS_METODOLOGIA}
                extras={
                  <div className="rounded-lg border border-dashed border-border bg-surface p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                      <CloudUpload className="size-4 text-primary" /> Upload de cronograma
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Anexe o cronograma consolidado do projeto (PDF, XLSX ou imagem).
                    </p>
                  </div>
                }
              />
            )}
            {section === "evidencias" && <SectionEvidencias project={project} />}
            {section === "despesas" && <SectionDespesas project={project} />}
            {section === "revisao" && (
              <SectionRevisao
                project={project}
                completion={completion}
                onGoToSection={setSection}
                canSubmit={canSubmit}
                onSubmit={handleSubmit}
                hideSubmitCta={isRevisor}
              />
            )}

            {isRevisor && (
              <div className="mt-8 flex flex-col items-end gap-2 border-t border-border pt-6">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="gap-2"
                    disabled={!canReview}
                    onClick={() => setAdjustOpen(true)}
                  >
                    <Wrench className="size-4" /> Solicitar ajustes
                  </Button>
                  <Button
                    className="gap-2"
                    disabled={!canReview}
                    onClick={() => setApproveOpen(true)}
                  >
                    <CheckCircle2 className="size-4" /> Aprovar e encaminhar ao Jurídico
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Sticky actions */}
          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 backdrop-blur">
            <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-6 py-3 lg:pl-[calc(16rem+2.5rem)]">
              <div className="hidden text-xs text-muted-foreground sm:block">
                <span className="mr-3">
                  Status:{" "}
                  <span className="font-medium text-foreground">
                    {STATUS_LABEL[project.status]}
                  </span>
                </span>
                <span>
                  Progresso: <span className="font-medium text-foreground">{overall}%</span>
                </span>
              </div>
              <div className="ml-auto flex gap-2">
                {isRevisor ? (
                  <>
                    <Button
                      variant="outline"
                      className="gap-2"
                      disabled={!canReview}
                      onClick={() => setAdjustOpen(true)}
                    >
                      <Wrench className="size-4" /> Solicitar ajustes
                    </Button>
                    <Button
                      className="gap-2"
                      disabled={!canReview}
                      onClick={() => setApproveOpen(true)}
                    >
                      <CheckCircle2 className="size-4" /> Aprovar e encaminhar
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" className="gap-2" onClick={handleSaveDraft}>
                      <Save className="size-4" /> Salvar Rascunho
                    </Button>
                    <Button className="gap-2" disabled={!canSubmit} onClick={handleSubmit}>
                      <Send className="size-4" /> Enviar para Revisão
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {isRevisor && (
        <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Solicitar ajustes</DialogTitle>
              <DialogDescription>
                Descreva o que precisa ser corrigido. O projeto voltará para o Relator com o status
                "Ajuste solicitado".
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-1.5">
              <Label htmlFor="adjust-note">O que precisa ser corrigido?</Label>
              <Textarea
                id="adjust-note"
                value={adjustNote}
                onChange={(e) => setAdjustNote(e.target.value)}
                placeholder="Ex.: Detalhar melhor o comparativo tecnológico na seção Inovador."
                rows={4}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAdjustOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleRequestAdjustment}>Solicitar ajustes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {isRevisor && (
        <AlertDialog open={approveOpen} onOpenChange={setApproveOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Encaminhar projeto para o Jurídico?</AlertDialogTitle>
              <AlertDialogDescription>
                A revisão deste projeto será concluída e o projeto será encaminhado para análise
                jurídica. Após o encaminhamento, o projeto não poderá mais ser editado pelo Revisor,
                a menos que seja devolvido para ajustes.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleApprove}>Aprovar e encaminhar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
