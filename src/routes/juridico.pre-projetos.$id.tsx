import { createFileRoute, notFound } from "@tanstack/react-router";
import { useProjectsStore } from "@/lib/store";
import { JuridicoPreProjetoApresentacao } from "@/components/juridico/juridico-pre-projeto-apresentacao";

export const Route = createFileRoute("/juridico/pre-projetos/$id")({
  head: ({ params }) => ({
    meta: [{ title: `Pré-projeto ${params.id.slice(0, 6)} — Jurídico | Lei do Bem` }],
  }),
  component: PreProjetoPage,
});

function PreProjetoPage() {
  const { id } = Route.useParams();
  const preProjeto = useProjectsStore((s) => s.preProjetos.find((p) => p.id === id));

  if (!preProjeto) {
    throw notFound();
  }

  return <JuridicoPreProjetoApresentacao preProjeto={preProjeto} />;
}
