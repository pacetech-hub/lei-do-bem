import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { cn } from "@/lib/utils";

// Layout da Controladoria: cabeçalho + menu persistente no topo (Iniciativas
// / Contas contábeis), igual um menu de tela — em vez de uma página de
// seleção intermediária, entrar em Controladoria já cai direto em
// Iniciativas (ver controladoria.index.tsx) e o menu permite trocar de tela
// sem voltar para um hub.
export const Route = createFileRoute("/controladoria")({
  component: ControladoriaLayout,
});

const TABS = [
  { to: "/controladoria/iniciativas", label: "Iniciativas" },
  { to: "/controladoria/contas-contabeis", label: "Contas contábeis" },
] as const;

function ControladoriaLayout() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <AppHeader current="Controladoria" role="controladoria" />
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
