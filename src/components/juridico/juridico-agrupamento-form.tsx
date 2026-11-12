import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Eye, Plus, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Link } from "@tanstack/react-router";
import { useProjectsStore } from "@/lib/store";
import {
  diretoriasDoAgrupamento,
  gerarConsolidacaoAgrupamento,
  gerarPreProjetoConteudo,
  gerarSugestoesAgrupamento,
  iniciativaValor,
  iniciativasNaoAgrupadas,
  valorTotalIniciativas,
} from "@/lib/juridico";
import { IniciativaDetailSheet } from "@/components/juridico/iniciativa-detail-sheet";
import type { Agrupamento, Project } from "@/lib/types";

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface ConsolidacaoFields {
  name: string;
  resumo: string;
  objetivoComum: string;
  relacaoAtividades: string;
  justificativa: string;
}

function computeInitial(
  agrupamento: Agrupamento | undefined,
  suggestionId: string | undefined,
  projects: Project[],
  agrupamentos: Agrupamento[],
): {
  fields: ConsolidacaoFields;
  iniciativaIds: string[];
  aiSuggested: boolean;
  resumoEditado: boolean;
} {
  if (agrupamento) {
    return {
      fields: {
        name: agrupamento.name,
        resumo: agrupamento.resumo,
        objetivoComum: agrupamento.objetivoComum,
        relacaoAtividades: agrupamento.relacaoAtividades,
        justificativa: agrupamento.justificativa,
      },
      iniciativaIds: agrupamento.iniciativaIds,
      aiSuggested: agrupamento.aiSuggested,
      resumoEditado: agrupamento.resumoEditadoManualmente ?? false,
    };
  }
  if (suggestionId) {
    const sugestao = gerarSugestoesAgrupamento(projects, agrupamentos).find(
      (s) => s.id === suggestionId,
    );
    if (sugestao) {
      const consolidacao = gerarConsolidacaoAgrupamento(sugestao.iniciativaIds, projects);
      return {
        fields: { ...consolidacao, name: sugestao.name },
        iniciativaIds: sugestao.iniciativaIds,
        aiSuggested: true,
        resumoEditado: false,
      };
    }
  }
  return {
    fields: { name: "", resumo: "", objetivoComum: "", relacaoAtividades: "", justificativa: "" },
    iniciativaIds: [],
    aiSuggested: false,
    resumoEditado: false,
  };
}

