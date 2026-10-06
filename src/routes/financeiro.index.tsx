import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { ProjectsList } from "@/components/projects-list";

export const Route = createFileRoute("/financeiro/")({
  head: () => ({
    meta: [
      { title: "Iniciativas — Financeiro | Lei do Bem" },
      {
        name: "description",
        content: "Acompanhamento financeiro das iniciativas da sua Diretoria.",
      },
    ],
  }),
  component: FinanceiroPage,
});

function FinanceiroPage() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader current="Financeiro" role="financeiro" />
      <ProjectsList
        title="Minhas Iniciativas"
        description="Acompanhe as despesas das iniciativas da sua Diretoria."
        scopedFilial="Matriz — São Paulo/SP"
        scopedSetor="Pesquisa & Desenvolvimento"
        variant="financeiro"
      />
    </div>
  );
}
