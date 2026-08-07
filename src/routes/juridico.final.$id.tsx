import { useMemo, useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Save } from "lucide-react";
import { toast } from "sonner";

import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useProjectsStore } from "@/lib/store";
import { FINAL_PROJECT_STATUS_LABEL } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/juridico/final/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Projeto Final ${params.id.slice(0, 6)} — Lei do Bem` },
      { name: "description", content: "Revisão final da consolidação antes do envio ao MCTI." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FinalProjectReview,
});

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const STATUS_BADGE_CLASS: Record<string, string> = {
  rascunho: "bg-status-draft text-status-draft-fg",
  em_revisao: "bg-status-review text-status-review-fg",
  enviado: "bg-status-approved text-status-approved-fg",
};

function FinalProjectReview() {
  const { id } = Route.useParams();
  const finalProject = useProjectsStore((s) => s.finalProjects.find((f) => f.id === id));
  const allProjects = useProjectsStore((s) => s.projects);
  const updateFinalProject = useProjectsStore((s) => s.updateFinalProject);

  if (!finalProject) {
    throw notFound();
  }

  const readOnly = finalProject.status === "enviado";
  const [notes, setNotes] = useState(finalProject.notes ?? "");

  const includedProjects = useMemo(
    () =>
      finalProject.projectIds.map((pid) => allProjects.find((p) => p.id === pid)).filter(Boolean),
    [finalProject.projectIds, allProjects],
  ) as typeof allProjects;

  const despesasTotal = (p: (typeof allProjects)[number]) =>
    p.thirdParties.reduce((acc, t) => acc + t.usedInProject, 0) +
    p.materials.reduce((acc, m) => acc + m.netValue, 0);

  const handleSaveDraft = () => {
    updateFinalProject(finalProject.id, { notes, status: "em_revisao" });
    toast.success("Rascunho salvo");
  };

  const handleSubmit = () => {
    updateFinalProject(finalProject.id, {
      notes,
      status: "enviado",
      submittedAt: new Date().toISOString(),
    });
    toast.success("Projeto Final enviado", {
      description: "A consolidação foi registrada como enviada ao MCTI.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader current={finalProject.name} />
      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                  STATUS_BADGE_CLASS[finalProject.status],
                )}
              >
                {FINAL_PROJECT_STATUS_LABEL[finalProject.status]}
              </span>
              <span className="text-xs text-muted-foreground">Ano {finalProject.year}</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">{finalProject.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Etapa 3 de 3 — Revisão final antes do envio oficial ao MCTI.
            </p>
          </div>
          <Button asChild variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
            <Link to="/juridico">
              <ArrowLeft className="size-4" /> Voltar para a Central Jurídica
            </Link>
          </Button>
        </div>

        <div className="mb-6 overflow-hidden rounded-lg border border-border bg-surface">
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-muted hover:bg-surface-muted">
                <TableHead className="w-[35%]">Projeto</TableHead>
                <TableHead>Área</TableHead>
                <TableHead>Natureza</TableHead>
                <TableHead className="text-right">Despesas consolidadas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {includedProjects.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="py-4 font-medium text-foreground">{p.name}</TableCell>
                  <TableCell className="py-4 text-sm text-muted-foreground">{p.area}</TableCell>
                  <TableCell className="py-4 text-sm capitalize text-muted-foreground">
                    {p.natureza}
                  </TableCell>
                  <TableCell className="py-4 text-right text-sm tabular-nums text-muted-foreground">
                    {brl(despesasTotal(p))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="final-notes">Observações da consolidação</Label>
          <Textarea
            id="final-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Registre observações sobre esta consolidação antes do envio."
            rows={4}
            readOnly={readOnly}
          />
        </div>

        {readOnly ? (
          <p className="mt-6 text-sm text-muted-foreground">
            Este Projeto Final já foi enviado ao MCTI e não pode mais ser editado.
          </p>
        ) : (
          <div className="mt-6 flex justify-end gap-2 border-t border-border pt-6">
            <Button variant="outline" className="gap-2" onClick={handleSaveDraft}>
              <Save className="size-4" /> Salvar rascunho
            </Button>
            <Button className="gap-2" onClick={handleSubmit}>
              <CheckCircle2 className="size-4" /> Concluir e enviar
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
