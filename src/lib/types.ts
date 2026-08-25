export type ProjectStatus =
  | "rascunho"
  | "ajustes"
  | "revisao"
  | "pronto"
  | "submetido"
  | "aprovado"
  | "indeferido";

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  rascunho: "Rascunho",
  ajustes: "Ajuste solicitado",
  revisao: "Em revisão",
  pronto: "Pronto",
  submetido: "Submetido",
  aprovado: "Aprovado",
  indeferido: "Indeferido",
};

export type Natureza = "produto" | "processo" | "servico";
export type Atividade = "basica" | "aplicada" | "experimental";

export type ProjectType = "independente" | "mestre" | "dependente";

export const PROJECT_TYPE_LABEL: Record<ProjectType, string> = {
  independente: "Projeto independente",
  mestre: "Projeto Mestre",
  dependente: "Projeto Dependente",
};

// Estágio do projeto dentro do ciclo do Jurídico, independente do ProjectStatus
// usado pelo Relator/Revisor. Só existe a partir do momento em que o Revisor
// aprova e encaminha o projeto (ProjectStatus "pronto").
export type LegalStatus =
  | "aguardando_juridico"
  | "pronto_submissao"
  | "submetido"
  | "ajustes_mcti"
  | "aprovado"
  | "indeferido";

export const LEGAL_STATUS_LABEL: Record<LegalStatus, string> = {
  aguardando_juridico: "Aguardando análise jurídica",
  pronto_submissao: "Pronto para submissão",
  submetido: "Em análise pelo MCTI",
  ajustes_mcti: "Ajuste solicitado (MCTI)",
  aprovado: "Aprovado",
  indeferido: "Indeferido",
};

// Reaproveita a paleta de cores dos status já existentes (bg/fg suaves).
export const LEGAL_STATUS_BADGE_CLASS: Record<LegalStatus, string> = {
  aguardando_juridico: "bg-status-review text-status-review-fg",
  pronto_submissao: "bg-status-ready text-status-ready-fg",
  submetido: "bg-status-submitted text-status-submitted-fg",
  ajustes_mcti: "bg-status-adjust text-status-adjust-fg",
  aprovado: "bg-status-approved text-status-approved-fg",
  indeferido: "bg-status-rejected text-status-rejected-fg",
};

// Projetos nesses estágios exigem alguma ação do Jurídico.
export const LEGAL_STATUS_ACTIONABLE: LegalStatus[] = [
  "aguardando_juridico",
  "pronto_submissao",
  "ajustes_mcti",
];

// Projetos nesses estágios estão concluídos e ficam no histórico.
export const LEGAL_STATUS_FINALIZED: LegalStatus[] = ["aprovado", "indeferido"];

export interface MctiParecerResult {
  projectId: string;
  projectName: string;
  suggested: "aprovado" | "ajustes_mcti";
  reason?: string;
  confirmed: boolean;
}

export interface MctiParecer {
  id: string;
  // Um único parecer anual — o MCTI não é mais tratado por trimestre.
  year: number;
  fileName: string;
  uploadedAt: string;
  uploadedBy: string;
  results: MctiParecerResult[];
}

// Projeto Final Jurídico: entidade separada que consolida, uma vez por ano,
// os projetos já aprovados para a submissão oficial ao MCTI. Não substitui
// os projetos originais — apenas referencia seus ids.
export type FinalProjectStatus = "rascunho" | "em_revisao" | "enviado";

export const FINAL_PROJECT_STATUS_LABEL: Record<FinalProjectStatus, string> = {
  rascunho: "Rascunho",
  em_revisao: "Em revisão final",
  enviado: "Enviado ao MCTI",
};

export interface FinalProject {
  id: string;
  year: number;
  name: string;
  projectIds: string[];
  status: FinalProjectStatus;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
}

// Item estruturado de um pedido de ajuste do Revisor: aponta para a etapa e,
// quando aplicável, o campo/pergunta específico dentro dela.
export interface AdjustmentItem {
  id: string;
  sectionKey: SectionKey;
  fieldId?: string;
  fieldLabel: string;
  comment: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  category?: "fotos" | "relatorio" | "apresentacao" | "outros";
  uploadedAt: string;
  uploadedBy: string;
  size?: number;
}

export interface EmployeeExpense {
  id: string;
  code: string;
  name: string;
  role: string;
  activity: string;
  totalHours: number;
  eligibleHours: number;
}

export interface ThirdPartyExpense {
  id: string;
  company: string;
  cnpj: string;
  invoice: string;
  invoiceTotal: number;
  usedInProject: number;
  allocatedElsewhere?: number; // legado — lançamentos antigos sem invoiceId/itemId
  // Referência à nota/item compartilhados (ver Invoice) — presente em todo
  // lançamento feito pelo novo fluxo de busca por CNPJ.
  invoiceId?: string;
  itemId?: string;
}

