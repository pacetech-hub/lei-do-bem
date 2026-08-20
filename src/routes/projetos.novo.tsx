import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  FileText,
  Layers,
  Calendar as CalendarIcon,
  ShieldCheck,
  File,
  Copy,
  Search,
  ArrowLeft,
} from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AREAS, CURRENT_USER } from "@/lib/types";
import { useProjectsStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/projetos/novo")({
  head: () => ({
    meta: [
      { title: "Nova iniciativa — Lei do Bem" },
      { name: "description", content: "Cadastre as informações iniciais da iniciativa." },
    ],
  }),
  component: NovoProjetoPage,
});

const schema = z
  .object({
    name: z.string().trim().min(3, "Informe um nome com pelo menos 3 caracteres").max(160),
    area: z.string().min(1, "Selecione a área"),
    natureza: z.enum(["produto", "processo", "servico"]),
    atividade: z.enum(["basica", "aplicada", "experimental"]),
    startDate: z.string().min(1, "Informe a data de início"),
    endDate: z.string().min(1, "Informe a data prevista de término"),
    hasPatent: z.enum(["sim", "nao"]),
    patentNumber: z.string().optional(),
  })
  .refine((v) => v.hasPatent === "nao" || (v.patentNumber && v.patentNumber.trim().length > 0), {
    message: "Informe o número da patente",
    path: ["patentNumber"],
  })
  .refine((v) => !v.startDate || !v.endDate || new Date(v.endDate) >= new Date(v.startDate), {
    message: "Deve ser posterior à data de início",
    path: ["endDate"],
  });

type FormValues = z.infer<typeof schema>;

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-surface">
      <header className="flex items-start gap-3 border-b border-border px-6 py-4">
        <span className="mt-1 grid size-8 place-items-center rounded-md bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
        </div>
      </header>
      <div className="px-6 py-5">{children}</div>
    </section>
  );
}

