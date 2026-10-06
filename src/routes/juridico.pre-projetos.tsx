import { createFileRoute } from "@tanstack/react-router";
import { RoleStubPlaceholder } from "@/components/role-stub";

export const Route = createFileRoute("/juridico/pre-projetos")({
  head: () => ({
    meta: [{ title: "Pré-projetos — Jurídico | Lei do Bem" }],
  }),
  component: () => (
    <RoleStubPlaceholder
      role="juridico"
      roleLabel="Jurídico"
      title="Pré-projetos"
      backTo="/juridico"
    />
  ),
});
