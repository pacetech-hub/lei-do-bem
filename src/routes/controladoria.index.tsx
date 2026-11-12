import { createFileRoute } from "@tanstack/react-router";
import { LayoutList, Calculator } from "lucide-react";
import { RoleStubIndex } from "@/components/role-stub";

export const Route = createFileRoute("/controladoria/")({
  head: () => ({
    meta: [
      { title: "Controladoria | Lei do Bem" },
      {
        name: "description",
        content: "Análise financeira das iniciativas recebidas do Revisor.",
      },
    ],
  }),
  component: ControladoriaPage,
});

function ControladoriaPage() {
  return (
    <RoleStubIndex
      role="controladoria"
      roleLabel="Controladoria"
      description="Acompanhe as iniciativas recebidas do Revisor e consulte a classificação contábil das despesas."
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
      ]}
    />
  );
}
