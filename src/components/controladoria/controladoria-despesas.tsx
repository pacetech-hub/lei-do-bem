import { useState } from "react";
import { AlertTriangle, CheckCircle2, MessageSquareWarning, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProjectsStore } from "@/lib/store";
import { getItemConsumed } from "@/lib/invoices";
import {
  decisionFor,
  despesaFoiAlterada,
  valorConsiderado,
  valorTotalInformado,
  type DespesaRef,
} from "@/lib/controladoria";
import {
  ROLE_USERS,
  type DespesaDecisionStatus,
  type EmployeeExpense,
  type MaterialExpense,
  type Project,
  type ThirdPartyExpense,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const DECISION_LABEL: Record<DespesaDecisionStatus, string> = {
  validada: "Validada",
  pendencia: "Com pendência",
  excluida: "Excluída",
};

const DECISION_CLASS: Record<DespesaDecisionStatus, string> = {
  validada: "bg-status-ready text-status-ready-fg",
  pendencia: "bg-status-adjust text-status-adjust-fg",
  excluida: "bg-surface-muted text-muted-foreground",
};

// Popover com campo de comentário obrigatório, reaproveitado tanto para
// "Sinalizar pendência" quanto para "Excluir despesa" (ambos exigem
// justificativa) — só muda rótulo/ação. Gatilho compacto (ícone) para caber
// na coluna de decisão da tabela.
function JustificationPopover({
  label,
  placeholder,
  confirmLabel,
  icon: Icon,
  tone,
  defaultValue,
  onConfirm,
}: {
  label: string;
  placeholder: string;
  confirmLabel: string;
  icon: typeof MessageSquareWarning;
  tone: "warning" | "destructive";
  defaultValue?: string;
  onConfirm: (comment: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState(defaultValue ?? "");

  const submit = () => {
    if (!comment.trim()) {
      toast.error("Descreva a justificativa.");
      return;
    }
    onConfirm(comment.trim());
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) setComment(defaultValue ?? "");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className={cn(
            "size-7",
            tone === "destructive" && "text-destructive hover:text-destructive",
          )}
          aria-label={label}
        >
          <Icon className="size-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 space-y-2">
        <Label>{label}</Label>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={placeholder}
          rows={3}
        />
        <Button size="sm" className="w-full" onClick={submit}>
          {confirmLabel}
        </Button>
      </PopoverContent>
    </Popover>
  );
}

// Coluna de decisão compartilhada pelas três tabelas de despesa — mostra a
// decisão atual (se houver), o alerta de valor alterado desde a última
// análise e, quando editável, os três controles (validar/pendência/excluir).
function DecisionCell({
  project,
  despesa,
  readOnly,
}: {
  project: Project;
  despesa: DespesaRef;
  readOnly?: boolean;
}) {
  const setDespesaDecision = useProjectsStore((s) => s.setDespesaDecision);
  const decision = decisionFor(project, despesa.id);
  const alterada = despesaFoiAlterada(project, despesa);

  const record = (status: DespesaDecisionStatus, comment?: string) => {
    const historyDescription =
      status === "validada"
        ? `validou a despesa "${despesa.title}"`
        : status === "pendencia"
          ? `sinalizou pendência na despesa "${despesa.title}": ${comment}`
          : `excluiu a despesa "${despesa.title}" da composição financeira: ${comment}`;
    setDespesaDecision(
      project.id,
      despesa.id,
      {
        status,
        comment,
        decidedAt: new Date().toISOString(),
        decidedBy: ROLE_USERS.controladoria.name,
        snapshotValue: despesa.value,
      },
      historyDescription,
    );
    toast.success(
      status === "validada"
        ? "Despesa validada."
        : status === "pendencia"
          ? "Pendência sinalizada."
          : "Despesa excluída da composição financeira.",
    );
  };

  return (
    <div className="flex flex-col items-start gap-1.5">
      {decision && (
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
            DECISION_CLASS[decision.status],
          )}
        >
          {DECISION_LABEL[decision.status]}
        </span>
      )}
      {alterada && (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-status-adjust-fg">
          <AlertTriangle className="size-3 shrink-0" /> Alterada
        </span>
      )}
      {!readOnly && (
        <div className="flex gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="size-7"
            aria-label="Validar"
            onClick={() => record("validada")}
          >
            <CheckCircle2 className="size-3.5" />
          </Button>
          <JustificationPopover
            label="Sinalizar pendência"
            placeholder="Descreva o problema identificado nesta despesa."
            confirmLabel="Registrar pendência"
            icon={MessageSquareWarning}
            tone="warning"
            defaultValue={decision?.status === "pendencia" ? decision.comment : undefined}
            onConfirm={(comment) => record("pendencia", comment)}
          />
          <JustificationPopover
            label="Excluir despesa"
            placeholder="Justifique a exclusão desta despesa da composição financeira."
            confirmLabel="Confirmar exclusão"
            icon={Trash2}
            tone="destructive"
            defaultValue={decision?.status === "excluida" ? decision.comment : undefined}
            onConfirm={(comment) => record("excluida", comment)}
          />
        </div>
      )}
      {decision?.status === "pendencia" && decision.financeiroResponse ? (
        <div className="max-w-[220px] space-y-0.5 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Nota devolvida</p>
          <p>
            <span className="font-medium">Pendência:</span> {decision.comment}
          </p>
          <p>
            <span className="font-medium">Ajustada:</span> {decision.financeiroResponse}
          </p>
        </div>
      ) : (
        decision?.comment && (
          <p className="max-w-[220px] text-xs text-muted-foreground">{decision.comment}</p>
        )
      )}
    </div>
  );
}

