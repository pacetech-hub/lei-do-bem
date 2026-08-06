import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { ProjectsList } from "@/components/projects-list";

export const Route = createFileRoute("/financeiro")({
  head: () => ({
    meta: [
      { title: "Projetos — Financeiro | Lei do Bem" },
      { name: "description", content: "Acompanhamento financeiro dos projetos do seu setor." },
    ],
  }),
  component: FinanceiroPage,
});

function FinanceiroPage() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader current="Financeiro" />
      <ProjectsList
        title="Meus Projetos"
        description="Acompanhe as despesas dos projetos do seu setor."
        scopedFilial="Matriz — São Paulo/SP"
        scopedSetor="Pesquisa & Desenvolvimento"
        variant="financeiro"
      />
    </div>
  );
}
