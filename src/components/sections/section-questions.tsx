import type { ReactNode } from "react";
import { QuestionField, type FieldMode } from "@/components/question-field";
import type { AdjustmentItem, Project, Question } from "@/lib/types";
import { useProjectsStore } from "@/lib/store";

interface Props {
  project: Project;
  title: string;
  description: string;
  questions: Question[];
  extras?: ReactNode;
  pendingItems?: AdjustmentItem[];
  mode?: FieldMode;
  draftItems?: AdjustmentItem[];
  onAddDraftAdjustment?: (fieldId: string, fieldLabel: string, comment: string) => void;
  onRemoveDraftAdjustment?: (id: string) => void;
  // Projeto de origem compartilhada (Revisor): texto original somente
  // leitura, com observações adicionais por campo — ver QuestionField.
  sharedReadOnly?: boolean;
  onChangeAdditionalNote?: (fieldId: string, value: string) => void;
}

export function SectionQuestions({
  project,
  title,
  description,
  questions,
  extras,
  pendingItems,
  mode = "editable",
  draftItems,
  onAddDraftAdjustment,
  onRemoveDraftAdjustment,
  sharedReadOnly = false,
  onChangeAdditionalNote,
}: Props) {
  const setAnswer = useProjectsStore((s) => s.setAnswer);
  return (
    <div className="max-w-3xl">
      <header className="mb-6">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </header>

      <div className="space-y-4">
        {questions.map((q) => (
          <QuestionField
            key={q.id}
            projectId={project.id}
            questionId={q.id}
            label={q.label}
            value={project.answers[q.id] ?? ""}
            onChange={(v) => setAnswer(project.id, q.id, v)}
            attachments={project.attachments[q.id] ?? []}
            flagComment={pendingItems?.find((i) => i.fieldId === q.id)?.comment}
            mode={mode}
            draftAdjustments={draftItems?.filter((i) => i.fieldId === q.id)}
            onAddDraftAdjustment={
              onAddDraftAdjustment
                ? (comment) => onAddDraftAdjustment(q.id, q.label, comment)
                : undefined
            }
            onRemoveDraftAdjustment={onRemoveDraftAdjustment}
            sharedReadOnly={sharedReadOnly}
            additionalNote={project.sharedAdditionalNotes?.[q.id]}
            onChangeAdditionalNote={
              onChangeAdditionalNote ? (v) => onChangeAdditionalNote(q.id, v) : undefined
            }
          />
        ))}
        {extras}
      </div>
    </div>
  );
}
