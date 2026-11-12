import { createFileRoute } from "@tanstack/react-router";
import { ControladoriaContasContabeis } from "@/components/controladoria/controladoria-contas-contabeis";

export const Route = createFileRoute("/controladoria/contas-contabeis")({
  head: () => ({
    meta: [
      { title: "Contas contábeis — Controladoria | Lei do Bem" },
      {
        name: "description",
        content: "Classificação contábil consolidada das despesas, por exercício.",
      },
    ],
  }),
  component: ControladoriaContasContabeis,
});
