import { createFileRoute, Link } from "@tanstack/react-router";
import { ClipboardList, Wallet, ShieldCheck, Scale, ArrowRight } from "lucide-react";
import { AppHeader } from "@/components/app-header";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboards — Lei do Bem" },
      {
        name: "description",
        content: "Selecione o perfil para acessar os projetos da Lei do Bem.",
      },
      { property: "og:title", content: "Dashboards — Lei do Bem" },
      { property: "og:description", content: "Escolha o perfil para visualizar os projetos." },
    ],
  }),
  component: DashboardsHub,
});

const CARDS = [
  {
    to: "/dashboard" as const,
    title: "Relator",
    description:
      "Cadastre e preencha projetos de inovação da sua área, envie para revisão e acompanhe rascunhos.",
    icon: ClipboardList,
  },
  {
    to: "/financeiro" as const,
    title: "Responsável Financeiro",
    description:
      "Acompanhe as despesas dos projetos por filial e setor, validando lançamentos e evidências fiscais.",
    icon: Wallet,
  },
  {
    to: "/revisor" as const,
    title: "Revisor",
    description:
      "Analise os projetos de todas as áreas e filiais que aguardam revisão, aprovando ou solicitando ajustes.",
    icon: ShieldCheck,
  },
  {
    to: "/juridico" as const,
    title: "Jurídico",
    description:
      "Gerencie o portfólio, controle submissões ao MCTI e conduza pareceres, ajustes e defesas.",
    icon: Scale,
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
            Selecione o perfil de acesso para visualizar os projetos com as personalizações
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
                className="group flex flex-col rounded-lg border border-border bg-surface p-6 transition-all hover:border-primary/50 hover:shadow-md"
              >
                <div className="mb-4 grid size-11 place-items-center rounded-md bg-primary/10 text-primary">
                  <Icon className="size-5.5" />
                </div>
                <div className="text-base font-semibold tracking-tight">{c.title}</div>
                <p className="mt-1.5 flex-1 text-sm text-muted-foreground">{c.description}</p>
                <div className="mt-4 flex items-center gap-1.5 text-sm font-medium text-primary">
                  Acessar
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
