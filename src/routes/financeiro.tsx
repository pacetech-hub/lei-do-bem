import { createFileRoute, Outlet } from "@tanstack/react-router";

// Layout-only route: /financeiro/projetos/$id is registered as a child of
// this route (it shares the "/financeiro" path prefix), so this component
// must render <Outlet /> for that child page to actually appear. The real
// list page lives in financeiro.index.tsx (the exact "/financeiro" match).
export const Route = createFileRoute("/financeiro")({
  component: Outlet,
});
