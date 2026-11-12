import { createFileRoute, Outlet } from "@tanstack/react-router";

// Layout-only route: /juridico/projetos/, /juridico/projetos/$id e
// /juridico/projetos/devolutivas são registradas como filhas desta rota,
// então este componente precisa renderizar <Outlet /> para as páginas reais
// aparecerem.
export const Route = createFileRoute("/juridico/projetos")({
  component: Outlet,
});
