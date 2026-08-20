import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, FolderTree, Lock, Search } from "lucide-react";
import { toast } from "sonner";

import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useProjectsStore } from "@/lib/store";
import { CONSOLIDATION_WINDOW, isConsolidationWindowOpen } from "@/lib/mock";
import { ROLE_USERS } from "@/lib/types";

export const Route = createFileRoute("/juridico/final/novo")({
  head: () => ({
    meta: [
      { title: "Criar Projeto Final — Lei do Bem" },
      {
        name: "description",
        content: "Etapa 1: selecione os projetos aprovados que farão parte da consolidação.",
      },
    ],
  }),
  component: NewFinalProject,
});

function NewFinalProject() {
  const navigate = useNavigate();
  const allProjects = useProjectsStore((s) => s.projects);
  const createFinalProject = useProjectsStore((s) => s.createFinalProject);

  const currentYear = new Date().getFullYear();
  const windowOpen = isConsolidationWindowOpen();

  const [name, setName] = useState(`Projeto Final Jurídico ${currentYear}`);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Elegível = já aprovado pelo Jurídico na ficha do projeto ("Aprovar para
  // criar projeto final"), ainda não incluído numa consolidação anterior.
  // Agrupadores também aparecem como uma única linha selecionável — ao
  // marcar um agrupador, todos os seus dependentes prontos entram de uma vez.
  const readyDependentsByMaster = useMemo(() => {
    const map = new Map<string, typeof allProjects>();
    allProjects.forEach((p) => {
      if (
        p.projectType === "dependente" &&
        p.masterProjectId &&
        p.legalStatus === "pronto_submissao"
      ) {
        const list = map.get(p.masterProjectId) ?? [];
        list.push(p);
        map.set(p.masterProjectId, list);
      }
    });
    return map;
  }, [allProjects]);

  const eligibleEntries = useMemo(() => {
    const entries: Array<{
      id: string;
      name: string;
      area: string;
      isGroup: boolean;
      count?: number;
    }> = [];
    allProjects.forEach((p) => {
      if (p.projectType === "independente" && p.legalStatus === "pronto_submissao") {
        entries.push({ id: p.id, name: p.name, area: p.area, isGroup: false });
      } else if (p.projectType === "mestre") {
        const deps = readyDependentsByMaster.get(p.id) ?? [];
        if (deps.length > 0) {
          entries.push({ id: p.id, name: p.name, area: p.area, isGroup: true, count: deps.length });
        }
      }
    });
    return entries.filter((e) => !query || e.name.toLowerCase().includes(query.toLowerCase()));
  }, [allProjects, readyDependentsByMaster, query]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleGenerate = () => {
    if (!name.trim()) {
      toast.error("Informe o nome do Projeto Final.");
      return;
    }
    if (selected.size === 0) {
      toast.error("Selecione ao menos um projeto ou agrupador para consolidar.");
      return;
    }
    // Um agrupador selecionado expande para os ids dos seus dependentes
    // prontos — o agrupador em si nunca é submetido, é só um agregador.
    const projectIds = Array.from(selected).flatMap((id) => {
      const deps = readyDependentsByMaster.get(id);
      return deps ? deps.map((d) => d.id) : [id];
    });
    const id = createFinalProject({
      year: currentYear,
      name: name.trim(),
      projectIds,
      createdBy: ROLE_USERS.juridico.name,
    });
    toast.success("Projeto Final gerado", {
      description: "Revise as informações consolidadas antes de enviar ao MCTI.",
    });
    navigate({ to: "/juridico/final/$id", params: { id } });
  };

  if (!windowOpen) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader current="Criar Projeto Final" role="juridico" />
        <main className="mx-auto max-w-xl px-6 py-16 text-center">
          <Lock className="mx-auto mb-3 size-8 text-muted-foreground" />
          <h1 className="text-lg font-semibold text-foreground">
            Período anual de consolidação encerrado
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            O período para criar o Projeto Final {CONSOLIDATION_WINDOW.year} já foi finalizado.
            Novos Projetos Finais só poderão ser criados no próximo ciclo anual.
          </p>
          <Button asChild variant="outline" className="mt-6 gap-2">
            <Link to="/juridico">
              <ArrowLeft className="size-4" /> Voltar para a Central Jurídica
            </Link>
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader current="Criar Projeto Final" role="juridico" />
      <main className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Criar Projeto Final</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Etapa 1 de 3 — Selecione os projetos aprovados que farão parte da consolidação oficial
              de {currentYear}.
            </p>
          </div>
          <Button asChild variant="ghost" size="sm" className="gap-2 text-muted-foreground">
            <Link to="/juridico">
              <ArrowLeft className="size-4" /> Cancelar
            </Link>
          </Button>
        </div>

        <div className="space-y-4 rounded-lg border border-border bg-surface p-5">
          <div className="space-y-2">
            <Label htmlFor="final-name">Nome do Projeto Final</Label>
            <Input id="final-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Projetos e agrupadores disponíveis</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nome…"
                className="h-9 pl-8"
              />
            </div>
            <div className="max-h-80 space-y-1 overflow-y-auto rounded-md border border-border p-2">
              {eligibleEntries.length === 0 ? (
                <p className="p-2 text-sm text-muted-foreground">
                  Nenhum projeto ou agrupador disponível para consolidação.
                </p>
              ) : (
                eligibleEntries.map((e) => (
                  <label
                    key={e.id}
                    className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-surface-muted"
                  >
                    <Checkbox checked={selected.has(e.id)} onCheckedChange={() => toggle(e.id)} />
                    {e.isGroup && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                        <FolderTree className="size-3" /> Agrupador
                      </span>
                    )}
                    <span className="flex-1 truncate text-foreground">{e.name}</span>
                    {e.isGroup && (
                      <span className="text-xs text-muted-foreground">
                        {e.count} projeto{e.count === 1 ? "" : "s"} pronto
                        {e.count === 1 ? "" : "s"}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">{e.area}</span>
                  </label>
                ))
              )}
            </div>
            {selected.size > 0 && (
              <p className="text-xs text-muted-foreground">
                {selected.size} ite{selected.size === 1 ? "m" : "ns"} selecionado
                {selected.size === 1 ? "" : "s"}.
              </p>
            )}
          </div>

          <div className="flex justify-end border-t border-border pt-4">
            <Button className="gap-2" onClick={handleGenerate}>
              <FolderTree className="size-4" /> Gerar Projeto Final
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
