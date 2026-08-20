import { useMemo } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { AppHeader } from "@/components/app-header";
import { MasterProjectView } from "@/components/master-project-view";
import { ProjectFicha } from "@/components/project-ficha";
import { Button } from "@/components/ui/button";
import { useProjectsStore } from "@/lib/store";

export const Route = createFileRoute("/juridico/projetos/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Jurídico — Projeto ${params.id.slice(0, 6)} — Lei do Bem` },
      { name: "description", content: "Central de análise e acompanhamento jurídico do projeto." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: JuridicoProjetoPage,
});

function JuridicoProjetoPage() {
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

  // Um Projeto Mestre é apenas um agrupador lógico (sem formulário, despesas
  // ou aprovação própria) — a visão consolidada depende do status dos
  // dependentes, não do legalStatus do próprio Mestre, então não passa pelo
  // mesmo bloqueio de "ainda não chegou ao Jurídico".
  if (project.projectType === "mestre") {
    return <MasterProjectView project={project} dependents={dependents} mode="juridico" />;
  }

  if (!project.legalStatus) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader current={project.name} role="juridico" />
        <main className="mx-auto max-w-xl px-6 py-16 text-center">
          <h1 className="text-lg font-semibold text-foreground">
            Este projeto ainda não chegou ao Jurídico
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            O projeto precisa ser revisado e encaminhado pelo Revisor Técnico antes de aparecer na
            Central Jurídica.
          </p>
          <Button asChild variant="outline" className="mt-6 gap-2">
            <Link to="/juridico">
              <ArrowLeft className="size-4" /> Voltar para a Central Jurídica
            </Link>
          </Button>
        </main>
      </div>
    );
  }

  return <ProjectFicha project={project} mode="juridico" masterProject={masterProject} />;
}
