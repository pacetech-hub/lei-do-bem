import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { ProjectsList } from "@/components/projects-list";

export const Route = createFileRoute("/revisor/")({
  head: () => ({
    meta: [
      { title: "Projetos — Revisor | Lei do Bem" },
      { name: "description", content: "Central de revisão dos projetos de inovação da empresa." },
    ],
  }),
  component: RevisorPage,
});

function RevisorPage() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader current="Revisor" role="revisor" />
      <ProjectsList
        title="Revisão de Projetos"
        description="Acompanhe os projetos de todas as áreas e filiais que aguardam sua análise técnica."
        variant="revisor"
        infoFilial="Matriz — São Paulo/SP"
        infoSetor="Pesquisa & Desenvolvimento"
      />
    </div>
  );
}
