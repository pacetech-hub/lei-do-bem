import { Fragment, useMemo, useState, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Plus,
  Search,
  FileEdit,
  FileWarning,
  FileClock,
  FileCheck2,
  Send,
  ArrowUpRight,
  Building2,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  FolderTree,
  CornerDownRight,
  AlertTriangle,
  ListChecks,
  Share2,
} from "lucide-react";
import { StatusBadge, STATUS_BADGE_CLASS } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  STATUS_LABEL,
  AREAS,
  ALL_REQUIRED_QUESTIONS,
  type ProjectStatus,
  type Project,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const FILIAIS = [
  "Matriz — São Paulo/SP",
  "Filial Rio de Janeiro/RJ",
  "Filial Belo Horizonte/MG",
  "Filial Campinas/SP",
  "Filial Porto Alegre/RS",
];

// Deterministic filial per project id (mock)
export function getFilial(p: Project): string {
  if (p.filial) return p.filial;
  let h = 0;
  for (let i = 0; i < p.id.length; i++) h = (h * 31 + p.id.charCodeAt(i)) | 0;
  return FILIAIS[Math.abs(h) % FILIAIS.length];
}

export function getProgress(p: Project): number {
  const total = ALL_REQUIRED_QUESTIONS.length;
  if (!total) return 0;
  const filled = ALL_REQUIRED_QUESTIONS.filter(
    (id) => (p.answers?.[id] ?? "").trim().length >= 40,
  ).length;
  return Math.round((filled / total) * 100);
}

export function quarterOf(dateIso: string): 1 | 2 | 3 | 4 {
  const m = new Date(dateIso).getMonth();
  return (Math.floor(m / 3) + 1) as 1 | 2 | 3 | 4;
}

export function yearOf(dateIso: string): number {
  return new Date(dateIso).getFullYear();
}

export function quarterLabel(dateIso: string): string {
  return `${quarterOf(dateIso)}º Tri/${yearOf(dateIso)}`;
}

type SortKey = "updated_desc" | "updated_asc" | "deadline_asc" | "deadline_desc";

function compareProjects(a: Project, b: Project, sortKey: SortKey) {
  switch (sortKey) {
    case "updated_asc":
      return +new Date(a.updatedAt) - +new Date(b.updatedAt);
    case "deadline_asc":
      return +new Date(a.endDate) - +new Date(b.endDate);
    case "deadline_desc":
      return +new Date(b.endDate) - +new Date(a.endDate);
    case "updated_desc":
    default:
      return +new Date(b.updatedAt) - +new Date(a.updatedAt);
  }
}

const STATUS_ORDER: ProjectStatus[] = [
  "rascunho",
  "revisao",
  "ajustes",
  "pronto",
  "submetido",
  "aprovado",
  "indeferido",
];

export function summarizeDependentStatuses(deps: Project[]) {
  const c: Partial<Record<ProjectStatus, number>> = {};
  deps.forEach((d) => {
    c[d.status] = (c[d.status] ?? 0) + 1;
  });
  return STATUS_ORDER.filter((s) => c[s]).map((s) => ({ status: s, count: c[s] as number }));
}

// Tag de projeto (não é status): indica que o projeto foi compartilhado com a
// área do Revisor, mesmo sem ele ser o revisor titular.
function SharedWithAreaTag() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
      <Share2 className="size-3" /> Compartilhado com a sua área
    </span>
  );
}

type SummaryCard = {
  key: ProjectStatus;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
};

const DEFAULT_SUMMARY: SummaryCard[] = [
  { key: "rascunho", label: "Em Rascunho", icon: FileEdit, accent: "text-status-draft-fg" },
  {
    key: "ajustes",
    label: "Ajuste solicitado",
    icon: FileWarning,
    accent: "text-status-adjust-fg",
  },
  { key: "revisao", label: "Em revisão", icon: FileClock, accent: "text-status-review-fg" },
  { key: "pronto", label: "Prontos", icon: FileCheck2, accent: "text-status-ready-fg" },
  { key: "submetido", label: "Submetidos", icon: Send, accent: "text-status-submitted-fg" },
];

