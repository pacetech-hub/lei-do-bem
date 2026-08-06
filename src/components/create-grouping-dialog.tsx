import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { FolderTree, Pencil, Search } from "lucide-react";
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
import { CURRENT_USER, type Project } from "@/lib/types";

interface GroupingFormProps {
  master?: Project;
  onSaved: (masterId: string) => void;
  onClose: () => void;
}

// Nome do agrupamento e seleção de projetos numa única tela — compartilhado
// entre criação e edição, já que o conteúdo é o mesmo, só o estado inicial e
// a ação final (criar vs. salvar alterações) mudam.
function GroupingForm({ master, onSaved, onClose }: GroupingFormProps) {
  const projects = useProjectsStore((s) => s.projects);
  const createProject = useProjectsStore((s) => s.createProject);
  const updateProject = useProjectsStore((s) => s.updateProject);

  const currentDependentIds = useMemo(() => {
    if (!master) return new Set<string>();
    return new Set<string>(
      projects.filter((p: Project) => p.masterProjectId === master.id).map((p: Project) => p.id),
    );
  }, [projects, master]);

  const [name, setName] = useState(master?.name ?? "");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set(currentDependentIds));

  // Elegíveis: projetos independentes (ainda não agrupados) + os que já
  // pertencem a este Mestre (para poder desmarcá-los e devolvê-los).
  const eligibleProjects = useMemo(
    () =>
      projects
        .filter((p) => p.projectType === "independente" || currentDependentIds.has(p.id))
        .filter((p) => !query || p.name.toLowerCase().includes(query.toLowerCase())),
    [projects, currentDependentIds, query],
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Informe o nome do Projeto Mestre.");
      return;
    }
    if (!master && selected.size === 0) {
      toast.error("Selecione ao menos um projeto para agrupar.");
      return;
    }

    if (master) {
      updateProject(master.id, { name: name.trim() });
      currentDependentIds.forEach((id) => {
        if (!selected.has(id)) {
          updateProject(id, { projectType: "independente", masterProjectId: undefined });
        }
      });
      selected.forEach((id) => {
        if (!currentDependentIds.has(id)) {
          updateProject(id, { projectType: "dependente", masterProjectId: master.id });
        }
      });
      toast.success("Agrupamento atualizado");
      onSaved(master.id);
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
    toast.success("Projeto Mestre criado", {
      description: `${selected.size} projeto${selected.size === 1 ? "" : "s"} vinculado${
        selected.size === 1 ? "" : "s"
      } a "${name.trim()}".`,
    });
    onSaved(masterId);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{master ? "Editar agrupamento" : "Criar Projeto Mestre"}</DialogTitle>
        <DialogDescription>
          O Projeto Mestre é apenas um agrupador lógico — organiza projetos relacionados sem alterar
          o conteúdo deles.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="grouping-name">Nome do Projeto Mestre</Label>
          <Input
            id="grouping-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Inovação Industrial"
            autoFocus
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
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={handleSave}>{master ? "Salvar alterações" : "Salvar"}</Button>
      </DialogFooter>
    </>
  );
}

interface CreateGroupingDialogProps {
  // Só define para onde navegar após criar o agrupamento — a lógica de
  // criação é idêntica nas duas áreas.
  mode: "revisor" | "juridico";
}

export function CreateGroupingDialog({ mode }: CreateGroupingDialogProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setResetKey((k) => k + 1);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="default" className="gap-2">
          <FolderTree className="size-4" /> Criar Projeto Mestre
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <GroupingForm
          key={resetKey}
          onClose={() => setOpen(false)}
          onSaved={(masterId) => {
            setOpen(false);
            navigate({
              to: mode === "juridico" ? "/juridico/projetos/$id" : "/revisor/projetos/$id",
              params: { id: masterId },
            });
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

interface EditGroupingDialogProps {
  master: Project;
}

export function EditGroupingDialog({ master }: EditGroupingDialogProps) {
  const [open, setOpen] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  // Se o Mestre mudar (navegação para outro agrupamento), reabre com estado limpo.
  useEffect(() => {
    setResetKey((k) => k + 1);
  }, [master.id]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setResetKey((k) => k + 1);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="default" className="gap-2">
          <Pencil className="size-4" /> Editar agrupamento
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <GroupingForm
          key={resetKey}
          master={master}
          onClose={() => setOpen(false)}
          onSaved={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
