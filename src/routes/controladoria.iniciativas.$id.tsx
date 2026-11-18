import { createFileRoute, Outlet } from "@tanstack/react-router";

// Layout-only route: /controladoria/iniciativas/$id/ e
// /controladoria/iniciativas/$id/notas-fiscais/... são registradas como
// filhas desta rota, então este componente precisa renderizar <Outlet /> para
// as páginas reais aparecerem (mesmo padrão de financeiro.tsx/revisor.tsx).
export const Route = createFileRoute("/controladoria/iniciativas/$id")({
  component: Outlet,
});
