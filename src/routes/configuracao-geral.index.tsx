import { createFileRoute, Link } from "@tanstack/react-router";
import { HelpCircle, Briefcase, FlaskConical, ArrowRight } from "lucide-react";
import { AppHeader } from "@/components/app-header";

export const Route = createFileRoute("/configuracao-geral/")({
  head: () => ({
    meta: [
      { title: "Configuração Geral | Lei do Bem" },
      {
        name: "description",
        content: "Cadastros gerais utilizados pelas iniciativas da Lei do Bem.",
      },
    ],
  }),
  component: ConfiguracaoGeralPage,
});

const CARDS = [
  {
    to: "/configuracao-geral/perguntas" as const,
    title: "Cadastro de perguntas",
    description: "Perguntas utilizadas nas iniciativas, organizadas por etapa.",
    icon: HelpCircle,
  },
  {
    to: "/configuracao-geral/cargos" as const,
    title: "Cadastro de cargos",
    description: "Cargos/funções do sistema e o percentual de horas elegíveis de cada um.",
    icon: Briefcase,
  },
  {
    to: "/configuracao-geral/pesquisadores" as const,
    title: "Cadastro de pesquisadores",
    description: "Identifique quais funcionários são pesquisadores.",
    icon: FlaskConical,
  },
];

function ConfiguracaoGeralPage() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader current="Configuração Geral" role="configuracaoGeral" />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Configuração Geral</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cadastros gerais utilizados pelas iniciativas, independentes dos perfis operacionais.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CARDS.map((c) => (
            <Link
              key={c.to}
              to={c.to}
              className="group flex flex-col rounded-lg border border-border bg-surface p-6 transition-all hover:border-primary/50 hover:shadow-sm"
            >
              <div className="mb-4 grid size-11 place-items-center rounded-md bg-primary/10 text-primary">
                <c.icon className="size-5.5" />
              </div>
              <div className="text-base font-semibold tracking-tight">{c.title}</div>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">{c.description}</p>
              <div className="mt-4 flex items-center gap-2 text-sm font-medium text-primary">
                Acessar
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
