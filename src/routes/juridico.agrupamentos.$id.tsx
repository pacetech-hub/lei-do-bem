import { createFileRoute, notFound } from "@tanstack/react-router";
import { useProjectsStore } from "@/lib/store";
import { JuridicoAgrupamentoForm } from "@/components/juridico/juridico-agrupamento-form";

export const Route = createFileRoute("/juridico/agrupamentos/$id")({
  head: ({ params }) => ({
    meta: [{ title: `Agrupamento ${params.id.slice(0, 6)} — Jurídico | Lei do Bem` }],
  }),
  component: AgrupamentoPage,
});

function AgrupamentoPage() {
  const { id } = Route.useParams();
  const agrupamento = useProjectsStore((s) => s.agrupamentos.find((a) => a.id === id));

  if (!agrupamento) {
    throw notFound();
  }

  return <JuridicoAgrupamentoForm agrupamentoId={id} />;
}
