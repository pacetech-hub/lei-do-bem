import { createFileRoute } from "@tanstack/react-router";
import { ControladoriaValores } from "@/components/controladoria/controladoria-valores";

export const Route = createFileRoute("/controladoria/valores")({
  head: () => ({
    meta: [
      { title: "Valores — Controladoria | Lei do Bem" },
      {
        name: "description",
        content: "Resumo dos créditos, histórico de valores e lançamento contábil da Lei do Bem.",
      },
    ],
  }),
  component: ControladoriaValores,
});
