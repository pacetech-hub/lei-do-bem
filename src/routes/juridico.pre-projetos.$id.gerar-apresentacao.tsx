import { createFileRoute, notFound } from "@tanstack/react-router";
import { useProjectsStore } from "@/lib/store";
import { JuridicoGerarApresentacao } from "@/components/juridico/juridico-gerar-apresentacao";

export const Route = createFileRoute("/juridico/pre-projetos/$id/gerar-apresentacao")({
  head: ({ params }) => ({
    meta: [{ title: `Gerar apresentação — Pré-projeto ${params.id.slice(0, 6)} | Lei do Bem` }],
  }),
  component: GerarApresentacaoPage,
});

function GerarApresentacaoPage() {
  const { id } = Route.useParams();
  const preProjeto = useProjectsStore((s) => s.preProjetos.find((p) => p.id === id));

  if (!preProjeto) {
    throw notFound();
  }

  return <JuridicoGerarApresentacao preProjeto={preProjeto} />;
}
