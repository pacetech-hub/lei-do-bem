import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Agrupamento,
  Attachment,
  ComiteDecisao,
  ComiteDecisionRecord,
  DespesaAdjustmentItem,
  DespesaDecision,
  EmployeeExpense,
  Invoice,
  JobRole,
  JuridicoProjeto,
  MaterialExpense,
  MctiSubmission,
  PreProjeto,
  PreProjetoStatus,
  Project,
  ProjectStatus,
  QuestionRecord,
  ResourceEntry,
  ThirdPartyExpense,
} from "./types";
import { ROLE_USERS } from "./types";
import {
  INITIAL_AGRUPAMENTOS,
  INITIAL_JURIDICO_PROJETOS,
  INITIAL_PRE_PROJETOS,
  INITIAL_PROJECTS,
  INITIAL_INVOICES,
  INITIAL_JOB_ROLES,
  INITIAL_QUESTIONS,
} from "./mock";
import { gerarIdentificacaoProjeto, gerarSecoesProjeto, juridicoHistoryEvent } from "./juridico";

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
  // Decisão da Controladoria (validar/pendência/excluir) sobre uma despesa
  // específica — chave é o id da despesa (funcionário, terceiro ou material).
  setDespesaDecision: (
    id: string,
    expenseId: string,
    decision: DespesaDecision,
    historyDescription?: string,
  ) => void;
  // Resposta do Responsável financeiro a uma pendência sinalizada pela
  // Controladoria — mescla na decisão existente sem alterar status/comment.
  setDespesaFinanceiroResponse: (id: string, expenseId: string, response: string) => void;
  // Configuração Geral
  addQuestion: (q: QuestionRecord) => void;
  updateQuestion: (id: string, patch: Partial<QuestionRecord>) => void;
  removeQuestion: (id: string) => void;
  addJobRole: (r: JobRole) => void;
  updateJobRole: (id: string, patch: Partial<JobRole>) => void;
  removeJobRole: (id: string) => void;
  setResearcher: (code: string, isResearcher: boolean) => void;

  // --- Jurídico -------------------------------------------------------
  agrupamentos: Agrupamento[];
  preProjetos: PreProjeto[];
  juridicoProjetos: JuridicoProjeto[];
  createAgrupamento: (data: {
    name: string;
    resumo: string;
    objetivoComum: string;
    relacaoAtividades: string;
    justificativa: string;
    iniciativaIds: string[];
    aiSuggested: boolean;
  }) => string;
  updateAgrupamento: (
    id: string,
    patch: Partial<
      Pick<
        Agrupamento,
        | "name"
        | "resumo"
        | "objetivoComum"
        | "relacaoAtividades"
        | "justificativa"
        | "resumoEditadoManualmente"
      >
    >,
    historyDescription?: string,
  ) => void;
  addIniciativaToAgrupamento: (id: string, iniciativaId: string) => void;
  removeIniciativaFromAgrupamento: (id: string, iniciativaId: string) => void;
  // Cria o Pré-projeto a partir do agrupamento consolidado e vincula os dois
  // registros — o agrupamento continua existindo (ver "Revisar agrupamento").
  transformarAgrupamentoEmPreProjeto: (
    agrupamentoId: string,
    content: {
      name: string;
      ano: number;
      resumoExecutivo: string;
      problema: string;
      objetivoPrincipal: string;
      propostaInovacao: string;
      atividadesInovacao: string;
      resultadosEsperados: string;
    },
  ) => string;
  updatePreProjeto: (
    id: string,
    patch: Partial<
      Pick<
        PreProjeto,
        | "name"
        | "resumoExecutivo"
        | "problema"
        | "objetivoPrincipal"
        | "propostaInovacao"
        | "atividadesInovacao"
        | "resultadosEsperados"
      >
    >,
    historyDescription?: string,
  ) => void;
  // Registra a decisão do comitê. "aprovar" cria o Projeto e devolve o id
  // (para navegação); as demais decisões só atualizam o status/histórico.
  registrarDecisaoComite: (
    preProjetoId: string,
    decisao: ComiteDecisao,
    responsavel: string,
    data: string,
    observacoes?: string,
  ) => string | undefined;
  updateProjetoSection: (projetoId: string, sectionKey: string, content: string) => void;
  addProjetoSection: (projetoId: string, label: string, content?: string) => void;
  addProjetoDocument: (projetoId: string, att: Attachment) => void;
  removeProjetoDocument: (projetoId: string, attId: string) => void;
  finalizarProjeto: (projetoId: string, responsavel: string) => void;
  registrarSubmissaoMcti: (
    projetoId: string,
    responsavel: string,
    data: string,
    ajustesRealizados?: string,
  ) => void;
  processarDevolutivaMcti: (
    projetoId: string,
    payload: { resultado: "aprovado" | "nao_aprovado"; resumo: string; documento: Attachment },
  ) => void;
  reabrirProjetoParaAjustes: (projetoId: string) => void;
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
      agrupamentos: INITIAL_AGRUPAMENTOS,
      preProjetos: INITIAL_PRE_PROJETOS,
      juridicoProjetos: INITIAL_JURIDICO_PROJETOS,
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
      setDespesaDecision: (id, expenseId, decision, historyDescription) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id
              ? {
                  ...p,
                  despesaDecisions: { ...p.despesaDecisions, [expenseId]: decision },
                  controladoriaHistory: historyDescription
                    ? [
                        ...(p.controladoriaHistory ?? []),
                        {
                          id: crypto.randomUUID(),
                          date: nowIso(),
                          actor: decision.decidedBy,
                          description: historyDescription,
                        },
                      ]
                    : p.controladoriaHistory,
                  updatedAt: nowIso(),
                }
              : p,
          ),
        })),
      setDespesaFinanceiroResponse: (id, expenseId, response) =>
        set((s) => ({
          projects: s.projects.map((p) => {
            if (p.id !== id) return p;
            const current = p.despesaDecisions?.[expenseId];
            if (!current) return p;
            return {
              ...p,
              despesaDecisions: {
                ...p.despesaDecisions,
                [expenseId]: { ...current, financeiroResponse: response },
              },
              updatedAt: nowIso(),
            };
          }),
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

      createAgrupamento: (data) => {
        const id = crypto.randomUUID();
        const now = nowIso();
        const agrupamento: Agrupamento = {
          id,
          name: data.name,
          resumo: data.resumo,
          objetivoComum: data.objetivoComum,
          relacaoAtividades: data.relacaoAtividades,
          justificativa: data.justificativa,
          iniciativaIds: data.iniciativaIds,
          aiSuggested: data.aiSuggested,
          createdAt: now,
          updatedAt: now,
          history: [
            juridicoHistoryEvent(
              ROLE_USERS.juridico.name,
              data.aiSuggested
                ? "criou o agrupamento a partir de uma sugestão da IA"
                : "criou o agrupamento manualmente",
            ),
          ],
        };
        set((s) => ({ agrupamentos: [agrupamento, ...s.agrupamentos] }));
        return id;
      },
      updateAgrupamento: (id, patch, historyDescription) =>
        set((s) => ({
          agrupamentos: s.agrupamentos.map((a) =>
            a.id === id
              ? {
                  ...a,
                  ...patch,
                  updatedAt: nowIso(),
                  history: historyDescription
                    ? [
                        ...a.history,
                        juridicoHistoryEvent(ROLE_USERS.juridico.name, historyDescription),
                      ]
                    : a.history,
                }
              : a,
          ),
        })),
      addIniciativaToAgrupamento: (id, iniciativaId) =>
        set((s) => ({
          agrupamentos: s.agrupamentos.map((a) =>
            a.id === id && !a.iniciativaIds.includes(iniciativaId)
              ? {
                  ...a,
                  iniciativaIds: [...a.iniciativaIds, iniciativaId],
                  updatedAt: nowIso(),
                  history: [
                    ...a.history,
                    juridicoHistoryEvent(
                      ROLE_USERS.juridico.name,
                      "incluiu uma iniciativa no agrupamento",
                    ),
                  ],
                }
              : a,
          ),
        })),
      removeIniciativaFromAgrupamento: (id, iniciativaId) =>
        set((s) => ({
          agrupamentos: s.agrupamentos.map((a) =>
            a.id === id
              ? {
                  ...a,
                  iniciativaIds: a.iniciativaIds.filter((x) => x !== iniciativaId),
                  updatedAt: nowIso(),
                  history: [
                    ...a.history,
                    juridicoHistoryEvent(
                      ROLE_USERS.juridico.name,
                      "removeu uma iniciativa do agrupamento",
                    ),
                  ],
                }
              : a,
          ),
        })),
      transformarAgrupamentoEmPreProjeto: (agrupamentoId, content) => {
        const id = crypto.randomUUID();
        const now = nowIso();
        set((s) => {
          const agrupamento = s.agrupamentos.find((a) => a.id === agrupamentoId);
          if (!agrupamento) return s;
          const preProjeto: PreProjeto = {
            id,
            agrupamentoId,
            name: content.name,
            ano: content.ano,
            resumoExecutivo: content.resumoExecutivo,
            problema: content.problema,
            objetivoPrincipal: content.objetivoPrincipal,
            propostaInovacao: content.propostaInovacao,
            atividadesInovacao: content.atividadesInovacao,
            resultadosEsperados: content.resultadosEsperados,
            status: "aguardando_comite",
            createdAt: now,
            updatedAt: now,
            decisoes: [],
            history: [
              juridicoHistoryEvent(
                ROLE_USERS.juridico.name,
                "criou o pré-projeto a partir do agrupamento",
              ),
            ],
          };
          return {
            preProjetos: [preProjeto, ...s.preProjetos],
            agrupamentos: s.agrupamentos.map((a) =>
              a.id === agrupamentoId
                ? {
                    ...a,
                    preProjetoId: id,
                    updatedAt: now,
                    history: [
                      ...a.history,
                      juridicoHistoryEvent(
                        ROLE_USERS.juridico.name,
                        "transformou o agrupamento em pré-projeto",
                      ),
                    ],
                  }
                : a,
            ),
          };
        });
        return id;
      },
      updatePreProjeto: (id, patch, historyDescription) =>
        set((s) => ({
          preProjetos: s.preProjetos.map((p) =>
            p.id === id
              ? {
                  ...p,
                  ...patch,
                  updatedAt: nowIso(),
                  history: historyDescription
                    ? [
                        ...p.history,
                        juridicoHistoryEvent(ROLE_USERS.juridico.name, historyDescription),
                      ]
                    : p.history,
                }
              : p,
          ),
        })),
      registrarDecisaoComite: (preProjetoId, decisao, responsavel, data, observacoes) => {
        let projetoId: string | undefined;
        set((s) => {
          const preProjeto = s.preProjetos.find((p) => p.id === preProjetoId);
          if (!preProjeto) return s;

          const decisionRecord: ComiteDecisionRecord = {
            id: crypto.randomUUID(),
            decisao,
            data,
            responsavel,
            observacoes,
          };
          const historyText =
            decisao === "aprovar"
              ? "o comitê aprovou o pré-projeto"
              : decisao === "ajustes"
                ? "o comitê solicitou ajustes no pré-projeto"
                : "o comitê solicitou revisão do agrupamento de origem";
          const newStatus: PreProjetoStatus =
            decisao === "aprovar"
              ? "aprovado"
              : decisao === "ajustes"
                ? "ajustes_solicitados"
                : "revisao_agrupamento";

          let juridicoProjetos = s.juridicoProjetos;
          if (decisao === "aprovar") {
            const novoProjetoId = crypto.randomUUID();
            projetoId = novoProjetoId;
            const now = nowIso();
            const agrupamento = s.agrupamentos.find((a) => a.id === preProjeto.agrupamentoId);
            const novoProjeto: JuridicoProjeto = {
              id: novoProjetoId,
              preProjetoId: preProjeto.id,
              agrupamentoId: preProjeto.agrupamentoId,
              iniciativaIds: agrupamento?.iniciativaIds ?? [],
              name: preProjeto.name,
              identificacao: gerarIdentificacaoProjeto(preProjeto.ano, s.juridicoProjetos),
              ano: preProjeto.ano,
              objetivos: preProjeto.objetivoPrincipal,
              sections: gerarSecoesProjeto(preProjeto),
              documents: [],
              status: "em_elaboracao",
              createdAt: now,
              updatedAt: now,
              submissions: [],
              history: [
                juridicoHistoryEvent(
                  responsavel,
                  "criou o projeto a partir do pré-projeto aprovado pelo comitê",
                ),
              ],
            };
            juridicoProjetos = [novoProjeto, ...s.juridicoProjetos];
          }

          return {
            juridicoProjetos,
            preProjetos: s.preProjetos.map((p) =>
              p.id === preProjetoId
                ? {
                    ...p,
                    status: newStatus,
                    updatedAt: nowIso(),
                    decisoes: [...p.decisoes, decisionRecord],
                    projetoId: projetoId ?? p.projetoId,
                    history: [...p.history, juridicoHistoryEvent(responsavel, historyText)],
                  }
                : p,
            ),
          };
        });
        return projetoId;
      },
      updateProjetoSection: (projetoId, sectionKey, content) =>
        set((s) => ({
          juridicoProjetos: s.juridicoProjetos.map((p) =>
            p.id === projetoId
              ? {
                  ...p,
                  sections: p.sections.map((sec) =>
                    sec.key === sectionKey ? { ...sec, content } : sec,
                  ),
                  updatedAt: nowIso(),
                }
              : p,
          ),
        })),
      addProjetoSection: (projetoId, label, content = "") =>
        set((s) => ({
          juridicoProjetos: s.juridicoProjetos.map((p) =>
            p.id === projetoId
              ? {
                  ...p,
                  sections: [...p.sections, { key: crypto.randomUUID(), label, content }],
                  updatedAt: nowIso(),
                  history: [
                    ...p.history,
                    juridicoHistoryEvent(
                      ROLE_USERS.juridico.name,
                      `incluiu a seção "${label}" no conteúdo do projeto`,
                    ),
                  ],
                }
              : p,
          ),
        })),
      addProjetoDocument: (projetoId, att) =>
        set((s) => ({
          juridicoProjetos: s.juridicoProjetos.map((p) =>
            p.id === projetoId
              ? {
                  ...p,
                  documents: [...p.documents, att],
                  updatedAt: nowIso(),
                  history: [
                    ...p.history,
                    juridicoHistoryEvent(
                      ROLE_USERS.juridico.name,
                      `anexou o documento "${att.name}"`,
                    ),
                  ],
                }
              : p,
          ),
        })),
      removeProjetoDocument: (projetoId, attId) =>
        set((s) => ({
          juridicoProjetos: s.juridicoProjetos.map((p) => {
            if (p.id !== projetoId) return p;
            const removed = p.documents.find((d) => d.id === attId);
            return {
              ...p,
              documents: p.documents.filter((d) => d.id !== attId),
              updatedAt: nowIso(),
              history: removed
                ? [
                    ...p.history,
                    juridicoHistoryEvent(
                      ROLE_USERS.juridico.name,
                      `removeu o documento "${removed.name}"`,
                    ),
                  ]
                : p.history,
            };
          }),
        })),
      finalizarProjeto: (projetoId, responsavel) =>
        set((s) => ({
          juridicoProjetos: s.juridicoProjetos.map((p) =>
            p.id === projetoId
              ? {
                  ...p,
                  status: "aguardando_submissao",
                  finalizadoEm: nowIso(),
                  finalizadoPor: responsavel,
                  updatedAt: nowIso(),
                  history: [...p.history, juridicoHistoryEvent(responsavel, "finalizou o projeto")],
                }
              : p,
          ),
        })),
      registrarSubmissaoMcti: (projetoId, responsavel, data, ajustesRealizados) =>
        set((s) => ({
          juridicoProjetos: s.juridicoProjetos.map((p) => {
            if (p.id !== projetoId || p.submissions.length >= 2) return p;
            const numero = (p.submissions.length + 1) as 1 | 2;
            const submission: MctiSubmission = {
              numero,
              submittedAt: data,
              submittedBy: responsavel,
              ajustesRealizados: numero === 2 ? ajustesRealizados : undefined,
            };
            return {
              ...p,
              status: "submetido_mcti",
              submissions: [...p.submissions, submission],
              updatedAt: nowIso(),
              history: [
                ...p.history,
                juridicoHistoryEvent(
                  responsavel,
                  numero === 1
                    ? "registrou a submissão do projeto ao MCTI"
                    : "registrou a segunda submissão do projeto ao MCTI",
                ),
              ],
            };
          }),
        })),
      processarDevolutivaMcti: (projetoId, payload) =>
        set((s) => ({
          juridicoProjetos: s.juridicoProjetos.map((p) => {
            if (p.id !== projetoId || p.submissions.length === 0) return p;
            const idx = p.submissions.length - 1;
            const atualizada = [...p.submissions];
            atualizada[idx] = {
              ...atualizada[idx],
              resultado: payload.resultado,
              resultadoData: nowIso(),
              devolutivaDocumentoId: payload.documento.id,
              devolutivaResumo: payload.resumo,
            };
            return {
              ...p,
              status: payload.resultado,
              submissions: atualizada,
              documents: [...p.documents, payload.documento],
              updatedAt: nowIso(),
              history: [
                ...p.history,
                juridicoHistoryEvent(
                  ROLE_USERS.juridico.name,
                  payload.resultado === "aprovado"
                    ? "registrou a devolutiva do MCTI: projeto aprovado"
                    : "registrou a devolutiva do MCTI: projeto não aprovado",
                ),
              ],
            };
          }),
        })),
      reabrirProjetoParaAjustes: (projetoId) =>
        set((s) => ({
          juridicoProjetos: s.juridicoProjetos.map((p) =>
            p.id === projetoId && p.status === "nao_aprovado" && p.submissions.length < 2
              ? {
                  ...p,
                  status: "em_elaboracao",
                  updatedAt: nowIso(),
                  history: [
                    ...p.history,
                    juridicoHistoryEvent(
                      ROLE_USERS.juridico.name,
                      "reabriu o projeto para ajustes após devolutiva não aprovada",
                    ),
                  ],
                }
              : p,
          ),
        })),
    }),
    {
      name: "leidobem-projects-v4",
      // Hydration on client only
      skipHydration: false,
    },
  ),
);
