import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, Eye, FileStack, History, Save, Send, Sparkles } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { useProjectsStore } from "@/lib/store";
import { diretoriasDoAgrupamento, gerarPreProjetoConteudo, valorTotalIniciativas } from "@/lib/juridico";
import { PreProjetoStatusBadge } from "@/components/juridico/juridico-status-badge";
import { IniciativaDetailSheet } from "@/components/juridico/iniciativa-detail-sheet";
import {
  COMITE_DECISAO_LABEL,
  ROLE_USERS,
  type ComiteDecisao,
  type PreProjeto,
  type Project,
} from "@/lib/types";

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (iso: string) => format(new Date(iso), "dd/MM/yyyy", { locale: ptBR });
const todayInputValue = () => new Date().toISOString().slice(0, 10);

interface ConteudoFields {
  resumoExecutivo: string;
  problema: string;
  objetivoPrincipal: string;
  propostaInovacao: string;
  atividadesInovacao: string;
  resultadosEsperados: string;
}

function fieldsOf(pp: PreProjeto): ConteudoFields {
  return {
    resumoExecutivo: pp.resumoExecutivo,
    problema: pp.problema,
    objetivoPrincipal: pp.objetivoPrincipal,
    propostaInovacao: pp.propostaInovacao,
    atividadesInovacao: pp.atividadesInovacao,
    resultadosEsperados: pp.resultadosEsperados,
  };
}

