import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { FolderTree, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useProjectsStore } from "@/lib/store";
import { CURRENT_USER } from "@/lib/types";

interface CreateGroupingDialogProps {
  // Só define para onde navegar após criar o agrupamento — a lógica de
  // criação é idêntica nas duas áreas.
  mode: "revisor" | "juridico";
}

export function CreateGroupingDialog({ mode }: CreateGroupingDialogProps) {
  const navigate = useNavigate();
  const projects = useProjectsStore((s) => s.projects);
  const createProject = useProjectsStore((s) => s.createProject);
  const updateProject = useProjectsStore((s) => s.updateProject);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const eligibleProjects = useMemo(
    () =>
      projects
        .filter((p) => p.projectType === "independente")
        .filter((p) => !query || p.name.toLowerCase().includes(query.toLowerCase())),
    [projects, query],
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const reset = () => {
    setName("");
    setQuery("");
    setSelected(new Set());
  };

  const handleCreate = () => {
    if (!name.trim()) {
      toast.error("Informe o nome do agrupamento.");
      return;
    }
    if (selected.size === 0) {
      toast.error("Selecione ao menos um projeto para agrupar.");
      return;
    }
    const now = new Date();
    const inSixMonths = new Date(now.getTime() + 180 * 86400000);
    const masterId = createProject({
      name: name.trim(),
      area: CURRENT_USER.area,
      responsible: CURRENT_USER.name,
      startDate: now.toISOString(),
      endDate: inSixMonths.toISOString(),
      hasPatent: false,
      natureza: "produto",
      atividade: "basica",
      projectType: "mestre",
    });
    selected.forEach((id) => {
      updateProject(id, { projectType: "dependente", masterProjectId: masterId });
    });
    toast.success("Agrupamento criado", {
      description: `${selected.size} projeto${selected.size === 1 ? "" : "s"} vinculado${
        selected.size === 1 ? "" : "s"
      } a "${name.trim()}".`,
    });
    setOpen(false);
    reset();
    navigate({
      to: mode === "juridico" ? "/juridico/projetos/$id" : "/revisor/projetos/$id",
      params: { id: masterId },
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="default" className="gap-2">
          <FolderTree className="size-4" /> Agrupar projetos
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Agrupar projetos</DialogTitle>
          <DialogDescription>
            Crie um Projeto Mestre para organizar projetos relacionados. Os projetos selecionados
            continuam existindo individualmente — o agrupamento é apenas um agrupador lógico.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="grouping-name">Nome do agrupamento</Label>
            <Input
              id="grouping-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Inovação Industrial"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Selecionar projetos</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nome do projeto…"
                className="h-9 pl-8"
              />
            </div>
            <div className="max-h-64 space-y-1 overflow-y-auto rounded-md border border-border p-2">
              {eligibleProjects.length === 0 ? (
                <p className="p-2 text-sm text-muted-foreground">
                  Nenhum projeto independente disponível para agrupar.
                </p>
              ) : (
                eligibleProjects.map((p) => (
                  <label
                    key={p.id}
                    className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-surface-muted"
                  >
                    <Checkbox checked={selected.has(p.id)} onCheckedChange={() => toggle(p.id)} />
                    <span className="flex-1 truncate text-foreground">{p.name}</span>
                  </label>
                ))
              )}
            </div>
            {selected.size > 0 && (
              <p className="text-xs text-muted-foreground">
                {selected.size} projeto{selected.size === 1 ? "" : "s"} selecionado
                {selected.size === 1 ? "" : "s"}.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCreate}>Criar agrupamento</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
