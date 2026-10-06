import { useState } from "react";
import { Search, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useProjectsStore } from "@/lib/store";
import { MOCK_EMPLOYEES } from "@/lib/mock";
import { FILIAIS } from "@/components/projects-list";
import { AREAS, type Project, type ResourceEntry } from "@/lib/types";

function ProfessionalsTab({ project, readOnly }: { project: Project; readOnly?: boolean }) {
  const addResource = useProjectsStore((s) => s.addResource);
  const updateResource = useProjectsStore((s) => s.updateResource);
  const removeResource = useProjectsStore((s) => s.removeResource);

  const [badge, setBadge] = useState("");
  const [found, setFound] = useState<(typeof MOCK_EMPLOYEES)[number] | null>(null);
  const [filial, setFilial] = useState("");
  const [area, setArea] = useState("");
  const [filialFilter, setFilialFilter] = useState("all");
  const [areaFilter, setAreaFilter] = useState("all");
  const [query, setQuery] = useState("");

  const search = () => {
    const e = MOCK_EMPLOYEES.find((x) => x.code === badge.trim());
    if (!e) {
      toast.error("Colaborador não encontrado", { description: `Nenhum crachá ${badge}.` });
      setFound(null);
      return;
    }
    setFound(e);
  };

  const submit = () => {
    if (!found || !filial || !area) {
      toast.warning("Busque o colaborador e selecione a filial e a Diretoria.");
      return;
    }
    const resource: ResourceEntry = {
      id: crypto.randomUUID(),
      type: "funcionario",
      name: found.name,
      code: found.code,
      role: found.role,
      filial,
      area,
      active: true,
      createdAt: new Date().toISOString(),
    };
    addResource(project.id, resource);
    setBadge("");
    setFound(null);
    setFilial("");
    setArea("");
    toast.success("Profissional cadastrado.");
  };

  const professionals = project.resources.filter((r) => r.type === "funcionario");
  const filtered = professionals.filter((r) => {
    if (query && !r.name.toLowerCase().includes(query.toLowerCase()) && r.code !== query.trim())
      return false;
    if (filialFilter !== "all" && r.filial !== filialFilter) return false;
    if (areaFilter !== "all" && r.area !== areaFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {!readOnly && (
        <div className="rounded-lg border border-border bg-surface p-4">
          <h4 className="mb-3 text-sm font-semibold">Cadastrar profissional</h4>
          <div className="grid gap-3 md:grid-cols-[220px_1fr_auto]">
            <div className="space-y-2">
              <Label>Crachá</Label>
              <div className="flex gap-2">
                <Input
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  placeholder="Ex.: 10234"
                />
                <Button variant="outline" size="icon" onClick={search}>
                  <Search className="size-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nome / Função</Label>
              <Input
                value={found ? `${found.name} — ${found.role}` : ""}
                disabled
                placeholder="Busque pelo crachá…"
              />
            </div>
          </div>

          {found && (
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Filial</Label>
                <Select value={filial} onValueChange={setFilial}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a filial" />
                  </SelectTrigger>
                  <SelectContent>
                    {FILIAIS.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Diretoria</Label>
                <Select value={area} onValueChange={setArea}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a diretoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {AREAS.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button className="w-full gap-2" onClick={submit}>
                  <UserPlus className="size-4" /> Adicionar
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome ou crachá…"
            className="h-9 pl-8"
          />
        </div>
        <Select value={filialFilter} onValueChange={setFilialFilter}>
          <SelectTrigger className="h-9 w-[200px]">
            <SelectValue placeholder="Filial" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as filiais</SelectItem>
            {FILIAIS.map((f) => (
              <SelectItem key={f} value={f}>
                {f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={areaFilter} onValueChange={setAreaFilter}>
          <SelectTrigger className="h-9 w-[200px]">
            <SelectValue placeholder="Diretoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as diretorias</SelectItem>
            {AREAS.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Crachá</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Função</TableHead>
              <TableHead>Filial</TableHead>
              <TableHead>Diretoria</TableHead>
              <TableHead className="text-right">Ativo</TableHead>
              {!readOnly && <TableHead className="w-10" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={readOnly ? 6 : 7}
                  className="h-20 text-center text-sm text-muted-foreground"
                >
                  Nenhum profissional cadastrado.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-xs">{r.code}</TableCell>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{r.role}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{r.filial}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{r.area}</TableCell>
                <TableCell className="text-right">
                  <Switch
                    checked={r.active}
                    disabled={readOnly}
                    onCheckedChange={(checked) =>
                      updateResource(project.id, r.id, { active: checked })
                    }
                  />
                </TableCell>
                {!readOnly && (
                  <TableCell>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8"
                      onClick={() => removeResource(project.id, r.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function ThirdPartiesTab({ project, readOnly }: { project: Project; readOnly?: boolean }) {
  const addResource = useProjectsStore((s) => s.addResource);
  const updateResource = useProjectsStore((s) => s.updateResource);
  const removeResource = useProjectsStore((s) => s.removeResource);

  const [name, setName] = useState("");
  const [filial, setFilial] = useState("");
  const [area, setArea] = useState("");
  const [filialFilter, setFilialFilter] = useState("all");
  const [areaFilter, setAreaFilter] = useState("all");
  const [query, setQuery] = useState("");

  const submit = () => {
    if (!name.trim() || !filial || !area) {
      toast.warning("Informe o nome e selecione a filial e a Diretoria.");
      return;
    }
    const resource: ResourceEntry = {
      id: crypto.randomUUID(),
      type: "terceiro",
      name: name.trim(),
      filial,
      area,
      active: true,
      createdAt: new Date().toISOString(),
    };
    addResource(project.id, resource);
    setName("");
    setFilial("");
    setArea("");
    toast.success("Terceiro cadastrado.");
  };

  const thirdParties = project.resources.filter((r) => r.type === "terceiro");
  const filtered = thirdParties.filter((r) => {
    if (query && !r.name.toLowerCase().includes(query.toLowerCase())) return false;
    if (filialFilter !== "all" && r.filial !== filialFilter) return false;
    if (areaFilter !== "all" && r.area !== areaFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {!readOnly && (
        <div className="rounded-lg border border-border bg-surface p-4">
          <h4 className="mb-3 text-sm font-semibold">Cadastrar terceiro</h4>
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-2 md:col-span-2">
              <Label>Nome</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome do terceiro"
              />
            </div>
            <div className="space-y-2">
              <Label>Filial</Label>
              <Select value={filial} onValueChange={setFilial}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a filial" />
                </SelectTrigger>
                <SelectContent>
                  {FILIAIS.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Diretoria</Label>
              <Select value={area} onValueChange={setArea}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a diretoria" />
                </SelectTrigger>
                <SelectContent>
                  {AREAS.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button className="mt-3 gap-2" onClick={submit}>
            <UserPlus className="size-4" /> Adicionar
          </Button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome…"
            className="h-9 pl-8"
          />
        </div>
        <Select value={filialFilter} onValueChange={setFilialFilter}>
          <SelectTrigger className="h-9 w-[200px]">
            <SelectValue placeholder="Filial" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as filiais</SelectItem>
            {FILIAIS.map((f) => (
              <SelectItem key={f} value={f}>
                {f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={areaFilter} onValueChange={setAreaFilter}>
          <SelectTrigger className="h-9 w-[200px]">
            <SelectValue placeholder="Diretoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as diretorias</SelectItem>
            {AREAS.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Filial</TableHead>
              <TableHead>Diretoria</TableHead>
              <TableHead className="text-right">Ativo</TableHead>
              {!readOnly && <TableHead className="w-10" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={readOnly ? 4 : 5}
                  className="h-20 text-center text-sm text-muted-foreground"
                >
                  Nenhum terceiro cadastrado.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{r.filial}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{r.area}</TableCell>
                <TableCell className="text-right">
                  <Switch
                    checked={r.active}
                    disabled={readOnly}
                    onCheckedChange={(checked) =>
                      updateResource(project.id, r.id, { active: checked })
                    }
                  />
                </TableCell>
                {!readOnly && (
                  <TableCell>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8"
                      onClick={() => removeResource(project.id, r.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function SectionRecursos({
  project,
  readOnly,
}: {
  project: Project;
  // Recursos só são cadastrados pelo Relator — Revisor e Financeiro apenas
  // visualizam os cadastros já feitos (mesmo padrão de Despesas, invertido).
  readOnly?: boolean;
}) {
  return (
    <div className="max-w-5xl">
      <header className="mb-6">
        <h2 className="text-lg font-semibold tracking-tight">Recursos</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {readOnly
            ? "Profissionais e terceiros cadastrados pelo Relator para esta iniciativa."
            : "Cadastre os profissionais e terceiros que participam desta iniciativa."}
        </p>
      </header>

      <Tabs defaultValue="profissionais">
        <TabsList className="mb-6">
          <TabsTrigger value="profissionais">Profissionais</TabsTrigger>
          <TabsTrigger value="terceiros">Terceiros</TabsTrigger>
        </TabsList>
        <TabsContent value="profissionais">
          <ProfessionalsTab project={project} readOnly={readOnly} />
        </TabsContent>
        <TabsContent value="terceiros">
          <ThirdPartiesTab project={project} readOnly={readOnly} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
