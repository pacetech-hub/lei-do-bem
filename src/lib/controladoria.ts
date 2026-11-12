import type { DespesaDecision, Project } from "./types";

// Visão unificada das três categorias de despesa de uma iniciativa, para a
// Controladoria decidir (validar/sinalizar pendência/excluir) cada uma
// individualmente, independente do tipo de despesa.
export interface DespesaRef {
  id: string;
  type: "funcionario" | "terceiro" | "material";
  title: string;
  detail: string;
  // Horas elegíveis (funcionário) ou valor em R$ (terceiro/material).
  value: number;
}

export function despesaRefs(project: Project): DespesaRef[] {
  const employees: DespesaRef[] = project.employees.map((e) => ({
    id: e.id,
    type: "funcionario",
    title: `${e.name} — ${e.role}`,
    detail: e.activity,
    value: e.eligibleHours,
  }));
  const thirdParties: DespesaRef[] = project.thirdParties.map((t) => ({
    id: t.id,
    type: "terceiro",
    title: t.company,
    detail: `NF ${t.invoice}`,
    value: t.usedInProject,
  }));
  const materials: DespesaRef[] = project.materials.map((m) => ({
    id: m.id,
    type: "material",
    title: m.supplier,
    detail: m.materialDescription,
    value: m.netValue,
  }));
  return [...employees, ...thirdParties, ...materials];
}

export function decisionFor(project: Project, expenseId: string): DespesaDecision | undefined {
  return project.despesaDecisions?.[expenseId];
}

export function hasPendenciaAberta(project: Project): boolean {
  return despesaRefs(project).some((d) => decisionFor(project, d.id)?.status === "pendencia");
}

export function todasDespesasDecididas(project: Project): boolean {
  const refs = despesaRefs(project);
  return refs.length > 0 && refs.every((d) => decisionFor(project, d.id) !== undefined);
}

// Compara o valor atual da despesa com o registrado no momento da decisão —
// usado para sinalizar, num retorno do Revisor, quais despesas já corrigidas
// precisam de nova conferência.
export function despesaFoiAlterada(project: Project, ref: DespesaRef): boolean {
  const decision = decisionFor(project, ref.id);
  if (!decision) return false;
  return decision.snapshotValue !== ref.value;
}

// Soma de terceiros + materiais informada pelo Financeiro (funcionários não
// têm valor em R$, só horas) — não é afetada pelas decisões da Controladoria.
export function valorTotalInformado(project: Project): number {
  const terceiros = project.thirdParties.reduce((sum, t) => sum + t.usedInProject, 0);
  const materiais = project.materials.reduce((sum, m) => sum + m.netValue, 0);
  return terceiros + materiais;
}

// Mesmo total, mas excluindo despesas marcadas como "excluída" pela
// Controladoria — reflete o valor efetivamente considerado na composição
// financeira da análise.
export function valorConsiderado(project: Project): number {
  let total = 0;
  project.thirdParties.forEach((t) => {
    if (decisionFor(project, t.id)?.status !== "excluida") total += t.usedInProject;
  });
  project.materials.forEach((m) => {
    if (decisionFor(project, m.id)?.status !== "excluida") total += m.netValue;
  });
  return total;
}
