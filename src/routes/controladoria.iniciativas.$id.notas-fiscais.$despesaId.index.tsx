import { createFileRoute, notFound } from "@tanstack/react-router";

import { NotaFiscalView } from "@/components/controladoria/nota-fiscal-view";
import { gerarNotaFiscal } from "@/lib/nota-fiscal";
import { useProjectsStore } from "@/lib/store";

export const Route = createFileRoute("/controladoria/iniciativas/$id/notas-fiscais/$despesaId/")({
  head: () => ({
    meta: [
      { title: "Nota fiscal — Controladoria | Lei do Bem" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NotaFiscalPage,
});

function NotaFiscalPage() {
  const { id, despesaId } = Route.useParams();
  const project = useProjectsStore((s) => s.projects.find((p) => p.id === id));
  const nota = project ? gerarNotaFiscal(project, despesaId) : undefined;

  if (!project || !nota) {
    throw notFound();
  }

  return <NotaFiscalView nota={nota} iniciativaId={id} />;
}
