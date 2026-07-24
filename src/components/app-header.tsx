import { Link } from "@tanstack/react-router";
import { ChevronDown, LifeBuoy, LogOut, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CURRENT_USER } from "@/lib/types";

interface AppHeaderProps {
  current?: string;
}

export function AppHeader({ current }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-6 px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground font-bold text-sm">
            LB
          </div>
          <div className="leading-tight">
            <div className="text-[15px] font-semibold tracking-tight">Lei do Bem</div>
            <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
              Gestão de Projetos de Inovação
            </div>
          </div>
        </Link>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden text-right leading-tight sm:block">
            <div className="text-sm font-medium">{CURRENT_USER.name}</div>
            <div className="text-xs text-muted-foreground">
              {CURRENT_USER.area} · {CURRENT_USER.role}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 gap-2 px-2">
                <div className="grid size-8 place-items-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                  {CURRENT_USER.initials}
                </div>
                <ChevronDown className="size-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Minha conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 size-4" /> Perfil
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 size-4" /> Preferências
              </DropdownMenuItem>
              <DropdownMenuItem>
                <LifeBuoy className="mr-2 size-4" /> Ajuda
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogOut className="mr-2 size-4" /> Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {current && (
        <div className="mx-auto max-w-[1440px] px-6 pb-2.5">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/">Dashboards</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{current}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      )}
    </header>
  );
}
