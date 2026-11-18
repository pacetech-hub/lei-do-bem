import { useState } from "react";
import { Bell, ChevronDown, Hourglass } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useProjectsStore } from "@/lib/store";
import { decisionFor } from "@/lib/controladoria";
import { cn } from "@/lib/utils";
import type { Project } from "@/lib/types";
import {
  fmtCelula,
  HISTORICO_ANUAL,
  HISTORICO_ANUAL_TOTAL,
  HISTORICO_TRIMESTRAL_2026,
  LANCAMENTO_CONTABIL,
  RESUMO_CREDITOS,
} from "@/lib/valores";

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// --- 6.1 Resumo dos créditos -------------------------------------------------

function ResumoCreditosTab() {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface">
      <Table>
        <TableHeader>
          <TableRow className="bg-surface-muted hover:bg-surface-muted">
            <TableHead>RESUMO DOS CRÉDITOS</TableHead>
            <TableHead className="text-right">1º TRIMESTRE</TableHead>
            <TableHead className="text-right">2º TRIMESTRE</TableHead>
            <TableHead className="text-right">3º TRIMESTRE</TableHead>
            <TableHead className="text-right">TOTAL</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {RESUMO_CREDITOS.map((l) => (
            <TableRow
              key={l.label}
              className={cn(
                l.destaque === "total" && "bg-primary/10 hover:bg-primary/10",
                l.destaque === "beneficio" && "bg-status-ready/20 hover:bg-status-ready/20",
                l.destaque === "reducao" && "bg-status-review/20 hover:bg-status-review/20",
              )}
            >
              <TableCell
                className={cn(
                  "py-2.5",
                  l.destaque ? "font-semibold text-foreground" : "text-foreground",
                )}
              >
                {l.label}
              </TableCell>
              <TableCell className="py-2.5 text-right tabular-nums">
                {fmtCelula(l.t1, { percent: l.percentual })}
              </TableCell>
              <TableCell className="py-2.5 text-right tabular-nums">
                {fmtCelula(l.t2, { percent: l.percentual })}
              </TableCell>
              <TableCell className="py-2.5 text-right tabular-nums">
                {fmtCelula(l.t3, { percent: l.percentual })}
              </TableCell>
              <TableCell
                className={cn("py-2.5 text-right tabular-nums", l.destaque && "font-semibold")}
              >
                {fmtCelula(l.total, { percent: l.percentual })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// --- 6.2 Histórico de valores -------------------------------------------------

function HistoricoValoresTab() {
  const [anosAbertos, setAnosAbertos] = useState(false);

  return (
    <div className="space-y-8">
      <section>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Valores trimestrais de 2026</h3>
        <div className="overflow-x-auto rounded-lg border border-border bg-surface">
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-muted hover:bg-surface-muted">
                <TableHead>Ano</TableHead>
                <TableHead className="text-right">Produto</TableHead>
                <TableHead className="text-right">Industrial</TableHead>
                <TableHead className="text-right">TI</TableHead>
                <TableHead className="text-right">TOTAL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {HISTORICO_TRIMESTRAL_2026.map((l) => (
                <TableRow
                  key={l.periodo}
                  className={cn(l.destaque && "bg-primary/10 hover:bg-primary/10")}
                >
                  <TableCell className={cn("py-2.5", l.destaque && "font-semibold")}>
                    {l.periodo}
                  </TableCell>
                  <TableCell className="py-2.5 text-right tabular-nums">
                    {fmtCelula(l.produto)}
                  </TableCell>
                  <TableCell className="py-2.5 text-right tabular-nums">
                    {fmtCelula(l.industrial)}
                  </TableCell>
                  <TableCell className="py-2.5 text-right tabular-nums">
                    {fmtCelula(l.ti)}
                  </TableCell>
                  <TableCell
                    className={cn("py-2.5 text-right tabular-nums", l.destaque && "font-semibold")}
                  >
                    {fmtCelula(l.total)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          O 4º trimestre permanece sem valores consolidados até seu fechamento.
        </p>
      </section>

      <section>
        <Collapsible open={anosAbertos} onOpenChange={setAnosAbertos}>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="mb-3 flex w-full items-center gap-2 text-sm font-semibold text-foreground"
            >
              <ChevronDown
                className={cn("size-4 transition-transform", anosAbertos && "rotate-180")}
              />
              Histórico anual (anos anteriores)
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="overflow-x-auto rounded-lg border border-border bg-surface">
              <Table>
                <TableHeader>
                  <TableRow className="bg-surface-muted hover:bg-surface-muted">
                    <TableHead>Anos</TableHead>
                    <TableHead className="text-right">Pesquisa/Produto</TableHead>
                    <TableHead className="text-right">Industrial</TableHead>
                    <TableHead className="text-right">TI</TableHead>
                    <TableHead className="text-right">TOTAL</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {HISTORICO_ANUAL.map((l) => (
                    <TableRow key={l.ano}>
                      <TableCell className="py-2.5">{l.ano}</TableCell>
                      <TableCell className="py-2.5 text-right tabular-nums">
                        {fmtCelula(l.pesquisa)}
                      </TableCell>
                      <TableCell className="py-2.5 text-right tabular-nums">
                        {fmtCelula(l.industrial)}
                      </TableCell>
                      <TableCell className="py-2.5 text-right tabular-nums">
                        {fmtCelula(l.ti)}
                      </TableCell>
                      <TableCell className="py-2.5 text-right tabular-nums">
                        {fmtCelula(l.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-primary/10 hover:bg-primary/10">
                    <TableCell className="py-2.5 font-semibold">
                      {HISTORICO_ANUAL_TOTAL.ano}
                    </TableCell>
                    <TableCell className="py-2.5 text-right font-semibold tabular-nums">
                      {fmtCelula(HISTORICO_ANUAL_TOTAL.pesquisa)}
                    </TableCell>
                    <TableCell className="py-2.5 text-right font-semibold tabular-nums">
                      {fmtCelula(HISTORICO_ANUAL_TOTAL.industrial)}
                    </TableCell>
                    <TableCell className="py-2.5 text-right font-semibold tabular-nums">
                      {fmtCelula(HISTORICO_ANUAL_TOTAL.ti)}
                    </TableCell>
                    <TableCell className="py-2.5 text-right font-semibold tabular-nums">
                      {fmtCelula(HISTORICO_ANUAL_TOTAL.total)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </section>
    </div>
  );
}

// --- 6.3 Lançamento contábil --------------------------------------------------

function LancamentoContabilTab() {
  return (
    <div>
      <p className="mb-3 text-xs text-muted-foreground">
        Lançamentos detalhados do 3º trimestre de 2026, que compõem os valores consolidados nas
        demais abas.
      </p>
      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <Table>
          <TableHeader>
            <TableRow className="bg-surface-muted hover:bg-surface-muted">
              <TableHead className="min-w-[160px]">Descrição</TableHead>
              <TableHead className="min-w-[90px]">Conta</TableHead>
              <TableHead className="min-w-[70px]">CC</TableHead>
              <TableHead className="min-w-[380px]">Histórico</TableHead>
              <TableHead className="min-w-[140px] text-right">Débito</TableHead>
              <TableHead className="min-w-[140px] text-right">Crédito</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {LANCAMENTO_CONTABIL.map((l, idx) => (
              <TableRow
                key={idx}
                className={cn(
                  l.tipo === "subtotal" && "bg-surface-muted/70 hover:bg-surface-muted/70",
                  l.tipo === "total" && "bg-primary/10 hover:bg-primary/10",
                )}
              >
                <TableCell className={cn("py-2", l.tipo && "font-semibold text-foreground")}>
                  {l.descricao}
                </TableCell>
                <TableCell className="py-2 font-mono text-xs">{l.conta}</TableCell>
                <TableCell className="py-2 font-mono text-xs">{l.cc}</TableCell>
                <TableCell className="py-2 text-sm">{l.historico}</TableCell>
                <TableCell
                  className={cn("py-2 text-right tabular-nums", l.tipo && "font-semibold")}
                >
                  {brl(l.debito)}
                </TableCell>
                <TableCell className="py-2 text-right tabular-nums text-muted-foreground">
                  {l.credito !== null ? brl(l.credito) : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// --- Consolidação por projeto (área já existente antes desta etapa) ---------
// Mantida como aba própria para não perder a integração com a aprovação do
// Jurídico junto ao MCTI — ver regra importante nº 10 do escopo do Jurídico.

const CONTAS = [
  { key: "pessoal", label: "Despesas com Pessoal (Funcionários)" },
  { key: "terceiros", label: "Serviços de Terceiros" },
  { key: "materiais", label: "Materiais" },
] as const;

function somarContas(iniciativas: Project[]) {
  return {
    pessoal: 0,
    terceiros: iniciativas.reduce(
      (sum, p) =>
        sum +
        p.thirdParties.reduce(
          (s, t) => (decisionFor(p, t.id)?.status === "excluida" ? s : s + t.usedInProject),
          0,
        ),
      0,
    ),
    materiais: iniciativas.reduce(
      (sum, p) =>
        sum +
        p.materials.reduce(
          (s, m) => (decisionFor(p, m.id)?.status === "excluida" ? s : s + m.netValue),
          0,
        ),
      0,
    ),
  };
}

function ConsolidacaoPorProjetoTab() {
  const projects = useProjectsStore((s) => s.projects);
  const juridicoProjetos = useProjectsStore((s) => s.juridicoProjetos);
  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;

  const consolidated = projects.filter(
    (p) =>
      p.controladoriaStatus === "enviada_juridico" &&
      new Date(p.startDate).getFullYear() === previousYear,
  );
  const totals = somarContas(consolidated);
  const totalGeral = totals.terceiros + totals.materiais;

  const projetosAprovadosAnoAtual = juridicoProjetos.filter(
    (p) => p.status === "aprovado" && p.ano === currentYear,
  );
  const iniciativasAnoAtual = Array.from(
    new Set(projetosAprovadosAnoAtual.flatMap((p) => p.iniciativaIds)),
  )
    .map((id) => projects.find((p) => p.id === id))
    .filter((p): p is Project => !!p);
  const totalsAtual = somarContas(iniciativasAnoAtual);
  const totalGeralAtual = totalsAtual.terceiros + totalsAtual.materiais;

  return (
    <div>
      <p className="mb-6 text-sm text-muted-foreground">
        Classificação contábil consolidada das despesas das iniciativas, organizada por exercício.
      </p>

      <section className="mb-8">
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          Exercício {previousYear} — consulta
        </h3>
        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-muted hover:bg-surface-muted">
                <TableHead>Conta contábil</TableHead>
                <TableHead className="text-right">Valor consolidado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {CONTAS.map((c) => (
                <TableRow key={c.key}>
                  <TableCell className="py-3">{c.label}</TableCell>
                  <TableCell className="py-3 text-right tabular-nums">
                    {c.key === "pessoal" ? (
                      <span className="text-muted-foreground">Não aplicável</span>
                    ) : (
                      brl(totals[c.key])
                    )}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-surface-muted/50">
                <TableCell className="py-3 font-semibold">Total</TableCell>
                <TableCell className="py-3 text-right font-semibold tabular-nums">
                  {brl(totalGeral)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Consolidado a partir de {consolidated.length}{" "}
          {consolidated.length === 1 ? "iniciativa" : "iniciativas"} já encaminhada
          {consolidated.length === 1 ? "" : "s"} ao Jurídico com execução em {previousYear}.
        </p>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          Exercício {currentYear}
          {projetosAprovadosAnoAtual.length === 0 && " — aguardando consolidação"}
        </h3>
        {projetosAprovadosAnoAtual.length > 0 ? (
          <>
            <div className="overflow-hidden rounded-lg border border-border bg-surface">
              <Table>
                <TableHeader>
                  <TableRow className="bg-surface-muted hover:bg-surface-muted">
                    <TableHead>Conta contábil</TableHead>
                    <TableHead className="text-right">Valor consolidado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {CONTAS.map((c) => (
                    <TableRow key={c.key}>
                      <TableCell className="py-3">{c.label}</TableCell>
                      <TableCell className="py-3 text-right tabular-nums">
                        {c.key === "pessoal" ? (
                          <span className="text-muted-foreground">Não aplicável</span>
                        ) : (
                          brl(totalsAtual[c.key])
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-surface-muted/50">
                    <TableCell className="py-3 font-semibold">Total</TableCell>
                    <TableCell className="py-3 text-right font-semibold tabular-nums">
                      {brl(totalGeralAtual)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Disponibilizado automaticamente a partir de {projetosAprovadosAnoAtual.length}{" "}
              {projetosAprovadosAnoAtual.length === 1 ? "projeto aprovado" : "projetos aprovados"}{" "}
              pelo MCTI com execução em {currentYear}.
            </p>
          </>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-surface-muted/40 p-8 text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-surface-muted">
              <Hourglass className="size-5 text-muted-foreground" />
            </div>
            <p className="mt-4 text-sm font-medium text-foreground">
              Os dados contábeis do exercício atual ainda não estão disponíveis.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Eles serão disponibilizados automaticamente pelo sistema assim que o Jurídico aprovar
              e consolidar os projetos deste exercício. Não é possível preenchê-los manualmente.
            </p>
            <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
              <Bell className="size-3.5" /> Você será notificado quando novos dados estiverem
              disponíveis.
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export function ControladoriaValores() {
  return (
    <main className="mx-auto max-w-[1200px] px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Valores</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Créditos da Lei do Bem apurados, histórico de valores e lançamentos contábeis detalhados.
        </p>
      </div>

      <Tabs defaultValue="resumo">
        <TabsList className="mb-6 flex-wrap">
          <TabsTrigger value="resumo">Resumo dos créditos</TabsTrigger>
          <TabsTrigger value="historico">Histórico de valores</TabsTrigger>
          <TabsTrigger value="lancamento">Lançamento contábil</TabsTrigger>
          <TabsTrigger value="consolidacao">Consolidação por projeto</TabsTrigger>
        </TabsList>
        <TabsContent value="resumo">
          <ResumoCreditosTab />
        </TabsContent>
        <TabsContent value="historico">
          <HistoricoValoresTab />
        </TabsContent>
        <TabsContent value="lancamento">
          <LancamentoContabilTab />
        </TabsContent>
        <TabsContent value="consolidacao">
          <ConsolidacaoPorProjetoTab />
        </TabsContent>
      </Tabs>
    </main>
  );
}
