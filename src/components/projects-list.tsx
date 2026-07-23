import { useMemo, useState, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Plus,
  Search,
  FileEdit,
  FileWarning,
  FileClock,
  FileCheck2,
  Send,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  Building2,
  Briefcase,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  type ProjectStatus,
  type Project,
} from "@/lib/types";
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

type SummaryCard = {
  key: ProjectStatus;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
};

const DEFAULT_SUMMARY: SummaryCard[] = [
  { key: "rascunho", label: "Em Rascunho", icon: FileEdit, accent: "text-status-draft-fg" },
  { key: "ajustes", label: "Ajuste solicitado", icon: FileWarning, accent: "text-status-adjust-fg" },
  { key: "revisao", label: "Em revisão", icon: FileClock, accent: "text-status-review-fg" },
  { key: "pronto", label: "Prontos", icon: FileCheck2, accent: "text-status-ready-fg" },
  { key: "submetido", label: "Submetidos", icon: Send, accent: "text-status-submitted-fg" },
];

const RELATOR_SUMMARY: SummaryCard[] = [
  { key: "rascunho", label: "Rascunhos", icon: FileEdit, accent: "text-status-draft-fg" },
  { key: "revisao", label: "Em revisão", icon: FileClock, accent: "text-status-review-fg" },
  { key: "ajustes", label: "Ajuste solicitado", icon: FileWarning, accent: "text-status-adjust-fg" },
  { key: "pronto", label: "Prontos", icon: FileCheck2, accent: "text-status-ready-fg" },
  { key: "submetido", label: "Submetidos", icon: Send, accent: "text-status-submitted-fg" },
  { key: "aprovado", label: "Aprovados", icon: CheckCircle2, accent: "text-status-approved-fg" },
  { key: "indeferido", label: "Indeferidos", icon: XCircle, accent: "text-status-rejected-fg" },
];

type SortKey = "updated_desc" | "updated_asc" | "deadline_asc" | "deadline_desc";
type QuarterKey = "all" | "Q1" | "Q2" | "Q3" | "Q4";

interface ProjectsListProps {
  title: string;
  description: string;
  showNewButton?: boolean;
  scopedFilial?: string;
  scopedSetor?: string;
  paginated?: boolean;
  pageSize?: number;
  variant?: "default" | "relator";
}

