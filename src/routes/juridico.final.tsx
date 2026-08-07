import { createFileRoute, Outlet } from "@tanstack/react-router";

// Layout-only route: /juridico/final/novo and /juridico/final/$id share the
// "/juridico/final" path prefix, so they're registered as children of this
// route and need <Outlet /> to actually render. There is no standalone
// listing area at the exact "/juridico/final" path — a Projeto Final is
// only reachable via the creation flow or from the "Projeto Final" tag on
// the individual projects it consolidates.
export const Route = createFileRoute("/juridico/final")({
  component: Outlet,
});
