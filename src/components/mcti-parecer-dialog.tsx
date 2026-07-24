import { useState } from "react";
import { CheckCircle2, FileWarning, Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { useProjectsStore } from "@/lib/store";
import type { MctiParecerResult } from "@/lib/types";

const REASONS = [
  "Apresentar nova evidência técnica.",
  "Detalhar melhor a metodologia utilizada.",
  "Complementar informações sobre os testes realizados.",
  "Esclarecer o comparativo entre a tecnologia anterior e a nova.",
];

function pseudoRandom(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h) % 100;
}

interface MctiParecerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MctiParecerDialog({ open, onOpenChange }: MctiParecerDialogProps) {
  const allProjects = useProjectsStore((s) => s.projects);
  const addParecer = useProjectsStore((s) => s.addParecer);
  const updateProject = useProjectsStore((s) => s.updateProject);

  const [step, setStep] = useState<"upload" | "review">("upload");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [quarter, setQuarter] = useState<"1" | "2" | "3" | "4">("1");
  const [fileName, setFileName] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<MctiParecerResult[]>([]);

  const reset = () => {
    setStep("upload");
    setFileName("");
    setResults([]);
    setAnalyzing(false);
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleAnalyze = () => {
    if (!fileName.trim()) {
      toast.error("Selecione o documento recebido do MCTI.");
      return;
    }
    setAnalyzing(true);
    const candidates = allProjects.filter((p) => p.legalStatus === "submetido");
    window.setTimeout(() => {
      const suggested: MctiParecerResult[] = candidates.map((p) => {
        const roll = pseudoRandom(p.id);
        const isApproved = roll < 75;
        return {
          projectId: p.id,
          projectName: p.name,
          suggested: isApproved ? "aprovado" : "ajustes_mcti",
          reason: isApproved ? undefined : REASONS[roll % REASONS.length],
          confirmed: false,
        };
      });
      setResults(suggested);
      setAnalyzing(false);
      setStep("review");
    }, 600);
  };

  const updateResult = (projectId: string, patch: Partial<MctiParecerResult>) => {
    setResults((prev) => prev.map((r) => (r.projectId === projectId ? { ...r, ...patch } : r)));
  };

  const handleConfirmAll = () => {
    const parecerId = crypto.randomUUID();
    addParecer({
      id: parecerId,
      year: Number(year),
      quarter: Number(quarter) as 1 | 2 | 3 | 4,
      fileName,
      uploadedAt: new Date().toISOString(),
      uploadedBy: "Ana Souza",
      results: results.map((r) => ({ ...r, confirmed: true })),
    });
    results.forEach((r) => {
      updateProject(r.projectId, {
        legalStatus: r.suggested,
        ...(r.suggested === "aprovado" ? { status: "aprovado" as const } : {}),
        mctiParecerId: parecerId,
        mctiResult: r.suggested,
        mctiReason: r.reason,
      });
    });
    toast.success("Parecer registrado", {
      description: `${results.length} projetos atualizados.`,
    });
    handleClose(false);
  };

  const approved = results.filter((r) => r.suggested === "aprovado");
  const adjustments = results.filter((r) => r.suggested === "ajustes_mcti");

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Adicionar parecer do MCTI</DialogTitle>
          <DialogDescription>
            {step === "upload"
              ? "Selecione o ano e o trimestre e envie o documento recebido do Ministério."
              : "Confira o resultado sugerido para cada projeto antes de confirmar."}
          </DialogDescription>
        </DialogHeader>

        {step === "upload" ? (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Ano</Label>
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3].map((d) => {
                      const y = new Date().getFullYear() - d;
                      return (
                        <SelectItem key={y} value={y.toString()}>
                          {y}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Trimestre</Label>
                <Select value={quarter} onValueChange={(v) => setQuarter(v as typeof quarter)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1º Tri</SelectItem>
                    <SelectItem value="2">2º Tri</SelectItem>
                    <SelectItem value="3">3º Tri</SelectItem>
                    <SelectItem value="4">4º Tri</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="parecer-file">Documento do MCTI</Label>
              <div className="flex items-center gap-2">
                <input
                  id="parecer-file"
                  type="file"
                  className="hidden"
                  onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={() => document.getElementById("parecer-file")?.click()}
                >
                  <Upload className="size-4" /> Selecionar arquivo
                </Button>
                <span className="truncate text-sm text-muted-foreground">
                  {fileName || "Nenhum arquivo selecionado"}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => handleClose(false)}>
                Cancelar
              </Button>
              <Button className="gap-2" disabled={analyzing} onClick={handleAnalyze}>
                <Sparkles className="size-4" />
                {analyzing ? "Analisando documento…" : "Analisar documento"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {results.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum projeto em análise pelo MCTI foi encontrado para vincular a este parecer.
              </p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  {results.length} projetos identificados
                </p>

                <div className="max-h-[360px] space-y-4 overflow-y-auto pr-1">
                  <section>
                    <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-status-approved-fg">
                      <CheckCircle2 className="size-3.5" /> Aprovados ({approved.length})
                    </h3>
                    <div className="space-y-1.5">
                      {approved.map((r) => (
                        <ResultRow key={r.projectId} result={r} onChange={updateResult} />
                      ))}
                    </div>
                  </section>

                  {adjustments.length > 0 && (
                    <section>
                      <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-status-adjust-fg">
                        <FileWarning className="size-3.5" /> Ajustes solicitados (
                        {adjustments.length})
                      </h3>
                      <div className="space-y-1.5">
                        {adjustments.map((r) => (
                          <ResultRow key={r.projectId} result={r} onChange={updateResult} />
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              </>
            )}

            <div className="flex justify-end gap-2 border-t border-border pt-4">
              <Button variant="outline" onClick={() => setStep("upload")}>
                Voltar
              </Button>
              <Button disabled={results.length === 0} onClick={handleConfirmAll}>
                Confirmar todos e concluir
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ResultRow({
  result,
  onChange,
}: {
  result: MctiParecerResult;
  onChange: (projectId: string, patch: Partial<MctiParecerResult>) => void;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="rounded-md border border-border bg-surface p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-foreground">{result.projectName}</span>
        <div className="flex shrink-0 items-center gap-1.5">
          {result.confirmed ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-status-approved-fg">
              <CheckCircle2 className="size-3.5" /> Confirmado
            </span>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onChange(result.projectId, { confirmed: true })}
            >
              Confirmar
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => setEditing((v) => !v)}>
            Editar
          </Button>
        </div>
      </div>
      {editing && (
        <div className="mt-2.5 space-y-2 border-t border-border pt-2.5">
          <Select
            value={result.suggested}
            onValueChange={(v) =>
              onChange(result.projectId, {
                suggested: v as "aprovado" | "ajustes_mcti",
                confirmed: false,
              })
            }
          >
            <SelectTrigger className="h-8 w-[200px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="aprovado">Aprovado</SelectItem>
              <SelectItem value="ajustes_mcti">Ajuste solicitado</SelectItem>
            </SelectContent>
          </Select>
          {result.suggested === "ajustes_mcti" && (
            <Textarea
              value={result.reason ?? ""}
              onChange={(e) =>
                onChange(result.projectId, { reason: e.target.value, confirmed: false })
              }
              placeholder="Motivo do ajuste solicitado"
              rows={2}
              className="text-xs"
            />
          )}
        </div>
      )}
      {!editing && result.reason && (
        <p className="mt-1.5 text-xs text-muted-foreground">{result.reason}</p>
      )}
    </div>
  );
}