const RELATOR_STATUS_FILTERS: Array<{ key: ProjectStatus; label: string }> = [
  { key: "rascunho", label: "Rascunhos" },
  { key: "revisao", label: "Em revisão" },
  { key: "ajustes", label: "Ajuste solicitado" },
  { key: "pronto", label: "Prontos" },
  { key: "submetido", label: "Submetidos" },
  { key: "aprovado", label: "Aprovados" },
  { key: "indeferido", label: "Indeferidos" },
];

const REVISOR_STATUS_FILTERS: Array<{ key: ProjectStatus; label: string }> = [
  { key: "revisao", label: "Em revisão" },
  { key: "ajustes", label: "Ajuste solicitado" },
  { key: "pronto", label: "Prontos" },
  { key: "submetido", label: "Submetidos" },
  { key: "aprovado", label: "Aprovados" },
  { key: "indeferido", label: "Indeferidos" },
];

type QuarterKey = "all" | "Q1" | "Q2" | "Q3" | "Q4";

interface ProjectsListProps {
  title: string;
  description: string;
  showNewButton?: boolean;
  scopedFilial?: string;
  scopedSetor?: string;
  // Somente exibição (não filtra os projetos listados) — usado no Revisor,
  // que precisa ver a mesma área de Filial/Setor da sua base, mas continua
  // revisando projetos de todas as filiais e áreas.
  infoFilial?: string;
  infoSetor?: string;
  paginated?: boolean;
  pageSize?: number;
  variant?: "default" | "relator" | "revisor";
}

