import { Link, useNavigate } from "@tanstack/react-router";
import { FolderTree, Plus, ChevronRight, CloudUpload } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

import { AppHeader } from "@/components/app-header";
import { EditGroupingDialog } from "@/components/create-grouping-dialog";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getProgress, quarterLabel, summarizeDependentStatuses } from "@/components/projects-list";
import { STATUS_LABEL, type Project } from "@/lib/types";

interface MasterProjectViewProps {
  project: Project;
  dependents: Project[];
  mode?: "relator" | "revisor" | "financeiro" | "juridico";
}

export function MasterProjectView({
  project,
  dependents,
  mode = "relator",
}: MasterProjectViewProps) {
  const navigate = useNavigate();
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

  const statusSummary = summarizeDependentStatuses(dependents);
  const overallProgress = dependents.length
    ? Math.round(dependents.reduce((acc, d) => acc + getProgress(d), 0) / dependents.length)
    : getProgress(project);
  const hasAjustes = dependents.some((d) => d.status === "ajustes");

  return (
    <div className="min-h-screen bg-background">
      <AppHeader current={project.name} />

      <main className="mx-auto max-w-[1440px] px-6 py-8">
        {/* Banner de hierarquia */}
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <FolderTree className="size-3.5" /> Mestre
          </span>
          <span>
            {dependents.length} projeto{dependents.length === 1 ? "" : "s"} dependente
            {dependents.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {project.area} · Responsável: {project.responsible}
            </p>
          </div>
          {mode === "relator" && (
            <Button asChild size="default" className="gap-2">
              <a href={`/projetos/novo?master=${project.id}`}>
                <Plus className="size-4" /> Novo Projeto Dependente
              </a>
            </Button>
          )}
          {(isRevisor || isJuridico) && <EditGroupingDialog master={project} />}
        </div>

        {/* Informações do Projeto Mestre */}
        <div className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border border-border bg-surface p-4">
            <div className="text-xs text-muted-foreground">Status geral</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {statusSummary.length === 0 && (
                <span className="text-sm text-muted-foreground">Sem dependentes ainda</span>
              )}
              {statusSummary.map((seg) => (
                <span
                  key={seg.status}
                  className={
                    seg.status === "ajustes"
                      ? "inline-flex items-center gap-1 rounded-full bg-status-adjust px-2 py-1 text-xs font-semibold text-status-adjust-fg"
                      : "inline-flex items-center gap-1 rounded-full bg-surface-muted px-2 py-1 text-xs text-muted-foreground"
                  }
                >
                  {seg.count} {STATUS_LABEL[seg.status].toLowerCase()}
                </span>
              ))}
            </div>
            {hasAjustes && (
              <p className="mt-2 text-xs font-medium text-status-adjust-fg">
                Há projetos dependentes com ajuste solicitado
              </p>
            )}
          </div>

          <div className="rounded-lg border border-border bg-surface p-4">
            <div className="text-xs text-muted-foreground">Progresso geral</div>
            <div className="mt-2 flex items-center gap-2">
              <Progress value={overallProgress} className="h-1.5 flex-1" />
              <span className="text-sm font-semibold tabular-nums text-foreground">
                {overallProgress}%
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-surface p-4">
            <div className="text-xs text-muted-foreground">Projetos dependentes</div>
            <div className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">
              {dependents.length}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-surface p-4">
            <div className="text-xs text-muted-foreground">Última atualização</div>
            <div className="mt-2 flex items-center gap-2 text-sm text-foreground">
              <CloudUpload className="size-3.5 text-status-ready-fg" />
              há {formatDistanceToNow(new Date(project.updatedAt), { locale: ptBR })}
            </div>
          </div>
        </div>

        {/* Projetos Dependentes */}
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Projetos Dependentes</h2>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-muted hover:bg-surface-muted">
                <TableHead className="w-[130px]">Trimestre</TableHead>
                <TableHead className="w-[80%]">Projeto</TableHead>
                <TableHead className="w-[160px] text-left">Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {dependents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-sm text-muted-foreground">
                    Nenhum projeto dependente ainda.
                  </TableCell>
                </TableRow>
              )}
              {dependents.map((d) => {
                const progress = getProgress(d);
                return (
                  <TableRow
                    key={d.id}
                    className="group cursor-pointer"
                    onClick={() => navigate({ to: fichaRoute, params: { id: d.id } })}
                  >
                    <TableCell className="py-4 text-sm text-muted-foreground tabular-nums">
                      {quarterLabel(d.updatedAt)}
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="font-medium text-foreground">{d.name}</div>
                      <div className="mt-2 flex items-center gap-2">
                        <Progress value={progress} className="h-1 w-20" />
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {progress}% preenchido
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-left align-top">
                      <StatusBadge status={d.status} />
                    </TableCell>
                    <TableCell className="py-4 text-right">
                      <ChevronRight className="ml-auto size-4 text-muted-foreground/50 transition-colors group-hover:text-primary" />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="mt-6">
          <Button asChild variant="ghost" size="sm" className="gap-2 text-muted-foreground">
            <Link
              to={
                isRevisor
                  ? "/revisor"
                  : isFinanceiro
                    ? "/financeiro"
                    : isJuridico
                      ? "/juridico"
                      : "/dashboard"
              }
            >
              {isRevisor
                ? "Voltar para Revisão de Projetos"
                : isJuridico
                  ? "Voltar para a Central Jurídica"
                  : "Voltar para Meus Projetos"}
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
