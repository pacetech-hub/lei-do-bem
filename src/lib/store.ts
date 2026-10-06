import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Attachment,
  DespesaAdjustmentItem,
  EmployeeExpense,
  Invoice,
  JobRole,
  MaterialExpense,
  Project,
  ProjectStatus,
  QuestionRecord,
  ResourceEntry,
  ThirdPartyExpense,
} from "./types";
import { INITIAL_PROJECTS, INITIAL_INVOICES, INITIAL_JOB_ROLES, INITIAL_QUESTIONS } from "./mock";

interface ProjectsState {
  projects: Project[];
  invoices: Invoice[];
  // Configuração Geral — cadastros básicos (ver types.ts para o motivo de
  // ainda não integrarem com a ficha/cálculo de despesas).
  questions: QuestionRecord[];
  jobRoles: JobRole[];
  researcherCodes: string[];
  createProject: (
    p: Omit<
      Project,
      | "id"
      | "createdAt"
      | "updatedAt"
      | "status"
      | "answers"
      | "attachments"
      | "employees"
      | "thirdParties"
      | "materials"
      | "resources"
    >,
  ) => string;
  updateProject: (id: string, patch: Partial<Project>) => void;
  setAnswer: (id: string, questionId: string, value: string) => void;
  addAttachment: (id: string, bucket: string, att: Attachment) => void;
  removeAttachment: (id: string, bucket: string, attId: string) => void;
  addEmployee: (id: string, e: EmployeeExpense) => void;
  removeEmployee: (id: string, eid: string) => void;
  addThirdParty: (id: string, e: ThirdPartyExpense) => void;
  removeThirdParty: (id: string, eid: string) => void;
  addMaterial: (id: string, e: MaterialExpense) => void;
  removeMaterial: (id: string, eid: string) => void;
  setStatus: (id: string, status: ProjectStatus) => void;
  // Nota fiscal compartilhada entre projetos (busca por CNPJ ou leitura de
  // chave) — registrada uma vez, reutilizável por qualquer projeto.
  addInvoice: (inv: Omit<Invoice, "id" | "createdAt">) => string;
  // Recursos (profissionais/terceiros) cadastrados pelo Relator na iniciativa.
  addResource: (id: string, r: ResourceEntry) => void;
  updateResource: (id: string, rid: string, patch: Partial<ResourceEntry>) => void;
  removeResource: (id: string, rid: string) => void;
  // Ajuste do Revisor sobre uma despesa específica, devolvida ao Financeiro.
  addDespesaAdjustment: (id: string, item: DespesaAdjustmentItem) => void;
  resolveDespesaAdjustment: (id: string, adjustmentId: string) => void;
  // Configuração Geral
  addQuestion: (q: QuestionRecord) => void;
  updateQuestion: (id: string, patch: Partial<QuestionRecord>) => void;
  removeQuestion: (id: string) => void;
  addJobRole: (r: JobRole) => void;
  updateJobRole: (id: string, patch: Partial<JobRole>) => void;
  removeJobRole: (id: string) => void;
  setResearcher: (code: string, isResearcher: boolean) => void;
}

const nowIso = () => new Date().toISOString();

