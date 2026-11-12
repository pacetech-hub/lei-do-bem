import { createFileRoute, Outlet } from "@tanstack/react-router";

// Layout-only route: /controladoria/iniciativas/$id é registrado como filho
// desta rota (já que compartilham o prefixo "/controladoria/iniciativas"),
// então este componente precisa renderizar <Outlet /> para essa página
// filha aparecer de fato. A lista em si mora em
// controladoria.iniciativas.index.tsx (o match exato de "/controladoria/iniciativas").
export const Route = createFileRoute("/controladoria/iniciativas")({
  component: Outlet,
});
