import { createFileRoute } from "@tanstack/react-router";
import { JuridicoDashboard } from "@/components/juridico-dashboard";

export const Route = createFileRoute("/juridico")({
  head: () => ({
    meta: [
      { title: "Central Jurídica — Lei do Bem" },
      {
        name: "description",
        content:
          "Gerencie o portfólio de projetos, controle submissões ao MCTI e conduza ajustes e defesas.",
      },
    ],
  }),
  component: JuridicoDashboard,
});
