import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ListChecks,
  FileCheck2,
  Scale,
  FileClock,
  FileWarning,
  ChevronRight,
  Upload,
  FileText,
  FolderTree,
  CalendarClock,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreateGroupingDialog } from "@/components/create-grouping-dialog";
import { MctiParecerDialog } from "@/components/mcti-parecer-dialog";
import { ProjectsList, quarterLabel, yearOf } from "@/components/projects-list";
import { useProjectsStore } from "@/lib/store";
import { CONSOLIDATION_WINDOW, isConsolidationWindowOpen } from "@/lib/mock";
import {
  LEGAL_STATUS_BADGE_CLASS,
  LEGAL_STATUS_LABEL,
  type LegalStatus,
  type Project,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export function JuridicoDashboard() {
  const navigate = useNavigate();
  const allProjects = useProjectsStore((s) => s.projects) as Project[];
  const pareceres = useProjectsStore((s) => s.pareceres);

  const [parecerDialogOpen, setParecerDialogOpen] = useState(false);

  const currentYear = new Date().getFullYear();
  const windowOpen = isConsolidationWindowOpen();

  const legalProjects = useMemo(() => allProjects.filter((p) => p.legalStatus), [allProjects]);
  const activeProjects = useMemo(
    () =>
      legalProjects.filter((p) => p.legalStatus !== "aprovado" && p.legalStatus !== "indeferido"),
    [legalProjects],
  );

  const counts = useMemo(() => {
    const c: Record<LegalStatus, number> = {
      aguardando_juridico: 0,
      pronto_submissao: 0,
      submetido: 0,
      ajustes_mcti: 0,
      aprovado: 0,
      indeferido: 0,
    };
    activeProjects.forEach((p) => {
      if (p.legalStatus) c[p.legalStatus]++;
    });
    return c;
  }, [activeProjects]);

  const projectsThisYear = useMemo(
    () => legalProjects.filter((p) => yearOf(p.updatedAt) === currentYear).length,
    [legalProjects, currentYear],
  );

  const priorityProjects = useMemo(
    () => activeProjects.filter((p) => p.legalStatus !== "submetido").slice(0, 5),
    [activeProjects],
  );

  const openProject = (id: string) => navigate({ to: "/juridico/projetos/$id", params: { id } });

  const renderRow = (p: Project) => (
    <TableRow key={p.id} className="group cursor-pointer" onClick={() => openProject(p.id)}>
      <TableCell className="py-4 text-sm tabular-nums text-muted-foreground">
        {quarterLabel(p.updatedAt)}
      </TableCell>
      <TableCell className="py-4">
        <div className="font-medium text-foreground">{p.name}</div>
        {p.projectType === "dependente" && (
          <div className="text-xs text-muted-foreground">Projeto Dependente</div>
        )}
      </TableCell>
      <TableCell className="py-4 text-sm text-muted-foreground">{p.area}</TableCell>
      <TableCell className="py-4 text-sm text-muted-foreground">{p.responsible}</TableCell>
      <TableCell className="py-4">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
            LEGAL_STATUS_BADGE_CLASS[p.legalStatus as LegalStatus],
          )}
        >
          <span className="size-1.5 rounded-full bg-current opacity-70" />
          {LEGAL_STATUS_LABEL[p.legalStatus as LegalStatus]}
        </span>
      </TableCell>
      <TableCell className="py-4 text-right">
        <ChevronRight className="ml-auto size-4 text-muted-foreground/50 transition-colors group-hover:text-primary" />
      </TableCell>
    </TableRow>
  );

  const extraTop = (
    <>
      {/* Prazo do Projeto Final */}
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface-muted/60 px-4 py-3 text-sm">
        <CalendarClock className="size-4 text-muted-foreground" />
        <span className="text-muted-foreground">
          Período de consolidação do Projeto Final {CONSOLIDATION_WINDOW.year}:{" "}
          <span className="font-medium text-foreground">
            {format(new Date(CONSOLIDATION_WINDOW.opensAt), "dd/MM", { locale: ptBR })}–
            {format(new Date(CONSOLIDATION_WINDOW.closesAt), "dd/MM/yyyy", { locale: ptBR })}
          </span>
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
            windowOpen
              ? "bg-status-approved text-status-approved-fg"
              : "bg-surface-muted text-muted-foreground",
          )}
        >
          {windowOpen ? <CheckCircle2 className="size-3" /> : <Lock className="size-3" />}
          {windowOpen ? "Aberto" : "Encerrado"}
        </span>
      </div>

      {/* Visão geral */}
      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="mb-3 grid size-9 place-items-center rounded-md bg-surface-muted text-muted-foreground">
            <FileText className="size-4.5" />
          </div>
          <div className="text-2xl font-semibold tabular-nums tracking-tight">
            {projectsThisYear}
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">Projetos no ano</div>
        </div>
        <div className="rounded-lg border-2 border-primary/50 bg-primary/5 p-4">
          <div className="mb-3 grid size-9 place-items-center rounded-md bg-primary/10 text-primary">
            <FileCheck2 className="size-4.5" />
          </div>
          <div className="text-2xl font-semibold tabular-nums tracking-tight text-primary">
            {counts.pronto_submissao}
          </div>
          <div className="mt-0.5 text-xs font-medium text-foreground">Prontos para submissão</div>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="mb-3 grid size-9 place-items-center rounded-md bg-surface-muted text-status-review-fg">
            <FileClock className="size-4.5" />
          </div>
          <div className="text-2xl font-semibold tabular-nums tracking-tight">
            {counts.aguardando_juridico}
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">Aguardando análise jurídica</div>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="mb-3 grid size-9 place-items-center rounded-md bg-surface-muted text-status-submitted-fg">
            <Scale className="size-4.5" />
          </div>
          <div className="text-2xl font-semibold tabular-nums tracking-tight">
            {counts.submetido}
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">Em análise pelo MCTI</div>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="mb-3 grid size-9 place-items-center rounded-md bg-surface-muted text-status-adjust-fg">
            <FileWarning className="size-4.5" />
          </div>
          <div className="text-2xl font-semibold tabular-nums tracking-tight">
            {counts.ajustes_mcti}
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">Ajustes solicitados</div>
        </div>
      </div>

      {/* Projetos que precisam da minha ação */}
      <div className="mb-8 rounded-lg border border-primary/20 bg-primary/5 p-4">
        <div className="mb-3 flex items-center gap-2">
          <ListChecks className="size-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">
            Projetos que precisam da minha ação
          </h2>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold tabular-nums text-primary">
            {priorityProjects.length}
          </span>
        </div>
        {priorityProjects.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum projeto exige ação no momento.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border bg-surface">
            <Table>
              <TableHeader>
                <TableRow className="bg-surface-muted hover:bg-surface-muted">
                  <TableHead className="w-[130px]">Trimestre</TableHead>
                  <TableHead className="w-[28%]">Projeto</TableHead>
                  <TableHead>Área</TableHead>
                  <TableHead>Relator</TableHead>
                  <TableHead className="w-[190px]">Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>{priorityProjects.map(renderRow)}</TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Pareceres do MCTI */}
      {pareceres.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Pareceres do MCTI
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {pareceres.map((parecer) => {
              const aprovados = parecer.results.filter((r) => r.suggested === "aprovado").length;
              const ajustes = parecer.results.filter((r) => r.suggested === "ajustes_mcti").length;
              return (
                <div key={parecer.id} className="rounded-lg border border-border bg-surface p-4">
                  <div className="text-sm font-semibold text-foreground">
                    {parecer.quarter}º Trimestre de {parecer.year}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {parecer.results.length} projetos · {aprovados} aprovados · {ajustes} ajustes
                    solicitados
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <FileText className="size-3.5" /> {parecer.fileName}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );

  const extraAction = (
    <>
      <CreateGroupingDialog mode="juridico" />
      <Button variant="outline" className="gap-2" onClick={() => setParecerDialogOpen(true)}>
        <Upload className="size-4" /> Adicionar parecer do MCTI
      </Button>
      <Button asChild variant="outline" className="gap-2">
        <Link to="/juridico/final">
          <FileText className="size-4" /> Projetos Finais
        </Link>
      </Button>
      {windowOpen ? (
        <Button asChild className="gap-2">
          <Link to="/juridico/final/novo">
            <FolderTree className="size-4" /> Criar Projeto Final
          </Link>
        </Button>
      ) : (
        <Button className="gap-2" disabled title="Período anual de consolidação encerrado.">
          <FolderTree className="size-4" /> Criar Projeto Final
        </Button>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      <AppHeader current="Jurídico" />
      <ProjectsList
        title="Central Jurídica"
        description="Gerencie o portfólio de projetos, controle submissões ao MCTI e conduza ajustes e defesas."
        variant="juridico"
        extraTop={extraTop}
        extraAction={extraAction}
      />
      <MctiParecerDialog open={parecerDialogOpen} onOpenChange={setParecerDialogOpen} />
    </div>
  );
}
