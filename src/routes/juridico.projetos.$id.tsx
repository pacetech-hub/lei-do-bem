import { createFileRoute, notFound } from "@tanstack/react-router";
import { useProjectsStore } from "@/lib/store";
import { JuridicoProjetoElaboracao } from "@/components/juridico/juridico-projeto-elaboracao";

export const Route = createFileRoute("/juridico/projetos/$id")({
  head: ({ params }) => ({
    meta: [{ title: `Projeto ${params.id.slice(0, 6)} — Jurídico | Lei do Bem` }],
  }),
  component: ProjetoPage,
});

function ProjetoPage() {
  const { id } = Route.useParams();
  const projeto = useProjectsStore((s) => s.juridicoProjetos.find((p) => p.id === id));

  if (!projeto) {
    throw notFound();
  }

  return <JuridicoProjetoElaboracao projeto={projeto} />;
}
