import { createFileRoute } from "@tanstack/react-router";
import { RoleStubPlaceholder } from "@/components/role-stub";

export const Route = createFileRoute("/juridico/agrupamentos")({
  head: () => ({
    meta: [{ title: "Agrupamentos — Jurídico | Lei do Bem" }],
  }),
  component: () => (
    <RoleStubPlaceholder
      role="juridico"
      roleLabel="Jurídico"
      title="Agrupamentos"
      backTo="/juridico"
    />
  ),
});
