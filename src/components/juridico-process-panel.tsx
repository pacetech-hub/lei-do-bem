import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ChevronRight, FileWarning, Gavel, Send, Upload } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useProjectsStore } from "@/lib/store";
import {
  LEGAL_STATUS_BADGE_CLASS,
  LEGAL_STATUS_LABEL,
  type LegalStatus,
  type Project,
} from "@/lib/types";
import { cn } from "@/lib/utils";

interface JuridicoProcessPanelProps {
  project: Project;
}

// Painel único que reúne as ferramentas do Jurídico (análise, submissão,
// parecer, histórico, relacionados, ajustes) — as etapas do projeto em si
// (Gerais/Inovador/.../Revisão Final) já são exibidas pelo ProjectFicha, de
// forma idêntica ao Relator/Revisor/Financeiro.
export function JuridicoProcessPanel({ project }: JuridicoProcessPanelProps) {
  const navigate = useNavigate();
  const allProjects = useProjectsStore((s) => s.projects);
  const pareceres = useProjectsStore((s) => s.pareceres);
  const updateProject = useProjectsStore((s) => s.updateProject);

  const [submissionOpen, setSubmissionOpen] = useState(false);
  const [submissionDoc, setSubmissionDoc] = useState("");
  const [submissionNote, setSubmissionNote] = useState("");

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
  const relatedProjects =
    project.projectType === "mestre"
      ? dependents
      : project.projectType === "dependente"
        ? siblings
        : [];
  const parecer = project.mctiParecerId
    ? pareceres.find((p) => p.id === project.mctiParecerId)
    : undefined;

  const openProject = (id: string) => navigate({ to: "/juridico/projetos/$id", params: { id } });

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
    setSubmissionOpen(false);
  };

  const handlePrepareNewSubmission = () => {
    updateProject(project.id, { legalStatus: "pronto_submissao" });
    toast.success("Projeto liberado para nova submissão");
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

  const nextActionText: Record<LegalStatus, string> = {
    aguardando_juridico: "Realize a análise jurídica da documentação para liberar a submissão.",
    pronto_submissao: "Registre a submissão externa ao MCTI.",
    submetido: "Projeto em análise pelo MCTI. Aguarde o parecer do trimestre.",
    ajustes_mcti: "O MCTI solicitou ajustes. Prepare a defesa e uma nova submissão.",
    aprovado: "Projeto aprovado pelo MCTI. Nenhuma ação pendente.",
    indeferido: "Projeto indeferido pelo MCTI. Nenhuma ação pendente.",
  };

  return (
    <div className="mb-8 rounded-lg border border-primary/20 bg-primary/5 p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Gavel className="size-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Processo Jurídico</h2>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
            LEGAL_STATUS_BADGE_CLASS[legalStatus],
          )}
        >
          <span className="size-1.5 rounded-full bg-current opacity-70" />
          {LEGAL_STATUS_LABEL[legalStatus]}
        </span>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">{nextActionText[legalStatus]}</p>

      <div className="mb-5 flex flex-wrap gap-2">
        {legalStatus === "pronto_submissao" && (
          <Button size="sm" className="gap-2" onClick={() => setSubmissionOpen(true)}>
            <Upload className="size-4" /> Registrar submissão
          </Button>
        )}
        {legalStatus === "ajustes_mcti" && (
          <>
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
            <Button size="sm" className="gap-2" onClick={handlePrepareNewSubmission}>
              <Send className="size-4" /> Preparar nova submissão
            </Button>
          </>
        )}
      </div>

      {legalStatus === "ajustes_mcti" && project.mctiReason && (
        <div className="mb-5 rounded-lg border border-status-adjust bg-status-adjust/40 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-status-adjust-fg">
            <FileWarning className="size-4" /> Ajuste solicitado pelo MCTI
          </div>
          <p className="mt-1 text-sm text-status-adjust-fg">Motivo: {project.mctiReason}</p>
        </div>
      )}

      {parecer && (
        <div className="mb-5 rounded-lg border border-border bg-surface p-4">
          <div className="text-sm font-semibold text-foreground">
            Parecer do MCTI — {parecer.quarter}º Trimestre de {parecer.year}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{parecer.fileName}</p>
        </div>
      )}

      {project.submissionDate && (
        <div className="mb-5 rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Send className="size-4 text-status-ready-fg" /> Submissão registrada
          </div>
          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
            <div>
              Data: {format(new Date(project.submissionDate), "dd/MM/yyyy", { locale: ptBR })}
            </div>
            <div>Documento: {project.submissionDoc}</div>
            {project.submissionNote && <div>Observações: {project.submissionNote}</div>}
          </div>
        </div>
      )}

      {relatedProjects.length > 0 && (
        <div className="mb-5">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Projetos relacionados
          </h3>
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
                {relatedProjects.map((p) => (
                  <TableRow
                    key={p.id}
                    className="group cursor-pointer"
                    onClick={() => openProject(p.id)}
                  >
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
                        <span className="text-xs text-muted-foreground">—</span>
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
        </div>
      )}

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Histórico
        </h3>
        <div className="space-y-2">
          {historyEvents.map((ev, idx) => (
            <div key={idx} className="flex gap-3 rounded-lg border border-border bg-surface p-3">
              <div className="w-20 shrink-0 text-xs tabular-nums text-muted-foreground">
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

      <Dialog open={submissionOpen} onOpenChange={setSubmissionOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Registrar submissão</DialogTitle>
            <DialogDescription>
              A submissão ao MCTI é realizada externamente. Utilize este formulário para registrar
              que ela foi feita.
            </DialogDescription>
          </DialogHeader>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmissionOpen(false)}>
              Cancelar
            </Button>
            <Button className="gap-2" onClick={handleRegisterSubmission}>
              <Upload className="size-4" /> Registrar submissão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
