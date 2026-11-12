import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  FileStack,
  History,
  Plus,
  RotateCcw,
  Send,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProjectsStore } from "@/lib/store";
import { diretoriasDoAgrupamento, valorTotalIniciativas } from "@/lib/juridico";
import { ProjetoStatusBadge } from "@/components/juridico/juridico-status-badge";
import { IniciativaDetailSheet } from "@/components/juridico/iniciativa-detail-sheet";
import { ROLE_USERS, type JuridicoProjeto, type Project } from "@/lib/types";

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (iso: string) => format(new Date(iso), "dd/MM/yyyy", { locale: ptBR });
const todayInputValue = () => new Date().toISOString().slice(0, 10);

export function JuridicoProjetoElaboracao({ projeto }: { projeto: JuridicoProjeto }) {
  const navigate = useNavigate();
  const projects = useProjectsStore((s) => s.projects);
  const preProjetos = useProjectsStore((s) => s.preProjetos);
  const agrupamentos = useProjectsStore((s) => s.agrupamentos);
  const updateProjetoSection = useProjectsStore((s) => s.updateProjetoSection);
  const addProjetoSection = useProjectsStore((s) => s.addProjetoSection);
  const addProjetoDocument = useProjectsStore((s) => s.addProjetoDocument);
  const removeProjetoDocument = useProjectsStore((s) => s.removeProjetoDocument);
  const finalizarProjeto = useProjectsStore((s) => s.finalizarProjeto);
  const registrarSubmissaoMcti = useProjectsStore((s) => s.registrarSubmissaoMcti);
  const reabrirProjetoParaAjustes = useProjectsStore((s) => s.reabrirProjetoParaAjustes);

  const preProjeto = preProjetos.find((p) => p.id === projeto.preProjetoId);
  const agrupamento = agrupamentos.find((a) => a.id === projeto.agrupamentoId);
  const membros = useMemo(
    () =>
      projeto.iniciativaIds
        .map((id) => projects.find((p) => p.id === id))
        .filter((p): p is Project => !!p),
    [projeto.iniciativaIds, projects],
  );
  const diretorias = diretoriasDoAgrupamento(projeto.iniciativaIds, projects);
  const valorTotal = valorTotalIniciativas(projeto.iniciativaIds, projects);

  const [detailProject, setDetailProject] = useState<Project | null>(null);
  const [newSectionOpen, setNewSectionOpen] = useState(false);
  const [newSectionLabel, setNewSectionLabel] = useState("");
  const [docName, setDocName] = useState("");
  const [finalizarOpen, setFinalizarOpen] = useState(false);
  const [submissaoOpen, setSubmissaoOpen] = useState(false);
  const [dataSubmissao, setDataSubmissao] = useState(todayInputValue());
  const [confirmoEnvio, setConfirmoEnvio] = useState(false);
  const [ajustesRealizados, setAjustesRealizados] = useState("");

  const history = [...projeto.history].sort((a, b) => +new Date(b.date) - +new Date(a.date));
  const proximaSubmissaoNumero = (projeto.submissions.length + 1) as 1 | 2;
  const podeRegistrarSubmissao =
    projeto.status === "aguardando_submissao" && projeto.submissions.length < 2;
  const podeReabrir = projeto.status === "nao_aprovado" && projeto.submissions.length < 2;

  const handleSalvarSection = (key: string, content: string) => {
    updateProjetoSection(projeto.id, key, content);
  };

  const handleIncluirSecao = () => {
    if (!newSectionLabel.trim()) {
      toast.error("Informe um título para a nova seção.");
      return;
    }
    addProjetoSection(projeto.id, newSectionLabel.trim());
    setNewSectionLabel("");
    setNewSectionOpen(false);
    toast.success("Seção incluída.");
  };

  const handleUpload = () => {
    if (!docName.trim()) {
      toast.warning("Informe o nome do documento.");
      return;
    }
    addProjetoDocument(projeto.id, {
      id: crypto.randomUUID(),
      name: docName.trim(),
      type: docName.includes(".") ? docName.split(".").pop()! : "pdf",
      uploadedAt: new Date().toISOString(),
      uploadedBy: ROLE_USERS.juridico.name,
      size: Math.floor(Math.random() * 2000 + 200) * 1024,
    });
    setDocName("");
    toast.success("Documento anexado.");
  };

  const handleFinalizar = () => {
    finalizarProjeto(projeto.id, ROLE_USERS.juridico.name);
    setFinalizarOpen(false);
    toast.success("Projeto finalizado — aguardando submissão ao MCTI.");
  };

  const handleRegistrarSubmissao = () => {
    if (!confirmoEnvio) {
      toast.error("Confirme que o envio foi realizado externamente.");
      return;
    }
    if (proximaSubmissaoNumero === 2 && !ajustesRealizados.trim()) {
      toast.error("Descreva os ajustes realizados desde a primeira submissão.");
      return;
    }
    registrarSubmissaoMcti(
      projeto.id,
      ROLE_USERS.juridico.name,
      new Date(dataSubmissao).toISOString(),
      proximaSubmissaoNumero === 2 ? ajustesRealizados.trim() : undefined,
    );
    setSubmissaoOpen(false);
    setConfirmoEnvio(false);
    setAjustesRealizados("");
    toast.success("Submissão ao MCTI registrada.");
  };

  const handleReabrir = () => {
    reabrirProjetoParaAjustes(projeto.id);
    toast.success("Projeto reaberto para ajustes.");
  };

  return (
    <div className="pb-10">
      <main className="mx-auto max-w-[1200px] px-6 py-8">
        <Link
          to="/juridico/projetos"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Projetos
        </Link>

        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <ProjetoStatusBadge status={projeto.status} />
            <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">{projeto.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{projeto.identificacao}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {projeto.status === "em_elaboracao" && (
              <Button className="gap-2" onClick={() => setFinalizarOpen(true)}>
                <CheckCircle2 className="size-4" /> Finalizar projeto
              </Button>
            )}
            {podeRegistrarSubmissao && (
              <Button className="gap-2" onClick={() => setSubmissaoOpen(true)}>
                <Send className="size-4" /> Registrar submissão ao MCTI
              </Button>
            )}
            {podeReabrir && (
              <Button variant="outline" className="gap-2" onClick={handleReabrir}>
                <RotateCcw className="size-4" /> Reabrir projeto para ajustes
              </Button>
            )}
          </div>
        </div>

        {(projeto.status === "submetido_mcti" || projeto.status === "nao_aprovado") && (
          <div className="mb-6 rounded-md bg-primary/5 p-3 text-sm text-primary">
            Acompanhe o retorno do MCTI em{" "}
            <Link
              to="/juridico/projetos/devolutivas"
              className="font-medium underline underline-offset-2"
            >
              Devolutivas do MCTI
            </Link>
            .
          </div>
        )}

        {/* Informações gerais */}
        <section className="mb-6 grid grid-cols-1 gap-4 rounded-lg border border-border bg-surface p-5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="text-xs text-muted-foreground">Ano de referência</div>
            <div className="font-medium text-foreground">{projeto.ano}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Diretorias envolvidas</div>
            <div className="font-medium text-foreground">{diretorias.join(", ") || "—"}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Valor financeiro total</div>
            <div className="font-medium text-foreground">{brl(valorTotal)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Data de criação</div>
            <div className="font-medium text-foreground">{fmtDate(projeto.createdAt)}</div>
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <div className="text-xs text-muted-foreground">Objetivos</div>
            <p className="mt-1 text-sm text-foreground">{projeto.objetivos}</p>
          </div>
        </section>

        {/* Origem do projeto */}
        <section className="mb-6 rounded-lg border border-border bg-surface p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <FileStack className="size-4 text-muted-foreground" /> Origem do projeto
          </h2>
          <div className="flex flex-wrap gap-3 text-sm">
            {preProjeto && (
              <Link
                to="/juridico/pre-projetos/$id"
                params={{ id: preProjeto.id }}
                className="rounded-md border border-border px-3 py-1.5 text-muted-foreground hover:text-foreground"
              >
                Pré-projeto aprovado: {preProjeto.name}
              </Link>
            )}
            {agrupamento && (
              <Link
                to="/juridico/agrupamentos/$id"
                params={{ id: agrupamento.id }}
                className="rounded-md border border-border px-3 py-1.5 text-muted-foreground hover:text-foreground"
              >
                Agrupamento de origem: {agrupamento.name}
              </Link>
            )}
          </div>
          <ul className="mt-4 divide-y divide-border">
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
        </section>

        {/* Conteúdo do projeto */}
        <section className="mb-6 rounded-lg border border-border bg-surface p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-foreground">Conteúdo do projeto</h2>
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={() => setNewSectionOpen(true)}
            >
              <Plus className="size-3.5" /> Incluir seção
            </Button>
          </div>
          <div className="space-y-4">
            {projeto.sections.map((sec) => (
              <div key={sec.key} className="space-y-2">
                <Label>{sec.label}</Label>
                <Textarea
                  defaultValue={sec.content}
                  rows={4}
                  onBlur={(e) => handleSalvarSection(sec.key, e.target.value)}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Documentos e evidências */}
        <section className="mb-6 rounded-lg border border-border bg-surface p-5">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Documentos e evidências</h2>
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-border p-4">
            <Input
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              placeholder="Nome do documento (ex.: memorial-descritivo.pdf)"
              className="flex-1"
            />
            <Button onClick={handleUpload} className="gap-2">
              <Upload className="size-4" /> Anexar
            </Button>
          </div>
          {projeto.documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum documento anexado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Enviado em</TableHead>
                  <TableHead>Enviado por</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {projeto.documents.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {fmtDate(d.uploadedAt)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{d.uploadedBy}</TableCell>
                    <TableCell>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 text-muted-foreground hover:text-destructive"
                        onClick={() => removeProjetoDocument(projeto.id, d.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </section>

        {/* Submissões ao MCTI */}
        {projeto.submissions.length > 0 && (
          <section className="mb-6 rounded-lg border border-border bg-surface p-5">
            <h2 className="mb-3 text-sm font-semibold text-foreground">Submissões ao MCTI</h2>
            <div className="space-y-3">
              {projeto.submissions.map((s) => (
                <div key={s.numero} className="rounded-md border border-border p-3 text-sm">
                  <div className="flex items-center gap-2 font-medium text-foreground">
                    {s.numero === 2 && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary">
                        2ª submissão
                      </span>
                    )}
                    Submetido em {fmtDate(s.submittedAt)} por {s.submittedBy}
                  </div>
                  {s.ajustesRealizados && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Ajustes desde a 1ª submissão: {s.ajustesRealizados}
                    </p>
                  )}
                  {s.resultado ? (
                    <p className="mt-1 text-foreground">
                      Resultado: {s.resultado === "aprovado" ? "Aprovado" : "Não aprovado"} em{" "}
                      {s.resultadoData && fmtDate(s.resultadoData)}. {s.devolutivaResumo}
                    </p>
                  ) : (
                    <p className="mt-1 text-muted-foreground">Aguardando devolutiva do MCTI.</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Histórico */}
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <History className="size-4 text-muted-foreground" /> Histórico
          </h2>
          <div className="space-y-2">
            {history.map((ev) => (
              <div key={ev.id} className="rounded-lg border border-border bg-surface p-3 text-sm">
                <span className="font-medium text-foreground">{ev.actor}</span>{" "}
                <span className="text-foreground">{ev.description}</span>{" "}
                <span className="text-muted-foreground">em {fmtDate(ev.date)}.</span>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Dialog open={newSectionOpen} onOpenChange={setNewSectionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Incluir nova seção</DialogTitle>
            <DialogDescription>
              Adicione um novo bloco de conteúdo ao projeto, além dos sugeridos pela IA.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Título da seção</Label>
            <Input value={newSectionLabel} onChange={(e) => setNewSectionLabel(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setNewSectionOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleIncluirSecao}>Incluir seção</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={finalizarOpen} onOpenChange={setFinalizarOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalizar projeto?</AlertDialogTitle>
            <AlertDialogDescription>
              O conteúdo atual ficará identificado como versão finalizada e o projeto passará para
              "Aguardando submissão". Continue editando antes de finalizar, se necessário.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleFinalizar}>Finalizar projeto</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={submissaoOpen} onOpenChange={setSubmissaoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar submissão ao MCTI</DialogTitle>
            <DialogDescription>
              A submissão é realizada externamente pelo usuário — registre aqui a confirmação do
              envio.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Data da submissão</Label>
              <Input
                type="date"
                value={dataSubmissao}
                onChange={(e) => setDataSubmissao(e.target.value)}
              />
            </div>
            {proximaSubmissaoNumero === 2 && (
              <div className="space-y-2">
                <Label>Ajustes realizados desde a primeira submissão</Label>
                <Textarea
                  value={ajustesRealizados}
                  onChange={(e) => setAjustesRealizados(e.target.value)}
                  rows={3}
                />
              </div>
            )}
            <label className="flex items-start gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                className="mt-1"
                checked={confirmoEnvio}
                onChange={(e) => setConfirmoEnvio(e.target.checked)}
              />
              Confirmo que o envio ao MCTI foi realizado externamente.
            </label>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSubmissaoOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRegistrarSubmissao}>Registrar submissão</Button>
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
