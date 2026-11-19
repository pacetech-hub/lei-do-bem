import { useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Eye, Plus, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useProjectsStore } from "@/lib/store";
import { diretoriasDoAgrupamento, valorTotalIniciativas } from "@/lib/juridico";

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Menu próprio para agrupamentos (ver escopo do Jurídico — separado de
// Iniciativas para que cada tela tenha um foco: lá, as iniciativas recebidas
// e seu status de agrupamento; aqui, a organização dos agrupamentos em si).
// A criação (manual ou a partir de uma sugestão da IA) é tratada no fluxo de
// escolha de "Novo agrupamento" (ver juridico-novo-agrupamento.tsx).
export function JuridicoAgrupamentosList() {
  const projects = useProjectsStore((s) => s.projects);
  const agrupamentos = useProjectsStore((s) => s.agrupamentos);
  const navigate = useNavigate();

  const cards = useMemo(
    () =>
      agrupamentos.map((a) => ({
        id: a.id,
        name: a.name,
        resumo: a.resumo,
        iniciativaCount: a.iniciativaIds.length,
        diretorias: diretoriasDoAgrupamento(a.iniciativaIds, projects),
        valorTotal: valorTotalIniciativas(a.iniciativaIds, projects),
        aiSuggested: a.aiSuggested,
      })),
    [agrupamentos, projects],
  );

  return (
    <main className="mx-auto max-w-[1440px] px-6 py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Agrupamentos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Conjuntos de iniciativas relacionadas, organizados para avaliação conjunta e
            transformação em pré-projeto.
          </p>
        </div>
        <Button className="gap-2" onClick={() => navigate({ to: "/juridico/agrupamentos/novo" })}>
          <Plus className="size-4" /> Novo agrupamento
        </Button>
      </div>

      {cards.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-surface-muted/40 p-6 text-center text-sm text-muted-foreground">
          Nenhum agrupamento criado ainda. Use "Novo agrupamento" para organizar iniciativas
          manualmente ou a partir de uma sugestão da IA.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((item) => (
            <div
              key={item.id}
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
                  navigate({ to: "/juridico/agrupamentos/$id", params: { id: item.id } })
                }
              >
                <Eye className="size-4" /> Abrir
              </Button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
