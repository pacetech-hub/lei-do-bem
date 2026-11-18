import { createFileRoute, notFound } from "@tanstack/react-router";

import { TransacoesContabeisView } from "@/components/controladoria/transacoes-contabeis-view";
import { gerarNotaFiscal } from "@/lib/nota-fiscal";
import { useProjectsStore } from "@/lib/store";

export const Route = createFileRoute(
  "/controladoria/iniciativas/$id/notas-fiscais/$despesaId/transacoes",
)({
  head: () => ({
    meta: [
      { title: "Transações contábeis — Controladoria | Lei do Bem" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TransacoesPage,
});

function TransacoesPage() {
  const { id, despesaId } = Route.useParams();
  const project = useProjectsStore((s) => s.projects.find((p) => p.id === id));
  const nota = project ? gerarNotaFiscal(project, despesaId) : undefined;

  if (!project || !nota) {
    throw notFound();
  }

  return <TransacoesContabeisView nota={nota} iniciativaId={id} />;
}
