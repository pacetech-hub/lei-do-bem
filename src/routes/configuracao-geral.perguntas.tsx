import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

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
import { useProjectsStore } from "@/lib/store";
import { SECTIONS, type SectionKey } from "@/lib/types";

export const Route = createFileRoute("/configuracao-geral/perguntas")({
  head: () => ({
    meta: [{ title: "Cadastro de perguntas — Configuração Geral | Lei do Bem" }],
  }),
  component: PerguntasPage,
});

// Etapas que usam perguntas individuais (as demais — evidências, despesas,
// recursos, revisão final — não têm perguntas cadastráveis).
const QUESTION_SECTIONS: SectionKey[] = ["inovador", "barreiras", "metodologia"];

function PerguntasPage() {
  const questions = useProjectsStore((s) => s.questions);
  const addQuestion = useProjectsStore((s) => s.addQuestion);
  const removeQuestion = useProjectsStore((s) => s.removeQuestion);

  const [sectionKey, setSectionKey] = useState<SectionKey>("inovador");
  const [label, setLabel] = useState("");

  const submit = () => {
    if (!label.trim()) {
      toast.error("Descreva a pergunta.");
      return;
    }
    addQuestion({ id: crypto.randomUUID(), sectionKey, label: label.trim() });
    setLabel("");
    toast.success("Pergunta cadastrada.");
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader current="Cadastro de perguntas" role="configuracaoGeral" />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <Link
          to="/configuracao-geral"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Configuração Geral
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Cadastro de perguntas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Perguntas utilizadas nas iniciativas, organizadas por etapa. As perguntas já existentes no
          sistema estão listadas abaixo.
        </p>

        <div className="mt-6 rounded-lg border border-border bg-surface p-4">
          <h4 className="mb-3 text-sm font-semibold">Adicionar pergunta</h4>
          <div className="grid gap-3 sm:grid-cols-[200px_1fr_auto]">
            <div className="space-y-2">
              <Label>Etapa</Label>
              <Select value={sectionKey} onValueChange={(v) => setSectionKey(v as SectionKey)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUESTION_SECTIONS.map((key) => (
                    <SelectItem key={key} value={key}>
                      {SECTIONS.find((s) => s.key === key)?.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Pergunta</Label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Descreva a pergunta"
              />
            </div>
            <div className="flex items-end">
              <Button className="w-full gap-2" onClick={submit}>
                <Plus className="size-4" /> Adicionar
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-6">
          {QUESTION_SECTIONS.map((key) => {
            const list = questions.filter((q) => q.sectionKey === key);
            return (
              <div key={key}>
                <h3 className="mb-2 text-sm font-semibold text-foreground">
                  {SECTIONS.find((s) => s.key === key)?.label}
                </h3>
                <div className="overflow-hidden rounded-lg border border-border bg-surface">
                  {list.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Nenhuma pergunta cadastrada.
                    </div>
                  ) : (
                    list.map((q) => (
                      <div
                        key={q.id}
                        className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 text-sm last:border-0"
                      >
                        <span>{q.label}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8 shrink-0"
                          onClick={() => removeQuestion(q.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
