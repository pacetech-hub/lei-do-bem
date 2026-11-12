import { createFileRoute } from "@tanstack/react-router";
import { JuridicoDevolutivasMcti } from "@/components/juridico/juridico-devolutivas-mcti";

export const Route = createFileRoute("/juridico/projetos/devolutivas")({
  head: () => ({
    meta: [{ title: "Devolutivas do MCTI — Jurídico | Lei do Bem" }],
  }),
  component: JuridicoDevolutivasMcti,
});
