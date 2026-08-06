import { createFileRoute, Outlet } from "@tanstack/react-router";

// Layout-only route: /juridico/finalizados and /juridico/projetos/$id are
// registered as children of this route (they share the "/juridico" path
// prefix), so this component must render <Outlet /> for those child pages
// to actually appear. The real dashboard lives in juridico.index.tsx (the
// exact "/juridico" match).
export const Route = createFileRoute("/juridico")({
  component: Outlet,
});
