import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertTriangle, Pencil, Save, Wrench, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { useProjectsStore } from "@/lib/store";
import { AREAS, STATUS_LABEL, type AdjustmentItem, type Project } from "@/lib/types";
import type { FieldMode } from "@/components/question-field";
import { cn } from "@/lib/utils";

const NATUREZA = { produto: "Produto", processo: "Processo", servico: "Serviço" } as const;
const ATIVIDADE = {
  basica: "Pesquisa básica dirigida",
  aplicada: "Pesquisa aplicada",
  experimental: "Desenvolvimento experimental",
} as const;

function Row({
  label,
  value,
  flag,
  draftFlags,
  canRequestAdjustment = false,
  onRequestAdjustment,
  onRemoveDraft,
}: {
  label: string;
  value: React.ReactNode;
  flag?: AdjustmentItem;
  draftFlags?: AdjustmentItem[];
  canRequestAdjustment?: boolean;
  onRequestAdjustment?: (comment: string) => void;
  onRemoveDraft?: (id: string) => void;
}) {
  const [requesting, setRequesting] = useState(false);
  const [comment, setComment] = useState("");
  const hasHighlight = Boolean(flag) || Boolean(draftFlags?.length);

  const submit = () => {
    if (!comment.trim()) return;
    onRequestAdjustment?.(comment.trim());
    setRequesting(false);
    setComment("");
  };

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-1 border-b border-border py-3 last:border-0 sm:grid-cols-[240px_1fr] sm:gap-4",
        hasHighlight &&
          "-mx-3 rounded-md border border-status-adjust-fg/40 bg-status-adjust/5 px-3",
      )}
    >
      <dt
        className={cn(
          "flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-muted-foreground",
          hasHighlight && "text-status-adjust-fg",
        )}
      >
        {hasHighlight && <AlertTriangle className="size-3 shrink-0" />}
        {label}
      </dt>
      <dd className="text-sm text-foreground">
        <div className="flex items-start justify-between gap-2">
          <div>{value}</div>
          {canRequestAdjustment && !requesting && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 shrink-0 gap-1 px-2 text-xs text-status-adjust-fg hover:bg-status-adjust/10 hover:text-status-adjust-fg"
              onClick={() => setRequesting(true)}
            >
              <Wrench className="size-3" /> Solicitar ajuste
            </Button>
          )}
        </div>
        {flag && (
          <p className="mt-1 text-xs font-medium text-status-adjust-fg">
            Ajuste solicitado: {flag.comment}
          </p>
        )}
        {draftFlags?.map((item) => (
          <div
            key={item.id}
            className="mt-2 flex items-start justify-between gap-2 rounded-md border border-dashed border-status-adjust-fg/40 bg-background/70 p-2 text-xs text-status-adjust-fg"
          >
            <span>
              <span className="font-medium">Ajuste registrado</span> (será enviado ao final da
              revisão): {item.comment}
            </span>
            <button
              type="button"
              onClick={() => onRemoveDraft?.(item.id)}
              className="shrink-0 text-status-adjust-fg/70 hover:text-status-adjust-fg"
              aria-label="Remover solicitação"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
        {requesting && (
          <div className="mt-2 space-y-2">
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              placeholder="Descreva o que precisa ser corrigido."
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setRequesting(false);
                  setComment("");
                }}
              >
                Cancelar
              </Button>
              <Button type="button" size="sm" disabled={!comment.trim()} onClick={submit}>
                Registrar solicitação
              </Button>
            </div>
          </div>
        )}
      </dd>
    </div>
  );
}

interface FormState {
  name: string;
  area: string;
  responsible: string;
  startDate: string;
  endDate: string;
  hasPatent: "sim" | "nao";
  patentNumber: string;
  natureza: Project["natureza"];
  atividade: Project["atividade"];
}

function toFormState(p: Project): FormState {
  return {
    name: p.name,
    area: p.area,
    responsible: p.responsible,
    startDate: p.startDate.slice(0, 10),
    endDate: p.endDate.slice(0, 10),
    hasPatent: p.hasPatent ? "sim" : "nao",
    patentNumber: p.patentNumber ?? "",
    natureza: p.natureza,
    atividade: p.atividade,
  };
}