export interface MaterialExpense {
  id: string;
  supplier: string;
  cnpj: string;
  invoice: string;
  grossValue: number;
  netValue: number;
  materialDescription: string;
  usageDescription: string;
  invoiceId?: string;
  itemId?: string;
}

// Item de uma nota fiscal — o "consumido" por cada projeto não é armazenado
// aqui: é sempre derivado somando usedInProject/netValue de todos os
// ThirdPartyExpense/MaterialExpense que referenciam este item (ver
// src/lib/invoices.ts), para nunca haver dois números que possam divergir.
export interface InvoiceItem {
  id: string;
  description: string;
  totalValue: number;
}

// Nota fiscal compartilhada entre projetos: cadastrada uma vez (por busca de
// CNPJ ou leitura da chave de acesso) e reutilizável por qualquer projeto do
// Responsável Financeiro, mostrando quanto de cada item ainda está
// disponível.
export interface Invoice {
  id: string;
  cnpj: string;
  companyName: string;
  invoiceNumber: string;
  accessKey: string;
  items: InvoiceItem[];
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  area: string;
  filial?: string;
  responsible: string;
  startDate: string;
  endDate: string;
  hasPatent: boolean;
  patentNumber?: string;
  natureza: Natureza;
  atividade: Atividade;
  status: ProjectStatus;
  projectType: ProjectType;
  masterProjectId?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  lastAdjustmentNote?: string;
  adjustmentItems?: AdjustmentItem[];
  // Ajustes registrados pelo Revisor durante a leitura, ainda não enviados ao
  // Relator (persistidos para sobreviver a navegações antes do envio final).
  draftAdjustmentItems?: AdjustmentItem[];
  // Compartilhamento do projeto com outra filial/área/revisor (tag "Compartilhado
  // com a sua área"). sharedStatus controla o aceite/recusa por quem recebeu.
  sharedWithArea?: boolean;
  sharedFilial?: string;
  sharedSetor?: string;
  sharedReviewer?: string;
  sharedStatus?: "pendente" | "aceito" | "recusado";
  sharedDeclineReason?: string;
  // Marca permanente: este projeto já foi compartilhado com outra área em
  // algum momento (nunca é limpo, mesmo após aceitar/recusar) — usado pelo
  // Revisor para tratar o texto já escrito pelo Relator original como
  // somente leitura para sempre, com um campo próprio de acréscimos.
  everSharedWithArea?: boolean;
  // Observações que o Revisor acrescenta em projetos de origem compartilhada,
  // por questionId — nunca sobrescreve o texto original em `answers`.
  sharedAdditionalNotes?: Record<string, string>;
  // Tags livres atribuídas pelo Revisor na Revisão Final (não obrigatório).
  tags?: string[];
  // Ciclo do Jurídico (ver LegalStatus)
  legalStatus?: LegalStatus;
  legalAnalysisNote?: string;
  submissionDate?: string;
  submissionDoc?: string;
  submissionNote?: string;
  mctiParecerId?: string;
  mctiResult?: "aprovado" | "ajustes_mcti";
  mctiReason?: string;
  createdAt: string;
  updatedAt: string;
  // Answers keyed by question id
  answers: Record<string, string>;
  // Attachments per question id + generic evidences bucket "_evidencias"
  attachments: Record<string, Attachment[]>;
  employees: EmployeeExpense[];
  thirdParties: ThirdPartyExpense[];
  materials: MaterialExpense[];
}

export type SectionKey =
  | "gerais"
  | "inovador"
  | "barreiras"
  | "metodologia"
  | "evidencias"
  | "despesas"
  | "revisao";

export interface SectionDef {
  key: SectionKey;
  label: string;
  short: string;
}

export const SECTIONS: SectionDef[] = [
  { key: "gerais", label: "Informações Gerais", short: "Gerais" },
  { key: "inovador", label: "Elemento Tecnologicamente Novo ou Inovador", short: "Inovação" },
  { key: "barreiras", label: "Barreiras e Desafios Tecnológicos", short: "Barreiras" },
  { key: "metodologia", label: "Metodologia e Métodos Utilizados", short: "Metodologia" },
  { key: "evidencias", label: "Evidências", short: "Evidências" },
  { key: "despesas", label: "Despesas", short: "Despesas" },
  { key: "revisao", label: "Revisão Final", short: "Revisão" },
];

export interface Question {
  id: string;
  label: string;
  helper?: string;
}

