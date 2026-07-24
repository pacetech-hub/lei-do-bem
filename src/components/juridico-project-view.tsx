import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  FolderTree,
  GitFork,
  Gavel,
  FileWarning,
  Send,
  Upload,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

import { AppHeader } from "@/components/app-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { SectionGerais } from "@/components/sections/section-gerais";
import { SectionQuestions } from "@/components/sections/section-questions";
import { SectionEvidencias } from "@/components/sections/section-evidencias";
import { SectionDespesas } from "@/components/sections/section-despesas";

import { getFilial, getProgress, quarterLabel } from "@/components/projects-list";
import { useProjectsStore } from "@/lib/store";
import {
  LEGAL_STATUS_BADGE_CLASS,
  LEGAL_STATUS_LABEL,
  QUESTIONS_BARREIRAS,
  QUESTIONS_INOVADOR,
  QUESTIONS_METODOLOGIA,
  type LegalStatus,
  type MctiParecer,
  type Project,
} from "@/lib/types";
import { cn } from "@/lib/utils";

type JuridicoTab =
  | "resumo"
  | "documentacao"
  | "evidencias"
  | "despesas"
  | "revisoes"
  | "relacionados"
  | "historico"
  | "analise"
  | "submissao"
  | "parecer"
  | "ajustes";

const TABS: Array<{ key: JuridicoTab; label: string }> = [
  { key: "resumo", label: "Resumo" },
  { key: "documentacao", label: "Documentação técnica" },
  { key: "evidencias", label: "Evidências" },
  { key: "despesas", label: "Despesas" },
  { key: "revisoes", label: "Revisões" },
  { key: "relacionados", label: "Projetos relacionados" },
  { key: "historico", label: "Histórico" },
  { key: "analise", label: "Análise jurídica" },
  { key: "submissao", label: "Submissão" },
  { key: "parecer", label: "Parecer do MCTI" },
  { key: "ajustes", label: "Ajustes e defesa" },
];

const DOC_SECTIONS = [
  { key: "gerais", label: "Gerais" },
  { key: "inovador", label: "Inovador" },
  { key: "barreiras", label: "Barreiras" },
  { key: "metodologia", label: "Metodologia" },
] as const;

interface JuridicoProjectViewProps {
  project: Project;
}

