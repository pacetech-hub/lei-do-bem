import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Archive, ChevronRight, Search } from "lucide-react";

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
import { getFilial, quarterLabel, quarterOf, yearOf, FILIAIS } from "@/components/projects-list";
import { useProjectsStore } from "@/lib/store";
import { AREAS, LEGAL_STATUS_BADGE_CLASS, LEGAL_STATUS_LABEL, type Project } from "@/lib/types";
import { cn } from "@/lib/utils";

export function JuridicoFinalizados() {
  const navigate = useNavigate();
  const allProjects = useProjectsStore((s) => s.projects) as Project[];

  const [q, setQ] = useState("");
  const [yearFilter, setYearFilter] = useState("all");
  const [quarterFilter, setQuarterFilter] = useState("all");
  const [areaFilter, setAreaFilter] = useState("all");
  const [filialFilter, setFilialFilter] = useState("all");
  const [relatorFilter, setRelatorFilter] = useState("all");
  const [revisorFilter, setRevisorFilter] = useState("all");

  const finalizedProjects = useMemo(
    () => allProjects.filter((p) => p.legalStatus === "aprovado" || p.legalStatus === "indeferido"),
    [allProjects],
  );

  const relatorOptions = useMemo(
    () => Array.from(new Set(finalizedProjects.map((p) => p.responsible))).sort(),
    [finalizedProjects],
  );
  const revisorOptions = useMemo(
    () =>
      Array.from(
        new Set(finalizedProjects.map((p) => p.reviewedBy).filter(Boolean)),
      ).sort() as string[],
    [finalizedProjects],
  );
  const yearOptions = useMemo(
    () =>
      Array.from(new Set(finalizedProjects.map((p) => yearOf(p.updatedAt)))).sort((a, b) => b - a),
    [finalizedProjects],
  );

  const filtered = useMemo(() => {
    return finalizedProjects
      .filter((p) => {
        if (q && !p.name.toLowerCase().includes(q.toLowerCase())) return false;
        if (yearFilter !== "all" && yearOf(p.updatedAt).toString() !== yearFilter) return false;
        if (quarterFilter !== "all" && `Q${quarterOf(p.updatedAt)}` !== quarterFilter) return false;
        if (areaFilter !== "all" && p.area !== areaFilter) return false;
        if (filialFilter !== "all" && getFilial(p) !== filialFilter) return false;
        if (relatorFilter !== "all" && p.responsible !== relatorFilter) return false;
        if (revisorFilter !== "all" && p.reviewedBy !== revisorFilter) return false;
        return true;
      })
      .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
  }, [
    finalizedProjects,
    q,
    yearFilter,
    quarterFilter,
    areaFilter,
    filialFilter,
    relatorFilter,
    revisorFilter,
  ]);

  const anyFilter =
    q ||
    yearFilter !== "all" ||
    quarterFilter !== "all" ||
    areaFilter !== "all" ||
    filialFilter !== "all" ||
    relatorFilter !== "all" ||
    revisorFilter !== "all";

  return (
    <div className="min-h-screen bg-background">
      <AppHeader current="Projetos finalizados" />

      <main className="mx-auto max-w-[1440px] px-6 py-8">
        <div className="mb-6">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="mb-3 -ml-2 gap-1.5 text-muted-foreground"
          >
            <Link to="/juridico">
              <ArrowLeft className="size-4" /> Voltar para a Central Jurídica
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Archive className="size-5 text-muted-foreground" />
            <h1 className="text-2xl font-semibold tracking-tight">Projetos finalizados</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Histórico de projetos já analisados pelo MCTI. Nenhum item aqui exige ação.
          </p>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
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
          {anyFilter && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 text-muted-foreground"
              onClick={() => {
                setQ("");
                setYearFilter("all");
                setQuarterFilter("all");
                setAreaFilter("all");
                setFilialFilter("all");
                setRelatorFilter("all");
                setRevisorFilter("all");
              }}
            >
              Limpar filtros
            </Button>
          )}
          <div className="ml-auto text-xs text-muted-foreground">{filtered.length} projetos</div>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-surface opacity-90">
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-muted hover:bg-surface-muted">
                <TableHead className="w-[130px]">Trimestre</TableHead>
                <TableHead className="w-[28%]">Projeto</TableHead>
                <TableHead>Área</TableHead>
                <TableHead>Relator</TableHead>
                <TableHead>Revisor</TableHead>
                <TableHead className="w-[160px]">Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-sm text-muted-foreground">
                    Nenhum projeto finalizado encontrado com os filtros atuais.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((p) => (
                <TableRow
                  key={p.id}
                  className="group cursor-pointer"
                  onClick={() => navigate({ to: "/juridico/projetos/$id", params: { id: p.id } })}
                >
                  <TableCell className="py-3 text-sm tabular-nums text-muted-foreground">
                    {quarterLabel(p.updatedAt)}
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="font-medium text-foreground">{p.name}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">Finalizado</div>
                  </TableCell>
                  <TableCell className="py-3 text-sm text-muted-foreground">{p.area}</TableCell>
                  <TableCell className="py-3 text-sm text-muted-foreground">
                    {p.responsible}
                  </TableCell>
                  <TableCell className="py-3 text-sm text-muted-foreground">
                    {p.reviewedBy ?? "—"}
                  </TableCell>
                  <TableCell className="py-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                        LEGAL_STATUS_BADGE_CLASS[p.legalStatus!],
                      )}
                    >
                      {LEGAL_STATUS_LABEL[p.legalStatus!]}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    <ChevronRight className="ml-auto size-4 text-muted-foreground/50 transition-colors group-hover:text-primary" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
}
