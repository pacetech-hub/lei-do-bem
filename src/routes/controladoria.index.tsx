import { createFileRoute, redirect } from "@tanstack/react-router";

// Não existe mais uma tela de seleção intermediária — entrar em Controladoria
// (por qualquer caminho) cai direto em Iniciativas; a troca entre Iniciativas
// e Contas contábeis acontece pelo menu no topo (ver controladoria.tsx).
export const Route = createFileRoute("/controladoria/")({
  beforeLoad: () => {
    throw redirect({ to: "/controladoria/iniciativas" });
  },
});
