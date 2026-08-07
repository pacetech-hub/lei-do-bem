import { SECTIONS, type MctiParecer, type Project } from "./types";

export interface ProjectHistoryEvent {
  date: string;
  actor: string;
  description: string;
}

// Trilha de auditoria simples, derivada dos campos já existentes no projeto
// (não há um log de eventos granular por ação — ex.: despesas não têm data
// nem responsável individual registrados, então não geram um evento aqui).
export function buildProjectHistory(
  project: Project,
  pareceres: MctiParecer[] = [],
): ProjectHistoryEvent[] {
  const events: ProjectHistoryEvent[] = [
    {
      date: project.createdAt,
      actor: project.responsible,
      description: "criou o projeto",
    },
  ];

  if (project.reviewedAt) {
    events.push({
      date: project.reviewedAt,
      actor: project.reviewedBy ?? "Revisor",
      description: "concluiu a revisão técnica e encaminhou o projeto ao Jurídico",
    });
  }

  if (project.lastAdjustmentNote) {
    const structuredItems = project.adjustmentItems ?? [];
    const sectionLabels = Array.from(
      new Set(structuredItems.map((i) => SECTIONS.find((s) => s.key === i.sectionKey)?.label)),
    ).filter(Boolean) as string[];
    const actor = structuredItems.length > 0 ? (project.reviewedBy ?? "Revisor") : "Jurídico";
    const description =
      sectionLabels.length > 0
        ? `solicitou ajustes na etapa ${sectionLabels.join(", ")}`
        : "solicitou ajustes no projeto";
    events.push({ date: project.updatedAt, actor, description });
  }

  if (project.sharedStatus === "recusado" && project.sharedDeclineReason) {
    events.push({
      date: project.updatedAt,
      actor: project.sharedSetor ?? "Área de origem",
      description: "recusou o compartilhamento do projeto",
    });
  }

  if (project.submissionDate) {
    events.push({
      date: project.submissionDate,
      actor: "Jurídico",
      description: `registrou a submissão ao MCTI (${project.submissionDoc ?? "documento"})`,
    });
  }

  const parecer = project.mctiParecerId
    ? pareceres.find((p) => p.id === project.mctiParecerId)
    : undefined;
  if (parecer) {
    events.push({
      date: parecer.uploadedAt,
      actor: "MCTI",
      description:
        project.mctiResult === "aprovado"
          ? "aprovou o projeto"
          : `solicitou ajustes: ${project.mctiReason ?? "sem detalhes"}`,
    });
  }

  return events.sort((a, b) => +new Date(b.date) - +new Date(a.date));
}
