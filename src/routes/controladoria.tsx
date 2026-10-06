import { createFileRoute, Outlet } from "@tanstack/react-router";

// Layout-only route: /controladoria/* child routes share this path prefix.
export const Route = createFileRoute("/controladoria")({
  component: Outlet,
});
