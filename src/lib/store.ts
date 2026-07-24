import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Attachment,
  EmployeeExpense,
  MaterialExpense,
  MctiParecer,
  MctiParecerResult,
  Project,
  ProjectStatus,
  ThirdPartyExpense,
} from "./types";
import { INITIAL_PROJECTS, INITIAL_PARECERES } from "./mock";

interface ProjectsState {
  projects: Project[];
  pareceres: MctiParecer[];
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
    >,
  ) => string;
  updateProject: (id: string, patch: Partial<Project>) => void;
  addParecer: (p: MctiParecer) => void;
  updateParecerResult: (
    parecerId: string,
    projectId: string,
    patch: Partial<MctiParecerResult>,
  ) => void;
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
}

const nowIso = () => new Date().toISOString();

export const useProjectsStore = create<ProjectsState>()(
  persist(
    (set) => ({
      projects: INITIAL_PROJECTS,
      pareceres: INITIAL_PARECERES,
      addParecer: (p) => set((s) => ({ pareceres: [p, ...s.pareceres] })),
      updateParecerResult: (parecerId, projectId, patch) =>
        set((s) => ({
          pareceres: s.pareceres.map((parecer) =>
            parecer.id === parecerId
              ? {
                  ...parecer,
                  results: parecer.results.map((r) =>
                    r.projectId === projectId ? { ...r, ...patch } : r,
                  ),
                }
              : parecer,
          ),
        })),
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
    }),
    {
      name: "leidobem-projects-v3",
      // Hydration on client only
      skipHydration: false,
    },
  ),
);
