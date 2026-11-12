import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, CheckCircle2, FileSearch, Upload, XCircle } from "lucide-react";
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
import { useProjectsStore } from "@/lib/store";
import { ProjetoStatusBadge } from "@/components/juridico/juridico-status-badge";

const fmtDate = (iso: string) => format(new Date(iso), "dd/MM/yyyy", { locale: ptBR });

type Resultado = "aprovado" | "nao_aprovado";

export function JuridicoDevolutivasMcti() {
  const navigate = useNavigate();
  const juridicoProjetos = useProjectsStore((s) => s.juridicoProjetos);
  const addProjetoDocument = useProjectsStore((s) => s.addProjetoDocument);
  const processarDevolutivaMcti = useProjectsStore((s) => s.processarDevolutivaMcti);

  const aguardando = useMemo(
    () => juridicoProjetos.filter((p) => p.status === "submetido_mcti"),
    [juridicoProjetos],
  );
  const processados = useMemo(
    () =>
      juridicoProjetos
        .filter((p) => p.status === "aprovado" || p.status === "nao_aprovado")
        .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)),
    [juridicoProjetos],
  );

  const [step, setStep] = useState<"upload" | "conferencia">("upload");
  const [documentName, setDocumentName] = useState("");
  const [projetoId, setProjetoId] = useState<string>("");
  const [resultado, setResultado] = useState<Resultado>("aprovado");
  const [resumo, setResumo] = useState("");

  const projetoSelecionado = aguardando.find((p) => p.id === projetoId);

  const handleAnalisar = () => {
    if (!documentName.trim()) {
      toast.error("Envie o documento oficial de devolutiva do MCTI.");
      return;
    }
    if (!projetoId) {
      toast.error("Selecione o projeto correspondente a esta devolutiva.");
      return;
    }
    setStep("conferencia");
  };

  const resetWizard = () => {
    setStep("upload");
    setDocumentName("");
    setProjetoId("");
    setResultado("aprovado");
    setResumo("");
  };

  const handleConfirmar = () => {
    if (!projetoSelecionado) return;
    if (!resumo.trim()) {
      toast.error("Descreva as informações e justificativas apresentadas pelo MCTI.");
      return;
    }
    const documento = {
      id: crypto.randomUUID(),
      name: documentName.trim(),
      type: documentName.includes(".") ? documentName.split(".").pop()! : "pdf",
      uploadedAt: new Date().toISOString(),
      uploadedBy: "Jurídico",
      size: Math.floor(Math.random() * 1500 + 300) * 1024,
    };
    processarDevolutivaMcti(projetoSelecionado.id, { resultado, resumo: resumo.trim(), documento });
    toast.success(
      resultado === "aprovado"
        ? "Devolutiva registrada — projeto aprovado pelo MCTI."
        : "Devolutiva registrada — projeto não aprovado.",
    );
    const id = projetoSelecionado.id;
    resetWizard();
    navigate({ to: "/juridico/projetos/$id", params: { id } });
  };

  return (
    <main className="mx-auto max-w-[1200px] px-6 py-8">
      <Link
        to="/juridico/projetos"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Projetos
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Devolutivas do MCTI</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Envie o documento oficial de retorno do MCTI e confirme a interpretação antes de atualizar
          o status do projeto.
        </p>
      </div>

      <section className="mb-8 rounded-lg border border-border bg-surface p-5">
        {step === "upload" ? (
          <>
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Upload className="size-4 text-muted-foreground" /> Enviar documento
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Documento oficial de devolutiva</Label>
                <Input
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  placeholder="Ex.: devolutiva-mcti-2026.pdf"
                />
              </div>
              <div className="space-y-2">
                <Label>Projeto correspondente</Label>
                <Select value={projetoId} onValueChange={setProjetoId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o projeto submetido" />
                  </SelectTrigger>
                  <SelectContent>
                    {aguardando.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        Nenhum projeto aguardando devolutiva.
                      </div>
                    ) : (
                      aguardando.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.identificacao} — {p.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className="mt-4 gap-2" onClick={handleAnalisar}>
              <FileSearch className="size-4" /> Analisar documento
            </Button>
          </>
        ) : (
          projetoSelecionado && (
            <>
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
                <FileSearch className="size-4 text-muted-foreground" /> Conferência da interpretação
              </h2>
              <dl className="mb-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground">Documento enviado</dt>
                  <dd className="font-medium text-foreground">{documentName}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Projeto identificado</dt>
                  <dd className="font-medium text-foreground">
                    {projetoSelecionado.identificacao} — {projetoSelecionado.name}
                  </dd>
                </div>
              </dl>

              <div className="mb-4 space-y-2">
                <Label>Resultado interpretado pela IA</Label>
                <Select value={resultado} onValueChange={(v) => setResultado(v as Resultado)}>
                  <SelectTrigger className="w-[240px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aprovado">Aprovado</SelectItem>
                    <SelectItem value="nao_aprovado">Não aprovado</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Confira o resultado identificado no documento e corrija antes de confirmar, se
                  necessário.
                </p>
              </div>

              <div className="mb-4 space-y-2">
                <Label>Informações e justificativas apresentadas pelo MCTI</Label>
                <Textarea value={resumo} onChange={(e) => setResumo(e.target.value)} rows={4} />
              </div>

              <div className="mb-4 rounded-md border border-dashed border-border p-4 text-sm">
                <div className="mb-1 font-medium text-foreground">Prévia das alterações</div>
                <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                  <li>
                    Status do projeto mudará de <ProjetoStatusBadge status="submetido_mcti" /> para{" "}
                    <ProjetoStatusBadge status={resultado} />.
                  </li>
                  <li>A data do retorno e o documento enviado serão registrados.</li>
                  <li>O histórico do projeto será atualizado.</li>
                  {resultado === "aprovado" ? (
                    <li>
                      As informações financeiras serão disponibilizadas automaticamente para a
                      Controladoria, em Contas contábeis.
                    </li>
                  ) : (
                    <li>
                      O projeto ficará destacado na listagem e poderá ser reaberto para ajustes,
                      desde que ainda não tenha havido uma segunda submissão.
                    </li>
                  )}
                </ul>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setStep("upload")}>
                  Voltar
                </Button>
                <Button className="gap-2" onClick={handleConfirmar}>
                  {resultado === "aprovado" ? (
                    <CheckCircle2 className="size-4" />
                  ) : (
                    <XCircle className="size-4" />
                  )}
                  Confirmar atualização
                </Button>
              </div>
            </>
          )
        )}
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Projetos aguardando devolutiva ({aguardando.length})
        </h2>
        {aguardando.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum projeto aguardando devolutiva.</p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
            {aguardando.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <div>
                  <div className="font-medium text-foreground">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.identificacao}</div>
                </div>
                <Link
                  to="/juridico/projetos/$id"
                  params={{ id: p.id }}
                  className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                >
                  Ver projeto
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Devolutivas processadas</h2>
        {processados.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma devolutiva processada ainda.</p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
            {processados.map((p) => {
              const ultima = p.submissions[p.submissions.length - 1];
              return (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                >
                  <div>
                    <div className="font-medium text-foreground">{p.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.identificacao} · {ultima?.resultadoData && fmtDate(ultima.resultadoData)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <ProjetoStatusBadge status={p.status} />
                    <Link
                      to="/juridico/projetos/$id"
                      params={{ id: p.id }}
                      className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                    >
                      Ver projeto
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