export function ProjectsList({
  title,
  description,
  showNewButton = false,
  scopedFilial,
  scopedSetor,
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
  const [sortKey, setSortKey] = useState<SortKey>("updated_desc");
  const [filialFilter, setFilialFilter] = useState<string>("all");
  const [setorFilter, setSetorFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const isRelator = variant === "relator";
  const isScoped = Boolean(scopedFilial && scopedSetor);
  const showFilialSetorFilters = !isScoped;
  const showFilialColumn = !isScoped && !isRelator;
  const showSetorColumn = !isScoped && !isRelator;

  const summaryCards = isRelator ? RELATOR_SUMMARY : DEFAULT_SUMMARY;

  const scopedProjects = useMemo(() => {
    if (!isScoped) return projects;
    return projects.filter(
      (p) => getFilial(p) === scopedFilial && p.area === scopedSetor,
    );
  }, [projects, isScoped, scopedFilial, scopedSetor]);

  const counts = useMemo(() => {
    const c: Record<ProjectStatus, number> = {
      rascunho: 0, ajustes: 0, revisao: 0, pronto: 0,
      submetido: 0, aprovado: 0, indeferido: 0,
    };
    scopedProjects.forEach((p) => { c[p.status]++; });
    return c;
  }, [scopedProjects]);

  const filtered = useMemo(() => {
    const now = Date.now();
    const periodMs =
      periodFilter === "all" ? Infinity : parseInt(periodFilter, 10) * 86400000;
    const list = scopedProjects.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q.toLowerCase())) return false;
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (!isRelator && periodFilter !== "all" &&
          now - new Date(p.updatedAt).getTime() > periodMs) return false;
      if (isRelator && quarterFilter !== "all") {
        const m = new Date(p.updatedAt).getMonth();
        const q = (Math.floor(m / 3) + 1) as 1 | 2 | 3 | 4;
        if (`Q${q}` !== quarterFilter) return false;
      }
      if (filialFilter !== "all" && getFilial(p) !== filialFilter) return false;
      if (setorFilter !== "all" && p.area !== setorFilter) return false;
      return true;
    });
    const cmp = (a: Project, b: Project) => {
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
    };
    return list.sort(cmp);
  }, [scopedProjects, q, statusFilter, periodFilter, quarterFilter,
      filialFilter, setorFilter, sortKey, isRelator]);

  useEffect(() => { setPage(1); }, [q, statusFilter, periodFilter, quarterFilter,
    filialFilter, setorFilter, sortKey]);

  const totalPages = paginated ? Math.max(1, Math.ceil(filtered.length / pageSize)) : 1;
  const pageRows = paginated
    ? filtered.slice((page - 1) * pageSize, page * pageSize)
    : filtered;

  const anyFilter =
    q || statusFilter !== "all" || periodFilter !== "all" || quarterFilter !== "all" ||
    filialFilter !== "all" || setorFilter !== "all" || sortKey !== "updated_desc";

  const colCount = isRelator
    ? 7 // Projeto, Área, Início, Término, Atualização, Status, seta
    : 3 + (showFilialColumn ? 1 : 0) + (showSetorColumn ? 1 : 0) + 1;

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

      {isScoped && (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface-muted/60 px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">Filial:</span>
            <span className="font-medium text-foreground">{scopedFilial}</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2 text-sm">
            <Briefcase className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">Setor:</span>
            <span className="font-medium text-foreground">{scopedSetor}</span>
          </div>
        </div>
      )}

      <div className={`mb-8 grid gap-3 grid-cols-2 ${isRelator ? "md:grid-cols-4 xl:grid-cols-7" : "md:grid-cols-3 xl:grid-cols-5"}`}>
        {summaryCards.map((c) => {
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
                <div className={`grid size-9 place-items-center rounded-md bg-surface-muted ${c.accent}`}>
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
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ProjectStatus | "all")}>
          <SelectTrigger className="h-9 w-[170px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {(Object.keys(STATUS_LABEL) as ProjectStatus[]).map((s) => (
              <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {showFilialSetorFilters && (
          <>
            <Select value={filialFilter} onValueChange={setFilialFilter}>
              <SelectTrigger className="h-9 w-[220px]"><SelectValue placeholder="Filial" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as filiais</SelectItem>
                {FILIAIS.map((f) => (
                  <SelectItem key={f} value={f}>{f}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={setorFilter} onValueChange={setSetorFilter}>
              <SelectTrigger className="h-9 w-[220px]"><SelectValue placeholder="Setor" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os setores</SelectItem>
                {AREAS.map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}
        {isRelator ? (
          <>
            <Select value={quarterFilter} onValueChange={(v) => setQuarterFilter(v as QuarterKey)}>
              <SelectTrigger className="h-9 w-[170px]"><SelectValue placeholder="Trimestre" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os trimestres</SelectItem>
                <SelectItem value="Q1">1º trimestre</SelectItem>
                <SelectItem value="Q2">2º trimestre</SelectItem>
                <SelectItem value="Q3">3º trimestre</SelectItem>
                <SelectItem value="Q4">4º trimestre</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
              <SelectTrigger className="h-9 w-[220px]"><SelectValue placeholder="Ordenar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="updated_desc">Atualização (mais recente)</SelectItem>
                <SelectItem value="updated_asc">Atualização (mais antiga)</SelectItem>
                <SelectItem value="deadline_asc">Prazo (mais próximo)</SelectItem>
                <SelectItem value="deadline_desc">Prazo (mais distante)</SelectItem>
              </SelectContent>
            </Select>
          </>
        ) : (
          <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as typeof periodFilter)}>
            <SelectTrigger className="h-9 w-[170px]"><SelectValue placeholder="Período" /></SelectTrigger>
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
              setQ(""); setStatusFilter("all"); setPeriodFilter("all");
              setQuarterFilter("all"); setSortKey("updated_desc");
              setFilialFilter("all"); setSetorFilter("all");
            }}
          >
            Limpar filtros
          </Button>
        )}
        <div className="ml-auto text-xs text-muted-foreground">
          {filtered.length} de {scopedProjects.length} projetos
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <Table>
          <TableHeader>
            <TableRow className="bg-surface-muted hover:bg-surface-muted">
              <TableHead className={isRelator ? "w-[24%]" : "w-[30%]"}>Projeto</TableHead>
              {showFilialColumn && <TableHead>Filial</TableHead>}
              {showSetorColumn && <TableHead>Setor</TableHead>}
              {isRelator && <TableHead>Área</TableHead>}
              {isRelator && <TableHead>Início</TableHead>}
              {isRelator && <TableHead>Prev. término</TableHead>}
              {!isRelator && <TableHead>Responsável</TableHead>}
              <TableHead>Última atualização</TableHead>
              <TableHead>Status</TableHead>
              {isRelator && <TableHead className="w-10" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={colCount} className="h-24 text-center text-sm text-muted-foreground">
                  Nenhum projeto encontrado com os filtros atuais.
                </TableCell>
              </TableRow>
            )}
            {pageRows.map((p) => {
              return (
                <TableRow
                  key={p.id}
                  className="cursor-pointer"
                  onClick={() => navigate({ to: "/projetos/$id", params: { id: p.id } })}
                >
                  <TableCell>
                    <div className="font-medium text-foreground">{p.name}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      Criado em {format(new Date(p.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                    </div>
                  </TableCell>
                  {showFilialColumn && (
                    <TableCell className="text-sm text-muted-foreground">{getFilial(p)}</TableCell>
                  )}
                  {showSetorColumn && (
                    <TableCell className="text-sm text-muted-foreground">{p.area}</TableCell>
                  )}
                  {isRelator && (
                    <TableCell className="text-sm text-muted-foreground">{p.area}</TableCell>
                  )}
                  {isRelator && (
                    <TableCell className="text-sm text-muted-foreground tabular-nums">
                      {format(new Date(p.startDate), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                  )}
                  {isRelator && (
                    <TableCell className="text-sm text-muted-foreground tabular-nums">
                      {format(new Date(p.endDate), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                  )}
                  {!isRelator && (
                    <TableCell className="text-sm text-muted-foreground">{p.responsible}</TableCell>
                  )}
                  <TableCell className="text-sm text-muted-foreground">
                    há {formatDistanceToNow(new Date(p.updatedAt), { locale: ptBR })}
                  </TableCell>
                  <TableCell><StatusBadge status={p.status} /></TableCell>
                  {isRelator && (
                    <TableCell className="text-right">
                      <ChevronRight className="ml-auto size-4 text-muted-foreground/50" />
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {paginated && filtered.length > 0 && (
        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="text-xs text-muted-foreground">
            Mostrando {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} de {filtered.length}
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
