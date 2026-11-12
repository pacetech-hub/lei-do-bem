import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight, Clock3, Send, Undo2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { AppHeader } from "@/components/app-header";
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
import { valorTotalInformado } from "@/lib/controladoria";
import {
  CONTROLADORIA_STATUS_BADGE_CLASS,
  ControladoriaStatusBadge,
} from "@/components/controladoria/controladoria-status-badge";
import {
  AREAS,
  CONTROLADORIA_STATUS_LABEL,
  type ControladoriaStatus,
  type Project,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const INDICATORS: Array<{ key: ControladoriaStatus; icon: typeof Clock3 }> = [
  { key: "aguardando_analise", icon: Clock3 },
  { key: "devolvida_revisor", icon: Undo2 },
  { key: "enviada_juridico", icon: Send },
];

export function ControladoriaIniciativasList() {
  const projects = useProjectsStore((s) => s.projects);
  const [statusFilter, setStatusFilter] = useState<ControladoriaStatus | "all">("all");
  const [areaFilter, setAreaFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");

  // Toda iniciativa que já chegou pelo menos uma vez à Controladoria — mesmo
  // devolvida ao Revisor, ela continua aparecendo aqui com o status
  // "Devolvida ao Revisor" (ver tipo ControladoriaStatus em types.ts).
  const received = useMemo(
    () =>
      projects.filter(
        (p): p is Project & { controladoriaStatus: ControladoriaStatus } =>
          p.controladoriaStatus !== undefined,
      ),
    [projects],
  );

  const counts = useMemo(() => {
    const c: Record<ControladoriaStatus, number> = {
      aguardando_analise: 0,
      devolvida_revisor: 0,
      enviada_juridico: 0,
    };
    received.forEach((p) => {
      c[p.controladoriaStatus]++;
    });
    return c;
  }, [received]);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    received.forEach((p) => years.add(new Date(p.startDate).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [received]);

  const filtered = useMemo(() => {
    return received
      .filter((p) => statusFilter === "all" || p.controladoriaStatus === statusFilter)
      .filter((p) => areaFilter === "all" || p.area === areaFilter)
      .filter(
        (p) =>
          yearFilter === "all" || new Date(p.startDate).getFullYear().toString() === yearFilter,
      )
      .sort(
        (a, b) => +new Date(b.reviewedAt ?? b.updatedAt) - +new Date(a.reviewedAt ?? a.updatedAt),
      );
  }, [received, statusFilter, areaFilter, yearFilter]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader current="Iniciativas — Controladoria" role="controladoria" />
      <main className="mx-auto max-w-[1440px] px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Iniciativas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhe as iniciativas recebidas do Revisor e sua análise financeira.
          </p>
          {/* TESTE TEMPORÁRIO — remover depois de confirmar se o clique funciona */}
          <a
            href="https://www.google.com"
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-sm font-semibold text-primary underline"
          >
            LINK DE TESTE — clique aqui para ir ao Google
          </a>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {INDICATORS.map(({ key, icon: Icon }) => {
            const active = statusFilter === key;
            const highlight = key === "aguardando_analise";
            return (
              <button
                key={key}
                type="button"
                onClick={() => setStatusFilter(active ? "all" : key)}
                className={cn(
                  "group rounded-lg border bg-surface p-4 text-left transition-all hover:shadow-sm",
                  highlight ? "border-primary/40" : "border-border",
                  active && "ring-1 ring-primary/30",
                )}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div
                    className={cn(
                      "grid size-9 place-items-center rounded-md",
                      CONTROLADORIA_STATUS_BADGE_CLASS[key],
                    )}
                  >
                    <Icon className="size-4.5" />
                  </div>
                  {highlight && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                      Prioridade
                    </span>
                  )}
                </div>
                <div className="text-2xl font-semibold tabular-nums tracking-tight">
                  {counts[key]}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {CONTROLADORIA_STATUS_LABEL[key]}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as ControladoriaStatus | "all")}
          >
            <SelectTrigger className="h-9 w-[200px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {INDICATORS.map(({ key }) => (
                <SelectItem key={key} value={key}>
                  {CONTROLADORIA_STATUS_LABEL[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={areaFilter} onValueChange={setAreaFilter}>
            <SelectTrigger className="h-9 w-[220px]">
              <SelectValue placeholder="Diretoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as diretorias</SelectItem>
              {AREAS.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
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
          <div className="ml-auto text-xs text-muted-foreground">
            {filtered.length} de {received.length} iniciativas
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-muted hover:bg-surface-muted">
                <TableHead className="w-[28%]">Iniciativa</TableHead>
                <TableHead>Diretoria</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead className="w-[90px]">Ano</TableHead>
                <TableHead className="text-right">Valor total informado</TableHead>
                <TableHead>Data de recebimento</TableHead>
                <TableHead className="w-[170px]">Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-sm text-muted-foreground">
                    Nenhuma iniciativa encontrada com os filtros atuais.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((p, idx) => (
                <TableRow key={p.id} className="group">
                  <TableCell className="py-4 font-medium text-foreground">
                    {idx === 0 ? (
                      // TESTE TEMPORÁRIO — remover depois de confirmar se o clique funciona
                      <a
                        href="https://www.google.com"
                        target="_blank"
                        rel="noreferrer"
                        className="block text-primary underline"
                      >
                        [TESTE] {p.name}
                      </a>
                    ) : (
                      <Link
                        to="/controladoria/iniciativas/$id"
                        params={{ id: p.id }}
                        className="block hover:underline"
                      >
                        {p.name}
                      </Link>
                    )}
                  </TableCell>
                  <TableCell className="py-4 text-sm text-muted-foreground">{p.area}</TableCell>
                  <TableCell className="py-4 text-sm text-muted-foreground">
                    {p.responsible}
                  </TableCell>
                  <TableCell className="py-4 text-sm tabular-nums text-muted-foreground">
                    {new Date(p.startDate).getFullYear()}
                  </TableCell>
                  <TableCell className="py-4 text-right text-sm tabular-nums font-medium">
                    {brl(valorTotalInformado(p))}
                  </TableCell>
                  <TableCell className="py-4 text-sm text-muted-foreground">
                    {p.reviewedAt
                      ? format(new Date(p.reviewedAt), "dd/MM/yyyy", { locale: ptBR })
                      : "—"}
                  </TableCell>
                  <TableCell className="py-4">
                    <ControladoriaStatusBadge status={p.controladoriaStatus} />
                  </TableCell>
                  <TableCell className="py-4 text-right">
                    <Link
                      to="/controladoria/iniciativas/$id"
                      params={{ id: p.id }}
                      className="inline-flex items-center justify-end"
                      aria-label={`Abrir ${p.name}`}
                    >
                      <ChevronRight className="ml-auto size-4 text-muted-foreground/50 transition-colors group-hover:text-primary" />
                    </Link>
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