export function JuridicoAgrupamentoForm({
  agrupamentoId,
  suggestionId,
}: {
  agrupamentoId?: string;
  suggestionId?: string;
}) {
  const navigate = useNavigate();
  const projects = useProjectsStore((s) => s.projects);
  const agrupamentos = useProjectsStore((s) => s.agrupamentos);
  const createAgrupamento = useProjectsStore((s) => s.createAgrupamento);
  const updateAgrupamento = useProjectsStore((s) => s.updateAgrupamento);
  const addIniciativaToAgrupamento = useProjectsStore((s) => s.addIniciativaToAgrupamento);
  const removeIniciativaFromAgrupamento = useProjectsStore(
    (s) => s.removeIniciativaFromAgrupamento,
  );
  const transformarAgrupamentoEmPreProjeto = useProjectsStore(
    (s) => s.transformarAgrupamentoEmPreProjeto,
  );

  const agrupamentoExistente = agrupamentoId
    ? agrupamentos.find((a) => a.id === agrupamentoId)
    : undefined;

  const [initial] = useState(() =>
    computeInitial(agrupamentoExistente, suggestionId, projects, agrupamentos),
  );
  const [fields, setFields] = useState<ConsolidacaoFields>(initial.fields);
  const [iniciativaIds, setIniciativaIds] = useState<string[]>(initial.iniciativaIds);
  const [resumoEditado, setResumoEditado] = useState(initial.resumoEditado);
  const [addOpen, setAddOpen] = useState(false);
  const [confirmIaOpen, setConfirmIaOpen] = useState(false);
  const [pendingIaFields, setPendingIaFields] = useState<ConsolidacaoFields | null>(null);
  const [detailProject, setDetailProject] = useState<Project | null>(null);

  const isEdicao = !!agrupamentoExistente;

  const membros = useMemo(
    () =>
      iniciativaIds.map((id) => projects.find((p) => p.id === id)).filter((p): p is Project => !!p),
    [iniciativaIds, projects],
  );
  const diretorias = useMemo(
    () => diretoriasDoAgrupamento(iniciativaIds, projects),
    [iniciativaIds, projects],
  );
  const valorTotal = useMemo(
    () => valorTotalIniciativas(iniciativaIds, projects),
    [iniciativaIds, projects],
  );
  const candidatas = useMemo(
    () =>
      iniciativasNaoAgrupadas(projects, agrupamentos).filter((p) => !iniciativaIds.includes(p.id)),
    [projects, agrupamentos, iniciativaIds],
  );

  const applyConsolidacao = (c: ConsolidacaoFields) => {
    setFields(c);
    setResumoEditado(false);
  };

  const handleGerarIa = () => {
    if (membros.length === 0) {
      toast.warning("Adicione ao menos uma iniciativa para gerar uma sugestão da IA.");
      return;
    }
    const consolidacao = gerarConsolidacaoAgrupamento(iniciativaIds, projects);
    if (resumoEditado) {
      setPendingIaFields(consolidacao);
      setConfirmIaOpen(true);
      return;
    }
    applyConsolidacao(consolidacao);
    toast.success("Consolidação da IA aplicada.");
  };

  const persist = (): string | undefined => {
    if (!fields.name.trim()) {
      toast.error("Informe um nome para o agrupamento.");
      return undefined;
    }
    if (iniciativaIds.length === 0) {
      toast.error("Inclua ao menos uma iniciativa no agrupamento.");
      return undefined;
    }
    if (isEdicao && agrupamentoExistente) {
      const original = new Set(agrupamentoExistente.iniciativaIds);
      const atual = new Set(iniciativaIds);
      original.forEach((id) => {
        if (!atual.has(id)) removeIniciativaFromAgrupamento(agrupamentoExistente.id, id);
      });
      atual.forEach((id) => {
        if (!original.has(id)) addIniciativaToAgrupamento(agrupamentoExistente.id, id);
      });
      updateAgrupamento(
        agrupamentoExistente.id,
        { ...fields, resumoEditadoManualmente: resumoEditado },
        "atualizou as informações do agrupamento",
      );
      return agrupamentoExistente.id;
    }
    return createAgrupamento({ ...fields, iniciativaIds, aiSuggested: initial.aiSuggested });
  };

  const handleSalvar = () => {
    const id = persist();
    if (!id) return;
    toast.success("Agrupamento salvo.");
    if (!isEdicao) {
      navigate({ to: "/juridico/agrupamentos/$id", params: { id } });
    }
  };

  const handleTransformar = () => {
    const id = persist();
    if (!id) return;
    const ano =
      membros.length > 0
        ? Math.max(...membros.map((p) => new Date(p.startDate).getFullYear()))
        : new Date().getFullYear();
    const conteudo = gerarPreProjetoConteudo(fields, iniciativaIds, projects);
    const preProjetoId = transformarAgrupamentoEmPreProjeto(id, {
      name: `Pré-projeto — ${fields.name}`,
      ano,
      ...conteudo,
    });
    toast.success("Agrupamento transformado em pré-projeto.");
    navigate({ to: "/juridico/pre-projetos/$id", params: { id: preProjetoId } });
  };

  return (
    <>
      <main className="mx-auto max-w-[1440px] px-6 py-8">
        <Link
          to="/juridico/iniciativas"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Iniciativas
        </Link>

        <div className="mb-6">
          {initial.aiSuggested && (
            <div className="mb-2 inline-flex items-center gap-2 text-xs font-medium text-primary">
              <Sparkles className="size-3.5" /> Originado de uma sugestão da IA
            </div>
          )}
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            {isEdicao ? "Revisar agrupamento" : "Novo agrupamento"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Organize as iniciativas relacionadas e consolide as informações para avaliação do
            comitê.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Área principal — informações do agrupamento */}
          <section className="space-y-4 rounded-lg border border-border bg-surface p-5 lg:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-foreground">Informações do agrupamento</h2>
              <Button variant="outline" size="sm" className="gap-2" onClick={handleGerarIa}>
                <Sparkles className="size-3.5" /> Gerar sugestão da IA
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Nome do agrupamento</Label>
              <Input
                value={fields.name}
                onChange={(e) => setFields((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ex.: Automação e Robótica Industrial"
              />
            </div>

            <div className="space-y-2">
              <Label>Resumo consolidado</Label>
              <Textarea
                value={fields.resumo}
                onChange={(e) => {
                  setResumoEditado(true);
                  setFields((f) => ({ ...f, resumo: e.target.value }));
                }}
                rows={3}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Objetivo comum</Label>
                <Textarea
                  value={fields.objetivoComum}
                  onChange={(e) => setFields((f) => ({ ...f, objetivoComum: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Relação entre as atividades de inovação</Label>
                <Textarea
                  value={fields.relacaoAtividades}
                  onChange={(e) => setFields((f) => ({ ...f, relacaoAtividades: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Justificativa para o agrupamento</Label>
              <Textarea
                value={fields.justificativa}
                onChange={(e) => setFields((f) => ({ ...f, justificativa: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-border pt-4 text-sm sm:grid-cols-3">
              <div>
                <div className="text-xs text-muted-foreground">Quantidade de iniciativas</div>
                <div className="font-semibold text-foreground">{iniciativaIds.length}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Valor financeiro total</div>
                <div className="font-semibold text-foreground">{brl(valorTotal)}</div>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <div className="text-xs text-muted-foreground">Diretorias envolvidas</div>
                <div className="font-semibold text-foreground">
                  {diretorias.length > 0 ? diretorias.join(", ") : "—"}
                </div>
              </div>
            </div>
          </section>

          {/* Painel lateral — iniciativas do agrupamento */}
          <aside className="space-y-3 rounded-lg border border-border bg-surface p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-foreground">Iniciativas do agrupamento</h2>
              <Button
                size="sm"
                variant="outline"
                className="gap-1"
                onClick={() => setAddOpen(true)}
              >
                <Plus className="size-3.5" /> Adicionar
              </Button>
            </div>
            {membros.length === 0 ? (
              <p className="rounded-md border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                Nenhuma iniciativa incluída ainda.
              </p>
            ) : (
              <ul className="space-y-2">
                {membros.map((p) => (
                  <li key={p.id} className="rounded-md border border-border p-3 text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium text-foreground">{p.name}</span>
                      <div className="flex shrink-0 gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7"
                          aria-label="Visualizar detalhes"
                          onClick={() => setDetailProject(p)}
                        >
                          <Eye className="size-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7 text-muted-foreground hover:text-destructive"
                          aria-label="Remover"
                          onClick={() => setIniciativaIds((ids) => ids.filter((x) => x !== p.id))}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {p.area} · {p.responsible}
                    </div>
                    <div className="mt-1 text-xs font-medium text-foreground">
                      {brl(iniciativaValor(p))}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>

        {/* Ações do agrupamento */}
        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          <Button variant="ghost" onClick={() => navigate({ to: "/juridico/iniciativas" })}>
            Cancelar alterações
          </Button>
          <Button variant="outline" onClick={handleSalvar}>
            Salvar agrupamento
          </Button>
          <Button onClick={handleTransformar} disabled={iniciativaIds.length === 0}>
            Transformar em pré-projeto
          </Button>
        </div>
      </main>

      {/* Adicionar iniciativas */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Adicionar iniciativas</DialogTitle>
            <DialogDescription>
              Iniciativas recebidas da Controladoria que ainda não fazem parte de nenhum
              agrupamento.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {candidatas.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhuma iniciativa disponível para incluir.
              </p>
            ) : (
              candidatas.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-border p-3 text-sm"
                >
                  <div>
                    <div className="font-medium text-foreground">{p.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.area} · {p.responsible} · {brl(iniciativaValor(p))}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 gap-1"
                    onClick={() => setIniciativaIds((ids) => [...ids, p.id])}
                  >
                    <Plus className="size-3.5" /> Adicionar
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmação de nova consolidação da IA sobre resumo editado manualmente */}
      <AlertDialog open={confirmIaOpen} onOpenChange={setConfirmIaOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Substituir o resumo editado manualmente?</AlertDialogTitle>
            <AlertDialogDescription>
              Você editou o resumo manualmente. A nova consolidação da IA, com base nas iniciativas
              atuais, é:{" "}
              <span className="mt-2 block text-foreground">{pendingIaFields?.resumo}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Manter o resumo atual</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingIaFields) applyConsolidacao(pendingIaFields);
                toast.success("Consolidação da IA aplicada.");
              }}
            >
              Substituir pela consolidação da IA
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <IniciativaDetailSheet
        project={detailProject}
        open={detailProject !== null}
        onOpenChange={(open) => !open && setDetailProject(null)}
      />
    </>
  );
}
