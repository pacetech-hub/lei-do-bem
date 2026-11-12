import { createFileRoute } from "@tanstack/react-router";
import { JuridicoIniciativasList } from "@/components/juridico/juridico-iniciativas-list";

export const Route = createFileRoute("/juridico/iniciativas/")({
  head: () => ({
    meta: [
      { title: "Iniciativas — Jurídico | Lei do Bem" },
      {
        name: "description",
        content: "Iniciativas recebidas da Controladoria e sugestões de agrupamento.",
      },
    ],
  }),
  component: JuridicoIniciativasList,
});
