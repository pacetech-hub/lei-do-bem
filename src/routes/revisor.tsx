import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { ProjectsList } from "@/components/projects-list";

export const Route = createFileRoute("/revisor")({
  head: () => ({
    meta: [
      { title: "Projetos — Revisor | Lei do Bem" },
      { name: "description", content: "Revisão técnica dos projetos do seu setor." },
    ],
  }),
  component: RevisorPage,
});

function RevisorPage() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader current="Revisor" />
      <ProjectsList
        title="Projetos — Revisor"
        description="Analise a ficha técnica dos projetos do seu setor."
        scopedFilial="Filial Campinas/SP"
        scopedSetor="Engenharia de Produto"
      />
    </div>
  );
}