function NovoProjetoPage() {
  const navigate = useNavigate();
  const createProject = useProjectsStore((s) => s.createProject);
  const updateProject = useProjectsStore((s) => s.updateProject);
  const allProjects = useProjectsStore((s) => s.projects);

  const [step, setStep] = useState<"escolha" | "duplicar" | "form">("escolha");
  const [duplicateQuery, setDuplicateQuery] = useState("");
  const [duplicateSourceId, setDuplicateSourceId] = useState<string | null>(null);

  const duplicateCandidates = useMemo(
    () =>
      allProjects
        .filter((p) => p.projectType === "independente")
        .filter(
          (p) => !duplicateQuery || p.name.toLowerCase().includes(duplicateQuery.toLowerCase()),
        ),
    [allProjects, duplicateQuery],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      area: "",
      natureza: "produto",
      atividade: "experimental",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: "",
      hasPatent: "nao",
      patentNumber: "",
    },
  });

  const hasPatent = form.watch("hasPatent");
  const errors = form.formState.errors;

  const buildPayload = (v: FormValues) => ({
    name: v.name.trim(),
    area: v.area,
    responsible: CURRENT_USER.name,
    startDate: new Date(v.startDate).toISOString(),
    endDate: new Date(v.endDate).toISOString(),
    hasPatent: v.hasPatent === "sim",
    patentNumber: v.hasPatent === "sim" ? v.patentNumber : undefined,
    natureza: v.natureza,
    atividade: v.atividade,
    projectType: "independente" as const,
  });

  const onSubmit = (v: FormValues) => {
    const id = createProject(buildPayload(v));
    toast.success("Iniciativa criada", {
      description: "Continue com o preenchimento da ficha técnica.",
    });
    navigate({ to: "/projetos/$id", params: { id } });
  };

  const onSaveDraft = () => {
    const v = form.getValues();
    if (!v.name.trim() || !v.area) {
      form.trigger(["name", "area"]);
      toast.error("Preencha o nome e a área para salvar o rascunho.");
      return;
    }
    const id = createProject({
      name: v.name.trim(),
      area: v.area,
      responsible: CURRENT_USER.name,
      startDate: v.startDate ? new Date(v.startDate).toISOString() : new Date().toISOString(),
      endDate: v.endDate ? new Date(v.endDate).toISOString() : new Date().toISOString(),
      hasPatent: v.hasPatent === "sim",
      patentNumber: v.hasPatent === "sim" ? v.patentNumber : undefined,
      natureza: v.natureza,
      atividade: v.atividade,
      projectType: "independente",
    });
    toast.success("Rascunho salvo", { description: "Você pode retomar o projeto pelo dashboard." });
    navigate({ to: "/dashboard" });
    void id;
  };

  const handleDuplicate = (sourceId: string) => {
    const source = allProjects.find((p) => p.id === sourceId);
    if (!source) return;
    const id = createProject({
      name: `${source.name} (cópia)`,
      area: source.area,
      responsible: CURRENT_USER.name,
      startDate: source.startDate,
      endDate: source.endDate,
      hasPatent: source.hasPatent,
      patentNumber: source.patentNumber,
      natureza: source.natureza,
      atividade: source.atividade,
      projectType: "independente",
    });
    updateProject(id, {
      answers: { ...source.answers },
      attachments: { ...source.attachments },
      employees: source.employees.map((e) => ({ ...e, id: crypto.randomUUID() })),
      thirdParties: source.thirdParties.map((e) => ({ ...e, id: crypto.randomUUID() })),
      materials: source.materials.map((e) => ({ ...e, id: crypto.randomUUID() })),
    });
    toast.success("Iniciativa duplicada", {
      description: "Revise e ajuste as informações antes de enviar para revisão.",
    });
    navigate({ to: "/projetos/$id", params: { id } });
  };

  if (step === "escolha") {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader current="Nova iniciativa" role="relator" />
        <main className="mx-auto max-w-4xl px-6 py-8">
          <header className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Criar uma nova iniciativa
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Comece do zero ou duplique uma iniciativa existente para aproveitar informações já
              preenchidas.
            </p>
          </header>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setStep("form")}
              className="flex flex-col items-start gap-2 rounded-lg border border-border bg-surface p-4 text-left transition-colors hover:border-primary/40"
            >
              <span className="grid size-9 place-items-center rounded-md bg-surface-muted text-muted-foreground">
                <File className="size-4.5" />
              </span>
              <span className="text-sm font-semibold text-foreground">Iniciativa nova</span>
              <span className="text-xs text-muted-foreground">
                Cadastre uma iniciativa do zero, preenchendo as informações iniciais.
              </span>
            </button>
            <button
              type="button"
              onClick={() => setStep("duplicar")}
              className="flex flex-col items-start gap-2 rounded-lg border border-border bg-surface p-4 text-left transition-colors hover:border-primary/40"
            >
              <span className="grid size-9 place-items-center rounded-md bg-surface-muted text-muted-foreground">
                <Copy className="size-4.5" />
              </span>
              <span className="text-sm font-semibold text-foreground">Duplicar iniciativa</span>
              <span className="text-xs text-muted-foreground">
                Selecione uma iniciativa existente para copiar suas informações.
              </span>
            </button>
          </div>

          <div className="mt-8">
            <Button asChild variant="ghost" type="button">
              <Link to="/dashboard">Cancelar</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (step === "duplicar") {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader current="Nova iniciativa" role="relator" />
        <main className="mx-auto max-w-2xl px-6 py-8">
          <header className="mb-6">
            <button
              type="button"
              onClick={() => setStep("escolha")}
              className="mb-3 inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" /> Voltar
            </button>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Duplicar iniciativa
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Selecione a iniciativa existente que servirá de base para a nova cópia.
            </p>
          </header>

          <div className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={duplicateQuery}
                onChange={(e) => setDuplicateQuery(e.target.value)}
                placeholder="Buscar por nome da iniciativa…"
                className="h-9 pl-8"
              />
            </div>
            <div className="max-h-96 space-y-1 overflow-y-auto rounded-md border border-border p-2">
              {duplicateCandidates.length === 0 ? (
                <p className="p-2 text-sm text-muted-foreground">
                  Nenhuma iniciativa disponível para duplicar.
                </p>
              ) : (
                duplicateCandidates.map((p) => (
                  <label
                    key={p.id}
                    className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-surface-muted"
                  >
                    <input
                      type="radio"
                      name="duplicate-source"
                      className="size-4 accent-primary"
                      checked={duplicateSourceId === p.id}
                      onChange={() => setDuplicateSourceId(p.id)}
                    />
                    <span className="flex-1 truncate text-foreground">{p.name}</span>
                    <span className="text-xs text-muted-foreground">{p.area}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between">
            <Button asChild variant="ghost" type="button">
              <Link to="/dashboard">Cancelar</Link>
            </Button>
            <Button
              type="button"
              disabled={!duplicateSourceId}
              onClick={() => duplicateSourceId && handleDuplicate(duplicateSourceId)}
            >
              Duplicar iniciativa
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader current="Nova iniciativa" role="relator" />
      <main className="mx-auto max-w-4xl px-6 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Nova iniciativa</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Cadastre as informações iniciais da iniciativa para começar o preenchimento da
            documentação técnica.
          </p>
          <button
            type="button"
            onClick={() => setStep("escolha")}
            className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" /> Voltar
          </button>
        </header>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* Card 1 — Identificação */}
          <SectionCard
            icon={FileText}
            title="Identificação da Iniciativa"
            description="Dados básicos que identificam a iniciativa internamente."
          >
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nome da iniciativa <span className="text-primary">*</span>
                </Label>
                <Input
                  id="name"
                  {...form.register("name")}
                  placeholder="Digite o nome da iniciativa de inovação"
                />
                {errors.name && <p className="text-xs text-primary">{errors.name.message}</p>}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>
                    Área da iniciativa <span className="text-primary">*</span>
                  </Label>
                  <Select
                    value={form.watch("area")}
                    onValueChange={(v) => form.setValue("area", v, { shouldValidate: true })}
                  >
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
                  {errors.area && <p className="text-xs text-primary">{errors.area.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Responsável pela iniciativa</Label>
                  <Input value={CURRENT_USER.name} disabled readOnly />
                  <p className="text-xs text-muted-foreground">
                    Preenchido automaticamente com o usuário logado.
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Card 2 — Classificação */}
          <SectionCard
            icon={Layers}
            title="Classificação da Iniciativa"
            description="Enquadramento da iniciativa conforme a Lei do Bem."
          >
            <div className="grid gap-6">
              <div className="space-y-2">
                <Label>
                  Natureza <span className="text-primary">*</span>
                </Label>
                <RadioGroup
                  value={form.watch("natureza")}
                  onValueChange={(v) => form.setValue("natureza", v as FormValues["natureza"])}
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
                  value={form.watch("atividade")}
                  onValueChange={(v) => form.setValue("atividade", v as FormValues["atividade"])}
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
            </div>
          </SectionCard>

          {/* Card 3 — Período */}
          <SectionCard
            icon={CalendarIcon}
            title="Período da Iniciativa"
            description="Vigência prevista para execução das atividades."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">
                  Data de início <span className="text-primary">*</span>
                </Label>
                <Input id="startDate" type="date" {...form.register("startDate")} />
                {errors.startDate && (
                  <p className="text-xs text-primary">{errors.startDate.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">
                  Data prevista de término <span className="text-primary">*</span>
                </Label>
                <Input id="endDate" type="date" {...form.register("endDate")} />
                {errors.endDate && <p className="text-xs text-primary">{errors.endDate.message}</p>}
              </div>
            </div>
          </SectionCard>

          {/* Card 4 — Patente */}
          <SectionCard
            icon={ShieldCheck}
            title="Registro de Patente"
            description="Informações sobre proteção intelectual associada à iniciativa."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>
                  Existe registro de patente relacionado à iniciativa?{" "}
                  <span className="text-primary">*</span>
                </Label>
                <RadioGroup
                  value={hasPatent}
                  onValueChange={(v) => form.setValue("hasPatent", v as "sim" | "nao")}
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
              {hasPatent === "sim" && (
                <div className="space-y-2">
                  <Label htmlFor="patentNumber">
                    Número da patente <span className="text-primary">*</span>
                  </Label>
                  <Input
                    id="patentNumber"
                    {...form.register("patentNumber")}
                    placeholder="Ex.: BR102023000123-4"
                  />
                  {errors.patentNumber && (
                    <p className="text-xs text-primary">{errors.patentNumber.message}</p>
                  )}
                </div>
              )}
            </div>
          </SectionCard>

          {/* Rodapé de ações */}
          <div className="sticky bottom-0 -mx-6 border-t border-border bg-background/95 px-6 py-4 backdrop-blur sm:mx-0 sm:rounded-lg sm:border">
            <div className="flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
              <p className="text-xs text-muted-foreground">
                Ao criar, a iniciativa receberá o status{" "}
                <span className="font-medium text-foreground">Rascunho</span>.
              </p>
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <Button asChild variant="ghost" type="button">
                  <Link to="/dashboard">Cancelar</Link>
                </Button>
                <Button variant="outline" type="button" onClick={onSaveDraft}>
                  Salvar rascunho
                </Button>
                <Button type="submit">Salvar e continuar</Button>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
