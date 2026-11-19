import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowUpDown, ChevronRight, Eye, Sparkles, Users } from "lucide-react";
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
import {
  diretoriasDoAgrupamento,
  gerarSugestoesAgrupamento,
  iniciativaValor,
  iniciativasNaoAgrupadas,
  iniciativasRecebidas,
  valorTotalIniciativas,
} from "@/lib/juridico";
import { AREAS } from "@/lib/types";

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (iso: string) => format(new Date(iso), "dd/MM/yyyy", { locale: ptBR });

type SortKey = "data" | "nome" | "valor";

export function JuridicoIniciativasList() {
  const projects = useProjectsStore((s) => s.projects);
  const agrupamentos = useProjectsStore((s) => s.agrupamentos);
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState("all");
  const [responsavelFilter, setResponsavelFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("data");

  const recebidas = useMemo(() => iniciativasRecebidas(projects), [projects]);
  const naoAgrupadas = useMemo(
    () => iniciativasNaoAgrupadas(projects, agrupamentos),
    [projects, agrupamentos],
  );
  const naoAgrupadasIds = useMemo(() => new Set(naoAgrupadas.map((p) => p.id)), [naoAgrupadas]);
  const sugestoes = useMemo(
    () => gerarSugestoesAgrupamento(projects, agrupamentos),
    [projects, agrupamentos],
  );

  // Listagem unificada: agrupamentos já existentes (manuais ou criados a
  // partir de uma sugestão da IA) e sugestões da IA ainda não revisadas —
  // cada card recebe a tag "Sugestão de IA" quando aplicável, sem que isso
  // apareça no título da seção (ver escopo do Jurídico, item 1).
  const agrupamentosExistentes = useMemo(
    () =>
      agrupamentos.map((a) => ({
        key: a.id,
        kind: "agrupamento" as const,
        name: a.name,
        resumo: a.resumo,
        iniciativaCount: a.iniciativaIds.length,
        diretorias: diretoriasDoAgrupamento(a.iniciativaIds, projects),
        valorTotal: valorTotalIniciativas(a.iniciativaIds, projects),
        aiSuggested: a.aiSuggested,
        id: a.id,
      })),
    [agrupamentos, projects],
  );
  const sugestoesCards = useMemo(
    () =>
      sugestoes.map((s) => ({
        key: s.id,
        kind: "sugestao" as const,
        name: s.name,
        resumo: s.resumo,
        iniciativaCount: s.iniciativaIds.length,
        diretorias: s.diretorias,
        valorTotal: s.valorTotal,
        aiSuggested: true,
        id: s.id,
      })),
    [sugestoes],
  );
  const todosOsAgrupamentos = useMemo(
    () => [...agrupamentosExistentes, ...sugestoesCards],
    [agrupamentosExistentes, sugestoesCards],
  );

  const responsaveis = useMemo(
    () => Array.from(new Set(recebidas.map((p) => p.responsible))).sort(),
    [recebidas],
  );
  const years = useMemo(
    () =>
      Array.from(new Set(recebidas.map((p) => new Date(p.startDate).getFullYear()))).sort(
        (a, b) => b - a,
      ),
    [recebidas],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = recebidas.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.answers.inov_3 ?? "").toLowerCase().includes(q);
      const matchesArea = areaFilter === "all" || p.area === areaFilter;
      const matchesResponsavel = responsavelFilter === "all" || p.responsible === responsavelFilter;
      const matchesYear =
        yearFilter === "all" || new Date(p.startDate).getFullYear().toString() === yearFilter;
      return matchesSearch && matchesArea && matchesResponsavel && matchesYear;
    });
    return list.sort((a, b) => {
      if (sortKey === "nome") return a.name.localeCompare(b.name, "pt-BR");
      if (sortKey === "valor") return iniciativaValor(b) - iniciativaValor(a);
      return +new Date(b.reviewedAt ?? b.updatedAt) - +new Date(a.reviewedAt ?? a.updatedAt);
    });
  }, [recebidas, search, areaFilter, responsavelFilter, yearFilter, sortKey]);

  return (
    <main className="mx-auto max-w-[1440px] px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Iniciativas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Iniciativas recebidas da Controladoria, disponíveis para identificar relações e organizar
          agrupamentos.
        </p>
      </div>

      {/* Agrupamentos — tanto os já existentes (manuais ou criados a partir de
          sugestões da IA) quanto as sugestões ainda não revisadas. A origem
          aparece como uma etiqueta no próprio card, não no título da seção. */}
      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-foreground">Agrupamentos</h2>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => navigate({ to: "/juridico/agrupamentos/novo" })}
          >
            <Users className="size-4" /> Criar agrupamento manualmente
          </Button>
        </div>
        {todosOsAgrupamentos.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-surface-muted/40 p-6 text-center text-sm text-muted-foreground">
            Nenhum agrupamento no momento. Sugestões aparecem aqui quando a IA identifica relações
            entre iniciativas ainda não agrupadas, e você também pode criar um manualmente.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {todosOsAgrupamentos.map((item) => (
              <div
                key={item.key}
                className="flex flex-col rounded-lg border border-border bg-surface p-5"
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-foreground">{item.name}</h3>
                  {item.aiSuggested && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                      <Sparkles className="size-3" /> Sugestão de IA
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{item.resumo}</p>
                <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <dt className="text-muted-foreground">Iniciativas relacionadas</dt>
                    <dd className="font-medium text-foreground">{item.iniciativaCount}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Valor financeiro total</dt>
                    <dd className="font-medium text-foreground">{brl(item.valorTotal)}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-muted-foreground">Diretorias envolvidas</dt>
                    <dd className="font-medium text-foreground">
                      {item.diretorias.join(", ") || "—"}
                    </dd>
                  </div>
                </dl>
                <Button
                  size="sm"
                  className="mt-4 gap-2"
                  onClick={() =>
                    item.kind === "agrupamento"
                      ? navigate({ to: "/juridico/agrupamentos/$id", params: { id: item.id } })
                      : navigate({
                          to: "/juridico/agrupamentos/novo",
                          search: { suggestion: item.id },
                        })
                  }
                >
                  <Eye className="size-4" />{" "}
                  {item.kind === "agrupamento" ? "Abrir" : "Visualizar e revisar"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Lista de iniciativas */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Todas as iniciativas</h2>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou palavra-chave…"
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
          <Select value={responsavelFilter} onValueChange={setResponsavelFilter}>
            <SelectTrigger className="h-9 w-[200px]">
              <SelectValue placeholder="Responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os responsáveis</SelectItem>
              {responsaveis.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
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
          <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
            <SelectTrigger className="h-9 w-[200px] gap-2">
              <ArrowUpDown className="size-3.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="data">Data de recebimento</SelectItem>
              <SelectItem value="nome">Nome</SelectItem>
              <SelectItem value="valor">Valor financeiro</SelectItem>
            </SelectContent>
          </Select>
          <div className="ml-auto text-xs text-muted-foreground">
            {filtered.length} de {recebidas.length} iniciativas
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-muted hover:bg-surface-muted">
                <TableHead className="w-[22%]">Iniciativa</TableHead>
                <TableHead>Diretoria</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead className="w-[70px]">Ano</TableHead>
                <TableHead className="w-[28%]">Resumo</TableHead>
                <TableHead className="text-right">Valor financeiro</TableHead>
                <TableHead>Recebida em</TableHead>
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
              {filtered.map((p) => (
                <TableRow
                  key={p.id}
                  className="group cursor-pointer"
                  onClick={() =>
                    navigate({ to: "/juridico/iniciativas/$id", params: { id: p.id } })
                  }
                >
                  <TableCell className="py-4 font-medium text-foreground">
                    {p.name}
                    {!naoAgrupadasIds.has(p.id) && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                        Agrupada
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="py-4 text-sm text-muted-foreground">{p.area}</TableCell>
                  <TableCell className="py-4 text-sm text-muted-foreground">
                    {p.responsible}
                  </TableCell>
                  <TableCell className="py-4 text-sm tabular-nums text-muted-foreground">
                    {new Date(p.startDate).getFullYear()}
                  </TableCell>
                  <TableCell className="py-4 text-sm text-muted-foreground">
                    <span className="line-clamp-2">{p.answers.inov_3?.trim() || "—"}</span>
                  </TableCell>
                  <TableCell className="py-4 text-right text-sm tabular-nums font-medium">
                    {brl(iniciativaValor(p))}
                  </TableCell>
                  <TableCell className="py-4 text-sm text-muted-foreground">
                    {p.reviewedAt ? fmtDate(p.reviewedAt) : "—"}
                  </TableCell>
                  <TableCell className="py-4 text-right">
                    <ChevronRight className="ml-auto size-4 text-muted-foreground/50 transition-colors group-hover:text-primary" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </main>
  );
}
