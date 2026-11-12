import { useState } from "react";
import { AlertTriangle, CheckCircle2, MessageSquareWarning, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { useProjectsStore } from "@/lib/store";
import {
  decisionFor,
  despesaFoiAlterada,
  despesaRefs,
  valorConsiderado,
  valorTotalInformado,
  type DespesaRef,
} from "@/lib/controladoria";
import { ROLE_USERS, type DespesaDecisionStatus, type Project } from "@/lib/types";
import { cn } from "@/lib/utils";

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const GROUP_LABEL: Record<DespesaRef["type"], string> = {
  funcionario: "Funcionários",
  terceiro: "Terceiros",
  material: "Materiais",
};

const DECISION_LABEL: Record<DespesaDecisionStatus, string> = {
  validada: "Validada",
  pendencia: "Pendência",
  excluida: "Excluída",
};

const DECISION_CLASS: Record<DespesaDecisionStatus, string> = {
  validada: "bg-status-ready text-status-ready-fg",
  pendencia: "bg-status-adjust text-status-adjust-fg",
  excluida: "bg-surface-muted text-muted-foreground line-through decoration-1",
};

// Popover com campo de comentário obrigatório, reaproveitado tanto para
// "Sinalizar pendência" quanto para "Excluir despesa" (ambos exigem
// justificativa) — só muda rótulo/ação.
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
          size="sm"
          variant="outline"
          className={cn(
            "h-8 gap-1.5 text-xs",
            tone === "destructive" && "text-destructive hover:text-destructive",
          )}
        >
          <Icon className="size-3.5" /> {label}
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

function DespesaRow({
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
    setDespesaDecision(project.id, despesa.id, {
      status,
      comment,
      decidedAt: new Date().toISOString(),
      decidedBy: ROLE_USERS.controladoria.name,
      snapshotValue: despesa.value,
    });
    toast.success(
      status === "validada"
        ? "Despesa validada."
        : status === "pendencia"
          ? "Pendência sinalizada."
          : "Despesa excluída da composição financeira.",
    );
  };

  return (
    <div className="space-y-2 border-b border-border p-4 last:border-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-medium text-foreground">{despesa.title}</div>
          <div className="text-xs text-muted-foreground">{despesa.detail}</div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="text-right text-sm tabular-nums font-medium text-foreground">
            {despesa.type === "funcionario" ? `${despesa.value}h elegíveis` : brl(despesa.value)}
          </div>
          {decision && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
                DECISION_CLASS[decision.status],
              )}
            >
              {DECISION_LABEL[decision.status]}
            </span>
          )}
        </div>
      </div>

      {alterada && (
        <div className="flex items-center gap-1.5 text-xs font-medium text-status-adjust-fg">
          <AlertTriangle className="size-3.5 shrink-0" /> Valor alterado desde a última análise —
          confira novamente.
        </div>
      )}

      {decision?.comment && (
        <p className="rounded-md bg-surface-muted/60 p-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Justificativa:</span> {decision.comment}
        </p>
      )}

      {!readOnly && (
        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 text-xs"
            onClick={() => record("validada")}
          >
            <CheckCircle2 className="size-3.5" /> Validar
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
  const refs = despesaRefs(project);
  const groups: DespesaRef["type"][] = ["funcionario", "terceiro", "material"];

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

      {refs.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-8 text-center text-sm text-muted-foreground">
          Nenhuma despesa lançada pelo Responsável Financeiro.
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((type) => {
            const list = refs.filter((r) => r.type === type);
            if (list.length === 0) return null;
            return (
              <div key={type}>
                <h3 className="mb-2 text-sm font-semibold text-foreground">{GROUP_LABEL[type]}</h3>
                <div className="overflow-hidden rounded-lg border border-border bg-surface">
                  {list.map((despesa) => (
                    <DespesaRow
                      key={despesa.id}
                      project={project}
                      despesa={despesa}
                      readOnly={readOnly}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
