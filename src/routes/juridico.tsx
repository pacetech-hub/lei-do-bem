import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { cn } from "@/lib/utils";

// Layout do Jurídico: cabeçalho + menu persistente no topo (Iniciativas /
// Pré-projetos / Projetos), no mesmo padrão do menu da Controladoria (ver
// controladoria.tsx) — entrar em Jurídico (por qualquer caminho) cai direto
// em Iniciativas (ver juridico.index.tsx).
export const Route = createFileRoute("/juridico")({
  component: JuridicoLayout,
});

const TABS = [
  { to: "/juridico/iniciativas", label: "Iniciativas" },
  { to: "/juridico/pre-projetos", label: "Pré-projetos" },
  { to: "/juridico/projetos", label: "Projetos" },
] as const;

function JuridicoLayout() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <AppHeader current="Jurídico" role="juridico" />
      <nav className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-[1440px] gap-1 px-6">
          {TABS.map((tab) => {
            const active = pathname.startsWith(tab.to);
            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={cn(
                  "border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                  active
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>
      <Outlet />
    </div>
  );
}
