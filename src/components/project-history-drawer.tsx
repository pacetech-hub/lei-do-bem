import { useState } from "react";
import { History } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useProjectsStore } from "@/lib/store";
import { buildProjectHistory } from "@/lib/project-history";
import type { Project } from "@/lib/types";

interface ProjectHistoryDrawerProps {
  project: Project;
}

// Acesso discreto (texto secundário, não um botão destacado) a uma trilha de
// auditoria simples do projeto, aberta num drawer lateral compacto.
export function ProjectHistoryDrawer({ project }: ProjectHistoryDrawerProps) {
  const [open, setOpen] = useState(false);
  const pareceres = useProjectsStore((s) => s.pareceres);
  const events = buildProjectHistory(project, pareceres);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
      >
        <History className="size-3.5" /> Ver histórico do projeto
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <History className="size-4 text-muted-foreground" /> Histórico do projeto
            </SheetTitle>
            <SheetDescription>
              Trilha de auditoria simples: quem realizou ações no projeto e quando.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 space-y-3 px-4">
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum evento registrado ainda.</p>
            ) : (
              events.map((ev, idx) => {
                const date = new Date(ev.date);
                return (
                  <div key={idx} className="rounded-lg border border-border bg-surface p-3 text-sm">
                    <span className="font-medium text-foreground">{ev.actor}</span>{" "}
                    <span className="text-foreground">{ev.description}</span>{" "}
                    <span className="text-muted-foreground">
                      em {format(date, "dd/MM/yyyy", { locale: ptBR })} às{" "}
                      {format(date, "HH:mm", { locale: ptBR })}.
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
