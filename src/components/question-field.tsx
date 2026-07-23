import { useState } from "react";
import { Paperclip, Sparkles, ScanSearch, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { CURRENT_USER } from "@/lib/types";
import type { Attachment } from "@/lib/types";
import { useProjectsStore } from "@/lib/store";

interface Props {
  projectId: string;
  questionId: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  attachments: Attachment[];
  minChars?: number;
}

export function QuestionField({
  projectId,
  questionId,
  label,
  value,
  onChange,
  attachments,
  minChars = 200,
}: Props) {
  const [aiOpen, setAiOpen] = useState(false);
  const [aiMode, setAiMode] = useState<"improve" | "analyze">("improve");
  const addAttachment = useProjectsStore((s) => s.addAttachment);
  const removeAttachment = useProjectsStore((s) => s.removeAttachment);

  const charCount = value.length;
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

  const openAi = (mode: "improve" | "analyze") => {
    setAiMode(mode);
    setAiOpen(true);
  };

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-2 flex items-start justify-between gap-4">
        <Label htmlFor={questionId} className="text-[13px] font-semibold text-foreground">
          {label}
        </Label>
        <div className="flex shrink-0 gap-1.5">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 gap-1.5 px-2 text-xs text-primary hover:bg-primary/5 hover:text-primary"
            onClick={() => openAi("improve")}
          >
            <Sparkles className="size-3.5" /> Melhorar com IA
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => openAi("analyze")}
          >
            <ScanSearch className="size-3.5" /> Analisar
          </Button>
        </div>
      </div>

      <Textarea
        id={questionId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        placeholder="Escreva a resposta com o maior nível de detalhe possível…"
        className="resize-y bg-background text-sm leading-relaxed"
      />

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3 text-xs">
          <span className={meetsMin ? "text-muted-foreground" : "text-primary"}>
            {charCount.toLocaleString("pt-BR")} caracteres
            {!meetsMin && ` · sugerido: ${minChars}+`}
          </span>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 gap-1.5 text-xs"
          onClick={handleAttach}
        >
          <Paperclip className="size-3.5" /> Anexar documento
        </Button>
      </div>

      {attachments.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {attachments.map((a) => (
            <li
              key={a.id}
              className="flex items-center gap-2 rounded-md border border-border bg-surface-muted px-2.5 py-1.5 text-xs"
            >
              <FileText className="size-3.5 text-muted-foreground" />
              <span className="flex-1 truncate">{a.name}</span>
              <span className="text-muted-foreground">
                {new Date(a.uploadedAt).toLocaleDateString("pt-BR")}
              </span>
              <button
                type="button"
                onClick={() => removeAttachment(projectId, questionId, a.id)}
                className="text-muted-foreground hover:text-primary"
                aria-label="Remover anexo"
              >
                <X className="size-3.5" />
              </button>
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
            <div className="rounded-md border border-border bg-surface-muted p-3">
              <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Pergunta
              </div>
              <p className="text-foreground">{label}</p>
            </div>

            {aiMode === "improve" ? (
              <div className="space-y-2">
                <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
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
                  <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Completude
                  </div>
                  <p>{meetsMin ? "A resposta atende ao tamanho mínimo sugerido." : `Está abaixo do mínimo recomendado de ${minChars} caracteres.`}</p>
                </div>
                <div className="rounded-md border border-border p-3">
                  <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
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
