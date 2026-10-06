import { createFileRoute } from "@tanstack/react-router";
import { FolderKanban, GitFork, FileStack } from "lucide-react";
import { RoleStubIndex } from "@/components/role-stub";

export const Route = createFileRoute("/juridico/")({
  head: () => ({
    meta: [
      { title: "Jurídico | Lei do Bem" },
      { name: "description", content: "Estrutura do Jurídico — funcionalidades a definir." },
    ],
  }),
  component: JuridicoPage,
});

function JuridicoPage() {
  return (
    <RoleStubIndex
      role="juridico"
      roleLabel="Jurídico"
      description="Estrutura inicial do Jurídico. As funcionalidades de cada área serão definidas posteriormente."
      items={[
        {
          label: "Agrupamentos",
          description: "Agrupamento de projetos para submissão conjunta.",
          to: "/juridico/agrupamentos",
          icon: GitFork,
        },
        {
          label: "Pré-projetos",
          description: "Projetos encaminhados pelo Revisor, aguardando tratamento jurídico.",
          to: "/juridico/pre-projetos",
          icon: FileStack,
        },
        {
          label: "Projetos",
          description: "Projetos já formalizados pelo Jurídico.",
          to: "/juridico/projetos",
          icon: FolderKanban,
        },
      ]}
    />
  );
}
