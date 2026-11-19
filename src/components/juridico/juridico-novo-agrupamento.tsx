import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Sparkles, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useProjectsStore } from "@/lib/store";
import { diretoriasDoAgrupamento, gerarSugestoesAgrupamento } from "@/lib/juridico";
import { JuridicoAgrupamentoForm } from "@/components/juridico/juridico-agrupamento-form";

type Step = "escolha" | "sugestoes" | "form";

// Mesmo modelo de escolha usado em "Nova iniciativa" do Relator (ver
// projetos.novo.tsx: Iniciativa nova / Duplicar iniciativa) — aqui aplicado à
// criação de um agrupamento: manualmente do zero, ou a partir de uma
// sugestão da IA ainda não revisada.
export function JuridicoNovoAgrupamento({ suggestionId }: { suggestionId?: string }) {
  const projects = useProjectsStore((s) => s.projects);
  const agrupamentos = useProjectsStore((s) => s.agrupamentos);

  const [step, setStep] = useState<Step>(suggestionId ? "form" : "escolha");
  const [chosenSuggestionId, setChosenSuggestionId] = useState<string | undefined>(suggestionId);

  const sugestoes = useMemo(
    () => gerarSugestoesAgrupamento(projects, agrupamentos),
    [projects, agrupamentos],
  );

  if (step === "form") {
    return <JuridicoAgrupamentoForm suggestionId={chosenSuggestionId} />;
  }

  if (step === "sugestoes") {
    return (
      <main className="mx-auto max-w-2xl px-6 py-8">
        <button
          type="button"
          onClick={() => setStep("escolha")}
          className="mb-3 inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Voltar
        </button>
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Agrupamento com IA
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Selecione uma sugestão de agrupamento identificada pela IA entre as iniciativas ainda
            não agrupadas.
          </p>
        </header>

        <div className="max-h-96 space-y-1 overflow-y-auto rounded-md border border-border p-2">
          {sugestoes.length === 0 ? (
            <p className="p-2 text-sm text-muted-foreground">
              Nenhuma sugestão da IA disponível no momento. Todas as iniciativas recebidas já fazem
              parte de um agrupamento, ou ainda não há relações suficientes entre as iniciativas
              pendentes.
            </p>
          ) : (
            sugestoes.map((s) => (
              <label
                key={s.id}
                className="flex cursor-pointer items-start gap-3 rounded-md px-2 py-2 text-sm hover:bg-surface-muted"
              >
                <input
                  type="radio"
                  name="suggestion-source"
                  className="mt-1 size-4 accent-primary"
                  checked={chosenSuggestionId === s.id}
                  onChange={() => setChosenSuggestionId(s.id)}
                />
                <span className="flex-1">
                  <span className="block font-medium text-foreground">{s.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {s.iniciativaIds.length} iniciativas ·{" "}
                    {diretoriasDoAgrupamento(s.iniciativaIds, projects).join(", ")}
                  </span>
                </span>
              </label>
            ))
          )}
        </div>

        <div className="mt-8 flex items-center justify-between">
          <Button asChild variant="ghost" type="button">
            <Link to="/juridico/agrupamentos">Cancelar</Link>
          </Button>
          <Button type="button" disabled={!chosenSuggestionId} onClick={() => setStep("form")}>
            Usar esta sugestão
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Novo agrupamento</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Crie um agrupamento manualmente ou utilize uma sugestão da IA como ponto de partida.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => {
            setChosenSuggestionId(undefined);
            setStep("form");
          }}
          className="flex flex-col items-start gap-2 rounded-lg border border-border bg-surface p-4 text-left transition-colors hover:border-primary/40"
        >
          <span className="grid size-9 place-items-center rounded-md bg-surface-muted text-muted-foreground">
            <Users className="size-4.5" />
          </span>
          <span className="text-sm font-semibold text-foreground">Agrupamento manual</span>
          <span className="text-xs text-muted-foreground">
            Selecione as iniciativas e preencha as informações do agrupamento do zero.
          </span>
        </button>
        <button
          type="button"
          onClick={() => setStep("sugestoes")}
          className="flex flex-col items-start gap-2 rounded-lg border border-border bg-surface p-4 text-left transition-colors hover:border-primary/40"
        >
          <span className="grid size-9 place-items-center rounded-md bg-surface-muted text-muted-foreground">
            <Sparkles className="size-4.5" />
          </span>
          <span className="text-sm font-semibold text-foreground">Agrupamento com IA</span>
          <span className="text-xs text-muted-foreground">
            Utilize uma sugestão de agrupamento já identificada pela IA como ponto de partida.
          </span>
        </button>
      </div>

      <div className="mt-8">
        <Button asChild variant="ghost" type="button">
          <Link to="/juridico/agrupamentos">Cancelar</Link>
        </Button>
      </div>
    </main>
  );
}
