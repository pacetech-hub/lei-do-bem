import { createFileRoute, Outlet } from "@tanstack/react-router";

// Layout-only route: /controladoria/iniciativas/$id/notas-fiscais/$despesaId/
// (a nota fiscal em si) e .../transacoes (as transações contábeis) são
// registradas como filhas desta rota — por isso este componente só
// renderiza <Outlet />.
export const Route = createFileRoute("/controladoria/iniciativas/$id/notas-fiscais/$despesaId")({
  component: Outlet,
});
