import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
import { diretoriasDoAgrupamento, valorTotalIniciativas } from "@/lib/juridico";
import { PreProjetoStatusBadge } from "@/components/juridico/juridico-status-badge";
import { AREAS } from "@/lib/types";

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (iso: string) => format(new Date(iso), "dd/MM/yyyy", { locale: ptBR });

export function JuridicoPreProjetosList() {
  const preProjetos = useProjectsStore((s) => s.preProjetos);
  const agrupamentos = useProjectsStore((s) => s.agrupamentos);
  const projects = useProjectsStore((s) => s.projects);
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");

  const rows = useMemo(
    () =>
      preProjetos.map((pp) => {
        const agrupamento = agrupamentos.find((a) => a.id === pp.agrupamentoId);
        const iniciativaIds = agrupamento?.iniciativaIds ?? [];
        return {
          preProjeto: pp,
          diretorias: diretoriasDoAgrupamento(iniciativaIds, projects),
          quantidade: iniciativaIds.length,
          valorTotal: valorTotalIniciativas(iniciativaIds, projects),
        };
      }),
    [preProjetos, agrupamentos, projects],
  );

  const years = useMemo(
    () => Array.from(new Set(preProjetos.map((p) => p.ano))).sort((a, b) => b - a),
    [preProjetos],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows
      .filter((r) => !q || r.preProjeto.name.toLowerCase().includes(q))
      .filter((r) => areaFilter === "all" || r.diretorias.includes(areaFilter))
      .filter((r) => yearFilter === "all" || r.preProjeto.ano.toString() === yearFilter)
      .sort((a, b) => +new Date(b.preProjeto.createdAt) - +new Date(a.preProjeto.createdAt));
  }, [rows, search, areaFilter, yearFilter]);

  return (
    <main className="mx-auto max-w-[1440px] px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Pré-projetos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Agrupamentos consolidados para apresentação e avaliação do comitê.
        </p>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome…"
          className="h-9 w-[260px]"
        />
        <Select value={areaFilter} onValueChange={setAreaFilter}>
          <SelectTrigger className="h-9 w-[200px]">
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
          <SelectTrigger className="h-9 w-[120px]">
            <SelectValue placeholder="Ano" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os anos</SelectItem>
            {years.map((y) => (
              <SelectItem key={y} value={y.toString()}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto text-xs text-muted-foreground">
          {filtered.length} de {preProjetos.length} pré-projetos
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <Table>
          <TableHeader>
            <TableRow className="bg-surface-muted hover:bg-surface-muted">
              <TableHead className="w-[24%]">Pré-projeto</TableHead>
              <TableHead className="w-[26%]">Resumo</TableHead>
              <TableHead>Diretorias envolvidas</TableHead>
              <TableHead className="text-right">Iniciativas</TableHead>
              <TableHead className="text-right">Valor financeiro total</TableHead>
              <TableHead>Data de criação</TableHead>
              <TableHead className="w-[180px]">Situação</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-sm text-muted-foreground">
                  Nenhum pré-projeto encontrado com os filtros atuais.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((r) => (
              <TableRow
                key={r.preProjeto.id}
                className="group cursor-pointer"
                onClick={() =>
                  navigate({ to: "/juridico/pre-projetos/$id", params: { id: r.preProjeto.id } })
                }
              >
                <TableCell className="py-4 font-medium text-foreground">
                  {r.preProjeto.name}
                </TableCell>
                <TableCell className="py-4 text-sm text-muted-foreground">
                  <span className="line-clamp-2">{r.preProjeto.resumoExecutivo}</span>
                </TableCell>
                <TableCell className="py-4 text-sm text-muted-foreground">
                  {r.diretorias.join(", ") || "—"}
                </TableCell>
                <TableCell className="py-4 text-right text-sm tabular-nums">
                  {r.quantidade}
                </TableCell>
                <TableCell className="py-4 text-right text-sm tabular-nums font-medium">
                  {brl(r.valorTotal)}
                </TableCell>
                <TableCell className="py-4 text-sm text-muted-foreground">
                  {fmtDate(r.preProjeto.createdAt)}
                </TableCell>
                <TableCell className="py-4">
                  <PreProjetoStatusBadge status={r.preProjeto.status} />
                </TableCell>
                <TableCell className="py-4 text-right">
                  <ChevronRight className="ml-auto size-4 text-muted-foreground/50 transition-colors group-hover:text-primary" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}
