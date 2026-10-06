import { SECTIONS, type Project } from "./types";

export interface ProjectHistoryEvent {
  date: string;
  actor: string;
  description: string;
}

// Trilha de auditoria simples, derivada dos campos já existentes na
// iniciativa (não há um log de eventos granular por ação — ex.: despesas não
// têm data nem responsável individual registrados, então não geram um evento
// aqui).
export function buildProjectHistory(project: Project): ProjectHistoryEvent[] {
  const events: ProjectHistoryEvent[] = [
    {
      date: project.createdAt,
      actor: project.responsible,
      description: "criou a iniciativa",
    },
  ];

  if (project.reviewedAt) {
    events.push({
      date: project.reviewedAt,
      actor: project.reviewedBy ?? "Revisor",
      description: "concluiu a revisão técnica e encaminhou a iniciativa para a Controladoria",
    });
  }

  if (project.lastAdjustmentNote) {
    const structuredItems = project.adjustmentItems ?? [];
    const sectionLabels = Array.from(
      new Set(structuredItems.map((i) => SECTIONS.find((s) => s.key === i.sectionKey)?.label)),
    ).filter(Boolean) as string[];
    const description =
      sectionLabels.length > 0
        ? `solicitou ajustes na etapa ${sectionLabels.join(", ")}`
        : "solicitou ajustes na iniciativa";
    events.push({ date: project.updatedAt, actor: project.reviewedBy ?? "Revisor", description });
  }

  if (project.sharedStatus === "recusado" && project.sharedDeclineReason) {
    events.push({
      date: project.updatedAt,
      actor: project.sharedSetor ?? "Diretoria de origem",
      description: "recusou o compartilhamento da iniciativa",
    });
  }

  return events.sort((a, b) => +new Date(b.date) - +new Date(a.date));
}