export function JuridicoPreProjetoApresentacao({ preProjeto }: { preProjeto: PreProjeto }) {
  const navigate = useNavigate();
  const projects = useProjectsStore((s) => s.projects);
  const agrupamentos = useProjectsStore((s) => s.agrupamentos);
  const juridicoProjetos = useProjectsStore((s) => s.juridicoProjetos);
  const updatePreProjeto = useProjectsStore((s) => s.updatePreProjeto);
  const registrarDecisaoComite = useProjectsStore((s) => s.registrarDecisaoComite);

  const agrupamento = agrupamentos.find((a) => a.id === preProjeto.agrupamentoId);
  const iniciativaIds = agrupamento?.iniciativaIds ?? [];
  const membros = useMemo(
    () => iniciativaIds.map((id) => projects.find((p) => p.id === id)).filter((p): p is Project => !!p),
    [iniciativaIds, projects],
  );
  const diretorias = diretoriasDoAgrupamento(iniciativaIds, projects);
  const valorTotal = valorTotalIniciativas(iniciativaIds, projects);
  const projetoVinculado = preProjeto.projetoId
    ? juridicoProjetos.find((p) => p.id === preProjeto.projetoId)
    : undefined;

  const [fields, setFields] = useState<ConteudoFields>(fieldsOf(preProjeto));
  const [confirmRegenOpen, setConfirmRegenOpen] = useState(false);
  const [decisaoOpen, setDecisaoOpen] = useState(false);
  const [decisao, setDecisao] = useState<ComiteDecisao>("aprovar");
  const [dataDecisao, setDataDecisao] = useState(todayInputValue());
  const [responsavel, setResponsavel] = useState(ROLE_USERS.juridico.name);
  const [observacoes, setObservacoes] = useState("");
  const [detailProject, setDetailProject] = useState<Project | null>(null);

  const history = [...preProjeto.history].sort((a, b) => +new Date(b.date) - +new Date(a.date));
  const decisoes = [...preProjeto.decisoes].sort((a, b) => +new Date(b.data) - +new Date(a.data));

  const handleSalvarConteudo = () => {
    updatePreProjeto(preProjeto.id, fields, "atualizou os conteúdos do pré-projeto");
    toast.success("Alterações salvas.");
  };

  const handleRegenerar = () => {
    if (!agrupamento) return;
    const novo = gerarPreProjetoConteudo(agrupamento, iniciativaIds, projects);
    setFields(novo);
    setConfirmRegenOpen(false);
    toast.success("Conteúdo atualizado a partir do agrupamento. Revise e salve as alterações.");
  };

  const handleRegistrarDecisao = () => {
    if (decisao !== "aprovar" && decisao !== "ajustes" && !observacoes.trim()) {
      toast.error("Descreva uma observação ou justificativa para esta decisão.");
      return;
    }
    const projetoId = registrarDecisaoComite(
      preProjeto.id,
      decisao,
      responsavel.trim() || ROLE_USERS.juridico.name,
      new Date(dataDecisao).toISOString(),
      observacoes.trim() || undefined,
    );
    setDecisaoOpen(false);
    setObservacoes("");
    if (decisao === "aprovar" && projetoId) {
      toast.success("Pré-projeto aprovado — projeto criado.");
      navigate({ to: "/juridico/projetos/$id", params: { id: projetoId } });
      return;
    }
    if (decisao === "revisar_agrupamento") {
      toast.success("Decisão registrada — revise o agrupamento de origem.");
      navigate({ to: "/juridico/agrupamentos/$id", params: { id: preProjeto.agrupamentoId } });
      return;
    }
    toast.success("Decisão do comitê registrada.");
  };

  return (
    <div className="pb-10">
      <main className="mx-auto max-w-[1200px] px-6 py-8">
        <Link
          to="/juridico/pre-projetos"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Pré-projetos
        </Link>

        {/* Cabeçalho */}
        <div className="mb-6 rounded-xl border border-border bg-surface p-6">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <PreProjetoStatusBadge status={preProjeto.status} />
              <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                {preProjeto.name}
              </h1>
            </div>
            {agrupamento && (
              <Link
                to="/juridico/agrupamentos/$id"
                params={{ id: agrupamento.id }}
                className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                <FileStack className="size-3.5" /> Agrupamento de origem: {agrupamento.name}
              </Link>
            )}
          </div>
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">Ano de referência:</span>{" "}
              <span className="font-medium text-foreground">{preProjeto.ano}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Diretorias envolvidas:</span>{" "}
              <span className="font-medium text-foreground">{diretorias.join(", ") || "—"}</span>
            </div>
          </div>
          {projetoVinculado && (
            <div className="mt-3 rounded-md bg-primary/5 p-3 text-sm text-primary">
              Este pré-projeto foi aprovado e já é o projeto{" "}
              <Link
                to="/juridico/projetos/$id"
                params={{ id: projetoVinculado.id }}
                className="font-medium underline underline-offset-2"
              >
                {projetoVinculado.identificacao}
              </Link>
              .
            </div>
          )}
        </div>

        {/* Indicadores principais */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-surface p-4 text-center">
            <div className="text-xs text-muted-foreground">Iniciativas</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">{iniciativaIds.length}</div>
          </div>
          <div className="rounded-lg border border-border bg-surface p-4 text-center">
            <div className="text-xs text-muted-foreground">Diretorias envolvidas</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">{diretorias.length}</div>
          </div>
          <div className="rounded-lg border border-border bg-surface p-4 text-center">
            <div className="text-xs text-muted-foreground">Valor financeiro total</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">{brl(valorTotal)}</div>
          </div>
        </div>

        {/* Resumo executivo */}
        <section className="mb-6 rounded-lg border border-border bg-surface p-5">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-foreground">Resumo executivo</h2>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setConfirmRegenOpen(true)}>
              <Sparkles className="size-3.5" /> Atualizar com base no agrupamento
            </Button>
          </div>
          <Textarea
            value={fields.resumoExecutivo}
            onChange={(e) => setFields((f) => ({ ...f, resumoExecutivo: e.target.value }))}
            rows={3}
          />
        </section>

        {/* Conteúdo do pré-projeto, em blocos */}
        <section className="mb-6 grid gap-4 lg:grid-cols-2">
          <div className="space-y-2 rounded-lg border border-border bg-surface p-5">
            <Label>1. Problema ou oportunidade identificada</Label>
            <Textarea
              value={fields.problema}
              onChange={(e) => setFields((f) => ({ ...f, problema: e.target.value }))}
              rows={4}
            />
          </div>
          <div className="space-y-2 rounded-lg border border-border bg-surface p-5">
            <Label>2. Objetivo principal</Label>
            <Textarea
              value={fields.objetivoPrincipal}
              onChange={(e) => setFields((f) => ({ ...f, objetivoPrincipal: e.target.value }))}
              rows={4}
            />
          </div>
          <div className="space-y-2 rounded-lg border border-border bg-surface p-5">
            <Label>3. Proposta de inovação</Label>
            <Textarea
              value={fields.propostaInovacao}
              onChange={(e) => setFields((f) => ({ ...f, propostaInovacao: e.target.value }))}
              rows={4}
            />
          </div>
          <div className="space-y-2 rounded-lg border border-border bg-surface p-5">
            <Label>4. Atividades de inovação envolvidas</Label>
            <Textarea
              value={fields.atividadesInovacao}
              onChange={(e) => setFields((f) => ({ ...f, atividadesInovacao: e.target.value }))}
              rows={4}
            />
          </div>
          <div className="space-y-2 rounded-lg border border-border bg-surface p-5 lg:col-span-2">
            <Label>5. Resultados esperados</Label>
            <Textarea
              value={fields.resultadosEsperados}
              onChange={(e) => setFields((f) => ({ ...f, resultadosEsperados: e.target.value }))}
              rows={3}
            />
          </div>
        </section>

        <div className="mb-6 flex justify-end">
          <Button className="gap-2" onClick={handleSalvarConteudo}>
            <Save className="size-4" /> Salvar alterações
          </Button>
        </div>

        {/* 6. Iniciativas que compõem o pré-projeto */}
        <section className="mb-6 rounded-lg border border-border bg-surface p-5">
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            6. Iniciativas que compõem o pré-projeto
          </h2>
          {membros.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma iniciativa vinculada.</p>
          ) : (
            <ul className="divide-y divide-border">
              {membros.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div>
                    <div className="font-medium text-foreground">{p.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.area} · {p.responsible}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1 text-xs"
                    onClick={() => setDetailProject(p)}
                  >
                    <Eye className="size-3.5" /> Consultar fonte
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Decisões do comitê */}
        <section className="mb-6 rounded-lg border border-border bg-surface p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-foreground">Decisão do comitê</h2>
            {preProjeto.status !== "aprovado" && (
              <Button size="sm" className="gap-2" onClick={() => setDecisaoOpen(true)}>
                <Send className="size-4" /> Registrar decisão do comitê
              </Button>
            )}
          </div>
          {decisoes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma decisão registrada ainda.</p>
          ) : (
            <ul className="space-y-2">
              {decisoes.map((d) => (
                <li key={d.id} className="rounded-md border border-border p-3 text-sm">
                  <div className="font-medium text-foreground">{COMITE_DECISAO_LABEL[d.decisao]}</div>
                  <div className="text-xs text-muted-foreground">
                    registrado por {d.responsavel} em {fmtDate(d.data)}
                  </div>
                  {d.observacoes && <p className="mt-1 text-foreground">{d.observacoes}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Histórico */}
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <History className="size-4 text-muted-foreground" /> Histórico
          </h2>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum evento registrado ainda.</p>
          ) : (
            <div className="space-y-2">
              {history.map((ev) => (
                <div key={ev.id} className="rounded-lg border border-border bg-surface p-3 text-sm">
                  <span className="font-medium text-foreground">{ev.actor}</span>{" "}
                  <span className="text-foreground">{ev.description}</span>{" "}
                  <span className="text-muted-foreground">em {fmtDate(ev.date)}.</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <AlertDialog open={confirmRegenOpen} onOpenChange={setConfirmRegenOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Atualizar conteúdo com base no agrupamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Os blocos de conteúdo (problema, objetivo, proposta, atividades e resultados) serão
              substituídos por uma nova consolidação a partir da composição atual do agrupamento.
              Revise e salve as alterações antes de sair da página.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRegenerar}>Atualizar conteúdo</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={decisaoOpen} onOpenChange={setDecisaoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar decisão do comitê</DialogTitle>
            <DialogDescription>
              O comitê pode não acessar diretamente a plataforma — registre aqui a decisão tomada
              durante a reunião.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Decisão do comitê</Label>
              <Select value={decisao} onValueChange={(v) => setDecisao(v as ComiteDecisao)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(COMITE_DECISAO_LABEL) as ComiteDecisao[]).map((d) => (
                    <SelectItem key={d} value={d}>
                      {COMITE_DECISAO_LABEL[d]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Data da decisão</Label>
                <Input
                  type="date"
                  value={dataDecisao}
                  onChange={(e) => setDataDecisao(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Responsável pelo registro</Label>
                <Input value={responsavel} onChange={(e) => setResponsavel(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Observações ou justificativa</Label>
              <Textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={3}
                placeholder="Obrigatório ao solicitar ajustes ou revisão do agrupamento."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDecisaoOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRegistrarDecisao}>Registrar decisão</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <IniciativaDetailSheet
        project={detailProject}
        open={detailProject !== null}
        onOpenChange={(open) => !open && setDetailProject(null)}
      />
    </div>
  );
}
