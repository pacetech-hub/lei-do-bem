import { createFileRoute } from "@tanstack/react-router";
import { RoleStubPlaceholder } from "@/components/role-stub";

export const Route = createFileRoute("/controladoria/iniciativas")({
  head: () => ({
    meta: [{ title: "Iniciativas — Controladoria | Lei do Bem" }],
  }),
  component: () => (
    <RoleStubPlaceholder
      role="controladoria"
      roleLabel="Controladoria"
      title="Iniciativas"
      backTo="/controladoria"
    />
  ),
});
