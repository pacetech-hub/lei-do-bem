import { createFileRoute, Outlet } from "@tanstack/react-router";

// Layout-only route: /juridico/final/novo and /juridico/final/$id share the
// "/juridico/final" path prefix, so they're registered as children of this
// route and need <Outlet /> to actually render. The list itself lives in
// juridico.final.index.tsx (the exact "/juridico/final" match).
export const Route = createFileRoute("/juridico/final")({
  component: Outlet,
});
