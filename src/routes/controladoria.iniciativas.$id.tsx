import { createFileRoute, notFound } from "@tanstack/react-router";

import { ControladoriaFicha } from "@/components/controladoria/controladoria-ficha";
import { useProjectsStore } from "@/lib/store";

export const Route = createFileRoute("/controladoria/iniciativas/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Análise — Iniciativa ${params.id.slice(0, 6)} — Lei do Bem` },
      { name: "description", content: "Análise financeira da Controladoria sobre a iniciativa." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ControladoriaIniciativaPage,
});

function ControladoriaIniciativaPage() {
  const { id } = Route.useParams();
  const project = useProjectsStore((s) => s.projects.find((p) => p.id === id));

  // Só iniciativas que já chegaram à Controladoria em algum momento têm essa
  // ficha de análise.
  if (!project || project.controladoriaStatus === undefined) {
    throw notFound();
  }

  return <ControladoriaFicha project={project} />;
}
