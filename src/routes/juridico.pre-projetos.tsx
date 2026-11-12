import { createFileRoute, Outlet } from "@tanstack/react-router";

// Layout-only route: /juridico/pre-projetos/ e /juridico/pre-projetos/$id
// são registradas como filhas desta rota, então este componente precisa
// renderizar <Outlet /> para as páginas reais aparecerem.
export const Route = createFileRoute("/juridico/pre-projetos")({
  component: Outlet,
});
