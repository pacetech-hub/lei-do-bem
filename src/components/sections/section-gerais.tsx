import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Pencil, Save, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { useProjectsStore } from "@/lib/store";
import { AREAS, STATUS_LABEL, type Project } from "@/lib/types";

const NATUREZA = { produto: "Produto", processo: "Processo", servico: "Serviço" } as const;
const ATIVIDADE = {
  basica: "Pesquisa básica dirigida",
  aplicada: "Pesquisa aplicada",
  experimental: "Desenvolvimento experimental",
} as const;

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-border py-3 last:border-0 sm:grid-cols-[240px_1fr] sm:gap-4">
      <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{value}</dd>
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

export function SectionGerais({ project }: { project: Project }) {
  const updateProject = useProjectsStore((s) => s.updateProject);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormState>(() => toFormState(project));

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
        {!editing ? (
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
          <Row label="Nome do projeto" value={project.name} />
          <Row label="Área" value={project.area} />
          <Row label="Responsável" value={project.responsible} />
          <Row
            label="Data de início"
            value={format(new Date(project.startDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          />
          <Row
            label="Data prevista de término"
            value={format(new Date(project.endDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          />
          <Row
            label="Registro de patente"
            value={project.hasPatent ? `Sim — ${project.patentNumber ?? "não informado"}` : "Não"}
          />
          <Row label="Natureza" value={NATUREZA[project.natureza]} />
          <Row label="Atividade" value={ATIVIDADE[project.atividade]} />
          <Row label="Status atual" value={STATUS_LABEL[project.status]} />
        </dl>
      ) : (
        <div className="space-y-5 rounded-lg border border-border bg-surface p-5">
          <div className="space-y-1.5">
            <Label htmlFor="ge-name">Nome do projeto <span className="text-primary">*</span></Label>
            <Input
              id="ge-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Área <span className="text-primary">*</span></Label>
              <Select value={form.area} onValueChange={(v) => setForm({ ...form, area: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione a área" /></SelectTrigger>
                <SelectContent>
                  {AREAS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ge-resp">Responsável</Label>
              <Input
                id="ge-resp"
                value={form.responsible}
                onChange={(e) => setForm({ ...form, responsible: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ge-start">Data de início <span className="text-primary">*</span></Label>
              <Input
                id="ge-start"
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ge-end">Data prevista de término <span className="text-primary">*</span></Label>
              <Input
                id="ge-end"
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Natureza <span className="text-primary">*</span></Label>
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
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-3 py-2.5 text-sm transition-colors hover:border-primary/40 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
                >
                  <RadioGroupItem value={opt.v} /> {opt.l}
                </label>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-1.5 sm:max-w-md">
            <Label>Atividade <span className="text-primary">*</span></Label>
            <Select
              value={form.atividade}
              onValueChange={(v) => setForm({ ...form, atividade: v as Project["atividade"] })}
            >
              <SelectTrigger><SelectValue placeholder="Selecione a atividade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="basica">Pesquisa básica dirigida</SelectItem>
                <SelectItem value="aplicada">Pesquisa aplicada</SelectItem>
                <SelectItem value="experimental">Desenvolvimento experimental</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Registro de patente <span className="text-primary">*</span></Label>
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
                    className="flex flex-1 cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-3 py-2.5 text-sm transition-colors hover:border-primary/40 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
                  >
                    <RadioGroupItem value={opt.v} /> {opt.l}
                  </label>
                ))}
              </RadioGroup>
            </div>
            {form.hasPatent === "sim" && (
              <div className="space-y-1.5">
                <Label htmlFor="ge-patent">Número da patente <span className="text-primary">*</span></Label>
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
