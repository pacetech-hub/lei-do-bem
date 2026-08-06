import { useState } from "react";
import { AlertTriangle, Plus, Search, Trash2, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MOCK_EMPLOYEES, MOCK_SUPPLIERS } from "@/lib/mock";
import type { AdjustmentItem, Project } from "@/lib/types";
import { useProjectsStore } from "@/lib/store";
import { toast } from "sonner";

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function EmployeesTab({ project }: { project: Project }) {
  const addEmployee = useProjectsStore((s) => s.addEmployee);
  const removeEmployee = useProjectsStore((s) => s.removeEmployee);
  const [badge, setBadge] = useState("");
  const [found, setFound] = useState<(typeof MOCK_EMPLOYEES)[number] | null>(null);
  const [activity, setActivity] = useState("");
  const [totalHours, setTotalHours] = useState("");
  const [eligibleHours, setEligibleHours] = useState("");

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
    if (!found || !activity || !totalHours) {
      toast.warning("Preencha atividade e horas totais.");
      return;
    }
    const total = Number(totalHours);
    const eligible = Number(eligibleHours || totalHours);
    if (eligible > total) {
      toast.error("Horas elegíveis não podem exceder o total.");
      return;
    }
    addEmployee(project.id, {
      id: crypto.randomUUID(),
      code: found.code,
      name: found.name,
      role: found.role,
      activity,
      totalHours: total,
      eligibleHours: eligible,
    });
    setBadge("");
    setFound(null);
    setActivity("");
    setTotalHours("");
    setEligibleHours("");
    toast.success("Colaborador adicionado.");
  };

  return (
    <div className="space-y-4">
      <Alert>
        <AlertTriangle className="size-4" />
        <AlertTitle>Atenção às horas elegíveis</AlertTitle>
        <AlertDescription>
          Nem todas as horas do colaborador podem ser consideradas. Apenas as horas dedicadas a
          atividades de inovação devem ser contabilizadas.
        </AlertDescription>
      </Alert>

      <div className="rounded-lg border border-border bg-surface p-4">
        <h4 className="mb-3 text-sm font-semibold">Adicionar colaborador</h4>
        <div className="grid gap-3 md:grid-cols-[220px_1fr_auto]">
          <div className="space-y-1.5">
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
          <div className="space-y-1.5">
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
            <div className="space-y-1.5 md:col-span-3">
              <Label>Atividade realizada</Label>
              <Input
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                placeholder="Descreva a atividade de inovação executada"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Horas totais no ano</Label>
              <Input
                type="number"
                min="0"
                value={totalHours}
                onChange={(e) => setTotalHours(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Horas elegíveis</Label>
              <Input
                type="number"
                min="0"
                value={eligibleHours}
                onChange={(e) => setEligibleHours(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button className="w-full gap-2" onClick={submit}>
                <Plus className="size-4" /> Adicionar
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Crachá</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Função</TableHead>
              <TableHead>Atividade</TableHead>
              <TableHead className="text-right">Horas totais</TableHead>
              <TableHead className="text-right">Horas elegíveis</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {project.employees.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-20 text-center text-sm text-muted-foreground">
                  Nenhum colaborador adicionado.
                </TableCell>
              </TableRow>
            )}
            {project.employees.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-mono text-xs">{e.code}</TableCell>
                <TableCell className="font-medium">{e.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{e.role}</TableCell>
                <TableCell className="text-sm">{e.activity}</TableCell>
                <TableCell className="text-right tabular-nums">{e.totalHours}h</TableCell>
                <TableCell className="text-right tabular-nums font-medium">
                  {e.eligibleHours}h
                </TableCell>
                <TableCell>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8"
                    onClick={() => removeEmployee(project.id, e.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function ThirdPartyTab({ project }: { project: Project }) {
  const addThirdParty = useProjectsStore((s) => s.addThirdParty);
  const removeThirdParty = useProjectsStore((s) => s.removeThirdParty);
  const [company, setCompany] = useState<string>(MOCK_SUPPLIERS[0].name);
  const [invoice, setInvoice] = useState("");
  const [total, setTotal] = useState("");
  const [used, setUsed] = useState("");
  const [allocatedElsewhere, setAllocatedElsewhere] = useState("");

  const supplier = MOCK_SUPPLIERS.find((s) => s.name === company)!;

  const submit = () => {
    const t = Number(total);
    const u = Number(used);
    const a = Number(allocatedElsewhere || 0);
    if (!invoice || !t || !u) {
      toast.warning("Preencha nota fiscal, valor total e valor utilizado.");
      return;
    }
    if (u + a > t) {
      toast.error("Valor excede o total da nota", {
        description: `Utilizado (${brl(u)}) + já alocado em outros projetos (${brl(a)}) ultrapassa o total (${brl(t)}).`,
      });
      return;
    }
    addThirdParty(project.id, {
      id: crypto.randomUUID(),
      company: supplier.name,
      cnpj: supplier.cnpj,
      invoice,
      invoiceTotal: t,
      usedInProject: u,
      allocatedElsewhere: a,
    });
    setInvoice("");
    setTotal("");
    setUsed("");
    setAllocatedElsewhere("");
    toast.success("Serviço adicionado.");
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-surface p-4">
        <h4 className="mb-3 text-sm font-semibold">Adicionar serviço de terceiro</h4>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Empresa fornecedora</Label>
            <select
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {MOCK_SUPPLIERS.map((s) => (
                <option key={s.cnpj} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>CNPJ</Label>
            <Input value={supplier.cnpj} disabled />
          </div>
          <div className="space-y-1.5">
            <Label>Nota fiscal</Label>
            <Input
              value={invoice}
              onChange={(e) => setInvoice(e.target.value)}
              placeholder="Ex.: NF 12345"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Valor total da nota (R$)</Label>
            <Input
              type="number"
              step="0.01"
              value={total}
              onChange={(e) => setTotal(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Valor utilizado neste projeto (R$)</Label>
            <Input
              type="number"
              step="0.01"
              value={used}
              onChange={(e) => setUsed(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              Já alocado em outros projetos (R$)
              <Info className="size-3.5 text-muted-foreground" />
            </Label>
            <Input
              type="number"
              step="0.01"
              value={allocatedElsewhere}
              onChange={(e) => setAllocatedElsewhere(e.target.value)}
              placeholder="0,00"
            />
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <Button className="gap-2" onClick={submit}>
            <Plus className="size-4" /> Adicionar
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>NF</TableHead>
              <TableHead className="text-right">Valor total</TableHead>
              <TableHead className="text-right">Utilizado</TableHead>
              <TableHead className="text-right">Outros projetos</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {project.thirdParties.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-20 text-center text-sm text-muted-foreground">
                  Nenhum serviço de terceiro cadastrado.
                </TableCell>
              </TableRow>
            )}
            {project.thirdParties.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-medium">{e.company}</TableCell>
                <TableCell className="font-mono text-xs">{e.cnpj}</TableCell>
                <TableCell className="text-sm">{e.invoice}</TableCell>
                <TableCell className="text-right tabular-nums">{brl(e.invoiceTotal)}</TableCell>
                <TableCell className="text-right tabular-nums font-medium">
                  {brl(e.usedInProject)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {brl(e.allocatedElsewhere ?? 0)}
                </TableCell>
                <TableCell>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8"
                    onClick={() => removeThirdParty(project.id, e.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function MaterialsTab({ project }: { project: Project }) {
  const addMaterial = useProjectsStore((s) => s.addMaterial);
  const removeMaterial = useProjectsStore((s) => s.removeMaterial);
  const [supplier, setSupplier] = useState<string>(MOCK_SUPPLIERS[0].name);
  const [invoice, setInvoice] = useState("");
  const [gross, setGross] = useState("");
  const [net, setNet] = useState("");
  const [desc, setDesc] = useState("");
  const [usage, setUsage] = useState("");
  const s = MOCK_SUPPLIERS.find((x) => x.name === supplier)!;

  const submit = () => {
    if (!invoice || !gross || !desc) {
      toast.warning("Preencha os campos obrigatórios.");
      return;
    }
    addMaterial(project.id, {
      id: crypto.randomUUID(),
      supplier: s.name,
      cnpj: s.cnpj,
      invoice,
      grossValue: Number(gross),
      netValue: Number(net || gross),
      materialDescription: desc,
      usageDescription: usage,
    });
    setInvoice("");
    setGross("");
    setNet("");
    setDesc("");
    setUsage("");
    toast.success("Material adicionado.");
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-surface p-4">
        <h4 className="mb-3 text-sm font-semibold">Adicionar material</h4>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Fornecedor</Label>
            <select
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {MOCK_SUPPLIERS.map((x) => (
                <option key={x.cnpj} value={x.name}>
                  {x.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>CNPJ</Label>
            <Input value={s.cnpj} disabled />
          </div>
          <div className="space-y-1.5">
            <Label>Nota fiscal</Label>
            <Input value={invoice} onChange={(e) => setInvoice(e.target.value)} />
          </div>
          <div className="space-y-1.5 md:col-span-1">
            <Label>Valor bruto (R$)</Label>
            <Input
              type="number"
              step="0.01"
              value={gross}
              onChange={(e) => setGross(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Valor líquido (R$)</Label>
            <Input type="number" step="0.01" value={net} onChange={(e) => setNet(e.target.value)} />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>Descrição do material</Label>
            <Input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Ex.: Placa FPGA modelo XYZ"
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>Descrição da utilização no projeto</Label>
            <Input
              value={usage}
              onChange={(e) => setUsage(e.target.value)}
              placeholder="Ex.: Prototipagem de módulo de aquisição de dados"
            />
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <Button className="gap-2" onClick={submit}>
            <Plus className="size-4" /> Adicionar
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fornecedor</TableHead>
              <TableHead>NF</TableHead>
              <TableHead>Material</TableHead>
              <TableHead className="text-right">Bruto</TableHead>
              <TableHead className="text-right">Líquido</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {project.materials.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-20 text-center text-sm text-muted-foreground">
                  Nenhum material cadastrado.
                </TableCell>
              </TableRow>
            )}
            {project.materials.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{m.supplier}</TableCell>
                <TableCell className="text-sm">{m.invoice}</TableCell>
                <TableCell className="text-sm">{m.materialDescription}</TableCell>
                <TableCell className="text-right tabular-nums">{brl(m.grossValue)}</TableCell>
                <TableCell className="text-right tabular-nums font-medium">
                  {brl(m.netValue)}
                </TableCell>
                <TableCell>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8"
                    onClick={() => removeMaterial(project.id, m.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function SectionDespesas({
  project,
  pendingItems,
}: {
  project: Project;
  pendingItems?: AdjustmentItem[];
}) {
  return (
    <div className="max-w-5xl">
      <header className="mb-6">
        <h2 className="text-lg font-semibold tracking-tight">Despesas</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Registre as despesas elegíveis vinculadas ao projeto: horas de funcionários, serviços de
          terceiros e materiais.
        </p>
      </header>

      {pendingItems && pendingItems.length > 0 && (
        <div className="mb-6 flex items-start gap-2 rounded-lg border border-status-adjust-fg/40 bg-status-adjust/5 p-4 text-sm text-status-adjust-fg">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <div className="space-y-1">
            {pendingItems.map((item) => (
              <p key={item.id}>Ajuste solicitado: {item.comment}</p>
            ))}
          </div>
        </div>
      )}

      <Tabs defaultValue="funcionarios">
        <TabsList>
          <TabsTrigger value="funcionarios">Funcionários</TabsTrigger>
          <TabsTrigger value="terceiros">Serviços de Terceiros</TabsTrigger>
          <TabsTrigger value="materiais">Materiais</TabsTrigger>
        </TabsList>
        <TabsContent value="funcionarios" className="mt-4">
          <EmployeesTab project={project} />
        </TabsContent>
        <TabsContent value="terceiros" className="mt-4">
          <ThirdPartyTab project={project} />
        </TabsContent>
        <TabsContent value="materiais" className="mt-4">
          <MaterialsTab project={project} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