// As três tabelas abaixo espelham exatamente o formato/colunas das tabelas de
// Despesas do Responsável Financeiro (ver section-despesas.tsx) — mesma
// identidade visual, inclusive as abas, só trocando a coluna de ação
// (adicionar/remover) pela coluna de decisão da Controladoria.

function FuncionariosTable({ project, readOnly }: { project: Project; readOnly?: boolean }) {
  return (
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
            <TableHead>Decisão</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {project.employees.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="h-20 text-center text-sm text-muted-foreground">
                Nenhum colaborador lançado.
              </TableCell>
            </TableRow>
          )}
          {project.employees.map((e: EmployeeExpense) => (
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
                <DecisionCell
                  project={project}
                  despesa={{
                    id: e.id,
                    type: "funcionario",
                    title: `${e.name} — ${e.role}`,
                    detail: e.activity,
                    value: e.eligibleHours,
                  }}
                  readOnly={readOnly}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function TerceirosTable({ project, readOnly }: { project: Project; readOnly?: boolean }) {
  const allProjects = useProjectsStore((s) => s.projects);

  const otherProjectsConsumption = (e: ThirdPartyExpense) => {
    if (!e.itemId) return e.allocatedElsewhere ?? 0;
    return getItemConsumed(allProjects, e.itemId) - e.usedInProject;
  };

  return (
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
            <TableHead>Decisão</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {project.thirdParties.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="h-20 text-center text-sm text-muted-foreground">
                Nenhum serviço de terceiro lançado.
              </TableCell>
            </TableRow>
          )}
          {project.thirdParties.map((e: ThirdPartyExpense) => (
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
              <TableCell>
                <DecisionCell
                  project={project}
                  despesa={{
                    id: e.id,
                    type: "terceiro",
                    title: e.company,
                    detail: `NF ${e.invoice}`,
                    value: e.usedInProject,
                  }}
                  readOnly={readOnly}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function MateriaisTable({ project, readOnly }: { project: Project; readOnly?: boolean }) {
  const allProjects = useProjectsStore((s) => s.projects);

  const otherProjectsConsumption = (m: MaterialExpense) => {
    if (!m.itemId) return 0;
    return getItemConsumed(allProjects, m.itemId) - m.netValue;
  };

  return (
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
            <TableHead>Decisão</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {project.materials.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="h-20 text-center text-sm text-muted-foreground">
                Nenhum material lançado.
              </TableCell>
            </TableRow>
          )}
          {project.materials.map((m: MaterialExpense) => (
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
              <TableCell>
                <DecisionCell
                  project={project}
                  despesa={{
                    id: m.id,
                    type: "material",
                    title: m.supplier,
                    detail: m.materialDescription,
                    value: m.netValue,
                  }}
                  readOnly={readOnly}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function ControladoriaDespesas({
  project,
  readOnly,
}: {
  project: Project;
  readOnly?: boolean;
}) {
  return (
    <div>
      <div className="mb-4 grid gap-4 rounded-lg border border-border bg-surface p-4 sm:grid-cols-2">
        <div>
          <div className="text-xs text-muted-foreground">Valor total informado</div>
          <div className="text-xl font-semibold tabular-nums tracking-tight">
            {brl(valorTotalInformado(project))}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Considerado na composição financeira</div>
          <div className="text-xl font-semibold tabular-nums tracking-tight">
            {brl(valorConsiderado(project))}
          </div>
        </div>
      </div>

      <Tabs defaultValue="funcionarios">
        <TabsList className="mb-4">
          <TabsTrigger value="funcionarios">Funcionários</TabsTrigger>
          <TabsTrigger value="terceiros">Serviços de Terceiros</TabsTrigger>
          <TabsTrigger value="materiais">Materiais</TabsTrigger>
        </TabsList>
        <TabsContent value="funcionarios">
          <FuncionariosTable project={project} readOnly={readOnly} />
        </TabsContent>
        <TabsContent value="terceiros">
          <TerceirosTable project={project} readOnly={readOnly} />
        </TabsContent>
        <TabsContent value="materiais">
          <MateriaisTable project={project} readOnly={readOnly} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
