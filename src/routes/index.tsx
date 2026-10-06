import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ClipboardList,
  Wallet,
  ShieldCheck,
  Scale,
  Landmark,
  Settings2,
  ArrowRight,
} from "lucide-react";
import { AppHeader } from "@/components/app-header";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboards — Lei do Bem" },
      {
        name: "description",
        content: "Selecione o perfil para acessar as iniciativas da Lei do Bem.",
      },
      { property: "og:title", content: "Dashboards — Lei do Bem" },
      { property: "og:description", content: "Escolha o perfil para visualizar as iniciativas." },
    ],
  }),
  component: DashboardsHub,
});

const CARDS = [
  {
    to: "/dashboard" as const,
    title: "Relator",
    description:
      "Cadastre e preencha iniciativas de inovação da sua Diretoria, envie para revisão e acompanhe rascunhos.",
    icon: ClipboardList,
  },
  {
    to: "/financeiro" as const,
    title: "Responsável Financeiro",
    description:
      "Acompanhe as despesas das iniciativas por filial e Diretoria, validando lançamentos e evidências fiscais.",
    icon: Wallet,
  },
  {
    to: "/revisor" as const,
    title: "Revisor",
    description:
      "Analise as iniciativas de todas as Diretorias e filiais que aguardam revisão, aprovando ou solicitando ajustes.",
    icon: ShieldCheck,
  },
  {
    to: "/controladoria" as const,
    title: "Controladoria",
    description: "Estrutura inicial da Controladoria — funcionalidades a definir.",
    icon: Landmark,
  },
  {
    to: "/juridico" as const,
    title: "Jurídico",
    description: "Estrutura inicial do Jurídico — funcionalidades a definir.",
    icon: Scale,
  },
];

const ADMIN_CARDS = [
  {
    to: "/configuracao-geral" as const,
    title: "Configuração Geral",
    description: "Cadastro de perguntas, cargos e pesquisadores utilizados nas iniciativas.",
    icon: Settings2,
  },
];

function DashboardsHub() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-[1440px] px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Dashboards</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Selecione o perfil de acesso para visualizar as iniciativas com as personalizações
            correspondentes.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {CARDS.map((c) => {
            const Icon = c.icon;
            return (
              <Link
                key={c.to}
                to={c.to}
                className="group flex flex-col rounded-lg border border-border bg-surface p-6 transition-all hover:border-primary/50 hover:shadow-sm"
              >
                <div className="mb-4 grid size-11 place-items-center rounded-md bg-primary/10 text-primary">
                  <Icon className="size-5.5" />
                </div>
                <div className="text-base font-semibold tracking-tight">{c.title}</div>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">{c.description}</p>
                <div className="mt-4 flex items-center gap-2 text-sm font-medium text-primary">
                  Acessar
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-10 border-t border-border pt-8">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Administração
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {ADMIN_CARDS.map((c) => {
              const Icon = c.icon;
              return (
                <Link
                  key={c.to}
                  to={c.to}
                  className="group flex flex-col rounded-lg border border-border bg-surface p-6 transition-all hover:border-primary/50 hover:shadow-sm"
                >
                  <div className="mb-4 grid size-11 place-items-center rounded-md bg-primary/10 text-primary">
                    <Icon className="size-5.5" />
                  </div>
                  <div className="text-base font-semibold tracking-tight">{c.title}</div>
                  <p className="mt-2 flex-1 text-sm text-muted-foreground">{c.description}</p>
                  <div className="mt-4 flex items-center gap-2 text-sm font-medium text-primary">
                    Acessar
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
