import { createFileRoute, Outlet } from "@tanstack/react-router";

// Layout-only route: /configuracao-geral/* child routes share this prefix.
export const Route = createFileRoute("/configuracao-geral")({
  component: Outlet,
});