export function JuridicoProjectView({ project }: JuridicoProjectViewProps) {
  const navigate = useNavigate();
  const allProjects = useProjectsStore((s) => s.projects) as Project[];
  const pareceres = useProjectsStore((s) => s.pareceres) as MctiParecer[];
  const updateProject = useProjectsStore((s) => s.updateProject);

  const [tab, setTab] = useState<JuridicoTab>("resumo");
  const [docSection, setDocSection] = useState<(typeof DOC_SECTIONS)[number]["key"]>("gerais");
  const [analysisNote, setAnalysisNote] = useState(project.legalAnalysisNote ?? "");
  const [adjustNote, setAdjustNote] = useState("");
  const [submissionDoc, setSubmissionDoc] = useState(project.submissionDoc ?? "");
  const [submissionNote, setSubmissionNote] = useState(project.submissionNote ?? "");

  const legalStatus = project.legalStatus as LegalStatus;
  const dependents = useMemo(
    () => allProjects.filter((p) => p.masterProjectId === project.id),
    [allProjects, project],
  );
  const masterProject = project.masterProjectId
    ? allProjects.find((p) => p.id === project.masterProjectId)
    : undefined;
  const siblings = useMemo(
    () =>
      masterProject
        ? allProjects.filter((p) => p.masterProjectId === masterProject.id && p.id !== project.id)
        : [],
    [allProjects, masterProject, project.id],
  );
  const parecer = project.mctiParecerId
    ? pareceres.find((p) => p.id === project.mctiParecerId)
    : undefined;

  const progress = getProgress(project);

  const openProject = (id: string) => navigate({ to: "/juridico/projetos/$id", params: { id } });

  const handleRequestAdjustment = () => {
    if (!adjustNote.trim()) {
      toast.error("Descreva o que precisa ser corrigido.");
      return;
    }
    updateProject(project.id, {
      status: "ajustes",
      legalStatus: undefined,
      lastAdjustmentNote: adjustNote.trim(),
    });
    toast.success("Ajustes solicitados", { description: "O projeto retornou para o Relator." });
    navigate({ to: "/juridico" });
  };

  const handleApproveForSubmission = () => {
    updateProject(project.id, { legalStatus: "pronto_submissao", legalAnalysisNote: analysisNote });
    toast.success("Projeto aprovado para submissão");
  };

  const handleRegisterSubmission = () => {
    if (!submissionDoc.trim()) {
      toast.error("Informe o documento ou comprovante da submissão.");
      return;
    }
    updateProject(project.id, {
      legalStatus: "submetido",
      submissionDate: new Date().toISOString(),
      submissionDoc: submissionDoc.trim(),
      submissionNote: submissionNote.trim() || undefined,
    });
    toast.success("Submissão registrada", { description: 'Status atualizado para "Submetido".' });
  };

  const handlePrepareNewSubmission = () => {
    updateProject(project.id, { legalStatus: "pronto_submissao" });
    toast.success("Projeto liberado para nova submissão");
    setTab("submissao");
  };

  const historyEvents = useMemo(() => {
    const events: Array<{ date: string; actor: string; description: string }> = [
      {
        date: project.createdAt,
        actor: `Relator: ${project.responsible}`,
        description: "Projeto criado.",
      },
    ];
    if (project.reviewedAt) {
      events.push({
        date: project.reviewedAt,
        actor: project.reviewedBy ? `Revisor: ${project.reviewedBy}` : "Revisor",
        description: "Revisão técnica concluída, projeto encaminhado ao Jurídico.",
      });
    }
    if (project.lastAdjustmentNote) {
      events.push({
        date: project.updatedAt,
        actor: "Ajuste solicitado",
        description: project.lastAdjustmentNote,
      });
    }
    if (project.submissionDate) {
      events.push({
        date: project.submissionDate,
        actor: "Jurídico",
        description: `Submissão registrada ao MCTI (${project.submissionDoc ?? "documento"}).`,
      });
    }
    if (parecer) {
      events.push({
        date: parecer.uploadedAt,
        actor: "Parecer do MCTI",
        description:
          project.mctiResult === "aprovado"
            ? "Projeto aprovado pelo MCTI."
            : `Ajuste solicitado pelo MCTI: ${project.mctiReason ?? ""}`,
      });
    }
    return events.sort((a, b) => +new Date(b.date) - +new Date(a.date));
  }, [project, parecer]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader current={project.name} />

      <div className="mx-auto flex max-w-[1440px]">
        {/* Left nav */}
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-64 shrink-0 border-r border-border bg-sidebar lg:block">
          <nav className="flex flex-col gap-0.5 p-2">
            {TABS.map((t) => {
              const active = tab === t.key;
              const needsAttention =
                (t.key === "analise" && legalStatus === "aguardando_juridico") ||
                (t.key === "submissao" && legalStatus === "pronto_submissao") ||
                (t.key === "ajustes" && legalStatus === "ajustes_mcti");
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={cn(
                    "flex items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors",
                    active
                      ? "bg-primary/8 font-semibold text-foreground"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                  )}
                >
                  {t.label}
                  {needsAttention && <span className="size-1.5 rounded-full bg-primary" />}
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 pb-16">
          {/* Banner */}
          <div className="border-b border-border bg-surface px-6 py-5 lg:px-10">
            {project.projectType === "mestre" && (
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                  <FolderTree className="size-3.5" /> Projeto Mestre
                </span>
                <span className="text-xs text-muted-foreground">
                  {dependents.length} projeto{dependents.length === 1 ? "" : "s"} dependente
                  {dependents.length === 1 ? "" : "s"}
                </span>
              </div>
            )}
            {project.projectType === "dependente" && (
              <div className="mb-3 flex flex-wrap items-center gap-2">
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
                      to="/juridico/projetos/$id"
                      params={{ id: masterProject.id }}
                      className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <ArrowLeft className="size-3.5" /> Voltar para Projeto Mestre
                    </Link>
                  </>
                )}
              </div>
            )}

            <h1 className="mb-3 truncate text-xl font-semibold tracking-tight sm:text-2xl">
              {project.name}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                  LEGAL_STATUS_BADGE_CLASS[legalStatus],
                )}
              >
                <span className="size-1.5 rounded-full bg-current opacity-70" />
                {LEGAL_STATUS_LABEL[legalStatus]}
              </span>
              <span>
                Trimestre:{" "}
                <span className="font-medium text-foreground">
                  {quarterLabel(project.updatedAt)}
                </span>
              </span>
              <span>
                Área: <span className="font-medium text-foreground">{project.area}</span>
              </span>
              <span>
                Filial: <span className="font-medium text-foreground">{getFilial(project)}</span>
              </span>
              <span>
                Relator: <span className="font-medium text-foreground">{project.responsible}</span>
              </span>
              <span>
                Revisor:{" "}
                <span className="font-medium text-foreground">{project.reviewedBy ?? "—"}</span>
              </span>
            </div>

            {/* Section pills (mobile) */}
            <div className="scrollbar-thin mt-4 flex gap-1 overflow-x-auto lg:hidden">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={cn(
                    "shrink-0 rounded-md px-3 py-1.5 text-xs font-medium",
                    tab === t.key
                      ? "bg-primary text-primary-foreground"
                      : "bg-surface-muted text-muted-foreground",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab body */}
          <div className="px-6 py-8 lg:px-10">
            {tab === "resumo" && (
              <div className="max-w-3xl space-y-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-border bg-surface p-4">
                    <div className="text-xs text-muted-foreground">Progresso da ficha técnica</div>
                    <div className="mt-2 flex items-center gap-2">
                      <Progress value={progress} className="h-1.5 flex-1" />
                      <span className="text-sm font-semibold tabular-nums text-foreground">
                        {progress}%
                      </span>
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-surface p-4">
                    <div className="text-xs text-muted-foreground">Última atualização</div>
                    <div className="mt-2 text-sm text-foreground">
                      há {formatDistanceToNow(new Date(project.updatedAt), { locale: ptBR })}
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-primary/20 bg-primary/5 p-5">
                  <div className="flex items-start gap-3">
                    <Gavel className="mt-0.5 size-5 shrink-0 text-primary" />
                    <div className="flex-1">
                      <div className="text-sm font-semibold">Próxima ação</div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {legalStatus === "aguardando_juridico" &&
                          "Realize a análise jurídica da documentação para liberar a submissão."}
                        {legalStatus === "pronto_submissao" &&
                          "Registre a submissão externa ao MCTI."}
                        {legalStatus === "submetido" &&
                          "Projeto em análise pelo MCTI. Aguarde o parecer do trimestre."}
                        {legalStatus === "ajustes_mcti" &&
                          "O MCTI solicitou ajustes. Prepare a defesa e uma nova submissão."}
                      </p>
                    </div>
                    {legalStatus === "aguardando_juridico" && (
                      <Button size="sm" onClick={() => setTab("analise")}>
                        Analisar
                      </Button>
                    )}
                    {legalStatus === "pronto_submissao" && (
                      <Button size="sm" onClick={() => setTab("submissao")}>
                        Registrar submissão
                      </Button>
                    )}
                    {legalStatus === "ajustes_mcti" && (
                      <Button size="sm" onClick={() => setTab("ajustes")}>
                        Ver ajustes
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {tab === "documentacao" && (
              <div>
                <div className="mb-6 flex flex-wrap gap-1.5">
                  {DOC_SECTIONS.map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => setDocSection(s.key)}
                      className={cn(
                        "rounded-md px-3 py-1.5 text-xs font-medium",
                        docSection === s.key
                          ? "bg-primary text-primary-foreground"
                          : "bg-surface-muted text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                {docSection === "gerais" && <SectionGerais project={project} />}
                {docSection === "inovador" && (
                  <SectionQuestions
                    project={project}
                    title="Elemento Tecnologicamente Novo ou Inovador"
                    description="Descrição da novidade tecnológica do projeto."
                    questions={QUESTIONS_INOVADOR}
                  />
                )}
                {docSection === "barreiras" && (
                  <SectionQuestions
                    project={project}
                    title="Barreiras e Desafios Tecnológicos"
                    description="Desafios enfrentados e estratégias adotadas."
                    questions={QUESTIONS_BARREIRAS}
                  />
                )}
                {docSection === "metodologia" && (
                  <SectionQuestions
                    project={project}
                    title="Metodologia e Métodos Utilizados"
                    description="Metodologia empregada e resultados obtidos."
                    questions={QUESTIONS_METODOLOGIA}
                  />
                )}
              </div>
            )}

            {tab === "evidencias" && <SectionEvidencias project={project} />}
            {tab === "despesas" && <SectionDespesas project={project} />}

            {tab === "revisoes" && (
              <div className="max-w-2xl">
                <header className="mb-6">
                  <h2 className="text-lg font-semibold tracking-tight">Revisões</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Ciclo de revisão técnica conduzido antes do encaminhamento ao Jurídico.
                  </p>
                </header>
                {project.reviewedBy ? (
                  <div className="rounded-lg border border-border bg-surface p-4">
                    <div className="text-sm font-medium text-foreground">
                      Revisado por {project.reviewedBy}
                    </div>
                    {project.reviewedAt && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        em {format(new Date(project.reviewedAt), "dd/MM/yyyy", { locale: ptBR })}
                      </div>
                    )}
                    {project.lastAdjustmentNote && (
                      <div className="mt-3 rounded-md bg-status-adjust/40 p-3 text-xs text-status-adjust-fg">
                        Última solicitação de ajuste do Revisor: {project.lastAdjustmentNote}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhuma revisão registrada ainda.</p>
                )}
              </div>
            )}

            {tab === "relacionados" && (
              <div className="max-w-3xl">
                <header className="mb-6">
                  <h2 className="text-lg font-semibold tracking-tight">Projetos relacionados</h2>
                </header>
                {project.projectType === "mestre" && (
                  <RelatedTable
                    projects={dependents}
                    onOpen={openProject}
                    emptyText="Nenhum projeto dependente ainda."
                  />
                )}
                {project.projectType === "dependente" && (
                  <>
                    {masterProject && (
                      <div className="mb-4 rounded-lg border border-border bg-surface p-4">
                        <div className="text-xs text-muted-foreground">Projeto Mestre</div>
                        <button
                          type="button"
                          className="mt-1 text-sm font-medium text-foreground hover:text-primary"
                          onClick={() => openProject(masterProject.id)}
                        >
                          {masterProject.name}
                        </button>
                      </div>
                    )}
                    <RelatedTable
                      projects={siblings}
                      onOpen={openProject}
                      emptyText="Nenhum outro projeto dependente deste mesmo Projeto Mestre."
                    />
                  </>
                )}
                {project.projectType === "independente" && (
                  <p className="text-sm text-muted-foreground">
                    Este projeto não possui vínculo com outros projetos.
                  </p>
                )}
              </div>
            )}

            {tab === "historico" && (
              <div className="max-w-2xl">
                <header className="mb-6">
                  <h2 className="text-lg font-semibold tracking-tight">Histórico do projeto</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Principais marcos registrados na trajetória do projeto.
                  </p>
                </header>
                <div className="space-y-3">
                  {historyEvents.map((ev, idx) => (
                    <div
                      key={idx}
                      className="flex gap-3 rounded-lg border border-border bg-surface p-4"
                    >
                      <div className="w-24 shrink-0 text-xs tabular-nums text-muted-foreground">
                        {format(new Date(ev.date), "dd/MM/yyyy", { locale: ptBR })}
                      </div>
                      <div>
                        <div className="text-xs font-medium text-primary">{ev.actor}</div>
                        <div className="mt-0.5 text-sm text-foreground">{ev.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === "analise" && (
              <div className="max-w-2xl">
                <header className="mb-6">
                  <h2 className="text-lg font-semibold tracking-tight">Análise jurídica</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Confira a documentação, registre observações e conclua a análise.
                  </p>
                </header>

                <div className="space-y-1.5">
                  <Label htmlFor="analysis-note">Observações</Label>
                  <Textarea
                    id="analysis-note"
                    value={analysisNote}
                    onChange={(e) => setAnalysisNote(e.target.value)}
                    placeholder="Registre observações sobre a análise jurídica deste projeto."
                    rows={5}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      updateProject(project.id, { legalAnalysisNote: analysisNote });
                      toast.success("Observações salvas");
                    }}
                  >
                    Salvar observações
                  </Button>
                </div>

                <div className="mt-6 space-y-1.5">
                  <Label htmlFor="adjust-note">Solicitar ajustes (opcional)</Label>
                  <Textarea
                    id="adjust-note"
                    value={adjustNote}
                    onChange={(e) => setAdjustNote(e.target.value)}
                    placeholder="Descreva o que precisa ser corrigido antes de prosseguir."
                    rows={3}
                    disabled={legalStatus !== "aguardando_juridico"}
                  />
                </div>

                <div className="mt-6 flex justify-end gap-2 border-t border-border pt-6">
                  <Button
                    variant="outline"
                    className="gap-2"
                    disabled={legalStatus !== "aguardando_juridico"}
                    onClick={handleRequestAdjustment}
                  >
                    <AlertTriangle className="size-4" /> Solicitar ajustes
                  </Button>
                  <Button
                    className="gap-2"
                    disabled={legalStatus !== "aguardando_juridico"}
                    onClick={handleApproveForSubmission}
                  >
                    <CheckCircle2 className="size-4" /> Aprovar para submissão
                  </Button>
                </div>
              </div>
            )}

            {tab === "submissao" && (
              <div className="max-w-2xl">
                <header className="mb-6">
                  <h2 className="text-lg font-semibold tracking-tight">Submissão</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    A submissão ao MCTI é realizada externamente. Utilize esta área para registrar
                    que ela foi feita.
                  </p>
                </header>

                {legalStatus === "aguardando_juridico" ? (
                  <p className="rounded-lg border border-dashed border-border bg-surface p-4 text-sm text-muted-foreground">
                    Conclua a análise jurídica antes de registrar a submissão.
                  </p>
                ) : project.submissionDate ? (
                  <div className="rounded-lg border border-border bg-surface p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Send className="size-4 text-status-ready-fg" /> Submissão registrada
                    </div>
                    <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                      <div>
                        Data:{" "}
                        {format(new Date(project.submissionDate), "dd/MM/yyyy", { locale: ptBR })}
                      </div>
                      <div>Documento: {project.submissionDoc}</div>
                      {project.submissionNote && <div>Observações: {project.submissionNote}</div>}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="submission-doc">Documento ou comprovante</Label>
                      <Input
                        id="submission-doc"
                        value={submissionDoc}
                        onChange={(e) => setSubmissionDoc(e.target.value)}
                        placeholder="Ex.: protocolo-mcti-2026-Q1.pdf"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="submission-note">Observações</Label>
                      <Textarea
                        id="submission-note"
                        value={submissionNote}
                        onChange={(e) => setSubmissionNote(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <Button className="gap-2" onClick={handleRegisterSubmission}>
                      <Upload className="size-4" /> Registrar submissão
                    </Button>
                  </div>
                )}
              </div>
            )}

            {tab === "parecer" && (
              <div className="max-w-2xl">
                <header className="mb-6">
                  <h2 className="text-lg font-semibold tracking-tight">Parecer do MCTI</h2>
                </header>
                {!parecer ? (
                  <p className="rounded-lg border border-dashed border-border bg-surface p-4 text-sm text-muted-foreground">
                    Aguardando parecer do MCTI para o trimestre deste projeto.
                  </p>
                ) : (
                  <div className="rounded-lg border border-border bg-surface p-4">
                    <div className="text-sm font-semibold text-foreground">
                      {parecer.quarter}º Trimestre de {parecer.year}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{parecer.fileName}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                          project.mctiResult === "aprovado"
                            ? "bg-status-approved text-status-approved-fg"
                            : "bg-status-adjust text-status-adjust-fg",
                        )}
                      >
                        Resultado:{" "}
                        {project.mctiResult === "aprovado" ? "Aprovado" : "Ajuste solicitado"}
                      </span>
                    </div>
                    {project.mctiReason && (
                      <p className="mt-2 text-sm text-muted-foreground">{project.mctiReason}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {tab === "ajustes" && (
              <div className="max-w-2xl">
                <header className="mb-6">
                  <h2 className="text-lg font-semibold tracking-tight">Ajustes e defesa</h2>
                </header>
                {legalStatus !== "ajustes_mcti" ? (
                  <p className="rounded-lg border border-dashed border-border bg-surface p-4 text-sm text-muted-foreground">
                    Nenhum ajuste solicitado pelo MCTI.
                  </p>
                ) : (
                  <div className="space-y-5">
                    <div className="rounded-lg border border-status-adjust bg-status-adjust/40 p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-status-adjust-fg">
                        <FileWarning className="size-4" /> Ajuste solicitado pelo MCTI
                      </div>
                      <p className="mt-1 text-sm text-status-adjust-fg">
                        Motivo: {project.mctiReason}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          toast.success("Solicitação enviada", {
                            description: `Informações solicitadas ao Relator (${project.responsible}).`,
                          })
                        }
                      >
                        Solicitar informações ao Relator
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          toast.success("Solicitação enviada", {
                            description: "Documentos solicitados ao Analista Financeiro.",
                          })
                        }
                      >
                        Solicitar documentos ao Financeiro
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setTab("evidencias")}>
                        Adicionar evidências
                      </Button>
                    </div>

                    <div className="border-t border-border pt-4">
                      <Button className="gap-2" onClick={handlePrepareNewSubmission}>
                        <Send className="size-4" /> Preparar nova submissão
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function RelatedTable({
  projects,
  onOpen,
  emptyText,
}: {
  projects: Project[];
  onOpen: (id: string) => void;
  emptyText: string;
}) {
  if (projects.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  }
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <Table>
        <TableHeader>
          <TableRow className="bg-surface-muted hover:bg-surface-muted">
            <TableHead>Projeto</TableHead>
            <TableHead className="w-[190px]">Status</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((p) => (
            <TableRow key={p.id} className="group cursor-pointer" onClick={() => onOpen(p.id)}>
              <TableCell className="py-3 font-medium text-foreground">{p.name}</TableCell>
              <TableCell className="py-3">
                {p.legalStatus ? (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                      LEGAL_STATUS_BADGE_CLASS[p.legalStatus],
                    )}
                  >
                    {LEGAL_STATUS_LABEL[p.legalStatus]}
                  </span>
                ) : (
                  <StatusBadge status={p.status} />
                )}
              </TableCell>
              <TableCell className="py-3 text-right">
                <ChevronRight className="ml-auto size-4 text-muted-foreground/50 transition-colors group-hover:text-primary" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
