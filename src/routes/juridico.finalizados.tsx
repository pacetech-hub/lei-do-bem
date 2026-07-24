import { createFileRoute } from "@tanstack/react-router";
import { JuridicoFinalizados } from "@/components/juridico-finalizados";

export const Route = createFileRoute("/juridico/finalizados")({
  head: () => ({
    meta: [
      { title: "Projetos finalizados — Jurídico — Lei do Bem" },
      {
        name: "description",
        content: "Histórico de projetos já analisados e finalizados pelo MCTI.",
      },
    ],
  }),
  component: JuridicoFinalizados,
});