export function ProjectsList({
  title,
  description,
  showNewButton = false,
  scopedFilial,
  scopedSetor,
  infoFilial,
  infoSetor,
  paginated = false,
  pageSize = 10,
  variant = "default",
}: ProjectsListProps) {
  const projects = useProjectsStore((s) => s.projects);
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all");
  const [periodFilter, setPeriodFilter] = useState<"all" | "7" | "30" | "90">("all");
  const [quarterFilter, setQuarterFilter] = useState<QuarterKey>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("updated_desc");
  const [filialFilter, setFilialFilter] = useState<string>("all");
  const [setorFilter, setSetorFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [expandedMasters, setExpandedMasters] = useState<Set<string>>(new Set());

  const isRelator = variant === "relator";
  const isRevisor = variant === "revisor";
  const isHierarchical = isRelator || isRevisor;
  const isScoped = Boolean(scopedFilial && scopedSetor);
  const showFilialSetorFilters = !isScoped && variant === "default";
  const showFilialColumn = !isScoped && !isHierarchical;
  const showSetorColumn = !isScoped && !isHierarchical;

  const scopedProjects = useMemo(() => {
    if (!isScoped) return projects;
    return projects.filter((p) => getFilial(p) === scopedFilial && p.area === scopedSetor);
  }, [projects, isScoped, scopedFilial, scopedSetor]);

  // Top-level rows for hierarchical dashboards (Relator/Revisor): independent + master
  // projects. Dependent projects are nested inside their master's row, not listed on
  // their own.
  const topLevelScoped = useMemo(
    () => scopedProjects.filter((p) => p.projectType !== "dependente"),
    [scopedProjects],
  );

  const dependentsByMaster = useMemo(() => {
    const map = new Map<string, Project[]>();
    scopedProjects.forEach((p) => {
      if (p.projectType === "dependente" && p.masterProjectId) {
        const list = map.get(p.masterProjectId) ?? [];
        list.push(p);
        map.set(p.masterProjectId, list);
      }
    });
    return map;
  }, [scopedProjects]);

  const counts = useMemo(() => {
    const c: Record<ProjectStatus, number> = {
      rascunho: 0,
      ajustes: 0,
      revisao: 0,
      pronto: 0,
      submetido: 0,
      aprovado: 0,
      indeferido: 0,
    };
    const base = isHierarchical ? topLevelScoped : scopedProjects;
    base.forEach((p) => {
      c[p.status]++;
    });
    return c;
  }, [isHierarchical, topLevelScoped, scopedProjects]);

  const filtered = useMemo(() => {
    const now = Date.now();
    const periodMs = periodFilter === "all" ? Infinity : parseInt(periodFilter, 10) * 86400000;
    const list = scopedProjects.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q.toLowerCase())) return false;
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (periodFilter !== "all" && now - new Date(p.updatedAt).getTime() > periodMs) return false;
      if (filialFilter !== "all" && getFilial(p) !== filialFilter) return false;
      if (setorFilter !== "all" && p.area !== setorFilter) return false;
      return true;
    });
    return list.sort((a, b) => compareProjects(a, b, sortKey));
  }, [scopedProjects, q, statusFilter, periodFilter, filialFilter, setorFilter, sortKey]);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    scopedProjects.forEach((p) => years.add(yearOf(p.updatedAt)));
    return Array.from(years).sort((a, b) => b - a);
  }, [scopedProjects]);

  const hierarchicalRows = useMemo(() => {
    if (!isHierarchical) return [];
    const matchesQuery = (p: Project) => !q || p.name.toLowerCase().includes(q.toLowerCase());
    const matchesQuarter = (p: Project) =>
      quarterFilter === "all" || `Q${quarterOf(p.updatedAt)}` === quarterFilter;
    const matchesYear = (p: Project) =>
      yearFilter === "all" || yearOf(p.updatedAt).toString() === yearFilter;
    const matchesStatus = (p: Project) => statusFilter === "all" || p.status === statusFilter;

    const rows: Array<{ project: Project; dependents: Project[] }> = [];
    topLevelScoped.forEach((p) => {
      const deps = p.projectType === "mestre" ? (dependentsByMaster.get(p.id) ?? []) : [];
      const selfMatches =
        matchesQuery(p) && matchesQuarter(p) && matchesYear(p) && matchesStatus(p);
      const someDependentMatches = deps.some((d) => matchesQuery(d) && matchesStatus(d));
      if (!selfMatches && !someDependentMatches) return;
      rows.push({ project: p, dependents: deps });
    });
    return rows.sort((a, b) => compareProjects(a.project, b.project, sortKey));
  }, [
    isHierarchical,
    topLevelScoped,
    dependentsByMaster,
    q,
    statusFilter,
    quarterFilter,
    yearFilter,
    sortKey,
  ]);

  // Revisor's work queue: exclusively projects with status "revisao" (self or a
  // dependent), independent of whatever the filters below are set to.
  const priorityRows = useMemo(() => {
    if (!isRevisor) return [];
    const rows: Array<{ project: Project; dependents: Project[] }> = [];
    topLevelScoped.forEach((p) => {
      const deps = p.projectType === "mestre" ? (dependentsByMaster.get(p.id) ?? []) : [];
      const revisaoDeps = deps.filter((d) => d.status === "revisao");
      const selfQualifies = p.status === "revisao";
      if (!selfQualifies && revisaoDeps.length === 0) return;
      rows.push({ project: p, dependents: revisaoDeps });
    });
    return rows.sort((a, b) => compareProjects(a.project, b.project, "updated_desc"));
  }, [isRevisor, topLevelScoped, dependentsByMaster]);

  const priorityRowsShown = priorityRows.slice(0, 5);

  const toggleQuarterSort = () => {
    setSortKey((prev) => (prev === "updated_desc" ? "updated_asc" : "updated_desc"));
  };

  useEffect(() => {
    setPage(1);
  }, [
    q,
    statusFilter,
    periodFilter,
    quarterFilter,
    yearFilter,
    filialFilter,
    setorFilter,
    sortKey,
  ]);

  const totalPages = paginated ? Math.max(1, Math.ceil(filtered.length / pageSize)) : 1;
  const pageRows = paginated ? filtered.slice((page - 1) * pageSize, page * pageSize) : filtered;

  const anyFilter =
    q ||
    statusFilter !== "all" ||
    periodFilter !== "all" ||
    quarterFilter !== "all" ||
    yearFilter !== "all" ||
    filialFilter !== "all" ||
    setorFilter !== "all" ||
    sortKey !== "updated_desc";

  const colCount = isRevisor
    ? 7 // Trimestre, Projeto, Relator, Área, Filial, Atualizado em, seta
    : isRelator
      ? 4 // Trimestre, Status, Projeto, seta
      : 4 + (showFilialColumn ? 1 : 0) + (showSetorColumn ? 1 : 0) + 1; // + seta

  const shownCount = isHierarchical ? hierarchicalRows.length : filtered.length;
  const totalCount = isHierarchical ? topLevelScoped.length : scopedProjects.length;

  const toggleExpanded = (id: string) => {
    setExpandedMasters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openProject = (id: string) =>
    navigate({ to: isRevisor ? "/revisor/projetos/$id" : "/projetos/$id", params: { id } });

  const renderHierarchicalRow = (entry: { project: Project; dependents: Project[] }) => {
    const { project: p, dependents } = entry;
    const isMaster = p.projectType === "mestre";
    const isExpanded = expandedMasters.has(p.id);
    const statusSummary = isMaster ? summarizeDependentStatuses(dependents) : [];
    const avgProgress =
      isMaster && dependents.length
        ? Math.round(dependents.reduce((acc, d) => acc + getProgress(d), 0) / dependents.length)
        : null;

    return (
      <Fragment key={p.id}>
        <TableRow
          className={cn("group cursor-pointer", isMaster && "bg-surface-muted/40")}
          onClick={() => (isMaster ? toggleExpanded(p.id) : openProject(p.id))}
        >
          <TableCell className="py-4 text-sm text-muted-foreground tabular-nums">
            {quarterLabel(p.updatedAt)}
          </TableCell>
          <TableCell className="py-4">
            {isMaster ? (
              <>
                {isRevisor && p.sharedWithArea && (
                  <div className="mb-1.5 pl-6">
                    <SharedWithAreaTag />
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-2.5">
                  {isExpanded ? (
                    <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  )}
                  <FolderTree className="size-4 shrink-0 text-primary" />
                  <span className="font-medium text-foreground">{p.name}</span>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 pl-6 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground/80">Mestre</span>
                  <span>
                    · {dependents.length} projeto{dependents.length === 1 ? "" : "s"} dependente
                    {dependents.length === 1 ? "" : "s"}
                  </span>
                  {isRevisor &&
                    statusSummary.map((seg) => (
                      <span
                        key={seg.status}
                        className={
                          seg.status === "ajustes" ? "font-semibold text-status-adjust-fg" : ""
                        }
                      >
                        · {seg.count} {STATUS_LABEL[seg.status].toLowerCase()}
                      </span>
                    ))}
                  {avgProgress !== null && <span>· {avgProgress}% preenchido</span>}
                </div>
              </>
            ) : (
              <>
                {isRevisor && p.sharedWithArea && (
                  <div className="mb-1.5">
                    <SharedWithAreaTag />
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-foreground">{p.name}</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {isRevisor && p.status === "revisao" ? "Solicitado em" : "Criado em"}{" "}
                  {format(
                    new Date(isRevisor && p.status === "revisao" ? p.updatedAt : p.createdAt),
                    "dd/MM/yyyy",
                    { locale: ptBR },
                  )}
                </div>
              </>
            )}
          </TableCell>
          {isRevisor && (
            <TableCell className="py-4 text-left align-top">
              {isMaster ? (
                <div className="flex flex-wrap gap-1.5">
                  {statusSummary.length === 0 ? (
                    <span className="text-xs text-muted-foreground">—</span>
                  ) : (
                    statusSummary.map((seg) => <StatusBadge key={seg.status} status={seg.status} />)
                  )}
                </div>
              ) : (
                <StatusBadge status={p.status} />
              )}
            </TableCell>
          )}
          {isRevisor && (
            <>
              <TableCell className="py-4 text-sm text-muted-foreground">{p.responsible}</TableCell>
              <TableCell className="py-4 text-sm text-muted-foreground">{p.area}</TableCell>
              <TableCell className="py-4 text-sm text-muted-foreground">{getFilial(p)}</TableCell>
            </>
          )}
          {isRelator && (
            <TableCell className="py-4 text-left align-top">
              {isMaster ? (
                <div className="flex flex-wrap gap-1.5">
                  {statusSummary.length === 0 ? (
                    <span className="text-xs text-muted-foreground">—</span>
                  ) : (
                    statusSummary.map((seg) => <StatusBadge key={seg.status} status={seg.status} />)
                  )}
                </div>
              ) : (
                <StatusBadge status={p.status} />
              )}
            </TableCell>
          )}
          <TableCell
            className="py-4 text-right"
            onClick={(e) => {
              if (isMaster) {
                e.stopPropagation();
                openProject(p.id);
              }
            }}
          >
            <ChevronRight className="ml-auto size-4 text-muted-foreground/50 transition-colors group-hover:text-primary" />
          </TableCell>
        </TableRow>

        {isMaster &&
          isExpanded &&
          dependents.map((d) => {
            const dProgress = getProgress(d);
            return (
              <TableRow
                key={d.id}
                className="group cursor-pointer bg-background hover:bg-surface-muted/50"
                onClick={() => openProject(d.id)}
              >
                <TableCell className="py-3.5 text-sm text-muted-foreground tabular-nums">
                  {quarterLabel(d.updatedAt)}
                </TableCell>
                <TableCell className="py-3.5">
                  {isRevisor && d.sharedWithArea && (
                    <div className="mb-1.5 pl-4">
                      <SharedWithAreaTag />
                    </div>
                  )}
                  <div className="flex items-center gap-2.5 border-l-2 border-border pl-4">
                    <CornerDownRight className="size-3.5 shrink-0 text-muted-foreground/60" />
                    <span className="text-sm font-medium text-foreground">{d.name}</span>
                  </div>
                  <div className="ml-2 mt-1.5 flex items-center gap-2 border-l-2 border-transparent pl-4">
                    <Progress value={dProgress} className="h-1 w-20" />
                    <span className="text-[11px] tabular-nums text-muted-foreground">
                      {dProgress}% preenchido
                    </span>
                  </div>
                </TableCell>
                {isRevisor && (
                  <TableCell className="py-3.5 text-left align-top">
                    <div className="flex flex-col items-start gap-1">
                      <StatusBadge status={d.status} />
                      {d.status === "ajustes" && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-status-adjust-fg">
                          <AlertTriangle className="size-3" /> Pendência
                        </span>
                      )}
                    </div>
                  </TableCell>
                )}
                {isRevisor && (
                  <>
                    <TableCell className="py-3.5 text-sm text-muted-foreground">
                      {d.responsible}
                    </TableCell>
                    <TableCell className="py-3.5 text-sm text-muted-foreground">{d.area}</TableCell>
                    <TableCell className="py-3.5 text-sm text-muted-foreground">
                      {getFilial(d)}
                    </TableCell>
                  </>
                )}
                {isRelator && (
                  <TableCell className="py-3.5 text-left align-top">
                    <div className="flex flex-col items-start gap-1">
                      <StatusBadge status={d.status} />
                      {d.status === "ajustes" && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-status-adjust-fg">
                          <AlertTriangle className="size-3" /> Pendência
                        </span>
                      )}
                    </div>
                  </TableCell>
                )}
                <TableCell className="py-3.5 text-right">
                  <ChevronRight className="ml-auto size-4 text-muted-foreground/50 transition-colors group-hover:text-primary" />
                </TableCell>
              </TableRow>
            );
          })}
      </Fragment>
    );
  };

  return (
    <main className="mx-auto max-w-[1440px] px-6 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        {showNewButton && (
          <Button asChild size="default" className="gap-2">
            <Link to="/projetos/novo">
              <Plus className="size-4" /> Novo Projeto
            </Link>
          </Button>
        )}
      </div>

      {(isScoped || (infoFilial && infoSetor)) && (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface-muted/60 px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">Filial:</span>
            <span className="font-medium text-foreground">{scopedFilial ?? infoFilial}</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2 text-sm">
            <Briefcase className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">Setor:</span>
            <span className="font-medium text-foreground">{scopedSetor ?? infoSetor}</span>
          </div>
        </div>
      )}

      {isRevisor && (
        <div className="mb-8 rounded-lg border border-primary/20 bg-primary/5 p-4">
          <div className="mb-3 flex items-center gap-2">
            <ListChecks className="size-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">
              Projetos que precisam da sua revisão
            </h2>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold tabular-nums text-primary">
              {priorityRows.length}
            </span>
          </div>
          {priorityRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum projeto aguardando sua revisão no momento.
            </p>
          ) : (
            <>
              <div className="overflow-hidden rounded-lg border border-border bg-surface">
                <Table>
                  <TableBody>{priorityRowsShown.map(renderHierarchicalRow)}</TableBody>
                </Table>
              </div>
              {priorityRows.length > priorityRowsShown.length && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Mostrando {priorityRowsShown.length} de {priorityRows.length} projetos. Use a
                  tabela abaixo para ver os demais.
                </p>
              )}
            </>
          )}
        </div>
      )}

      {isHierarchical ? (
        <div className="mb-8">
          <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Filtre por status
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              aria-pressed={statusFilter === "all"}
              onClick={() => setStatusFilter("all")}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                "bg-surface-muted text-foreground",
                statusFilter === "all"
                  ? "border-foreground/30 ring-2 ring-foreground/15"
                  : "border-transparent opacity-70 hover:opacity-100",
              )}
            >
              Todos os projetos
              <span className="rounded-full bg-background/70 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums">
                {totalCount}
              </span>
            </button>
            {(isRevisor ? REVISOR_STATUS_FILTERS : RELATOR_STATUS_FILTERS).map((f) => {
              const active = statusFilter === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setStatusFilter(active ? "all" : f.key)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                    STATUS_BADGE_CLASS[f.key],
                    active
                      ? "border-current ring-2 ring-current/25"
                      : "border-transparent opacity-70 hover:opacity-100",
                  )}
                >
                  <span className="size-1.5 rounded-full bg-current opacity-70" />
                  {f.label}
                  <span className="rounded-full bg-background/70 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums">
                    {counts[f.key]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          {DEFAULT_SUMMARY.map((c) => {
            const Icon = c.icon;
            const active = statusFilter === c.key;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => setStatusFilter(active ? "all" : c.key)}
                className={`group rounded-lg border bg-surface p-4 text-left transition-all hover:border-primary/40 hover:shadow-sm ${active ? "border-primary ring-1 ring-primary/30" : "border-border"}`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div
                    className={`grid size-9 place-items-center rounded-md bg-surface-muted ${c.accent}`}
                  >
                    <Icon className="size-4.5" />
                  </div>
                  <ArrowUpRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <div className="text-2xl font-semibold tabular-nums tracking-tight">
                  {counts[c.key]}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">{c.label}</div>
              </button>
            );
          })}
        </div>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome do projeto…"
            className="h-9 pl-8"
          />
        </div>
        {!isHierarchical && (
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as ProjectStatus | "all")}
          >
            <SelectTrigger className="h-9 w-[170px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {(Object.keys(STATUS_LABEL) as ProjectStatus[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {showFilialSetorFilters && (
          <>
            <Select value={filialFilter} onValueChange={setFilialFilter}>
              <SelectTrigger className="h-9 w-[220px]">
                <SelectValue placeholder="Filial" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as filiais</SelectItem>
                {FILIAIS.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={setorFilter} onValueChange={setSetorFilter}>
              <SelectTrigger className="h-9 w-[220px]">
                <SelectValue placeholder="Setor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os setores</SelectItem>
                {AREAS.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}
        {isHierarchical ? (
          <>
            <Select value={quarterFilter} onValueChange={(v) => setQuarterFilter(v as QuarterKey)}>
              <SelectTrigger className="h-9 w-[170px]">
                <SelectValue placeholder="Trimestre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os trimestres</SelectItem>
                <SelectItem value="Q1">1º trimestre</SelectItem>
                <SelectItem value="Q2">2º trimestre</SelectItem>
                <SelectItem value="Q3">3º trimestre</SelectItem>
                <SelectItem value="Q4">4º trimestre</SelectItem>
              </SelectContent>
            </Select>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="h-9 w-[140px]">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os anos</SelectItem>
                {availableYears.map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
              <SelectTrigger className="h-9 w-[220px]">
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updated_desc">Atualização (mais recente)</SelectItem>
                <SelectItem value="updated_asc">Atualização (mais antiga)</SelectItem>
                <SelectItem value="deadline_asc">Prazo (mais próximo)</SelectItem>
                <SelectItem value="deadline_desc">Prazo (mais distante)</SelectItem>
              </SelectContent>
            </Select>
          </>
        ) : (
          <Select
            value={periodFilter}
            onValueChange={(v) => setPeriodFilter(v as typeof periodFilter)}
          >
            <SelectTrigger className="h-9 w-[170px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Qualquer período</SelectItem>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
        )}
        {anyFilter && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-muted-foreground"
            onClick={() => {
              setQ("");
              setStatusFilter("all");
              setPeriodFilter("all");
              setQuarterFilter("all");
              setYearFilter("all");
              setSortKey("updated_desc");
              setFilialFilter("all");
              setSetorFilter("all");
            }}
          >
            Limpar filtros
          </Button>
        )}
        <div className="ml-auto text-xs text-muted-foreground">
          {shownCount} de {totalCount} projetos
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <Table>
          <TableHeader>
            <TableRow className="bg-surface-muted hover:bg-surface-muted">
              {isHierarchical && (
                <TableHead className={isRelator ? "w-[15%]" : "w-[130px]"}>
                  <button
                    type="button"
                    onClick={toggleQuarterSort}
                    className="inline-flex items-center gap-1 font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Trimestre
                    {sortKey === "updated_asc" ? (
                      <ArrowUp className="size-3.5" />
                    ) : (
                      <ArrowDown
                        className={cn("size-3.5", sortKey !== "updated_desc" && "opacity-30")}
                      />
                    )}
                  </button>
                </TableHead>
              )}
              <TableHead className={isRelator ? "w-[80%]" : isHierarchical ? "w-[22%]" : "w-[30%]"}>
                Projeto
              </TableHead>
              {isRevisor && <TableHead className="w-[130px] text-left">Status</TableHead>}
              {isRevisor && <TableHead className="w-[14%]">Relator</TableHead>}
              {isRevisor && <TableHead className="w-[16%]">Área</TableHead>}
              {isRevisor && <TableHead className="w-[16%]">Filial</TableHead>}
              {showFilialColumn && <TableHead>Filial</TableHead>}
              {showSetorColumn && <TableHead>Setor</TableHead>}
              {!isHierarchical && <TableHead>Responsável</TableHead>}
              {!isHierarchical && <TableHead>Última atualização</TableHead>}
              {isRelator && <TableHead className="w-[20%] text-left">Status</TableHead>}
              {!isHierarchical && <TableHead className="text-left">Status</TableHead>}
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isHierarchical ? (
              <>
                {hierarchicalRows.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={colCount}
                      className="h-24 text-center text-sm text-muted-foreground"
                    >
                      Nenhum projeto encontrado com os filtros atuais.
                    </TableCell>
                  </TableRow>
                )}
                {hierarchicalRows.map(renderHierarchicalRow)}
              </>
            ) : (
              <>
                {pageRows.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={colCount}
                      className="h-24 text-center text-sm text-muted-foreground"
                    >
                      Nenhum projeto encontrado com os filtros atuais.
                    </TableCell>
                  </TableRow>
                )}
                {pageRows.map((p) => (
                  <TableRow
                    key={p.id}
                    className="group cursor-pointer"
                    onClick={() => openProject(p.id)}
                  >
                    <TableCell className="py-4">
                      <div className="font-medium text-foreground">{p.name}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        Criado em {format(new Date(p.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                      </div>
                    </TableCell>
                    {showFilialColumn && (
                      <TableCell className="py-4 text-sm text-muted-foreground">
                        {getFilial(p)}
                      </TableCell>
                    )}
                    {showSetorColumn && (
                      <TableCell className="py-4 text-sm text-muted-foreground">{p.area}</TableCell>
                    )}
                    <TableCell className="py-4 text-sm text-muted-foreground">
                      {p.responsible}
                    </TableCell>
                    <TableCell className="py-4 text-sm text-muted-foreground">
                      há {formatDistanceToNow(new Date(p.updatedAt), { locale: ptBR })}
                    </TableCell>
                    <TableCell className="py-4 text-left">
                      <StatusBadge status={p.status} />
                    </TableCell>
                    <TableCell className="py-4 text-right">
                      <ChevronRight className="ml-auto size-4 text-muted-foreground/50 transition-colors group-hover:text-primary" />
                    </TableCell>
                  </TableRow>
                ))}
              </>
            )}
          </TableBody>
        </Table>
      </div>

      {paginated && !isHierarchical && filtered.length > 0 && (
        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="text-xs text-muted-foreground">
            Mostrando {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} de{" "}
            {filtered.length}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="size-4" /> Anterior
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
              .map((n, idx, arr) => (
                <span key={n} className="flex items-center gap-1">
                  {idx > 0 && arr[idx - 1] !== n - 1 && (
                    <span className="px-1 text-xs text-muted-foreground">…</span>
                  )}
                  <Button
                    variant={n === page ? "default" : "outline"}
                    size="sm"
                    className="h-8 w-8 p-0 tabular-nums"
                    onClick={() => setPage(n)}
                  >
                    {n}
                  </Button>
                </span>
              ))}
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Próxima <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
