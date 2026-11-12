import { createFileRoute } from "@tanstack/react-router";
import { JuridicoPreProjetosList } from "@/components/juridico/juridico-pre-projetos-list";

export const Route = createFileRoute("/juridico/pre-projetos/")({
  head: () => ({
    meta: [
      { title: "Pré-projetos — Jurídico | Lei do Bem" },
      {
        name: "description",
        content: "Pré-projetos consolidados para avaliação do comitê.",
      },
    ],
  }),
  component: JuridicoPreProjetosList,
});
