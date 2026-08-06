import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ChevronRight, FolderTree } from "lucide-react";

import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProjectsStore } from "@/lib/store";
import { isConsolidationWindowOpen } from "@/lib/mock";
import { FINAL_PROJECT_STATUS_LABEL } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/juridico/final/")({
  head: () => ({
    meta: [
      { title: "Projetos Finais — Lei do Bem" },
      {
        name: "description",
        content: "Consolidações anuais de projetos para submissão oficial ao MCTI.",
      },
    ],
  }),
  component: FinalProjectsList,
});

const STATUS_BADGE_CLASS: Record<string, string> = {
  rascunho: "bg-status-draft text-status-draft-fg",
  em_revisao: "bg-status-review text-status-review-fg",
  enviado: "bg-status-approved text-status-approved-fg",
};

function FinalProjectsList() {
  const navigate = useNavigate();
  const finalProjects = useProjectsStore((s) => s.finalProjects);
  const windowOpen = isConsolidationWindowOpen();
  const sorted = [...finalProjects].sort(
    (a, b) => b.year - a.year || +new Date(b.createdAt) - +new Date(a.createdAt),
  );

  return (
    <div className="min-h-screen bg-background">
      <AppHeader current="Projetos Finais" />
      <main className="mx-auto max-w-[1440px] px-6 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Projetos Finais</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Consolidações anuais de projetos aprovados para envio oficial ao MCTI.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
              <Link to="/juridico">
                <ArrowLeft className="size-4" /> Voltar para a Central Jurídica
              </Link>
            </Button>
            {windowOpen && (
              <Button asChild className="gap-2">
                <Link to="/juridico/final/novo">
                  <FolderTree className="size-4" /> Criar Projeto Final
                </Link>
              </Button>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-muted hover:bg-surface-muted">
                <TableHead className="w-[110px]">Ano</TableHead>
                <TableHead className="w-[45%]">Nome</TableHead>
                <TableHead>Projetos</TableHead>
                <TableHead className="w-[160px]">Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-sm text-muted-foreground">
                    Nenhum Projeto Final criado ainda.
                  </TableCell>
                </TableRow>
              )}
              {sorted.map((f) => (
                <TableRow
                  key={f.id}
                  className="group cursor-pointer"
                  onClick={() => navigate({ to: "/juridico/final/$id", params: { id: f.id } })}
                >
                  <TableCell className="py-4 tabular-nums text-muted-foreground">
                    {f.year}
                  </TableCell>
                  <TableCell className="py-4 font-medium text-foreground">{f.name}</TableCell>
                  <TableCell className="py-4 text-sm text-muted-foreground">
                    {f.projectIds.length} projeto{f.projectIds.length === 1 ? "" : "s"}
                  </TableCell>
                  <TableCell className="py-4">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                        STATUS_BADGE_CLASS[f.status],
                      )}
                    >
                      {FINAL_PROJECT_STATUS_LABEL[f.status]}
                    </span>
                  </TableCell>
                  <TableCell className="py-4 text-right">
                    <ChevronRight className="ml-auto size-4 text-muted-foreground/50 transition-colors group-hover:text-primary" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
}
