import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { ProjectsList } from "@/components/projects-list";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Projetos — Relator | Lei do Bem" },
      {
        name: "description",
        content: "Projetos de inovação sob sua responsabilidade como Relator.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader current="Meus Projetos" role="relator" />
      <ProjectsList
        title="Meus Projetos"
        description="Acompanhe o preenchimento e o andamento dos seus projetos da Lei do Bem."
        showNewButton
        scopedFilial="Matriz — São Paulo/SP"
        scopedSetor="Pesquisa & Desenvolvimento"
        variant="relator"
      />
    </div>
  );
}