export function SectionGerais({
  project,
  pendingItems,
  mode = "editable",
  draftItems,
  onAddDraftAdjustment,
  onRemoveDraftAdjustment,
}: {
  project: Project;
  pendingItems?: AdjustmentItem[];
  mode?: FieldMode;
  draftItems?: AdjustmentItem[];
  onAddDraftAdjustment?: (fieldId: string, fieldLabel: string, comment: string) => void;
  onRemoveDraftAdjustment?: (id: string) => void;
}) {
  const updateProject = useProjectsStore((s) => s.updateProject);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormState>(() => toFormState(project));

  const canRequestAdjustment = mode === "review";
  const flagFor = (fieldId: string) => pendingItems?.find((i) => i.fieldId === fieldId);
  const draftFlagsFor = (fieldId: string) => draftItems?.filter((i) => i.fieldId === fieldId);

  const startEdit = () => {
    setForm(toFormState(project));
    setEditing(true);
  };

  const cancelEdit = () => {
    setForm(toFormState(project));
    setEditing(false);
  };

  const save = () => {
    if (form.name.trim().length < 3) {
      toast.error("Informe um nome com pelo menos 3 caracteres.");
      return;
    }
    if (!form.area) {
      toast.error("Selecione a área do projeto.");
      return;
    }
    if (!form.startDate || !form.endDate) {
      toast.error("Informe as datas de início e término.");
      return;
    }
    if (new Date(form.endDate) < new Date(form.startDate)) {
      toast.error("A data de término deve ser posterior à data de início.");
      return;
    }
    if (form.hasPatent === "sim" && !form.patentNumber.trim()) {
      toast.error("Informe o número da patente.");
      return;
    }

    updateProject(project.id, {
      name: form.name.trim(),
      area: form.area,
      responsible: form.responsible.trim(),
      startDate: new Date(form.startDate).toISOString(),
      endDate: new Date(form.endDate).toISOString(),
      hasPatent: form.hasPatent === "sim",
      patentNumber: form.hasPatent === "sim" ? form.patentNumber.trim() : undefined,
      natureza: form.natureza,
      atividade: form.atividade,
    });

    toast.success("Informações atualizadas.");
    setEditing(false);
  };

  return (
    <div className="max-w-3xl">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Informações Gerais</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Dados de identificação do projeto informados na criação.
          </p>
        </div>
        {mode === "locked" ? null : !editing ? (
          <Button variant="outline" size="sm" className="gap-2" onClick={startEdit}>
            <Pencil className="size-4" /> Editar
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="gap-2" onClick={cancelEdit}>
              <X className="size-4" /> Cancelar
            </Button>
            <Button size="sm" className="gap-2" onClick={save}>
              <Save className="size-4" /> Salvar
            </Button>
          </div>
        )}
      </header>

      {!editing ? (
        <dl className="rounded-lg border border-border bg-surface px-5">
          <Row
            label="Nome do projeto"
            value={project.name}
            flag={flagFor("name")}
            draftFlags={draftFlagsFor("name")}
            canRequestAdjustment={canRequestAdjustment}
            onRequestAdjustment={(c) => onAddDraftAdjustment?.("name", "Nome do projeto", c)}
            onRemoveDraft={onRemoveDraftAdjustment}
          />
          <Row
            label="Área"
            value={project.area}
            flag={flagFor("area")}
            draftFlags={draftFlagsFor("area")}
            canRequestAdjustment={canRequestAdjustment}
            onRequestAdjustment={(c) => onAddDraftAdjustment?.("area", "Área", c)}
            onRemoveDraft={onRemoveDraftAdjustment}
          />
          <Row
            label="Responsável"
            value={project.responsible}
            flag={flagFor("responsible")}
            draftFlags={draftFlagsFor("responsible")}
            canRequestAdjustment={canRequestAdjustment}
            onRequestAdjustment={(c) => onAddDraftAdjustment?.("responsible", "Responsável", c)}
            onRemoveDraft={onRemoveDraftAdjustment}
          />
          <Row
            label="Data de início"
            value={format(new Date(project.startDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            flag={flagFor("startDate")}
            draftFlags={draftFlagsFor("startDate")}
            canRequestAdjustment={canRequestAdjustment}
            onRequestAdjustment={(c) => onAddDraftAdjustment?.("startDate", "Data de início", c)}
            onRemoveDraft={onRemoveDraftAdjustment}
          />
          <Row
            label="Data prevista de término"
            value={format(new Date(project.endDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            flag={flagFor("endDate")}
            draftFlags={draftFlagsFor("endDate")}
            canRequestAdjustment={canRequestAdjustment}
            onRequestAdjustment={(c) =>
              onAddDraftAdjustment?.("endDate", "Data prevista de término", c)
            }
            onRemoveDraft={onRemoveDraftAdjustment}
          />
          <Row
            label="Registro de patente"
            value={project.hasPatent ? `Sim — ${project.patentNumber ?? "não informado"}` : "Não"}
            flag={flagFor("hasPatent")}
            draftFlags={draftFlagsFor("hasPatent")}
            canRequestAdjustment={canRequestAdjustment}
            onRequestAdjustment={(c) =>
              onAddDraftAdjustment?.("hasPatent", "Registro de patente", c)
            }
            onRemoveDraft={onRemoveDraftAdjustment}
          />
          <Row
            label="Natureza"
            value={NATUREZA[project.natureza]}
            flag={flagFor("natureza")}
            draftFlags={draftFlagsFor("natureza")}
            canRequestAdjustment={canRequestAdjustment}
            onRequestAdjustment={(c) => onAddDraftAdjustment?.("natureza", "Natureza", c)}
            onRemoveDraft={onRemoveDraftAdjustment}
          />
          <Row
            label="Atividade"
            value={ATIVIDADE[project.atividade]}
            flag={flagFor("atividade")}
            draftFlags={draftFlagsFor("atividade")}
            canRequestAdjustment={canRequestAdjustment}
            onRequestAdjustment={(c) => onAddDraftAdjustment?.("atividade", "Atividade", c)}
            onRemoveDraft={onRemoveDraftAdjustment}
          />
          <Row label="Status atual" value={STATUS_LABEL[project.status]} />
        </dl>
      ) : (
        <div className="space-y-5 rounded-lg border border-border bg-surface p-5">
          <div className="space-y-2">
            <Label htmlFor="ge-name">
              Nome do projeto <span className="text-primary">*</span>
            </Label>
            <Input
              id="ge-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>
                Área <span className="text-primary">*</span>
              </Label>
              <Select value={form.area} onValueChange={(v) => setForm({ ...form, area: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a área" />
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
            <div className="space-y-2">
              <Label htmlFor="ge-resp">Responsável</Label>
              <Input
                id="ge-resp"
                value={form.responsible}
                onChange={(e) => setForm({ ...form, responsible: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ge-start">
                Data de início <span className="text-primary">*</span>
              </Label>
              <Input
                id="ge-start"
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ge-end">
                Data prevista de término <span className="text-primary">*</span>
              </Label>
              <Input
                id="ge-end"
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>
              Natureza <span className="text-primary">*</span>
            </Label>
            <RadioGroup
              value={form.natureza}
              onValueChange={(v) => setForm({ ...form, natureza: v as Project["natureza"] })}
              className="grid gap-2 sm:grid-cols-3"
            >
              {[
                { v: "produto", l: "Produto" },
                { v: "processo", l: "Processo" },
                { v: "servico", l: "Serviço" },
              ].map((opt) => (
                <label
                  key={opt.v}
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-3 py-3 text-sm transition-colors hover:border-primary/40 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
                >
                  <RadioGroupItem value={opt.v} /> {opt.l}
                </label>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2 sm:max-w-md">
            <Label>
              Atividade <span className="text-primary">*</span>
            </Label>
            <Select
              value={form.atividade}
              onValueChange={(v) => setForm({ ...form, atividade: v as Project["atividade"] })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a atividade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basica">Pesquisa básica dirigida</SelectItem>
                <SelectItem value="aplicada">Pesquisa aplicada</SelectItem>
                <SelectItem value="experimental">Desenvolvimento experimental</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>
                Registro de patente <span className="text-primary">*</span>
              </Label>
              <RadioGroup
                value={form.hasPatent}
                onValueChange={(v) => setForm({ ...form, hasPatent: v as "sim" | "nao" })}
                className="flex gap-2"
              >
                {[
                  { v: "sim", l: "Sim" },
                  { v: "nao", l: "Não" },
                ].map((opt) => (
                  <label
                    key={opt.v}
                    className="flex flex-1 cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-3 py-3 text-sm transition-colors hover:border-primary/40 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
                  >
                    <RadioGroupItem value={opt.v} /> {opt.l}
                  </label>
                ))}
              </RadioGroup>
            </div>
            {form.hasPatent === "sim" && (
              <div className="space-y-2">
                <Label htmlFor="ge-patent">
                  Número da patente <span className="text-primary">*</span>
                </Label>
                <Input
                  id="ge-patent"
                  value={form.patentNumber}
                  onChange={(e) => setForm({ ...form, patentNumber: e.target.value })}
                  placeholder="Ex.: BR102023000123-4"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
