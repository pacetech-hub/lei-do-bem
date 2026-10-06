import { useState } from "react";
import { AlertTriangle, MessageSquareWarning, Plus, Search, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MOCK_EMPLOYEES } from "@/lib/mock";
import { InvoiceItemPicker } from "@/components/sections/invoice-item-picker";
import { getItemConsumed } from "@/lib/invoices";
import type {
  AdjustmentItem,
  DespesaAdjustmentItem,
  Invoice,
  InvoiceItem,
  Project,
} from "@/lib/types";
import { useProjectsStore } from "@/lib/store";
import { toast } from "sonner";

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Botão por linha, visível só para o Revisor em modo leitura: registra um
// pedido de ajuste sobre aquela despesa específica, sem alterar o status do
// projeto nem a fila do Relator — só sinaliza a linha para o Financeiro.
function RequestAdjustmentButton({ onSubmit }: { onSubmit: (comment: string) => void }) {
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState("");

  const submit = () => {
    if (!comment.trim()) {
      toast.error("Descreva o que precisa ser corrigido nesta despesa.");
      return;
    }
    onSubmit(comment.trim());
    setComment("");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="icon" variant="ghost" className="size-8" aria-label="Solicitar ajuste">
          <MessageSquareWarning className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 space-y-2">
        <Label>Solicitar ajuste nesta despesa</Label>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Descreva o que precisa ser corrigido."
          rows={3}
        />
        <Button size="sm" className="w-full" onClick={submit}>
          Enviar ao Financeiro
        </Button>
      </PopoverContent>
    </Popover>
  );
}

// Regra provisória — o percentual final de horas elegíveis ainda não foi
// definido pelo negócio. Fácil de ajustar quando a regra for fechada.
const ELIGIBLE_HOURS_RATIO = 0.3;