export const useProjectsStore = create<ProjectsState>()(
  persist(
    (set) => ({
      projects: INITIAL_PROJECTS,
      invoices: INITIAL_INVOICES,
      questions: INITIAL_QUESTIONS,
      jobRoles: INITIAL_JOB_ROLES,
      researcherCodes: [],
      addInvoice: (inv) => {
        const id = crypto.randomUUID();
        const invoice: Invoice = { ...inv, id, createdAt: nowIso() };
        set((s) => ({ invoices: [invoice, ...s.invoices] }));
        return id;
      },
      createProject: (p) => {
        const id = crypto.randomUUID();
        const project: Project = {
          ...p,
          id,
          status: "rascunho",
          createdAt: nowIso(),
          updatedAt: nowIso(),
          answers: {},
          attachments: {},
          employees: [],
          thirdParties: [],
          materials: [],
          resources: [],
        };
        set((s) => ({ projects: [project, ...s.projects] }));
        return id;
      },
      updateProject: (id, patch) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, ...patch, updatedAt: nowIso() } : p,
          ),
        })),
      setAnswer: (id, questionId, value) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id
              ? { ...p, answers: { ...p.answers, [questionId]: value }, updatedAt: nowIso() }
              : p,
          ),
        })),
      addAttachment: (id, bucket, att) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id
              ? {
                  ...p,
                  attachments: {
                    ...p.attachments,
                    [bucket]: [...(p.attachments[bucket] ?? []), att],
                  },
                  updatedAt: nowIso(),
                }
              : p,
          ),
        })),
      removeAttachment: (id, bucket, attId) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id
              ? {
                  ...p,
                  attachments: {
                    ...p.attachments,
                    [bucket]: (p.attachments[bucket] ?? []).filter((a) => a.id !== attId),
                  },
                  updatedAt: nowIso(),
                }
              : p,
          ),
        })),
      addEmployee: (id, e) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, employees: [...p.employees, e], updatedAt: nowIso() } : p,
          ),
        })),
      removeEmployee: (id, eid) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id
              ? { ...p, employees: p.employees.filter((x) => x.id !== eid), updatedAt: nowIso() }
              : p,
          ),
        })),
      addThirdParty: (id, e) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, thirdParties: [...p.thirdParties, e], updatedAt: nowIso() } : p,
          ),
        })),
      removeThirdParty: (id, eid) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id
              ? {
                  ...p,
                  thirdParties: p.thirdParties.filter((x) => x.id !== eid),
                  updatedAt: nowIso(),
                }
              : p,
          ),
        })),
      addMaterial: (id, e) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, materials: [...p.materials, e], updatedAt: nowIso() } : p,
          ),
        })),
      removeMaterial: (id, eid) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id
              ? { ...p, materials: p.materials.filter((x) => x.id !== eid), updatedAt: nowIso() }
              : p,
          ),
        })),
      setStatus: (id, status) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, status, updatedAt: nowIso() } : p,
          ),
        })),
      addResource: (id, r) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, resources: [...p.resources, r], updatedAt: nowIso() } : p,
          ),
        })),
      updateResource: (id, rid, patch) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id
              ? {
                  ...p,
                  resources: p.resources.map((r) => (r.id === rid ? { ...r, ...patch } : r)),
                  updatedAt: nowIso(),
                }
              : p,
          ),
        })),
      removeResource: (id, rid) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id
              ? { ...p, resources: p.resources.filter((r) => r.id !== rid), updatedAt: nowIso() }
              : p,
          ),
        })),
      addDespesaAdjustment: (id, item) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id
              ? {
                  ...p,
                  despesaAdjustments: [...(p.despesaAdjustments ?? []), item],
                  updatedAt: nowIso(),
                }
              : p,
          ),
        })),
      resolveDespesaAdjustment: (id, adjustmentId) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id
              ? {
                  ...p,
                  despesaAdjustments: (p.despesaAdjustments ?? []).filter(
                    (a) => a.id !== adjustmentId,
                  ),
                  updatedAt: nowIso(),
                }
              : p,
          ),
        })),
      addQuestion: (q) => set((s) => ({ questions: [...s.questions, q] })),
      updateQuestion: (id, patch) =>
        set((s) => ({
          questions: s.questions.map((q) => (q.id === id ? { ...q, ...patch } : q)),
        })),
      removeQuestion: (id) => set((s) => ({ questions: s.questions.filter((q) => q.id !== id) })),
      addJobRole: (r) => set((s) => ({ jobRoles: [...s.jobRoles, r] })),
      updateJobRole: (id, patch) =>
        set((s) => ({
          jobRoles: s.jobRoles.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        })),
      removeJobRole: (id) => set((s) => ({ jobRoles: s.jobRoles.filter((r) => r.id !== id) })),
      setResearcher: (code, isResearcher) =>
        set((s) => ({
          researcherCodes: isResearcher
            ? Array.from(new Set([...s.researcherCodes, code]))
            : s.researcherCodes.filter((c) => c !== code),
        })),
    }),
    {
      name: "leidobem-projects-v4",
      // Hydration on client only
      skipHydration: false,
    },
  ),
);
