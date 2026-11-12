import { createFileRoute, notFound } from "@tanstack/react-router";
import { useProjectsStore } from "@/lib/store";
import { JuridicoIniciativaFicha } from "@/components/juridico/juridico-iniciativa-ficha";

export const Route = createFileRoute("/juridico/iniciativas/$id")({
  head: ({ params }) => ({
    meta: [{ title: `Iniciativa ${params.id.slice(0, 6)} — Jurídico | Lei do Bem` }],
  }),
  component: IniciativaPage,
});

function IniciativaPage() {
  const { id } = Route.useParams();
  const project = useProjectsStore((s) => s.projects.find((p) => p.id === id));

  // Só iniciativas já encaminhadas ao Jurídico pela Controladoria têm ficha
  // aqui.
  if (!project || project.controladoriaStatus !== "enviada_juridico") {
    throw notFound();
  }

  return <JuridicoIniciativaFicha project={project} />;
}
