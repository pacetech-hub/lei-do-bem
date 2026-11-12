import { createFileRoute } from "@tanstack/react-router";
import { ControladoriaIniciativasList } from "@/components/controladoria/controladoria-iniciativas-list";

export const Route = createFileRoute("/controladoria/iniciativas")({
  head: () => ({
    meta: [
      { title: "Iniciativas — Controladoria | Lei do Bem" },
      {
        name: "description",
        content: "Iniciativas recebidas do Revisor e sua análise financeira.",
      },
    ],
  }),
  component: ControladoriaIniciativasList,
});
