import { createFileRoute } from "@tanstack/react-router";
import { RoleStubPlaceholder } from "@/components/role-stub";

export const Route = createFileRoute("/controladoria/configuracoes")({
  head: () => ({
    meta: [{ title: "Configurações — Controladoria | Lei do Bem" }],
  }),
  component: () => (
    <RoleStubPlaceholder
      role="controladoria"
      roleLabel="Controladoria"
      title="Configurações"
      backTo="/controladoria"
    />
  ),
});
