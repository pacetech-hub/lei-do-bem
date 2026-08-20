import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle2,
  Pencil,
  Plus,
  Save,
  Send,
  CloudUpload,
  ArrowLeft,
  GitFork,
  Share2,
  Trash2,
  Wrench,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { AppHeader } from "@/components/app-header";
import { ProjectHistoryDrawer } from "@/components/project-history-drawer";
import { ProjectSidebar } from "@/components/project-sidebar";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { FILIAIS, getFilial, quarterLabel, ProjetoFinalTag } from "@/components/projects-list";
import { REVISOR_NAMES } from "@/lib/mock";
import {
  ALL_REQUIRED_QUESTIONS,
  AREAS,
  CURRENT_USER,
  QUESTIONS_BARREIRAS,
  QUESTIONS_INOVADOR,
  QUESTIONS_METODOLOGIA,
  SECTIONS,
  SECTION_FIELD_OPTIONS,
  STATUS_LABEL,
  type AdjustmentItem,
  type Project,
  type SectionKey,
} from "@/lib/types";

import { JuridicoProcessPanel } from "@/components/juridico-process-panel";
import { SectionGerais } from "@/components/sections/section-gerais";
import { SectionQuestions } from "@/components/sections/section-questions";
import { SectionEvidencias } from "@/components/sections/section-evidencias";
import { SectionDespesas } from "@/components/sections/section-despesas";
import { SectionRevisao } from "@/components/sections/section-revisao";
import type { FieldMode } from "@/components/question-field";

interface ProjectFichaProps {
  project: Project;
  mode: "relator" | "revisor" | "financeiro" | "juridico";
  masterProject?: Project;
}

