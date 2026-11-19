import { useState } from "react";
import { History } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import type { JuridicoHistoryEvent } from "@/lib/types";

interface JuridicoHistoryDrawerProps {
  events: JuridicoHistoryEvent[];
  title: string;
  description: string;
  triggerLabel: string;
}

// Mesmo padrão do ProjectHistoryDrawer usado pelo Relator (ver
// project-history-drawer.tsx): acesso discreto a uma trilha de auditoria,
// aberta num drawer lateral — reaproveitado aqui para o histórico do
// pré-projeto no Jurídico, incluindo as alterações campo a campo (valor
// anterior/novo valor) quando o evento registra uma edição de dados.
export function JuridicoHistoryDrawer({
  events,
  title,
  description,
  triggerLabel,
}: JuridicoHistoryDrawerProps) {
  const [open, setOpen] = useState(false);
  const sorted = [...events].sort((a, b) => +new Date(b.date) - +new Date(a.date));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
      >
        <History className="size-3.5" /> {triggerLabel}
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <History className="size-4 text-muted-foreground" /> {title}
            </SheetTitle>
            <SheetDescription>{description}</SheetDescription>
          </SheetHeader>

          <div className="mt-4 space-y-3 px-4">
            {sorted.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum evento registrado ainda.</p>
            ) : (
              sorted.map((ev) => {
                const date = new Date(ev.date);
                return (
                  <div
                    key={ev.id}
                    className="rounded-lg border border-border bg-surface p-3 text-sm"
                  >
                    <div>
                      <span className="font-medium text-foreground">{ev.actor}</span>{" "}
                      <span className="text-foreground">{ev.description}</span>{" "}
                      <span className="text-muted-foreground">
                        em {format(date, "dd/MM/yyyy", { locale: ptBR })} às{" "}
                        {format(date, "HH:mm", { locale: ptBR })}.
                      </span>
                    </div>
                    {ev.alteracoes && ev.alteracoes.length > 0 && (
                      <dl className="mt-2 space-y-2 border-t border-border pt-2">
                        {ev.alteracoes.map((alt, i) => (
                          <div key={i}>
                            <dt className="text-xs font-medium text-foreground">{alt.campo}</dt>
                            <dd className="mt-0.5 text-xs text-muted-foreground">
                              Valor anterior:{" "}
                              <span className="text-foreground">{alt.valorAnterior}</span>
                            </dd>
                            <dd className="text-xs text-muted-foreground">
                              Novo valor: <span className="text-foreground">{alt.novoValor}</span>
                            </dd>
                          </div>
                        ))}
                      </dl>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
