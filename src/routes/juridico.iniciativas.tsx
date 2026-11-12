import { createFileRoute, Outlet } from "@tanstack/react-router";

// Layout-only route: /juridico/iniciativas/ é registrada como filha desta
// rota (mesmo prefixo de caminho), então este componente precisa renderizar
// <Outlet /> para a página real (juridico.iniciativas.index.tsx) aparecer.
export const Route = createFileRoute("/juridico/iniciativas")({
  component: Outlet,
});
