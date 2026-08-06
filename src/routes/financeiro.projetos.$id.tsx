import { useMemo } from "react";
import { createFileRoute, notFound } from "@tanstack/react-router";

import { MasterProjectView } from "@/components/master-project-view";
import { ProjectFicha } from "@/components/project-ficha";
import { useProjectsStore } from "@/lib/store";

export const Route = createFileRoute("/financeiro/projetos/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Financeiro — Projeto ${params.id.slice(0, 6)} — Lei do Bem` },
      {
        name: "description",
        content: "Acompanhamento financeiro da ficha do projeto de inovação.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FinanceiroProjetoPage,
});

function FinanceiroProjetoPage() {
  const { id } = Route.useParams();
  const project = useProjectsStore((s) => s.projects.find((p) => p.id === id));
  const allProjects = useProjectsStore((s) => s.projects);

  if (!project) {
    throw notFound();
  }

  const dependents = useMemo(
    () => allProjects.filter((p) => p.masterProjectId === project.id),
    [allProjects, project],
  );
  const masterProject = project.masterProjectId
    ? allProjects.find((p) => p.id === project.masterProjectId)
    : undefined;

  if (project.projectType === "mestre") {
    return <MasterProjectView project={project} dependents={dependents} mode="financeiro" />;
  }

  return <ProjectFicha project={project} mode="financeiro" masterProject={masterProject} />;
}
