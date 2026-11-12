import { Bell, Hourglass } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProjectsStore } from "@/lib/store";
import { decisionFor } from "@/lib/controladoria";
import type { Project } from "@/lib/types";

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const CONTAS = [
  { key: "pessoal", label: "Despesas com Pessoal (Funcionários)" },
  { key: "terceiros", label: "Serviços de Terceiros" },
  { key: "materiais", label: "Materiais" },
] as const;

// Soma terceiros+materiais (excluindo despesas marcadas como "excluída") de
// um conjunto de iniciativas — mesma regra usada no exercício anterior.
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

export function ControladoriaContasContabeis() {
  const projects = useProjectsStore((s) => s.projects);
  const juridicoProjetos = useProjectsStore((s) => s.juridicoProjetos);
  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;

  // Consulta do exercício anterior: consolidado a partir das iniciativas já
  // finalizadas (encaminhadas ao Jurídico) com execução no ano anterior.
  const consolidated = projects.filter(
    (p) =>
      p.controladoriaStatus === "enviada_juridico" &&
      new Date(p.startDate).getFullYear() === previousYear,
  );
  const totals = somarContas(consolidated);
  // Funcionários não têm valor em R$ no modelo atual — exibido como
  // "não aplicável" em vez de inventar uma conversão hora→valor.
  const totalGeral = totals.terceiros + totals.materiais;

  // Exercício atual: só fica disponível quando o Jurídico aprova (devolutiva
  // do MCTI) pelo menos um projeto com execução neste exercício — ver
  // regra importante nº 10 do escopo do Jurídico ("a aprovação do MCTI deve
  // disponibilizar automaticamente as informações financeiras para a
  // Controladoria"). Disponibilizado automaticamente, sem ação manual.
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
    <main className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Contas contábeis</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Classificação contábil consolidada das despesas das iniciativas, organizada por exercício.
      </p>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Exercício {previousYear} — consulta
        </h2>
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

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Exercício {currentYear}
          {projetosAprovadosAnoAtual.length === 0 && " — aguardando consolidação"}
        </h2>
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
    </main>
  );
}
