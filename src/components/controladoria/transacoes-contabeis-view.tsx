import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { NotaFiscalDetalhe } from "@/lib/nota-fiscal";

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function TransacoesContabeisView({
  nota,
  iniciativaId,
}: {
  nota: NotaFiscalDetalhe;
  iniciativaId: string;
}) {
  return (
    <main className="mx-auto max-w-[1000px] px-6 py-8">
      <Link
        to="/controladoria/iniciativas/$id/notas-fiscais/$despesaId"
        params={{ id: iniciativaId, despesaId: nota.despesaId }}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Voltar para a nota fiscal
      </Link>

      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Transações contábeis
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Nota fiscal nº {nota.numero}/{nota.serie} — {nota.fornecedorNome}. Uma mesma nota fiscal
          pode gerar mais de uma transação contábil, direcionadas a contas diferentes.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <Table>
          <TableHeader>
            <TableRow className="bg-surface-muted hover:bg-surface-muted">
              <TableHead>Transação</TableHead>
              <TableHead>SEC</TableHead>
              <TableHead>Centro</TableHead>
              <TableHead>DC</TableHead>
              <TableHead>Conta contábil</TableHead>
              <TableHead>Histórico</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {nota.transacoes.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-mono text-xs">{t.transacao}</TableCell>
                <TableCell className="font-mono text-xs">{t.sec}</TableCell>
                <TableCell className="font-mono text-xs">{t.centro}</TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "inline-flex size-6 items-center justify-center rounded-full text-xs font-semibold",
                      t.dc === "C"
                        ? "bg-status-ready text-status-ready-fg"
                        : "bg-status-adjust text-status-adjust-fg",
                    )}
                  >
                    {t.dc}
                  </span>
                </TableCell>
                <TableCell className="whitespace-nowrap font-mono text-xs">
                  {t.contaContabil} — {t.descricaoConta}
                </TableCell>
                <TableCell className="min-w-[260px] text-sm">{t.historico}</TableCell>
                <TableCell className="text-right tabular-nums font-medium">
                  {brl(t.valor)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}
