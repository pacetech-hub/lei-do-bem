import type { Invoice, InvoiceItem, Project } from "./types";

// Notas fiscais já lançadas para um CNPJ (qualquer projeto pode reaproveitá-las).
export function findInvoicesByCnpj(invoices: Invoice[], cnpj: string): Invoice[] {
  const normalized = cnpj.replace(/\D/g, "");
  if (!normalized) return [];
  return invoices.filter((inv) => inv.cnpj.replace(/\D/g, "") === normalized);
}

// Quanto de um item já foi consumido por QUALQUER projeto — nunca é
// armazenado diretamente; é sempre somado a partir dos próprios lançamentos
// dos projetos (thirdParties/materials) que referenciam esse itemId, para
// nunca haver dois números (o "disponível" e o "já usado") que possam
// divergir entre si.
export function getItemConsumed(allProjects: Project[], itemId: string): number {
  let total = 0;
  allProjects.forEach((p) => {
    p.thirdParties.forEach((t) => {
      if (t.itemId === itemId) total += t.usedInProject;
    });
    p.materials.forEach((m) => {
      if (m.itemId === itemId) total += m.netValue;
    });
  });
  return total;
}

export function getItemAvailable(item: InvoiceItem, allProjects: Project[]): number {
  return item.totalValue - getItemConsumed(allProjects, item.id);
}
