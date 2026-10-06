import type { ComponentType } from "react";
import { Link } from "@tanstack/react-router";
import { Construction } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import type { UserRole } from "@/lib/types";

// Páginas de estrutura básica para perfis cujas funcionalidades ainda serão
// definidas (Jurídico reestruturado, Controladoria). Só navegação — sem
// dados, sem lógica, conforme pedido.

export interface StubMenuItem {
  label: string;
  description: string;
  to: string;
  icon: ComponentType<{ className?: string }>;
}

interface RoleStubIndexProps {
  role: UserRole;
  roleLabel: string;
  description: string;
  items: StubMenuItem[];
}

export function RoleStubIndex({ role, roleLabel, description, items }: RoleStubIndexProps) {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader current={roleLabel} role={role} />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">{roleLabel}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-lg border border-border bg-surface p-5 transition-colors hover:border-primary/40 hover:bg-surface-muted"
            >
              <item.icon className="size-5 text-primary" />
              <div className="mt-3 text-sm font-semibold">{item.label}</div>
              <div className="mt-1 text-xs text-muted-foreground">{item.description}</div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

interface RoleStubPlaceholderProps {
  role: UserRole;
  roleLabel: string;
  title: string;
  backTo: string;
}

export function RoleStubPlaceholder({ role, roleLabel, title, backTo }: RoleStubPlaceholderProps) {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader current={roleLabel} role={role} />
      <main className="mx-auto max-w-3xl px-6 py-16 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-surface-muted">
          <Construction className="size-6 text-muted-foreground" />
        </div>
        <h1 className="mt-4 text-xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Esta área ainda não foi implementada. A estrutura de navegação já está pronta — as
          funcionalidades serão definidas em um próximo momento.
        </p>
        <Link
          to={backTo}
          className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          Voltar
        </Link>
      </main>
    </div>
  );
}
