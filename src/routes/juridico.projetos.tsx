import { createFileRoute } from "@tanstack/react-router";
import { RoleStubPlaceholder } from "@/components/role-stub";

export const Route = createFileRoute("/juridico/projetos")({
  head: () => ({
    meta: [{ title: "Projetos — Jurídico | Lei do Bem" }],
  }),
  component: () => (
    <RoleStubPlaceholder role="juridico" roleLabel="Jurídico" title="Projetos" backTo="/juridico" />
  ),
});
