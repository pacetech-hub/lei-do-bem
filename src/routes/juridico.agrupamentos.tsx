import { createFileRoute, Outlet } from "@tanstack/react-router";

// Layout-only route: /juridico/agrupamentos/ (índice), /juridico/agrupamentos/novo
// e /juridico/agrupamentos/$id são registradas como filhas desta rota, então
// este componente precisa renderizar <Outlet /> para as páginas reais
// aparecerem.
export const Route = createFileRoute("/juridico/agrupamentos")({
  component: Outlet,
});
