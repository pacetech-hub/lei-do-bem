import { createFileRoute, Outlet } from "@tanstack/react-router";

// Layout-only route: /juridico/pre-projetos/$id/ e
// /juridico/pre-projetos/$id/gerar-apresentacao são registradas como filhas
// desta rota, então este componente precisa renderizar <Outlet /> para as
// páginas reais aparecerem (mesmo padrão de controladoria.iniciativas.$id.tsx).
export const Route = createFileRoute("/juridico/pre-projetos/$id")({
  component: Outlet,
});
