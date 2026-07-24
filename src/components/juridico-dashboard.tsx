import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  ListChecks,
  FileCheck2,
  Scale,
  FileClock,
  FileWarning,
  ChevronDown,
  ChevronRight,
  Search,
  Upload,
  FileText,
  Archive,
} from "lucide-react";

import { AppHeader } from "@/components/app-header";
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
import { MctiParecerDialog } from "@/components/mcti-parecer-dialog";
import { getFilial, quarterLabel, quarterOf, yearOf, FILIAIS } from "@/components/projects-list";
import { useProjectsStore } from "@/lib/store";
import {
  AREAS,
  LEGAL_STATUS_ACTIONABLE,
  LEGAL_STATUS_BADGE_CLASS,
  LEGAL_STATUS_LABEL,
  type LegalStatus,
  type MctiParecer,
  type Project,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";

type GroupBy = "area" | "mestre" | "trimestre" | "nenhum";
type TipoFilter = "all" | "independente" | "mestre" | "dependente";

const ACTIVE_STATUS_FILTERS: LegalStatus[] = [
  "aguardando_juridico",
  "pronto_submissao",
  "submetido",
  "ajustes_mcti",
];

export function JuridicoDashboard() {
  const navigate = useNavigate();
  const allProjects = useProjectsStore((s) => s.projects) as Project[];
  const pareceres = useProjectsStore((s) => s.pareceres) as MctiParecer[];

  const [q, setQ] = useState("");
  const [yearFilter, setYearFilter] = useState("all");
  const [quarterFilter, setQuarterFilter] = useState("all");
  const [areaFilter, setAreaFilter] = useState("all");
  const [filialFilter, setFilialFilter] = useState("all");
  const [relatorFilter, setRelatorFilter] = useState("all");
  const [revisorFilter, setRevisorFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | LegalStatus>("all");
  const [tipoFilter, setTipoFilter] = useState<TipoFilter>("all");
  const [groupBy, setGroupBy] = useState<GroupBy>("area");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [parecerDialogOpen, setParecerDialogOpen] = useState(false);

  const currentYear = new Date().getFullYear();

  const legalProjects = useMemo(() => allProjects.filter((p) => p.legalStatus), [allProjects]);
  const activeProjects = useMemo(
    () =>
      legalProjects.filter((p) => p.legalStatus !== "aprovado" && p.legalStatus !== "indeferido"),
    [legalProjects],
  );

  const relatorOptions = useMemo(
    () => Array.from(new Set(activeProjects.map((p) => p.responsible))).sort(),
    [activeProjects],
  );
  const revisorOptions = useMemo(
    () =>
      Array.from(
        new Set(activeProjects.map((p) => p.reviewedBy).filter(Boolean)),
      ).sort() as string[],
    [activeProjects],
  );
  const yearOptions = useMemo(
    () => Array.from(new Set(legalProjects.map((p) => yearOf(p.updatedAt)))).sort((a, b) => b - a),
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

  const filtered = useMemo(() => {
    return activeProjects.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q.toLowerCase())) return false;
      if (yearFilter !== "all" && yearOf(p.updatedAt).toString() !== yearFilter) return false;
      if (quarterFilter !== "all" && `Q${quarterOf(p.updatedAt)}` !== quarterFilter) return false;
      if (areaFilter !== "all" && p.area !== areaFilter) return false;
      if (filialFilter !== "all" && getFilial(p) !== filialFilter) return false;
      if (relatorFilter !== "all" && p.responsible !== relatorFilter) return false;
      if (revisorFilter !== "all" && p.reviewedBy !== revisorFilter) return false;
      if (statusFilter !== "all" && p.legalStatus !== statusFilter) return false;
      if (tipoFilter !== "all" && p.projectType !== tipoFilter) return false;
      return true;
    });
  }, [
    activeProjects,
    q,
    yearFilter,
    quarterFilter,
    areaFilter,
    filialFilter,
    relatorFilter,
    revisorFilter,
    statusFilter,
    tipoFilter,
  ]);

  const priorityProjects = useMemo(
    () => activeProjects.filter((p) => p.legalStatus !== "submetido"),
    [activeProjects],
  );

  const anyFilter =
    q ||
    yearFilter !== "all" ||
    quarterFilter !== "all" ||
    areaFilter !== "all" ||
    filialFilter !== "all" ||
    relatorFilter !== "all" ||
    revisorFilter !== "all" ||
    statusFilter !== "all" ||
    tipoFilter !== "all";

  const clearFilters = () => {
    setQ("");
    setYearFilter("all");
    setQuarterFilter("all");
    setAreaFilter("all");
    setFilialFilter("all");
    setRelatorFilter("all");
    setRevisorFilter("all");
    setStatusFilter("all");
    setTipoFilter("all");
  };

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const genericGroups = useMemo(() => {
    if (groupBy === "mestre") return [];
    const keyOf = (p: Project) =>
      groupBy === "trimestre"
        ? quarterLabel(p.updatedAt)
        : groupBy === "area"
          ? p.area
          : "Todos os projetos";
    const map = new Map<string, Project[]>();
    filtered.forEach((p) => {
      const key = keyOf(p);
      const list = map.get(key) ?? [];
      list.push(p);
      map.set(key, list);
    });
    return Array.from(map.entries())
      .map(([key, projects]) => ({ key, projects }))
      .sort((a, b) => b.projects.length - a.projects.length);
  }, [filtered, groupBy]);

  const masterGroups = useMemo(() => {
    if (groupBy !== "mestre")
      return {
        masters: [] as Array<{ master: Project; dependents: Project[] }>,
        independents: [] as Project[],
      };
    const masters = filtered.filter((p) => p.projectType === "mestre");
    const dependentsByMaster = new Map<string, Project[]>();
    legalProjects.forEach((p) => {
      if (p.projectType === "dependente" && p.masterProjectId) {
        const list = dependentsByMaster.get(p.masterProjectId) ?? [];
        list.push(p);
        dependentsByMaster.set(p.masterProjectId, list);
      }
    });
    const independents = filtered.filter((p) => p.projectType === "independente");
    return {
      masters: masters.map((m) => ({ master: m, dependents: dependentsByMaster.get(m.id) ?? [] })),
      independents,
    };
  }, [filtered, legalProjects, groupBy]);

  const openProject = (id: string) => navigate({ to: "/juridico/projetos/$id", params: { id } });

  const renderRow = (p: Project, muted = false) => (
    <TableRow
      key={p.id}
      className={cn("group cursor-pointer", muted && "opacity-60")}
      onClick={() => openProject(p.id)}
    >
      <TableCell className="py-3 text-sm tabular-nums text-muted-foreground">
        {quarterLabel(p.updatedAt)}
      </TableCell>
      <TableCell className="py-3">
        <div className="font-medium text-foreground">{p.name}</div>
        {p.projectType === "dependente" && (
          <div className="text-xs text-muted-foreground">Projeto Dependente</div>
        )}
      </TableCell>
      <TableCell className="py-3 text-sm text-muted-foreground">{p.area}</TableCell>
      <TableCell className="py-3 text-sm text-muted-foreground">{p.responsible}</TableCell>
      <TableCell className="py-3 text-sm text-muted-foreground">{p.reviewedBy ?? "—"}</TableCell>
      <TableCell className="py-3">
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
      <TableCell className="py-3 text-right">
        <ChevronRight className="ml-auto size-4 text-muted-foreground/50 transition-colors group-hover:text-primary" />
      </TableCell>
    </TableRow>
  );

  const tableHeader = (
    <TableHeader>
      <TableRow className="bg-surface-muted hover:bg-surface-muted">
        <TableHead className="w-[130px]">Trimestre</TableHead>
        <TableHead className="w-[28%]">Projeto</TableHead>
        <TableHead>Área</TableHead>
        <TableHead>Relator</TableHead>
        <TableHead>Revisor</TableHead>
        <TableHead className="w-[190px]">Status</TableHead>
        <TableHead className="w-10" />
      </TableRow>
    </TableHeader>
  );

  return (
    <div className="min-h-screen bg-background">
      <AppHeader current="Jurídico" />

      <main className="mx-auto max-w-[1440px] px-6 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Central Jurídica</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Gerencie o portfólio de projetos, controle submissões ao MCTI e conduza ajustes e
              defesas.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" className="gap-2">
              <Link to="/juridico/finalizados">
                <Archive className="size-4" /> Projetos finalizados
              </Link>
            </Button>
            <Button className="gap-2" onClick={() => setParecerDialogOpen(true)}>
              <Upload className="size-4" /> Adicionar parecer do MCTI
            </Button>
          </div>
        </div>

        {/* Visão geral */}
        <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          <button
            type="button"
            onClick={() => {
              clearFilters();
              setYearFilter(currentYear.toString());
            }}
            className="rounded-lg border border-border bg-surface p-4 text-left transition-all hover:border-primary/40 hover:shadow-sm"
          >
            <div className="mb-3 grid size-9 place-items-center rounded-md bg-surface-muted text-muted-foreground">
              <FileText className="size-4.5" />
            </div>
            <div className="text-2xl font-semibold tabular-nums tracking-tight">
              {projectsThisYear}
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">Projetos no ano</div>
          </button>

          <button
            type="button"
            onClick={() => {
              clearFilters();
              setStatusFilter(statusFilter === "pronto_submissao" ? "all" : "pronto_submissao");
            }}
            className={cn(
              "rounded-lg border-2 bg-primary/5 p-4 text-left transition-all hover:shadow-md",
              statusFilter === "pronto_submissao"
                ? "border-primary ring-2 ring-primary/30"
                : "border-primary/50",
            )}
          >
            <div className="mb-3 grid size-9 place-items-center rounded-md bg-primary/10 text-primary">
              <FileCheck2 className="size-4.5" />
            </div>
            <div className="text-2xl font-semibold tabular-nums tracking-tight text-primary">
              {counts.pronto_submissao}
            </div>
            <div className="mt-0.5 text-xs font-medium text-foreground">Prontos para submissão</div>
          </button>

          <button
            type="button"
            onClick={() => {
              clearFilters();
              setStatusFilter(
                statusFilter === "aguardando_juridico" ? "all" : "aguardando_juridico",
              );
            }}
            className={cn(
              "rounded-lg border bg-surface p-4 text-left transition-all hover:border-primary/40 hover:shadow-sm",
              statusFilter === "aguardando_juridico"
                ? "border-primary ring-1 ring-primary/30"
                : "border-border",
            )}
          >
            <div className="mb-3 grid size-9 place-items-center rounded-md bg-surface-muted text-status-review-fg">
              <FileClock className="size-4.5" />
            </div>
            <div className="text-2xl font-semibold tabular-nums tracking-tight">
              {counts.aguardando_juridico}
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">Aguardando análise jurídica</div>
          </button>

          <button
            type="button"
            onClick={() => {
              clearFilters();
              setStatusFilter(statusFilter === "submetido" ? "all" : "submetido");
            }}
            className={cn(
              "rounded-lg border bg-surface p-4 text-left transition-all hover:border-primary/40 hover:shadow-sm",
              statusFilter === "submetido"
                ? "border-primary ring-1 ring-primary/30"
                : "border-border",
            )}
          >
            <div className="mb-3 grid size-9 place-items-center rounded-md bg-surface-muted text-status-submitted-fg">
              <Scale className="size-4.5" />
            </div>
            <div className="text-2xl font-semibold tabular-nums tracking-tight">
              {counts.submetido}
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">Em análise pelo MCTI</div>
          </button>

          <button
            type="button"
            onClick={() => {
              clearFilters();
              setStatusFilter(statusFilter === "ajustes_mcti" ? "all" : "ajustes_mcti");
            }}
            className={cn(
              "rounded-lg border bg-surface p-4 text-left transition-all hover:border-primary/40 hover:shadow-sm",
              statusFilter === "ajustes_mcti"
                ? "border-primary ring-1 ring-primary/30"
                : "border-border",
            )}
          >
            <div className="mb-3 grid size-9 place-items-center rounded-md bg-surface-muted text-status-adjust-fg">
              <FileWarning className="size-4.5" />
            </div>
            <div className="text-2xl font-semibold tabular-nums tracking-tight">
              {counts.ajustes_mcti}
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">Ajustes solicitados</div>
          </button>
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
                {tableHeader}
                <TableBody>{priorityProjects.map((p) => renderRow(p))}</TableBody>
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
                const ajustes = parecer.results.filter(
                  (r) => r.suggested === "ajustes_mcti",
                ).length;
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

        {/* Filtros */}
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
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="h-9 w-[110px]">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os anos</SelectItem>
              {yearOptions.map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={quarterFilter} onValueChange={setQuarterFilter}>
            <SelectTrigger className="h-9 w-[150px]">
              <SelectValue placeholder="Trimestre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os trimestres</SelectItem>
              <SelectItem value="Q1">1º Tri</SelectItem>
              <SelectItem value="Q2">2º Tri</SelectItem>
              <SelectItem value="Q3">3º Tri</SelectItem>
              <SelectItem value="Q4">4º Tri</SelectItem>
            </SelectContent>
          </Select>
          <Select value={areaFilter} onValueChange={setAreaFilter}>
            <SelectTrigger className="h-9 w-[190px]">
              <SelectValue placeholder="Área" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as áreas</SelectItem>
              {AREAS.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filialFilter} onValueChange={setFilialFilter}>
            <SelectTrigger className="h-9 w-[190px]">
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
          <Select value={relatorFilter} onValueChange={setRelatorFilter}>
            <SelectTrigger className="h-9 w-[160px]">
              <SelectValue placeholder="Relator" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os relatores</SelectItem>
              {relatorOptions.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={revisorFilter} onValueChange={setRevisorFilter}>
            <SelectTrigger className="h-9 w-[160px]">
              <SelectValue placeholder="Revisor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os revisores</SelectItem>
              {revisorOptions.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
          >
            <SelectTrigger className="h-9 w-[190px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {ACTIVE_STATUS_FILTERS.map((s) => (
                <SelectItem key={s} value={s}>
                  {LEGAL_STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={tipoFilter} onValueChange={(v) => setTipoFilter(v as TipoFilter)}>
            <SelectTrigger className="h-9 w-[170px]">
              <SelectValue placeholder="Tipo de projeto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="mestre">Projeto Mestre</SelectItem>
              <SelectItem value="dependente">Projeto Dependente</SelectItem>
              <SelectItem value="independente">Independente</SelectItem>
            </SelectContent>
          </Select>
          {anyFilter && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 text-muted-foreground"
              onClick={clearFilters}
            >
              Limpar filtros
            </Button>
          )}
          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            <span>{filtered.length} projetos encontrados</span>
          </div>
        </div>

        <div className="mb-6 flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Agrupar por:</span>
          <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
            <SelectTrigger className="h-9 w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="area">Área</SelectItem>
              <SelectItem value="mestre">Projeto Mestre</SelectItem>
              <SelectItem value="trimestre">Trimestre</SelectItem>
              <SelectItem value="nenhum">Nenhum</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Listagem agrupada */}
        {groupBy === "mestre" ? (
          <div className="space-y-3">
            {masterGroups.masters.length === 0 && masterGroups.independents.length === 0 && (
              <div className="rounded-lg border border-border bg-surface p-8 text-center text-sm text-muted-foreground">
                Nenhum projeto encontrado com os filtros atuais.
              </div>
            )}
            {masterGroups.masters.map(({ master, dependents }) => {
              const isOpen = expandedGroups.has(master.id);
              return (
                <div
                  key={master.id}
                  className="overflow-hidden rounded-lg border border-border bg-surface"
                >
                  <button
                    type="button"
                    onClick={() => toggleGroup(master.id)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-surface-muted/60"
                  >
                    <div className="flex items-center gap-2">
                      {isOpen ? (
                        <ChevronDown className="size-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="size-4 text-muted-foreground" />
                      )}
                      <span className="font-semibold text-foreground">{master.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {dependents.length} projeto{dependents.length === 1 ? "" : "s"} dependente
                      {dependents.length === 1 ? "" : "s"}
                    </span>
                  </button>
                  {isOpen && (
                    <Table>
                      {tableHeader}
                      <TableBody>
                        {renderRow(master)}
                        {dependents.map((d) =>
                          renderRow(
                            d,
                            d.legalStatus === "aprovado" || d.legalStatus === "indeferido",
                          ),
                        )}
                      </TableBody>
                    </Table>
                  )}
                </div>
              );
            })}
            {masterGroups.independents.length > 0 && (
              <div className="overflow-hidden rounded-lg border border-border bg-surface">
                <div className="px-4 py-3 text-sm font-semibold text-foreground">
                  Projetos independentes
                </div>
                <Table>
                  {tableHeader}
                  <TableBody>{masterGroups.independents.map((p) => renderRow(p))}</TableBody>
                </Table>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {genericGroups.length === 0 && (
              <div className="rounded-lg border border-border bg-surface p-8 text-center text-sm text-muted-foreground">
                Nenhum projeto encontrado com os filtros atuais.
              </div>
            )}
            {genericGroups.map((g) => {
              const isOpen = groupBy === "nenhum" || expandedGroups.has(g.key);
              const actionable = g.projects.filter(
                (p) => p.legalStatus && LEGAL_STATUS_ACTIONABLE.includes(p.legalStatus),
              ).length;
              return (
                <div
                  key={g.key}
                  className="overflow-hidden rounded-lg border border-border bg-surface"
                >
                  {groupBy !== "nenhum" && (
                    <button
                      type="button"
                      onClick={() => toggleGroup(g.key)}
                      className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-surface-muted/60"
                    >
                      <div className="flex items-center gap-2">
                        {isOpen ? (
                          <ChevronDown className="size-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="size-4 text-muted-foreground" />
                        )}
                        <span className="font-semibold text-foreground">{g.key}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {g.projects.length} projetos
                        {actionable > 0 && ` · ${actionable} exigem ação`}
                      </span>
                    </button>
                  )}
                  {isOpen && (
                    <Table>
                      {tableHeader}
                      <TableBody>{g.projects.map((p) => renderRow(p))}</TableBody>
                    </Table>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      <MctiParecerDialog open={parecerDialogOpen} onOpenChange={setParecerDialogOpen} />
    </div>
  );
}
