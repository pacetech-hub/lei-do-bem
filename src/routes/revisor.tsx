import { createFileRoute, Outlet } from "@tanstack/react-router";

// Layout-only route: /revisor/projetos/$id is registered as a child of this
// route (it shares the "/revisor" path prefix), so this component must
// render <Outlet /> for that child page to actually appear. The real list
// page lives in revisor.index.tsx (the exact "/revisor" match).
export const Route = createFileRoute("/revisor")({
  component: Outlet,
});
