import { createFileRoute } from "@tanstack/react-router";
import { JuridicoProjetosList } from "@/components/juridico/juridico-projetos-list";

export const Route = createFileRoute("/juridico/projetos/")({
  head: () => ({
    meta: [
      { title: "Projetos — Jurídico | Lei do Bem" },
      {
        name: "description",
        content: "Projetos aprovados pelo comitê e seu acompanhamento junto ao MCTI.",
      },
    ],
  }),
  component: JuridicoProjetosList,
});
