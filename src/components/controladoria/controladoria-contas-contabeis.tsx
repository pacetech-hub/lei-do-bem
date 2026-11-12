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

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const CONTAS = [
  { key: "pessoal", label: "Despesas com Pessoal (Funcionários)" },
  { key: "terceiros", label: "Serviços de Terceiros" },
  { key: "materiais", label: "Materiais" },
] as const;

export function ControladoriaContasContabeis() {
  const projects = useProjectsStore((s) => s.projects);
  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;

  // Consulta do exercício anterior: consolidado a partir das iniciativas já
  // finalizadas (encaminhadas ao Jurídico) com execução no ano anterior.
  const consolidated = projects.filter(
    (p) =>
      p.controladoriaStatus === "enviada_juridico" &&
      new Date(p.startDate).getFullYear() === previousYear,
  );

  const totals = {
    pessoal: 0,
    terceiros: consolidated.reduce(
      (sum, p) =>
        sum +
        p.thirdParties.reduce(
          (s, t) => (decisionFor(p, t.id)?.status === "excluida" ? s : s + t.usedInProject),
          0,
        ),
      0,
    ),
    materiais: consolidated.reduce(
      (sum, p) =>
        sum +
        p.materials.reduce(
          (s, m) => (decisionFor(p, m.id)?.status === "excluida" ? s : s + m.netValue),
          0,
        ),
      0,
    ),
  };
  // Funcionários não têm valor em R$ no modelo atual — exibido como
  // "não aplicável" em vez de inventar uma conversão hora→valor.
  const totalGeral = totals.terceiros + totals.materiais;

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
          Exercício {currentYear} — aguardando consolidação
        </h2>
        <div className="rounded-lg border border-dashed border-border bg-surface-muted/40 p-8 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-surface-muted">
            <Hourglass className="size-5 text-muted-foreground" />
          </div>
          <p className="mt-4 text-sm font-medium text-foreground">
            Os dados contábeis do exercício atual ainda não estão disponíveis.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Eles serão disponibilizados automaticamente pelo sistema assim que o Jurídico aprovar e
            consolidar os projetos deste exercício. Não é possível preenchê-los manualmente.
          </p>
          <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
            <Bell className="size-3.5" /> Você será notificado quando novos dados estiverem
            disponíveis.
          </div>
        </div>
      </section>
    </main>
  );
}
