import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, FileStack, Presentation, Save, Send } from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProjectsStore } from "@/lib/store";
import {
  diretoriasDoAgrupamento,
  resumoFinanceiroTrimestral,
  valorTotalIniciativas,
} from "@/lib/juridico";
import { PreProjetoStatusBadge } from "@/components/juridico/juridico-status-badge";
import { JuridicoHistoryDrawer } from "@/components/juridico/juridico-history-drawer";
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
  problema: string;
  oportunidade: string;
  objetivoPrincipal: string;
  propostaInovacao: string;
  elementoInovador: string;
  barreiras: string;
  atividadesInovacao: string;
  resultadosEsperados: string;
}

function fieldsOf(pp: PreProjeto): ConteudoFields {
  return {
    problema: pp.problema,
    oportunidade: pp.oportunidade,
    objetivoPrincipal: pp.objetivoPrincipal,
    propostaInovacao: pp.propostaInovacao,
    elementoInovador: pp.elementoInovador,
    barreiras: pp.barreiras,
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
  const iniciativaIds = useMemo(() => agrupamento?.iniciativaIds ?? [], [agrupamento]);
  const membros = useMemo(
    () =>
      iniciativaIds.map((id) => projects.find((p) => p.id === id)).filter((p): p is Project => !!p),
    [iniciativaIds, projects],
  );
  const diretorias = diretoriasDoAgrupamento(iniciativaIds, projects);
  const valorTotal = valorTotalIniciativas(iniciativaIds, projects);
  const financeiro = useMemo(
    () => resumoFinanceiroTrimestral(iniciativaIds, projects),
    [iniciativaIds, projects],
  );
  const evidencias = useMemo(
    () =>
      membros.flatMap((p) =>
        (p.attachments._evidencias ?? []).map((a) => ({ ...a, iniciativaNome: p.name })),
      ),
    [membros],
  );
  const projetoVinculado = preProjeto.projetoId
    ? juridicoProjetos.find((p) => p.id === preProjeto.projetoId)
    : undefined;

  const [fields, setFields] = useState<ConteudoFields>(fieldsOf(preProjeto));
  const [decisaoOpen, setDecisaoOpen] = useState(false);
  const [decisao, setDecisao] = useState<ComiteDecisao>("aprovar");
  const [dataDecisao, setDataDecisao] = useState(todayInputValue());
  const [responsavel, setResponsavel] = useState(ROLE_USERS.juridico.name);
  const [observacoes, setObservacoes] = useState("");
  const [comiteInfo, setComiteInfo] = useState("");

  const abrirDecisao = (d: ComiteDecisao) => {
    setDecisao(d);
    setObservacoes("");
    setDecisaoOpen(true);
  };

  const decisoes = [...preProjeto.decisoes].sort((a, b) => +new Date(b.data) - +new Date(a.data));

  const handleSalvarConteudo = () => {
    updatePreProjeto(preProjeto.id, fields, "atualizou os conteúdos do pré-projeto");
    toast.success("Alterações salvas.");
  };

  const precisaJustificativa = decisao === "recusar" || decisao === "revisar_agrupamento";

  const handleRegistrarDecisao = () => {
    if (precisaJustificativa && !observacoes.trim()) {
      toast.error("Descreva uma observação ou justificativa para esta decisão.");
      return;
    }
    const projetoId = registrarDecisaoComite(
      preProjeto.id,
      decisao,
      responsavel.trim() || ROLE_USERS.juridico.name,
      new Date(dataDecisao).toISOString(),
      observacoes.trim() || undefined,
      comiteInfo.trim() || undefined,
    );
    setDecisaoOpen(false);
    setObservacoes("");
    setComiteInfo("");
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
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/juridico/pre-projetos"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" /> Pré-projetos
          </Link>
          <Button variant="outline" size="sm" className="gap-2" asChild>
            <Link to="/juridico/pre-projetos/$id/gerar-apresentacao" params={{ id: preProjeto.id }}>
              <Presentation className="size-3.5" /> Gerar apresentação
            </Link>
          </Button>
        </div>

        {/* Cabeçalho — hierarquia clara: identificação > nome > metadados > avisos */}
        <div className="mb-6 rounded-xl border border-border bg-surface p-6">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            Pré-projeto
          </span>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            {preProjeto.name}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span>
              Ano de referência:{" "}
              <span className="font-medium text-foreground">{preProjeto.ano}</span>
            </span>
            <span>
              Diretorias envolvidas:{" "}
              <span className="font-medium text-foreground">{diretorias.join(", ") || "—"}</span>
            </span>
            {agrupamento && (
              <Link
                to="/juridico/agrupamentos/$id"
                params={{ id: agrupamento.id }}
                className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <FileStack className="size-3.5" /> Agrupamento de origem: {agrupamento.name}
              </Link>
            )}
          </div>
          {projetoVinculado && (
            <div className="mt-4 rounded-md bg-primary/5 p-3 text-sm text-primary">
              Este pré-projeto já foi aprovado pelo comitê e deu origem ao projeto{" "}
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

        {/* Resumo executivo — 1/3 informações básicas, 2/3 detalhamento, nos
            mesmos moldes da ficha da Controladoria (ver controladoria-ficha.tsx) */}
        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-10">
          <section className="rounded-lg border border-border bg-surface p-5 lg:col-span-3">
            <h2 className="mb-4 text-sm font-semibold text-foreground">
              Informações básicas do pré-projeto
            </h2>
            <dl className="grid gap-4">
              <div>
                <dt className="text-xs text-muted-foreground">Ano de referência</dt>
                <dd className="text-sm font-medium text-foreground">{preProjeto.ano}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Diretorias envolvidas</dt>
                <dd className="text-sm font-medium text-foreground">
                  {diretorias.join(", ") || "—"}
                </dd>
              </div>
              {agrupamento && (
                <div>
                  <dt className="text-xs text-muted-foreground">Agrupamento de origem</dt>
                  <dd className="text-sm font-medium text-foreground">
                    <Link
                      to="/juridico/agrupamentos/$id"
                      params={{ id: agrupamento.id }}
                      className="text-primary hover:underline"
                    >
                      {agrupamento.name}
                    </Link>
                  </dd>
                </div>
              )}
            </dl>

            <div className="mt-5 space-y-2 border-t border-border pt-5">
              <Label>Resumo do projeto</Label>
              <p className="text-sm leading-relaxed text-foreground">
                {preProjeto.resumoExecutivo}
              </p>
            </div>
          </section>

          <section className="rounded-lg border-2 border-primary/20 bg-surface p-5 lg:col-span-7">
            <h2 className="mb-4 text-base font-semibold text-foreground">Detalhamento</h2>
            <div className="space-y-5">
              <div className="space-y-2">
                <Label>Problema identificado</Label>
                <Textarea
                  value={fields.problema}
                  onChange={(e) => setFields((f) => ({ ...f, problema: e.target.value }))}
                  rows={4}
                  className="resize-y"
                />
              </div>
              <div className="space-y-2">
                <Label>Oportunidade identificada</Label>
                <Textarea
                  value={fields.oportunidade}
                  onChange={(e) => setFields((f) => ({ ...f, oportunidade: e.target.value }))}
                  rows={4}
                  className="resize-y"
                />
              </div>
              <div className="space-y-2">
                <Label>Objetivo principal</Label>
                <Textarea
                  value={fields.objetivoPrincipal}
                  onChange={(e) => setFields((f) => ({ ...f, objetivoPrincipal: e.target.value }))}
                  rows={3}
                  className="resize-y"
                />
              </div>
              <div className="space-y-2">
                <Label>Proposta de inovação</Label>
                <Textarea
                  value={fields.propostaInovacao}
                  onChange={(e) => setFields((f) => ({ ...f, propostaInovacao: e.target.value }))}
                  rows={4}
                  className="resize-y"
                />
              </div>
              <div className="space-y-2">
                <Label>Elemento tecnologicamente inovador</Label>
                <Textarea
                  value={fields.elementoInovador}
                  onChange={(e) => setFields((f) => ({ ...f, elementoInovador: e.target.value }))}
                  rows={4}
                  className="resize-y"
                />
              </div>
              <div className="space-y-2">
                <Label>Barreiras e desafios tecnológicos</Label>
                <Textarea
                  value={fields.barreiras}
                  onChange={(e) => setFields((f) => ({ ...f, barreiras: e.target.value }))}
                  rows={4}
                  className="resize-y"
                />
              </div>
              <div className="space-y-2">
                <Label>Metodologia e métodos utilizados</Label>
                <Textarea
                  value={fields.atividadesInovacao}
                  onChange={(e) => setFields((f) => ({ ...f, atividadesInovacao: e.target.value }))}
                  rows={4}
                  className="resize-y"
                />
              </div>

              <div>
                <Label>Evidências</Label>
                {evidencias.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Nenhum documento anexado nas iniciativas de origem.
                  </p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {evidencias.map((a) => (
                      <li key={a.id} className="flex items-center justify-between text-sm">
                        <span className="text-foreground">{a.name}</span>
                        <span className="text-xs text-muted-foreground">{a.iniciativaNome}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="space-y-2">
                <Label>Resultados esperados</Label>
                <Textarea
                  value={fields.resultadosEsperados}
                  onChange={(e) =>
                    setFields((f) => ({ ...f, resultadosEsperados: e.target.value }))
                  }
                  rows={4}
                  className="resize-y"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end border-t border-border pt-5">
              <Button className="gap-2" onClick={handleSalvarConteudo}>
                <Save className="size-4" /> Salvar alterações
              </Button>
            </div>
          </section>
        </div>

        {/* Resumo financeiro — valor total e distribuição por trimestre das
            iniciativas que compõem o pré-projeto */}
        <section className="mb-6 rounded-lg border border-border bg-surface p-5">
          <h2 className="mb-2 text-sm font-semibold text-foreground">Resumo financeiro</h2>
          <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-3xl font-semibold tabular-nums text-foreground">
              {brl(valorTotal)}
            </span>
            <span className="text-sm text-muted-foreground">
              valor financeiro total consolidado de {iniciativaIds.length}{" "}
              {iniciativaIds.length === 1 ? "iniciativa" : "iniciativas"}
            </span>
          </div>

          {financeiro.porTrimestre.length > 0 && (
            <div className="mb-4 grid gap-2 sm:grid-cols-4">
              {financeiro.porTrimestre.map((t) => (
                <div key={t.trimestre} className="rounded-md border border-border p-3 text-center">
                  <div className="text-xs text-muted-foreground">{t.trimestre}</div>
                  <div className="mt-1 text-sm font-semibold tabular-nums text-foreground">
                    {brl(t.valor)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {financeiro.porIniciativa.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma iniciativa vinculada.</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Iniciativa</TableHead>
                    <TableHead>Trimestre</TableHead>
                    <TableHead className="text-right">Valor financeiro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {financeiro.porIniciativa.map((r) => (
                    <TableRow key={r.iniciativa.id}>
                      <TableCell className="font-medium">{r.iniciativa.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.trimestre}</TableCell>
                      <TableCell className="text-right tabular-nums">{brl(r.valor)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>

        {/* Decisão do comitê — situação, data, decisão, justificativa e informações do comitê */}
        <section className="mb-6 rounded-lg border border-border bg-surface p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold text-foreground">Decisão do comitê</h2>
              <PreProjetoStatusBadge status={preProjeto.status} />
            </div>
          </div>

          {preProjeto.status === "aguardando_comite" && (
            <div className="mb-4 flex flex-wrap items-center gap-2 rounded-md border border-dashed border-border bg-surface-muted p-3">
              <p className="mr-auto text-sm text-muted-foreground">
                Este pré-projeto aguarda a decisão do comitê.
              </p>
              <Button size="sm" className="gap-2" onClick={() => abrirDecisao("aprovar")}>
                <Send className="size-4" /> Aprovar
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
                onClick={() => abrirDecisao("recusar")}
              >
                Recusar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => abrirDecisao("ajustes")}>
                Outras decisões…
              </Button>
            </div>
          )}

          {decisoes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma decisão registrada ainda.</p>
          ) : (
            <ul className="space-y-2">
              {decisoes.map((d) => (
                <li key={d.id} className="rounded-md border border-border p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-foreground">
                      {COMITE_DECISAO_LABEL[d.decisao]}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Data da decisão: {fmtDate(d.data)}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Registrado por {d.responsavel}
                    {d.comite ? ` · Comitê: ${d.comite}` : ""}
                  </div>
                  {d.observacoes && (
                    <p className="mt-2 text-foreground">
                      <span className="text-xs font-medium text-muted-foreground">
                        Justificativa/observação:{" "}
                      </span>
                      {d.observacoes}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Histórico */}
        <section>
          <h2 className="mb-3 text-sm font-semibold text-foreground">Histórico</h2>
          <JuridicoHistoryDrawer
            events={preProjeto.history}
            title="Histórico do pré-projeto"
            description="Trilha de auditoria simples: quem realizou ações no pré-projeto e quando."
            triggerLabel="Ver histórico do pré-projeto"
          />
        </section>
      </main>

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
              <Label>Observações ou justificativa{precisaJustificativa && " (obrigatória)"}</Label>
              <Textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={3}
                placeholder="Obrigatório ao recusar ou solicitar revisão do agrupamento."
              />
            </div>
            <div className="space-y-2">
              <Label>Informações do comitê (opcional)</Label>
              <Input
                value={comiteInfo}
                onChange={(e) => setComiteInfo(e.target.value)}
                placeholder="Ex.: Reunião do Comitê de Inovação — 3ª sessão de 2026"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDecisaoOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleRegistrarDecisao}
              disabled={precisaJustificativa && !observacoes.trim()}
            >
              Registrar decisão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