export function ProjectFicha({ project, mode, masterProject }: ProjectFichaProps) {
  const navigate = useNavigate();
  const updateProject = useProjectsStore((s) => s.updateProject);
  const finalProjects = useProjectsStore((s) => s.finalProjects);
  const [section, setSection] = useState<SectionKey>("gerais");
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustSection, setAdjustSection] = useState<SectionKey>("gerais");
  const [adjustFieldId, setAdjustFieldId] = useState<string>("");
  const [adjustComment, setAdjustComment] = useState("");
  const [approveOpen, setApproveOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareFilial, setShareFilial] = useState("");
  const [shareSetor, setShareSetor] = useState("");
  const [shareReviewer, setShareReviewer] = useState("");
  const [declineShareOpen, setDeclineShareOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [juridicoAdjustOpen, setJuridicoAdjustOpen] = useState(false);
  const [juridicoAdjustNote, setJuridicoAdjustNote] = useState("");
  const [juridicoApproveOpen, setJuridicoApproveOpen] = useState(false);

  const isRevisor = mode === "revisor";
  const isFinanceiro = mode === "financeiro";
  const isJuridico = mode === "juridico";
  const fichaRoute = isRevisor
    ? "/revisor/projetos/$id"
    : isFinanceiro
      ? "/financeiro/projetos/$id"
      : isJuridico
        ? "/juridico/projetos/$id"
        : "/projetos/$id";
  const canReview = isRevisor && project.status === "revisao";
  const canDecideJuridico = isJuridico && project.legalStatus === "aguardando_juridico";
  const fieldMode: FieldMode =
    isFinanceiro || isJuridico
      ? "locked"
      : isRevisor
        ? canReview
          ? "review"
          : "locked"
        : "editable";

  // Persistido no projeto (não em estado local) para sobreviver a navegações
  // enquanto o Revisor ainda não enviou os ajustes registrados durante a leitura.
  const draftItems = project.draftAdjustmentItems ?? [];
  const setDraftItems = (
    updater: AdjustmentItem[] | ((prev: AdjustmentItem[]) => AdjustmentItem[]),
  ) => {
    const next = typeof updater === "function" ? updater(draftItems) : updater;
    updateProject(project.id, { draftAdjustmentItems: next });
  };

  const pendingItems = useMemo(() => project.adjustmentItems ?? [], [project.adjustmentItems]);
  const pendingBySection = useMemo(() => {
    const map = new Map<SectionKey, AdjustmentItem[]>();
    pendingItems.forEach((item) => {
      const list = map.get(item.sectionKey) ?? [];
      list.push(item);
      map.set(item.sectionKey, list);
    });
    return map;
  }, [pendingItems]);
  const generalPendingItems = (key: SectionKey) =>
    pendingBySection.get(key)?.filter((i) => !i.fieldId);

  const adjustFieldOptions = SECTION_FIELD_OPTIONS[adjustSection] ?? [];

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
  const handleFinanceiroSave = () => {
    toast.success("Alterações salvas", {
      description: "As informações financeiras foram registradas.",
    });
  };
  const handleFinanceiroSubmit = () => {
    toast.success("Enviado para revisão", {
      description: "As informações financeiras foram encaminhadas para revisão.",
    });
  };
  const handleSubmit = () => {
    if (!canSubmit) {
      toast.warning("Complete as seções obrigatórias antes de enviar para revisão.");
      return;
    }
    updateProject(project.id, {
      status: "revisao",
      adjustmentItems: [],
      draftAdjustmentItems: [],
      lastAdjustmentNote: undefined,
    });
    toast.success("Projeto enviado para revisão");
  };

  const resetAdjustPicker = () => {
    setAdjustSection("gerais");
    setAdjustFieldId("");
    setAdjustComment("");
  };

  const addFieldDraftItem = (
    sectionKey: SectionKey,
    fieldId: string,
    fieldLabel: string,
    comment: string,
  ) => {
    setDraftItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), sectionKey, fieldId, fieldLabel, comment },
    ]);
    toast.success("Ajuste registrado", {
      description: "Será enviado ao Relator quando você concluir a revisão.",
    });
  };

  const addAdjustItem = () => {
    if (!adjustComment.trim()) {
      toast.error("Descreva o que precisa ser corrigido.");
      return;
    }
    const sectionLabel = SECTIONS.find((s) => s.key === adjustSection)?.label ?? adjustSection;
    const field = adjustFieldOptions.find((q) => q.id === adjustFieldId);
    setDraftItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        sectionKey: adjustSection,
        fieldId: field?.id,
        fieldLabel: field?.label ?? sectionLabel,
        comment: adjustComment.trim(),
      },
    ]);
    setAdjustFieldId("");
    setAdjustComment("");
  };

  const removeAdjustItem = (id: string) => {
    setDraftItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleRequestAdjustment = () => {
    if (draftItems.length === 0) {
      toast.error("Adicione ao menos um item ao pedido de ajuste.");
      return;
    }
    updateProject(project.id, {
      status: "ajustes",
      adjustmentItems: draftItems,
      draftAdjustmentItems: [],
      lastAdjustmentNote: draftItems
        .map(
          (i) =>
            `${SECTIONS.find((s) => s.key === i.sectionKey)?.label} — ${i.fieldLabel}: ${i.comment}`,
        )
        .join("\n"),
    });
    toast.success("Ajustes solicitados", { description: "O projeto foi devolvido ao Relator." });
    setAdjustOpen(false);
    resetAdjustPicker();
    navigate({ to: "/revisor" });
  };

  const handleApprove = () => {
    updateProject(project.id, {
      status: "pronto",
      legalStatus: "aguardando_juridico",
      reviewedBy: CURRENT_USER.name,
      reviewedAt: new Date().toISOString(),
      draftAdjustmentItems: [],
    });
    toast.success("Projeto encaminhado ao Jurídico");
    setApproveOpen(false);
    navigate({ to: "/revisor" });
  };

  const handleJuridicoRequestAdjustment = () => {
    if (!juridicoAdjustNote.trim()) {
      toast.error("Descreva o motivo do ajuste.");
      return;
    }
    updateProject(project.id, {
      status: "ajustes",
      legalStatus: undefined,
      lastAdjustmentNote: juridicoAdjustNote.trim(),
    });
    toast.success("Ajustes solicitados", { description: "O projeto retornou para o Relator." });
    setJuridicoAdjustOpen(false);
    setJuridicoAdjustNote("");
    navigate({ to: "/juridico" });
  };

  const handleJuridicoApproveForFinal = () => {
    updateProject(project.id, { legalStatus: "pronto_submissao" });
    toast.success("Projeto aprovado", {
      description: "Disponível para consolidação em um Projeto Final.",
    });
    setJuridicoApproveOpen(false);
    navigate({ to: "/juridico" });
  };

  const handleShare = () => {
    if (!shareFilial || !shareSetor || !shareReviewer) {
      toast.error("Selecione a filial, a área e o revisor responsável.");
      return;
    }
    updateProject(project.id, {
      sharedWithArea: true,
      sharedFilial: shareFilial,
      sharedSetor: shareSetor,
      sharedReviewer: shareReviewer,
      sharedStatus: "pendente",
    });
    toast.success("Projeto compartilhado", {
      description: `Compartilhado com ${shareSetor} — ${shareReviewer}.`,
    });
    setShareOpen(false);
    setShareFilial("");
    setShareSetor("");
    setShareReviewer("");
  };

  const handleAcceptShare = () => {
    updateProject(project.id, {
      area: project.sharedSetor ?? project.area,
      filial: project.sharedFilial ?? project.filial,
      sharedWithArea: false,
      sharedFilial: undefined,
      sharedSetor: undefined,
      sharedReviewer: undefined,
      sharedStatus: undefined,
      sharedDeclineReason: undefined,
    });
    toast.success("Compartilhamento aceito", {
      description: "O projeto agora faz parte da sua área e segue o fluxo normal de revisão.",
    });
  };

  const confirmDeclineShare = () => {
    if (!declineReason.trim()) {
      toast.error("Descreva o motivo da recusa para a área de origem.");
      return;
    }
    updateProject(project.id, {
      sharedWithArea: false,
      sharedStatus: "recusado",
      sharedDeclineReason: declineReason.trim(),
    });
    toast.success("Compartilhamento recusado", {
      description: "O projeto foi devolvido à área de origem com a justificativa informada.",
    });
    setDeclineShareOpen(false);
    setDeclineReason("");
    navigate({ to: "/revisor" });
  };

  const dismissDeclineNotice = () => {
    updateProject(project.id, {
      sharedStatus: undefined,
      sharedDeclineReason: undefined,
      sharedFilial: undefined,
      sharedSetor: undefined,
      sharedReviewer: undefined,
    });
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
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface-muted/60 px-4 py-3 text-xs text-muted-foreground">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
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
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 shrink-0 gap-2 text-xs"
                    onClick={() => setShareOpen(true)}
                  >
                    <Share2 className="size-3.5" /> Compartilhar projeto
                  </Button>
                </div>
              )}

              {isRevisor && project.sharedWithArea && project.sharedStatus === "pendente" && (
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
                  <div className="flex items-start gap-2 text-sm text-foreground">
                    <Share2 className="mt-1 size-4 shrink-0 text-primary" />
                    <span>
                      Este projeto foi compartilhado com{" "}
                      <span className="font-medium">{project.sharedSetor}</span>
                      {project.sharedFilial && <> · {project.sharedFilial}</>}. Você pode aceitar ou
                      recusar a revisão.
                    </span>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => setDeclineShareOpen(true)}
                    >
                      <XCircle className="size-3.5" /> Recusar
                    </Button>
                    <Button size="sm" className="gap-2" onClick={handleAcceptShare}>
                      <CheckCircle2 className="size-3.5" /> Aceitar
                    </Button>
                  </div>
                </div>
              )}

              {isRevisor && project.sharedStatus === "recusado" && project.sharedDeclineReason && (
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3 rounded-lg border border-status-adjust-fg/30 bg-status-adjust/10 px-4 py-3">
                  <div className="flex items-start gap-2 text-sm text-foreground">
                    <XCircle className="mt-1 size-4 shrink-0 text-status-adjust-fg" />
                    <span>
                      {project.sharedSetor && (
                        <>
                          <span className="font-medium">{project.sharedSetor}</span> recusou a
                          revisão deste projeto.{" "}
                        </>
                      )}
                      Motivo: {project.sharedDeclineReason}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 shrink-0 text-xs text-muted-foreground"
                    onClick={dismissDeclineNotice}
                  >
                    Entendido
                  </Button>
                </div>
              )}

              {project.projectType === "dependente" && (
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
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
                    {isJuridico && finalProjects.some((f) => f.projectIds.includes(project.id)) && (
                      <ProjetoFinalTag />
                    )}
                  </div>
                  <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">
                    {project.name}
                  </h1>
                </div>
                <div className="flex min-w-[160px] flex-col items-end justify-start pt-1">
                  <ProjectHistoryDrawer project={project} />
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
                    "shrink-0 rounded-md px-3 py-2 text-xs font-medium " +
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
            {isJuridico && <JuridicoProcessPanel project={project} />}

            {isRevisor && canReview && draftItems.length > 0 && (
              <div className="mb-8 rounded-lg border border-primary/20 bg-primary/5 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Wrench className="size-4 text-primary" />
                  <h2 className="text-sm font-semibold text-foreground">
                    Ajustes registrados nesta revisão
                  </h2>
                  <span className="rounded-full bg-background/70 px-2 py-1 text-xs font-semibold tabular-nums text-primary">
                    {draftItems.length}
                  </span>
                </div>
                <p className="mb-3 text-xs text-muted-foreground">
                  Ainda não foram enviados ao Relator. Continue a revisão e use "Enviar para
                  ajustes" no rodapé quando concluir.
                </p>
                <div className="space-y-3">
                  {draftItems.map((item) => {
                    const sectionLabel =
                      SECTIONS.find((s) => s.key === item.sectionKey)?.label ?? item.sectionKey;
                    return (
                      <div key={item.id} className="rounded-md border border-border bg-surface p-4">
                        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                          <div className="text-xs font-medium text-muted-foreground">
                            {sectionLabel} <span className="text-foreground/40">·</span>{" "}
                            <span className="text-foreground">{item.fieldLabel}</span>
                          </div>
                          <div className="flex shrink-0 gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs text-primary hover:bg-primary/5 hover:text-primary"
                              onClick={() => setSection(item.sectionKey)}
                            >
                              Ir para a seção
                            </Button>
                            <button
                              type="button"
                              onClick={() => removeAdjustItem(item.id)}
                              className="text-muted-foreground hover:text-primary"
                              aria-label="Remover item"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-foreground">{item.comment}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {mode === "relator" && pendingItems.length > 0 && (
              <div className="mb-8 rounded-lg border border-status-adjust-fg/30 bg-status-adjust/10 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <AlertTriangle className="size-4 text-status-adjust-fg" />
                  <h2 className="text-sm font-semibold text-status-adjust-fg">
                    Ajustes solicitados
                  </h2>
                  <span className="rounded-full bg-background/70 px-2 py-1 text-xs font-semibold tabular-nums text-status-adjust-fg">
                    {pendingItems.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {pendingItems.map((item) => {
                    const sectionLabel =
                      SECTIONS.find((s) => s.key === item.sectionKey)?.label ?? item.sectionKey;
                    return (
                      <div key={item.id} className="rounded-md border border-border bg-surface p-4">
                        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                          <div className="text-xs font-medium text-muted-foreground">
                            {sectionLabel} <span className="text-foreground/40">·</span>{" "}
                            <span className="text-foreground">{item.fieldLabel}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-primary hover:bg-primary/5 hover:text-primary"
                            onClick={() => setSection(item.sectionKey)}
                          >
                            Ir para a seção
                          </Button>
                        </div>
                        <p className="text-sm text-foreground">{item.comment}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {section === "gerais" && (
              <SectionGerais
                project={project}
                pendingItems={pendingBySection.get("gerais")}
                mode={fieldMode}
                draftItems={draftItems.filter((i) => i.sectionKey === "gerais")}
                onAddDraftAdjustment={(fieldId, fieldLabel, comment) =>
                  addFieldDraftItem("gerais", fieldId, fieldLabel, comment)
                }
                onRemoveDraftAdjustment={removeAdjustItem}
              />
            )}
            {section === "inovador" && (
              <SectionQuestions
                project={project}
                title="Elemento Tecnologicamente Novo ou Inovador"
                description="Descreva com riqueza de detalhes a novidade tecnológica do projeto, seus objetivos e o cenário que motivou o desenvolvimento."
                questions={QUESTIONS_INOVADOR}
                pendingItems={pendingBySection.get("inovador")}
                mode={fieldMode}
                draftItems={draftItems.filter((i) => i.sectionKey === "inovador")}
                onAddDraftAdjustment={(fieldId, fieldLabel, comment) =>
                  addFieldDraftItem("inovador", fieldId, fieldLabel, comment)
                }
                onRemoveDraftAdjustment={removeAdjustItem}
              />
            )}
            {section === "barreiras" && (
              <SectionQuestions
                project={project}
                title="Barreiras e Desafios Tecnológicos"
                description="Documente os desafios enfrentados, competências mobilizadas e estratégias adotadas para superá-los."
                questions={QUESTIONS_BARREIRAS}
                pendingItems={pendingBySection.get("barreiras")}
                mode={fieldMode}
                draftItems={draftItems.filter((i) => i.sectionKey === "barreiras")}
                onAddDraftAdjustment={(fieldId, fieldLabel, comment) =>
                  addFieldDraftItem("barreiras", fieldId, fieldLabel, comment)
                }
                onRemoveDraftAdjustment={removeAdjustItem}
              />
            )}
            {section === "metodologia" && (
              <SectionQuestions
                project={project}
                title="Metodologia e Métodos Utilizados"
                description="Detalhe a metodologia empregada, o passo a passo e os resultados esperados e alcançados."
                questions={QUESTIONS_METODOLOGIA}
                pendingItems={pendingBySection.get("metodologia")}
                mode={fieldMode}
                draftItems={draftItems.filter((i) => i.sectionKey === "metodologia")}
                onAddDraftAdjustment={(fieldId, fieldLabel, comment) =>
                  addFieldDraftItem("metodologia", fieldId, fieldLabel, comment)
                }
                onRemoveDraftAdjustment={removeAdjustItem}
                extras={
                  isFinanceiro ? undefined : (
                    <div className="rounded-lg border border-dashed border-border bg-surface p-4">
                      <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                        <CloudUpload className="size-4 text-primary" /> Upload de cronograma
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Anexe o cronograma consolidado do projeto (PDF, XLSX ou imagem).
                      </p>
                    </div>
                  )
                }
              />
            )}
            {section === "evidencias" && (
              <SectionEvidencias
                project={project}
                pendingItems={generalPendingItems("evidencias")}
                readOnly={fieldMode === "locked"}
              />
            )}
            {section === "despesas" && (
              <SectionDespesas project={project} pendingItems={generalPendingItems("despesas")} />
            )}
            {section === "revisao" && (
              <SectionRevisao
                project={project}
                completion={completion}
                onGoToSection={setSection}
                canSubmit={canSubmit}
                hideSubmitCta={isRevisor || isFinanceiro}
                pendingItems={generalPendingItems("revisao")}
              />
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
                      <Wrench className="size-4" /> Enviar para ajustes
                    </Button>
                    <Button
                      className="gap-2"
                      disabled={!canReview}
                      onClick={() => setApproveOpen(true)}
                    >
                      <CheckCircle2 className="size-4" /> Aprovar e enviar para o Jurídico
                    </Button>
                  </>
                ) : isFinanceiro ? (
                  <>
                    <Button variant="outline" className="gap-2" onClick={handleFinanceiroSave}>
                      <Save className="size-4" /> Salvar alterações
                    </Button>
                    <Button className="gap-2" onClick={handleFinanceiroSubmit}>
                      <Send className="size-4" /> Enviar para revisão
                    </Button>
                  </>
                ) : isJuridico ? (
                  <>
                    <Button
                      variant="outline"
                      className="gap-2"
                      disabled={!canDecideJuridico}
                      onClick={() => setJuridicoAdjustOpen(true)}
                    >
                      <Pencil className="size-4" /> Enviar para ajustes
                    </Button>
                    <Button
                      className="gap-2"
                      disabled={!canDecideJuridico}
                      onClick={() => setJuridicoApproveOpen(true)}
                    >
                      <Send className="size-4" /> Aprovar para criar projeto final
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
        <Dialog
          open={adjustOpen}
          onOpenChange={(open) => {
            setAdjustOpen(open);
            if (!open) resetAdjustPicker();
          }}
        >
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Enviar para ajustes</DialogTitle>
              <DialogDescription>
                Aponte a etapa e, quando houver, o campo específico que precisa ser corrigido. O
                projeto voltará para o Relator com o status "Ajuste solicitado".
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Etapa</Label>
                  <Select
                    value={adjustSection}
                    onValueChange={(v) => {
                      setAdjustSection(v as SectionKey);
                      setAdjustFieldId("");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SECTIONS.map((s) => (
                        <SelectItem key={s.key} value={s.key}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {adjustFieldOptions.length > 0 && (
                  <div className="space-y-2">
                    <Label>Campo</Label>
                    <Select value={adjustFieldId} onValueChange={setAdjustFieldId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o campo" />
                      </SelectTrigger>
                      <SelectContent>
                        {adjustFieldOptions.map((f) => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="adjust-note">O que precisa ser corrigido?</Label>
                <Textarea
                  id="adjust-note"
                  value={adjustComment}
                  onChange={(e) => setAdjustComment(e.target.value)}
                  placeholder="Ex.: Detalhar melhor o comparativo tecnológico."
                  rows={3}
                />
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={addAdjustItem}
              >
                <Plus className="size-3.5" /> Adicionar item ao pedido
              </Button>

              {draftItems.length > 0 && (
                <div className="space-y-2 rounded-md border border-border bg-surface-muted/50 p-3">
                  {draftItems.map((item) => {
                    const sectionLabel =
                      SECTIONS.find((s) => s.key === item.sectionKey)?.label ?? item.sectionKey;
                    return (
                      <div
                        key={item.id}
                        className="flex items-start justify-between gap-2 rounded-md border border-border bg-surface p-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium text-muted-foreground">
                            {sectionLabel} ·{" "}
                            <span className="text-foreground">{item.fieldLabel}</span>
                          </div>
                          <p className="mt-1 text-sm text-foreground">{item.comment}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAdjustItem(item.id)}
                          className="shrink-0 text-muted-foreground hover:text-primary"
                          aria-label="Remover item"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setAdjustOpen(false)}>
                Cancelar
              </Button>
              <Button disabled={draftItems.length === 0} onClick={handleRequestAdjustment}>
                Enviar para ajustes
              </Button>
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
              <AlertDialogAction onClick={handleApprove}>
                Aprovar e enviar para o Jurídico
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {isRevisor && (
        <Dialog open={shareOpen} onOpenChange={setShareOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Compartilhar projeto</DialogTitle>
              <DialogDescription>
                Selecione a filial, a área e o revisor responsável para compartilhar este projeto.
                Quem receber poderá aceitar ou recusar a revisão.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Filial</Label>
                <Select value={shareFilial} onValueChange={setShareFilial}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a filial" />
                  </SelectTrigger>
                  <SelectContent>
                    {FILIAIS.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Área</Label>
                <Select value={shareSetor} onValueChange={setShareSetor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a área" />
                  </SelectTrigger>
                  <SelectContent>
                    {AREAS.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Revisor responsável</Label>
                <Select value={shareReviewer} onValueChange={setShareReviewer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o revisor" />
                  </SelectTrigger>
                  <SelectContent>
                    {REVISOR_NAMES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShareOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleShare}>Compartilhar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {isRevisor && (
        <Dialog
          open={declineShareOpen}
          onOpenChange={(open) => {
            setDeclineShareOpen(open);
            if (!open) setDeclineReason("");
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Recusar compartilhamento</DialogTitle>
              <DialogDescription>
                O projeto será devolvido à área de origem. Descreva o motivo para que ela entenda o
                que precisa ser ajustado antes de encaminhar novamente.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="decline-reason">Motivo da recusa</Label>
              <Textarea
                id="decline-reason"
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Ex.: Este projeto não é da nossa área; encaminhar para Automação."
                rows={4}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeclineShareOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={confirmDeclineShare}>
                Confirmar recusa
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {isJuridico && (
        <Dialog
          open={juridicoAdjustOpen}
          onOpenChange={(open) => {
            setJuridicoAdjustOpen(open);
            if (!open) setJuridicoAdjustNote("");
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enviar para ajustes</DialogTitle>
              <DialogDescription>
                Descreva o motivo do ajuste. O projeto voltará para o Relator com o status "Ajuste
                solicitado".
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="juridico-adjust-note">O que precisa ser corrigido?</Label>
              <Textarea
                id="juridico-adjust-note"
                value={juridicoAdjustNote}
                onChange={(e) => setJuridicoAdjustNote(e.target.value)}
                placeholder="Ex.: Falta comprovante de submissão dos documentos financeiros."
                rows={4}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setJuridicoAdjustOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleJuridicoRequestAdjustment}>Enviar para ajustes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {isJuridico && (
        <AlertDialog open={juridicoApproveOpen} onOpenChange={setJuridicoApproveOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Aprovar projeto para o Projeto Final?</AlertDialogTitle>
              <AlertDialogDescription>
                O projeto passa a ficar disponível para consolidação em um Projeto Final. O projeto
                original continua existindo e nenhuma informação dele é alterada ou perdida.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleJuridicoApproveForFinal}>
                Aprovar para criar projeto final
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
