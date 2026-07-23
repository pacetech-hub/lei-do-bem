import type { ReactNode } from "react";
import { QuestionField } from "@/components/question-field";
import type { Project, Question } from "@/lib/types";
import { useProjectsStore } from "@/lib/store";

interface Props {
  project: Project;
  title: string;
  description: string;
  questions: Question[];
  extras?: ReactNode;
}

export function SectionQuestions({ project, title, description, questions, extras }: Props) {
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
          />
        ))}
        {extras}
      </div>
    </div>
  );
}
