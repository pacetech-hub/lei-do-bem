import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { ProjectsList } from "@/components/projects-list";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Iniciativas — Relator | Lei do Bem" },
      {
        name: "description",
        content: "Iniciativas de inovação sob sua responsabilidade como Relator.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader current="Minhas Iniciativas" role="relator" />
      <ProjectsList
        title="Minhas Iniciativas"
        description="Acompanhe o preenchimento e o andamento das suas iniciativas da Lei do Bem."
        showNewButton
        scopedFilial="Matriz — São Paulo/SP"
        scopedSetor="Pesquisa & Desenvolvimento"
        variant="relator"
      />
    </div>
  );
}
