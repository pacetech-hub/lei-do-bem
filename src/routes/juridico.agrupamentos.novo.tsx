import { createFileRoute } from "@tanstack/react-router";
import { JuridicoAgrupamentoForm } from "@/components/juridico/juridico-agrupamento-form";

interface NovoAgrupamentoSearch {
  suggestion?: string;
}

export const Route = createFileRoute("/juridico/agrupamentos/novo")({
  validateSearch: (search: Record<string, unknown>): NovoAgrupamentoSearch => ({
    suggestion: typeof search.suggestion === "string" ? search.suggestion : undefined,
  }),
  head: () => ({
    meta: [{ title: "Novo agrupamento — Jurídico | Lei do Bem" }],
  }),
  component: NovoAgrupamentoPage,
});

function NovoAgrupamentoPage() {
  const { suggestion } = Route.useSearch();
  return <JuridicoAgrupamentoForm suggestionId={suggestion} />;
}
