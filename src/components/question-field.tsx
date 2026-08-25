import { useState } from "react";
import { AlertTriangle, Mic, Paperclip, Save, Sparkles, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { CURRENT_USER } from "@/lib/types";
import type { AdjustmentItem, Attachment } from "@/lib/types";
import { useProjectsStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export type FieldMode = "editable" | "review" | "locked";

interface Props {
  projectId: string;
  questionId: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  attachments: Attachment[];
  minChars?: number;
  flagComment?: string;
  mode?: FieldMode;
  draftAdjustments?: AdjustmentItem[];
  onAddDraftAdjustment?: (comment: string) => void;
  onRemoveDraftAdjustment?: (id: string) => void;
  // Projeto de origem compartilhada (Revisor): o texto original nunca é
  // editável, mesmo em modo de revisão — só um campo de observações abaixo,
  // permanentemente, para nunca sobrescrever o que a outra área escreveu.
  sharedReadOnly?: boolean;
  additionalNote?: string;
  onChangeAdditionalNote?: (v: string) => void;
}

export function QuestionField({
  projectId,
  questionId,
  label,
  value,
  onChange,
  attachments,
  minChars = 200,
  flagComment,
  mode = "editable",
  draftAdjustments,
  onAddDraftAdjustment,
  onRemoveDraftAdjustment,
  sharedReadOnly = false,
  additionalNote,
  onChangeAdditionalNote,
}: Props) {
  const [aiOpen, setAiOpen] = useState(false);
  const [aiMode, setAiMode] = useState<"improve" | "analyze">("analyze");
  const [editingText, setEditingText] = useState(false);
  const [draftText, setDraftText] = useState(value);
  const [requestingAdjustment, setRequestingAdjustment] = useState(false);
  const [adjustmentComment, setAdjustmentComment] = useState("");
  const [transcribing, setTranscribing] = useState(false);
  const addAttachment = useProjectsStore((s) => s.addAttachment);
  const removeAttachment = useProjectsStore((s) => s.removeAttachment);

  const isEditable = mode === "editable";
  const isReview = mode === "review";
  const isLocked = mode === "locked";
  const canTypeDirectly = isEditable || editingText;
  const showAsText = isLocked || sharedReadOnly;
  const displayedValue = editingText ? draftText : value;
  const charCount = displayedValue.length;
  const meetsMin = charCount >= minChars;

  const handleAttach = () => {
    const name = `documento-${Math.floor(Math.random() * 9000 + 1000)}.pdf`;
    addAttachment(projectId, questionId, {
      id: crypto.randomUUID(),
      name,
      type: "application/pdf",
      uploadedAt: new Date().toISOString(),
      uploadedBy: CURRENT_USER.name,
      size: Math.floor(Math.random() * 900 + 100) * 1024,
    });
  };

  const openAi = () => {
    setAiMode("analyze");
    setAiOpen(true);
  };

  const handleTranscribeAudio = () => {
    setTranscribing(true);
    window.setTimeout(() => {
      const mockTranscript =
        "Transcrição automática do áudio gravado: revise o texto abaixo e ajuste conforme necessário antes de enviar.";
      onChange(value.trim() ? `${value}\n\n${mockTranscript}` : mockTranscript);
      setTranscribing(false);
    }, 1500);
  };

  const startEditingText = () => {
    setDraftText(value);
    setEditingText(true);
  };
  const cancelEditingText = () => {
    setEditingText(false);
  };
  const saveEditingText = () => {
    onChange(draftText);
    setEditingText(false);
  };

  const startRequestingAdjustment = () => {
    setAdjustmentComment("");
    setRequestingAdjustment(true);
  };
  const cancelRequestingAdjustment = () => {
    setRequestingAdjustment(false);
    setAdjustmentComment("");
  };
  const submitAdjustmentRequest = () => {
    if (!adjustmentComment.trim()) return;
    onAddDraftAdjustment?.(adjustmentComment.trim());
    setRequestingAdjustment(false);
    setAdjustmentComment("");
  };

  const hasHighlight = Boolean(flagComment) || Boolean(draftAdjustments?.length);
  const showSharedNote = sharedReadOnly && (isReview || Boolean(additionalNote));

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-surface p-4",
        hasHighlight && "border-status-adjust-fg/40 bg-status-adjust/5",
      )}
    >
      {flagComment && (
        <div className="mb-3 flex items-start gap-2 rounded-md bg-background/70 p-3 text-xs font-medium text-status-adjust-fg">
          <AlertTriangle className="mt-1 size-3.5 shrink-0" />
          <span>Ajuste solicitado: {flagComment}</span>
        </div>
      )}

      {draftAdjustments && draftAdjustments.length > 0 && (
        <div className="mb-3 space-y-2">
          {draftAdjustments.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between gap-2 rounded-md border border-dashed border-status-adjust-fg/40 bg-background/70 p-3 text-xs text-status-adjust-fg"
            >
              <span>
                <span className="font-medium">Ajuste registrado</span> (será enviado ao Relator ao
                final da revisão): {item.comment}
              </span>
              <button
                type="button"
                onClick={() => onRemoveDraftAdjustment?.(item.id)}
                className="shrink-0 text-status-adjust-fg/70 hover:text-status-adjust-fg"
                aria-label="Remover solicitação"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Label htmlFor={questionId} className="mb-2 block text-sm font-semibold text-foreground">
        {label}
      </Label>

      {!showAsText && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {isEditable && (
            <>
              <Button type="button" size="sm" className="gap-2" onClick={openAi}>
                <Sparkles className="size-4" /> Analisar com IA
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-2"
                disabled={transcribing}
                onClick={handleTranscribeAudio}
              >
                <Mic className={cn("size-4", transcribing && "animate-pulse text-primary")} />
                {transcribing ? "Gravando…" : "Transcrever áudio"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={handleAttach}
              >
                <Paperclip className="size-4" /> Anexar documento
              </Button>
            </>
          )}

          {isReview && editingText && (
            <>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="gap-2"
                onClick={cancelEditingText}
              >
                <X className="size-4" /> Cancelar
              </Button>
              <Button type="button" size="sm" className="gap-2" onClick={saveEditingText}>
                <Save className="size-4" /> Salvar
              </Button>
            </>
          )}

          {isReview && !editingText && !requestingAdjustment && (
            <>
              <Button type="button" size="sm" className="gap-2" onClick={openAi}>
                <Sparkles className="size-4" /> Analisar com IA
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={handleAttach}
              >
                <Paperclip className="size-4" /> Anexar documento
              </Button>
              {!sharedReadOnly && (
                <Button type="button" size="sm" variant="outline" onClick={startEditingText}>
                  Ajustar texto
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="text-status-adjust-fg hover:text-status-adjust-fg"
                onClick={startRequestingAdjustment}
              >
                Solicitar ajuste
              </Button>
            </>
          )}
        </div>
      )}

      {showAsText ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
          {value.trim() || (
            <span className="text-muted-foreground">Nenhuma resposta registrada.</span>
          )}
        </p>
      ) : (
        <Textarea
          id={questionId}
          value={displayedValue}
          onChange={(e) => {
            if (isEditable) onChange(e.target.value);
            else if (editingText) setDraftText(e.target.value);
          }}
          readOnly={!canTypeDirectly}
          rows={5}
          placeholder="Escreva a resposta com o maior nível de detalhe possível…"
          className={cn(
            "resize-y bg-background text-sm leading-relaxed",
            !canTypeDirectly && "cursor-default resize-none bg-surface-muted/50",
          )}
        />
      )}

      {showSharedNote && (
        <div className="mt-3 space-y-2 rounded-md border border-dashed border-border bg-surface-muted/40 p-3">
          <Label
            htmlFor={`${questionId}-shared-note`}
            className="text-xs font-semibold text-muted-foreground"
          >
            Observações adicionais do Revisor
          </Label>
          {isReview ? (
            <Textarea
              id={`${questionId}-shared-note`}
              value={additionalNote ?? ""}
              onChange={(e) => onChangeAdditionalNote?.(e.target.value)}
              rows={3}
              placeholder="Acrescente informações sem alterar o texto original do Relator…"
            />
          ) : (
            <p className="whitespace-pre-wrap text-sm text-foreground">{additionalNote}</p>
          )}
        </div>
      )}

      {requestingAdjustment && (
        <div className="mt-3 space-y-2 rounded-md border border-status-adjust-fg/30 bg-status-adjust/5 p-3">
          <Label
            htmlFor={`${questionId}-adjustment`}
            className="text-xs font-semibold text-status-adjust-fg"
          >
            Solicitação de ajuste
          </Label>
          <Textarea
            id={`${questionId}-adjustment`}
            value={adjustmentComment}
            onChange={(e) => setAdjustmentComment(e.target.value)}
            rows={3}
            placeholder="Descreva exatamente o que precisa ser corrigido neste campo."
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={cancelRequestingAdjustment}>
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!adjustmentComment.trim()}
              onClick={submitAdjustmentRequest}
            >
              Registrar solicitação
            </Button>
          </div>
        </div>
      )}

      {!showAsText && (
        <div className="mt-2 flex items-center gap-3 text-xs">
          <span className={meetsMin ? "text-muted-foreground" : "text-primary"}>
            {charCount.toLocaleString("pt-BR")} caracteres
            {!meetsMin && ` · sugerido: ${minChars}+`}
          </span>
        </div>
      )}

      {attachments.length > 0 && (
        <ul className="mt-3 space-y-2">
          {attachments.map((a) => (
            <li
              key={a.id}
              className="flex items-center gap-2 rounded-md border border-border bg-surface-muted px-3 py-2 text-xs"
            >
              <FileText className="size-3.5 text-muted-foreground" />
              <span className="flex-1 truncate">{a.name}</span>
              <span className="text-muted-foreground">
                {new Date(a.uploadedAt).toLocaleDateString("pt-BR")}
              </span>
              {isEditable && (
                <button
                  type="button"
                  onClick={() => removeAttachment(projectId, questionId, a.id)}
                  className="text-muted-foreground hover:text-primary"
                  aria-label="Remover anexo"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <Sheet open={aiOpen} onOpenChange={setAiOpen}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              {aiMode === "improve" ? "Sugestão da IA" : "Análise da IA"}
            </SheetTitle>
            <SheetDescription>
              A IA atua como assistente. Você mantém o controle da resposta final.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 space-y-4 px-4 text-sm">
            {isEditable && (
              <div className="inline-flex rounded-md border border-border bg-surface-muted p-1">
                <button
                  type="button"
                  onClick={() => setAiMode("analyze")}
                  className={cn(
                    "rounded-sm px-3 py-1.5 text-xs font-medium transition-colors",
                    aiMode === "analyze"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Somente analisar
                </button>
                <button
                  type="button"
                  onClick={() => setAiMode("improve")}
                  className={cn(
                    "rounded-sm px-3 py-1.5 text-xs font-medium transition-colors",
                    aiMode === "improve"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Melhorar com IA
                </button>
              </div>
            )}

            <div className="rounded-md border border-border bg-surface-muted p-3">
              <div className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Pergunta
              </div>
              <p className="text-foreground">{label}</p>
            </div>

            {aiMode === "improve" ? (
              <div className="space-y-2">
                <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Versão sugerida
                </div>
                <div className="rounded-md border border-primary/20 bg-primary/5 p-3 text-sm leading-relaxed">
                  {value.trim().length === 0
                    ? "Escreva ao menos um rascunho para que a IA possa sugerir melhorias."
                    : "A resposta pode ser expandida com mais detalhes técnicos: descreva as tecnologias envolvidas, comparativos quantitativos com o estado da arte, marcos temporais e critérios de aceitação. Considere também citar bibliografia técnica e patentes correlatas para reforçar a fundamentação."}
                </div>
                <Button size="sm" className="w-full" disabled={value.trim().length === 0}>
                  Aplicar sugestão
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-md border border-border p-3">
                  <div className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Completude
                  </div>
                  <p>
                    {meetsMin
                      ? "A resposta atende ao tamanho mínimo sugerido."
                      : `Está abaixo do mínimo recomendado de ${minChars} caracteres.`}
                  </p>
                </div>
                <div className="rounded-md border border-border p-3">
                  <div className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Pontos a reforçar
                  </div>
                  <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
                    <li>Deixar clara a novidade em relação ao estado da arte.</li>
                    <li>Explicitar métricas objetivas de comparação.</li>
                    <li>Amarrar a resposta aos critérios da Lei do Bem.</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
