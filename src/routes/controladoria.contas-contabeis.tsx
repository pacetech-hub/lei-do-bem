import { createFileRoute } from "@tanstack/react-router";
import { RoleStubPlaceholder } from "@/components/role-stub";

export const Route = createFileRoute("/controladoria/contas-contabeis")({
  head: () => ({
    meta: [{ title: "Contas contábeis — Controladoria | Lei do Bem" }],
  }),
  component: () => (
    <RoleStubPlaceholder
      role="controladoria"
      roleLabel="Controladoria"
      title="Contas contábeis"
      backTo="/controladoria"
    />
  ),
});
