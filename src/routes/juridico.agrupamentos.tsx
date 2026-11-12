import { createFileRoute, Outlet } from "@tanstack/react-router";

// Layout-only route: /juridico/agrupamentos/novo e /juridico/agrupamentos/$id
// são registradas como filhas desta rota, então este componente precisa
// renderizar <Outlet /> para as páginas reais aparecerem. Não há uma tela
// própria em "/juridico/agrupamentos" — agrupamentos só são acessados a
// partir de Iniciativas (sugestão da IA ou criação manual).
export const Route = createFileRoute("/juridico/agrupamentos")({
  component: Outlet,
});
