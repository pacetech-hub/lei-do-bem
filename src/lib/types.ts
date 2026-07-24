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

export interface Attachment {
  id: string;
  name: string;
  type: string;
  category?: "fotos" | "nota_fiscal" | "relatorio" | "apresentacao" | "outros";
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
  allocatedElsewhere?: number; // mock — quanto já foi alocado em outros projetos
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

export const AREAS = [
  "Pesquisa & Desenvolvimento",
  "Engenharia de Produto",
  "Tecnologia da Informação",
  "Processos Industriais",
  "Qualidade e Inovação",
  "Automação",
];

export const CURRENT_USER = {
  name: "Ana Souza",
  area: "Pesquisa & Desenvolvimento",
  role: "Relator",
  initials: "AS",
};
