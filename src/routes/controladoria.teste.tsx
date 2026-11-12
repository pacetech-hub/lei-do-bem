import { createFileRoute } from "@tanstack/react-router";

// Rota de teste temporária — remover depois de confirmar a navegação interna.
export const Route = createFileRoute("/controladoria/teste")({
  component: () => <div style={{ padding: 40, fontSize: 24 }}>teste</div>,
});