export const QUESTIONS_INOVADOR: Question[] = [
  {
    id: "inov_1",
    label: "O projeto trata de desenvolvimento totalmente novo para a empresa ou para o mercado?",
  },
  { id: "inov_2", label: "Por quais motivos?" },
  { id: "inov_3", label: "Qual o objetivo do projeto?" },
  {
    id: "inov_4",
    label: "Comparativo entre a tecnologia anterior e a nova tecnologia desenvolvida.",
  },
  { id: "inov_5", label: "Foi realizada pesquisa ou avaliação de mercado?" },
  { id: "inov_6", label: "Quais funcionalidades e ganhos são esperados?" },
  { id: "inov_7", label: "Qual cenário motivou o desenvolvimento?" },
  { id: "inov_8", label: "Quais problemas o projeto busca resolver?" },
  { id: "inov_9", label: "Descrição detalhada do projeto." },
  { id: "inov_10", label: "Benefícios esperados." },
  { id: "inov_11", label: "Conhecimento adquirido com o desenvolvimento." },
];

export const QUESTIONS_BARREIRAS: Question[] = [
  { id: "barr_1", label: "Dificuldades encontradas durante o desenvolvimento." },
  { id: "barr_2", label: "Possíveis falhas do projeto." },
  { id: "barr_3", label: "Competências necessárias e conhecimentos externos utilizados." },
  { id: "barr_4", label: "Novos conhecimentos gerados." },
  { id: "barr_5", label: "Restrições técnicas." },
  { id: "barr_6", label: "Estratégias utilizadas para superar desafios." },
  { id: "barr_7", label: "Testes realizados." },
  { id: "barr_8", label: "Procedimentos adotados." },
  { id: "barr_9", label: "Principais riscos identificados." },
];

export const QUESTIONS_METODOLOGIA: Question[] = [
  { id: "met_1", label: "Metodologia utilizada pela empresa." },
  { id: "met_2", label: "Passo a passo das atividades realizadas." },
  { id: "met_3", label: "Resultados esperados." },
  { id: "met_4", label: "Resultados obtidos." },
  { id: "met_5", label: "Competências necessárias." },
  { id: "met_6", label: "Atividades realizadas no ano base." },
  { id: "met_7", label: "Resultados alcançados." },
];

export const ALL_REQUIRED_QUESTIONS = [
  ...QUESTIONS_INOVADOR,
  ...QUESTIONS_BARREIRAS,
  ...QUESTIONS_METODOLOGIA,
].map((q) => q.id);

// Campos editáveis da seção "Informações Gerais", usados para que o Revisor
// aponte um campo específico ao solicitar ajustes.
export const GERAIS_FIELDS: Question[] = [
  { id: "name", label: "Nome do projeto" },
  { id: "area", label: "Área" },
  { id: "responsible", label: "Responsável" },
  { id: "startDate", label: "Data de início" },
  { id: "endDate", label: "Data prevista de término" },
  { id: "hasPatent", label: "Registro de patente" },
  { id: "natureza", label: "Natureza" },
  { id: "atividade", label: "Atividade" },
];

// Perguntas/campos disponíveis por etapa, para o seletor de "campo" no pedido
// de ajuste do Revisor. Etapas sem campos individuais (evidências, despesas,
// revisão) ficam de fora e o ajuste se aplica à etapa como um todo.
export const SECTION_FIELD_OPTIONS: Partial<Record<SectionKey, Question[]>> = {
  gerais: GERAIS_FIELDS,
  inovador: QUESTIONS_INOVADOR,
  barreiras: QUESTIONS_BARREIRAS,
  metodologia: QUESTIONS_METODOLOGIA,
};

// Sugestões para o campo de tags do projeto (Etapa 7) — não é uma lista
// fechada, o Revisor pode digitar qualquer outra tag.
export const SUGGESTED_PROJECT_TAGS = ["Financeiro", "WMS", "Compras", "Robótica", "Logística"];

export const AREAS = [
  "Pesquisa & Desenvolvimento",
  "Engenharia de Produto",
  "Tecnologia da Informação",
  "Processos Industriais",
  "Qualidade e Inovação",
  "Automação",
];

export type UserRole = "relator" | "financeiro" | "revisor" | "juridico";

// Um usuário fixo por perfil de acesso, exibido no cabeçalho da área
// correspondente. Troca automaticamente conforme o perfil selecionado na
// tela inicial — a tela inicial em si não identifica nenhum usuário.
export const ROLE_USERS: Record<UserRole, { name: string; area: string; initials: string }> = {
  relator: { name: "Ana Souza", area: "Pesquisa & Desenvolvimento", initials: "AS" },
  financeiro: { name: "Carlos Oliveira", area: "Financeiro", initials: "CO" },
  revisor: { name: "Mariana Costa", area: "Pesquisa & Desenvolvimento", initials: "MC" },
  juridico: { name: "Ricardo Almeida", area: "Jurídico", initials: "RA" },
};

// Alias para o perfil de Relator — mantido para os fluxos que só existem
// dentro dessa área (criação de iniciativa, upload de evidências etc.).
export const CURRENT_USER = ROLE_USERS.relator;