function EmployeesTab({ project, readOnly }: { project: Project; readOnly?: boolean }) {
  const addEmployee = useProjectsStore((s) => s.addEmployee);
  const removeEmployee = useProjectsStore((s) => s.removeEmployee);
  const [badge, setBadge] = useState("");
  const [found, setFound] = useState<{ code: string; name: string; role: string } | null>(null);
  const [activity, setActivity] = useState("");
  const [totalHours, setTotalHours] = useState("");
  const eligibleHours = totalHours ? Math.round(Number(totalHours) * ELIGIBLE_HOURS_RATIO) : 0;

  const registeredResources = project.resources.filter((r) => r.type === "funcionario" && r.active);

  const search = () => {
    const e = MOCK_EMPLOYEES.find((x) => x.code === badge.trim());
    if (!e) {
      toast.error("Colaborador não encontrado", { description: `Nenhum crachá ${badge}.` });
      setFound(null);
      return;
    }
    setFound(e);
  };

  const pickResource = (resourceId: string) => {
    const r = registeredResources.find((x) => x.id === resourceId);
    if (!r) return;
    setFound({ code: r.code ?? "", name: r.name, role: r.role ?? "" });
    setBadge(r.code ?? "");
  };

  const submit = () => {
    if (!found || !activity || !totalHours) {
      toast.warning("Preencha atividade e horas totais.");
      return;
    }
    addEmployee(project.id, {
      id: crypto.randomUUID(),
      code: found.code,
      name: found.name,
      role: found.role,
      activity,
      totalHours: Number(totalHours),
      eligibleHours,
    });
    setBadge("");
    setFound(null);
    setActivity("");
    setTotalHours("");
    toast.success("Colaborador adicionado.");
  };

  return (
    <div className="space-y-4">
      {!readOnly && (
        <>
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
            {registeredResources.length > 0 && (
              <div className="mb-3 space-y-2">
                <Label>Recurso cadastrado pelo Relator (opcional)</Label>
                <Select value="" onValueChange={pickResource}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar um recurso já cadastrado" />
                  </SelectTrigger>
                  <SelectContent>
                    {registeredResources.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name} — {r.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
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
                  placeholder="Busque pelo crachá ou selecione um recurso…"
                />
              </div>
            </div>

            {found && (
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <div className="space-y-2 md:col-span-3">
                  <Label>Atividade realizada</Label>
                  <Input
                    value={activity}
                    onChange={(e) => setActivity(e.target.value)}
                    placeholder="Descreva a atividade de inovação executada"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Horas totais do trimestre</Label>
                  <Input
                    type="number"
                    min="0"
                    value={totalHours}
                    onChange={(e) => setTotalHours(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Horas elegíveis</Label>
                  <p className="flex h-9 items-center text-sm text-muted-foreground">
                    {eligibleHours}h{" "}
                    <span className="ml-1 text-xs">
                      ({Math.round(ELIGIBLE_HOURS_RATIO * 100)}% do total)
                    </span>
                  </p>
                </div>
                <div className="flex items-end">
                  <Button className="w-full gap-2" onClick={submit}>
                    <Plus className="size-4" /> Adicionar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

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
              {!readOnly && <TableHead className="w-10" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {project.employees.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={readOnly ? 6 : 7}
                  className="h-20 text-center text-sm text-muted-foreground"
                >
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
                {!readOnly && (
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
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function ThirdPartyTab({
  project,
  readOnly,
  canRequestAdjustment,
}: {
  project: Project;
  readOnly?: boolean;
  canRequestAdjustment?: boolean;
}) {
  const addThirdParty = useProjectsStore((s) => s.addThirdParty);
  const removeThirdParty = useProjectsStore((s) => s.removeThirdParty);
  const addDespesaAdjustment = useProjectsStore((s) => s.addDespesaAdjustment);
  const allProjects = useProjectsStore((s) => s.projects);
  const [selection, setSelection] = useState<{ invoice: Invoice; item: InvoiceItem } | null>(null);
  const [used, setUsed] = useState("");
  // Força o InvoiceItemPicker (não controlado) a remontar do zero após um
  // lançamento, já que ele mantém a seleção em estado próprio.
  const [pickerKey, setPickerKey] = useState(0);

  const clearSelection = () => {
    setSelection(null);
    setUsed("");
  };

  const submit = () => {
    if (!selection) {
      toast.warning("Busque o CNPJ e selecione um item da nota fiscal.");
      return;
    }
    const u = Number(used);
    if (!u) {
      toast.warning("Informe o valor consumido nesta iniciativa.");
      return;
    }
    const consumedSoFar = getItemConsumed(allProjects, selection.item.id);
    const available = selection.item.totalValue - consumedSoFar;
    if (u > available) {
      toast.error("Valor excede o saldo disponível do item", {
        description: `Disponível: ${brl(available)}.`,
      });
      return;
    }
    addThirdParty(project.id, {
      id: crypto.randomUUID(),
      company: selection.invoice.companyName,
      cnpj: selection.invoice.cnpj,
      invoice: selection.invoice.invoiceNumber,
      invoiceTotal: selection.item.totalValue,
      usedInProject: u,
      invoiceId: selection.invoice.id,
      itemId: selection.item.id,
    });
    clearSelection();
    setPickerKey((k) => k + 1);
    toast.success("Serviço adicionado.");
  };

  // Quanto já foi consumido por OUTROS projetos (exclui o próprio lançamento).
  const otherProjectsConsumption = (e: Project["thirdParties"][number]) => {
    if (!e.itemId) return e.allocatedElsewhere ?? 0;
    return getItemConsumed(allProjects, e.itemId) - e.usedInProject;
  };

  const requestAdjustment = (expenseId: string, comment: string) => {
    addDespesaAdjustment(project.id, {
      id: crypto.randomUUID(),
      expenseType: "thirdParty",
      expenseId,
      comment,
      createdAt: new Date().toISOString(),
    });
    toast.success("Ajuste solicitado ao Financeiro.");
  };

  return (
    <div className="space-y-4">
      {!readOnly && (
        <div className="space-y-3 rounded-lg border border-border bg-surface p-4">
          <h4 className="text-sm font-semibold">Adicionar serviço de terceiro</h4>
          <InvoiceItemPicker
            key={pickerKey}
            onSelect={(invoice, item) => setSelection({ invoice, item })}
            onClear={clearSelection}
          />
          {selection && (
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-2">
                <Label>Valor consumido nesta iniciativa (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={used}
                  onChange={(e) => setUsed(e.target.value)}
                />
              </div>
              <Button className="gap-2" onClick={submit}>
                <Plus className="size-4" /> Adicionar
              </Button>
            </div>
          )}
        </div>
      )}

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
              {!readOnly && <TableHead className="w-10" />}
              {canRequestAdjustment && <TableHead className="w-10" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {project.thirdParties.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6 + (!readOnly || canRequestAdjustment ? 1 : 0)}
                  className="h-20 text-center text-sm text-muted-foreground"
                >
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
                  {brl(otherProjectsConsumption(e))}
                </TableCell>
                {!readOnly && (
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
                )}
                {canRequestAdjustment && (
                  <TableCell>
                    <RequestAdjustmentButton
                      onSubmit={(comment) => requestAdjustment(e.id, comment)}
                    />
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

function MaterialsTab({
  project,
  readOnly,
  canRequestAdjustment,
}: {
  project: Project;
  readOnly?: boolean;
  canRequestAdjustment?: boolean;
}) {
  const addMaterial = useProjectsStore((s) => s.addMaterial);
  const removeMaterial = useProjectsStore((s) => s.removeMaterial);
  const addDespesaAdjustment = useProjectsStore((s) => s.addDespesaAdjustment);
  const allProjects = useProjectsStore((s) => s.projects);
  const [selection, setSelection] = useState<{ invoice: Invoice; item: InvoiceItem } | null>(null);
  const [used, setUsed] = useState("");
  const [usage, setUsage] = useState("");
  // Força o InvoiceItemPicker (não controlado) a remontar do zero após um
  // lançamento, já que ele mantém a seleção em estado próprio.
  const [pickerKey, setPickerKey] = useState(0);

  const clearSelection = () => {
    setSelection(null);
    setUsed("");
    setUsage("");
  };

  const submit = () => {
    if (!selection) {
      toast.warning("Busque o CNPJ e selecione um item da nota fiscal.");
      return;
    }
    const net = Number(used);
    if (!net) {
      toast.warning("Informe o valor líquido consumido nesta iniciativa.");
      return;
    }
    const consumedSoFar = getItemConsumed(allProjects, selection.item.id);
    const available = selection.item.totalValue - consumedSoFar;
    if (net > available) {
      toast.error("Valor excede o saldo disponível do item", {
        description: `Disponível: ${brl(available)}.`,
      });
      return;
    }
    addMaterial(project.id, {
      id: crypto.randomUUID(),
      supplier: selection.invoice.companyName,
      cnpj: selection.invoice.cnpj,
      invoice: selection.invoice.invoiceNumber,
      grossValue: selection.item.totalValue,
      netValue: net,
      materialDescription: selection.item.description,
      usageDescription: usage,
      invoiceId: selection.invoice.id,
      itemId: selection.item.id,
    });
    clearSelection();
    setPickerKey((k) => k + 1);
    toast.success("Material adicionado.");
  };

  const otherProjectsConsumption = (m: Project["materials"][number]) => {
    if (!m.itemId) return 0;
    return getItemConsumed(allProjects, m.itemId) - m.netValue;
  };

  const requestAdjustment = (expenseId: string, comment: string) => {
    addDespesaAdjustment(project.id, {
      id: crypto.randomUUID(),
      expenseType: "material",
      expenseId,
      comment,
      createdAt: new Date().toISOString(),
    });
    toast.success("Ajuste solicitado ao Financeiro.");
  };

  return (
    <div className="space-y-4">
      {!readOnly && (
        <div className="space-y-3 rounded-lg border border-border bg-surface p-4">
          <h4 className="text-sm font-semibold">Adicionar material</h4>
          <InvoiceItemPicker
            key={pickerKey}
            onSelect={(invoice, item) => setSelection({ invoice, item })}
            onClear={clearSelection}
          />
          {selection && (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Valor líquido consumido nesta iniciativa (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={used}
                  onChange={(e) => setUsed(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição da utilização na iniciativa</Label>
                <Input
                  value={usage}
                  onChange={(e) => setUsage(e.target.value)}
                  placeholder="Ex.: Prototipagem de módulo de aquisição de dados"
                />
              </div>
              <div className="md:col-span-2">
                <Button className="gap-2" onClick={submit}>
                  <Plus className="size-4" /> Adicionar
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fornecedor</TableHead>
              <TableHead>NF</TableHead>
              <TableHead>Material</TableHead>
              <TableHead className="text-right">Bruto</TableHead>
              <TableHead className="text-right">Líquido</TableHead>
              <TableHead className="text-right">Outros projetos</TableHead>
              {!readOnly && <TableHead className="w-10" />}
              {canRequestAdjustment && <TableHead className="w-10" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {project.materials.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6 + (!readOnly || canRequestAdjustment ? 1 : 0)}
                  className="h-20 text-center text-sm text-muted-foreground"
                >
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
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {brl(otherProjectsConsumption(m))}
                </TableCell>
                {!readOnly && (
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
                )}
                {canRequestAdjustment && (
                  <TableCell>
                    <RequestAdjustmentButton
                      onSubmit={(comment) => requestAdjustment(m.id, comment)}
                    />
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

export function SectionDespesas({
  project,
  pendingItems,
  readOnly,
  canRequestAdjustment,
}: {
  project: Project;
  pendingItems?: AdjustmentItem[];
  // Despesas só são editáveis pelo Responsável Financeiro — Relator e Revisor
  // apenas visualizam os lançamentos já feitos.
  readOnly?: boolean;
  // Revisor em modo leitura: pode solicitar ajuste numa despesa específica,
  // devolvendo-a ao Financeiro sem afetar o status da iniciativa.
  canRequestAdjustment?: boolean;
}) {
  const resolveDespesaAdjustment = useProjectsStore((s) => s.resolveDespesaAdjustment);
  const despesaAdjustments = project.despesaAdjustments ?? [];

  const expenseLabel = (item: DespesaAdjustmentItem) => {
    if (item.expenseType === "thirdParty") {
      const e = project.thirdParties.find((x) => x.id === item.expenseId);
      return e ? `Serviço de terceiro — ${e.company}` : "Serviço de terceiro";
    }
    const m = project.materials.find((x) => x.id === item.expenseId);
    return m ? `Material — ${m.materialDescription}` : "Material";
  };

  return (
    <div className="max-w-5xl">
      <header className="mb-6">
        <h2 className="text-lg font-semibold tracking-tight">Despesas</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {readOnly
            ? "Despesas elegíveis lançadas pelo Responsável Financeiro: horas de funcionários, serviços de terceiros e materiais."
            : "Registre as despesas elegíveis vinculadas à iniciativa: horas de funcionários, serviços de terceiros e materiais."}
        </p>
      </header>

      {pendingItems && pendingItems.length > 0 && (
        <div className="mb-6 flex items-start gap-2 rounded-lg border border-status-adjust-fg/40 bg-status-adjust/5 p-4 text-sm text-status-adjust-fg">
          <AlertTriangle className="mt-1 size-4 shrink-0" />
          <div className="space-y-1">
            {pendingItems.map((item) => (
              <p key={item.id}>Ajuste solicitado: {item.comment}</p>
            ))}
          </div>
        </div>
      )}

      {!readOnly && despesaAdjustments.length > 0 && (
        <div className="mb-6 space-y-2 rounded-lg border border-status-adjust-fg/40 bg-status-adjust/5 p-4 text-sm text-status-adjust-fg">
          <div className="flex items-center gap-2 font-medium">
            <AlertTriangle className="size-4 shrink-0" /> Ajustes solicitados pelo Revisor
          </div>
          {despesaAdjustments.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-3">
              <p>
                <span className="font-medium">{expenseLabel(item)}:</span> {item.comment}
              </p>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 shrink-0 text-xs"
                onClick={() => resolveDespesaAdjustment(project.id, item.id)}
              >
                Marcar como resolvido
              </Button>
            </div>
          ))}
        </div>
      )}

      <Tabs defaultValue="funcionarios">
        <TabsList>
          <TabsTrigger value="funcionarios">Funcionários</TabsTrigger>
          <TabsTrigger value="terceiros">Serviços de Terceiros</TabsTrigger>
          <TabsTrigger value="materiais">Materiais</TabsTrigger>
        </TabsList>
        <TabsContent value="funcionarios" className="mt-4">
          <EmployeesTab project={project} readOnly={readOnly} />
        </TabsContent>
        <TabsContent value="terceiros" className="mt-4">
          <ThirdPartyTab
            project={project}
            readOnly={readOnly}
            canRequestAdjustment={canRequestAdjustment}
          />
        </TabsContent>
        <TabsContent value="materiais" className="mt-4">
          <MaterialsTab
            project={project}
            readOnly={readOnly}
            canRequestAdjustment={canRequestAdjustment}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
