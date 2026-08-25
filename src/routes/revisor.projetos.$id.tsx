import { createFileRoute, notFound } from "@tanstack/react-router";

import { ProjectFicha } from "@/components/project-ficha";
import { useProjectsStore } from "@/lib/store";

export const Route = createFileRoute("/revisor/projetos/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Revisão — Projeto ${params.id.slice(0, 6)} — Lei do Bem` },
      { name: "description", content: "Revisão técnica da ficha do projeto de inovação." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RevisorProjetoPage,
});

function RevisorProjetoPage() {
  const { id } = Route.useParams();
  const project = useProjectsStore((s) => s.projects.find((p) => p.id === id));

  // O conceito de Projeto Mestre/Dependente não existe para o Revisor — ele
  // nunca acessa um projeto mestre, então essa URL simplesmente não existe.
  if (!project || project.projectType === "mestre") {
    throw notFound();
  }

  return <ProjectFicha project={project} mode="revisor" />;
}
