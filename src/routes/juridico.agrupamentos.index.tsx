import { createFileRoute } from "@tanstack/react-router";
import { JuridicoAgrupamentosList } from "@/components/juridico/juridico-agrupamentos-list";

export const Route = createFileRoute("/juridico/agrupamentos/")({
  head: () => ({
    meta: [{ title: "Agrupamentos — Jurídico | Lei do Bem" }],
  }),
  component: JuridicoAgrupamentosList,
});
