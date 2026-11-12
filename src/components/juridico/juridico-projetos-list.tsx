import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronRight, FileWarning } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
import { diretoriasDoAgrupamento, valorTotalIniciativas } from "@/lib/juridico";
import { ProjetoStatusBadge } from "@/components/juridico/juridico-status-badge";
import { AREAS, PROJETO_STATUS_LABEL, type ProjetoStatus } from "@/lib/types";

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (iso: string) => format(new Date(iso), "dd/MM/yyyy", { locale: ptBR });

const STATUS_OPTIONS: ProjetoStatus[] = [
  "em_elaboracao",
  "aguardando_submissao",
  "submetido_mcti",
  "aprovado",
  "nao_aprovado",
];

export function JuridicoProjetosList() {
  const juridicoProjetos = useProjectsStore((s) => s.juridicoProjetos);
  const projects = useProjectsStore((s) => s.projects);
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<ProjetoStatus | "all">("all");

  const rows = useMemo(
    () =>
      juridicoProjetos.map((p) => ({
        projeto: p,
        diretorias: diretoriasDoAgrupamento(p.iniciativaIds, projects),
        valorTotal: valorTotalIniciativas(p.iniciativaIds, projects),
      })),
    [juridicoProjetos, projects],
  );

  const years = useMemo(
    () => Array.from(new Set(juridicoProjetos.map((p) => p.ano))).sort((a, b) => b - a),
    [juridicoProjetos],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows
      .filter(
        (r) =>
          !q ||
          r.projeto.name.toLowerCase().includes(q) ||
          r.projeto.identificacao.toLowerCase().includes(q),
      )
      .filter((r) => areaFilter === "all" || r.diretorias.includes(areaFilter))
      .filter((r) => yearFilter === "all" || r.projeto.ano.toString() === yearFilter)
      .filter((r) => statusFilter === "all" || r.projeto.status === statusFilter)
      .sort((a, b) => +new Date(b.projeto.createdAt) - +new Date(a.projeto.createdAt));
  }, [rows, search, areaFilter, yearFilter, statusFilter]);

  return (
    <main className="mx-auto max-w-[1440px] px-6 py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projetos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Projetos aprovados pelo comitê, em elaboração ou acompanhamento junto ao MCTI.
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => navigate({ to: "/juridico/projetos/devolutivas" })}
        >
          <FileWarning className="size-4" /> Devolutivas do MCTI
        </Button>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou identificação…"
          className="h-9 w-[260px]"
        />
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as ProjetoStatus | "all")}
        >
          <SelectTrigger className="h-9 w-[200px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {PROJETO_STATUS_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
          {filtered.length} de {juridicoProjetos.length} projetos
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <Table>
          <TableHeader>
            <TableRow className="bg-surface-muted hover:bg-surface-muted">
              <TableHead className="w-[26%]">Projeto</TableHead>
              <TableHead>Identificação</TableHead>
              <TableHead>Diretorias envolvidas</TableHead>
              <TableHead className="text-right">Valor financeiro total</TableHead>
              <TableHead>Data de aprovação</TableHead>
              <TableHead className="w-[180px]">Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-sm text-muted-foreground">
                  Nenhum projeto encontrado com os filtros atuais.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((r) => (
              <TableRow
                key={r.projeto.id}
                className="group cursor-pointer"
                onClick={() =>
                  navigate({ to: "/juridico/projetos/$id", params: { id: r.projeto.id } })
                }
              >
                <TableCell className="py-4 font-medium text-foreground">{r.projeto.name}</TableCell>
                <TableCell className="py-4 text-sm text-muted-foreground">
                  {r.projeto.identificacao}
                </TableCell>
                <TableCell className="py-4 text-sm text-muted-foreground">
                  {r.diretorias.join(", ") || "—"}
                </TableCell>
                <TableCell className="py-4 text-right text-sm tabular-nums font-medium">
                  {brl(r.valorTotal)}
                </TableCell>
                <TableCell className="py-4 text-sm text-muted-foreground">
                  {fmtDate(r.projeto.createdAt)}
                </TableCell>
                <TableCell className="py-4">
                  <ProjetoStatusBadge status={r.projeto.status} />
                </TableCell>
                <TableCell className="py-4 text-right">
                  <ChevronRight className="ml-auto size-4 text-muted-foreground/50 transition-colors group-hover:text-primary" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        <Link to="/juridico/projetos/devolutivas" className="underline underline-offset-2">
          Devolutivas do MCTI
        </Link>{" "}
        reúne o envio e a interpretação dos documentos oficiais de retorno do MCTI para os projetos
        submetidos.
      </p>
    </main>
  );
}
