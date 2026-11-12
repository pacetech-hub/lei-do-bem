import { createFileRoute, redirect } from "@tanstack/react-router";

// Não existe uma tela de seleção intermediária — entrar em Jurídico (por
// qualquer caminho) cai direto em Iniciativas; a troca entre Iniciativas,
// Pré-projetos e Projetos acontece pelo menu no topo (ver juridico.tsx).
export const Route = createFileRoute("/juridico/")({
  beforeLoad: () => {
    throw redirect({ to: "/juridico/iniciativas" });
  },
});
