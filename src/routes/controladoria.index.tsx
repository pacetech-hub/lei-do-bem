import { createFileRoute } from "@tanstack/react-router";
import { LayoutList, Calculator, Settings } from "lucide-react";
import { RoleStubIndex } from "@/components/role-stub";

export const Route = createFileRoute("/controladoria/")({
  head: () => ({
    meta: [
      { title: "Controladoria | Lei do Bem" },
      { name: "description", content: "Estrutura da Controladoria — funcionalidades a definir." },
    ],
  }),
  component: ControladoriaPage,
});

function ControladoriaPage() {
  return (
    <RoleStubIndex
      role="controladoria"
      roleLabel="Controladoria"
      description="Estrutura inicial da Controladoria. As funcionalidades de cada área serão definidas posteriormente."
      items={[
        {
          label: "Iniciativas",
          description: "Iniciativas encaminhadas pelo Revisor.",
          to: "/controladoria/iniciativas",
          icon: LayoutList,
        },
        {
          label: "Contas contábeis",
          description: "Classificação contábil das despesas.",
          to: "/controladoria/contas-contabeis",
          icon: Calculator,
        },
        {
          label: "Configurações",
          description: "Configurações da área de Controladoria.",
          to: "/controladoria/configuracoes",
          icon: Settings,
        },
      ]}
    />
  );
}
