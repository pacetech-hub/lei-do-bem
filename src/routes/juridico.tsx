import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { ProjectsList } from "@/components/projects-list";

export const Route = createFileRoute("/juridico")({
  head: () => ({
    meta: [
      { title: "Projetos — Jurídico | Lei do Bem" },
      { name: "description", content: "Análise jurídica dos projetos de todas as áreas da empresa." },
    ],
  }),
  component: JuridicoPage,
});

function JuridicoPage() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <ProjectsList
        title="Projetos — Jurídico"
        description="Analise a conformidade regulatória e contratual dos projetos de todas as filiais e setores."
        paginated
        pageSize={10}
      />
    </div>
  );
}
