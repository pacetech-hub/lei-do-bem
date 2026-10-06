export type ProjectStatus = "rascunho" | "ajustes" | "revisao" | "enviado_controladoria";

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  rascunho: "Rascunho",
  ajustes: "Ajuste solicitado",
  revisao: "Em revisão",
  enviado_controladoria: "Enviado para Controladoria",
};

export type Natureza = "produto" | "processo" | "servico";
export type Atividade = "basica" | "aplicada" | "experimental";

export type ProjectType = "independente" | "mestre" | "dependente";

export const PROJECT_TYPE_LABEL: Record<ProjectType, string> = {
  independente: "Projeto independente",
  mestre: "Projeto Mestre",
  dependente: "Projeto Dependente",
};

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

// Pedido de ajuste do Revisor sobre uma despesa específica (terceiro ou
// material) já lançada pelo Responsável Financeiro. Não altera o status do
// projeto nem a fila de pendências do Relator — só sinaliza a linha para o
// Financeiro revisar/corrigir.
export interface DespesaAdjustmentItem {
  id: string;
  expenseType: "thirdParty" | "material";
  expenseId: string;
  comment: string;
  createdAt: string;
}

// Recurso (profissional ou terceiro) cadastrado pelo Relator na iniciativa,
// disponível para o Responsável Financeiro vincular uma despesa depois.
export interface ResourceEntry {
  id: string;
  type: "funcionario" | "terceiro";
  name: string;
  code?: string; // crachá — só para funcionário
  role?: string; // função — só para funcionário
  filial?: string;
  area: string; // Diretoria
  active: boolean;
  createdAt: string;
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
  // Data de emissão da nota fiscal (diferente de createdAt, que é o momento
  // do registro no sistema) — permite ordenar as notas por data.
  issueDate: string;
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
  // Compartilhamento do projeto com outra filial/Diretoria/revisor (tag
  // "Compartilhado com a sua Diretoria"). sharedStatus controla o
  // aceite/recusa por quem recebeu.
  sharedWithArea?: boolean;
  sharedFilial?: string;
  sharedSetor?: string;
  sharedReviewer?: string;
  sharedStatus?: "pendente" | "aceito" | "recusado";
  sharedDeclineReason?: string;
  // Marca permanente: este projeto já foi compartilhado com outra Diretoria em
  // algum momento (nunca é limpo, mesmo após aceitar/recusar) — usado pelo
  // Revisor para tratar o texto já escrito pelo Relator original como
  // somente leitura para sempre, com um campo próprio de acréscimos.
  everSharedWithArea?: boolean;
  // Observações que o Revisor acrescenta em projetos de origem compartilhada,
  // por questionId — nunca sobrescreve o texto original em `answers`.
  sharedAdditionalNotes?: Record<string, string>;
  // Tags livres atribuídas pelo Revisor na Revisão Final (não obrigatório).
  tags?: string[];
  // Vínculo simples com outra iniciativa/projeto já existente, criado pelo
  // Revisor — não é um agrupamento Mestre/Dependente, apenas uma referência.
  linkedProjectId?: string;
  createdAt: string;
  updatedAt: string;
  // Answers keyed by question id
  answers: Record<string, string>;
  // Attachments per question id + generic evidences bucket "_evidencias"
  attachments: Record<string, Attachment[]>;
  employees: EmployeeExpense[];
  thirdParties: ThirdPartyExpense[];
  materials: MaterialExpense[];
  // Recursos (profissionais/terceiros) cadastrados pelo Relator na etapa
  // Recursos, disponíveis para o Financeiro referenciar em Despesas.
  resources: ResourceEntry[];
  despesaAdjustments?: DespesaAdjustmentItem[];
}

export type SectionKey =
  | "gerais"
  | "inovador"
  | "barreiras"
  | "metodologia"
  | "evidencias"
  | "recursos"
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
  { key: "recursos", label: "Recursos", short: "Recursos" },
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
  { id: "name", label: "Nome da iniciativa" },
  { id: "area", label: "Diretoria" },
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

export type UserRole =
  | "relator"
  | "financeiro"
  | "revisor"
  | "controladoria"
  | "juridico"
  | "configuracaoGeral";

// Um usuário fixo por perfil de acesso, exibido no cabeçalho da área
// correspondente. Troca automaticamente conforme o perfil selecionado na
// tela inicial — a tela inicial em si não identifica nenhum usuário.
export const ROLE_USERS: Record<UserRole, { name: string; area: string; initials: string }> = {
  relator: { name: "Ana Souza", area: "Pesquisa & Desenvolvimento", initials: "AS" },
  financeiro: { name: "Carlos Oliveira", area: "Financeiro", initials: "CO" },
  revisor: { name: "Mariana Costa", area: "Pesquisa & Desenvolvimento", initials: "MC" },
  controladoria: { name: "Fernando Dias", area: "Controladoria", initials: "FD" },
  juridico: { name: "Ricardo Almeida", area: "Jurídico", initials: "RA" },
  configuracaoGeral: { name: "Camila Rocha", area: "Configuração Geral", initials: "CR" },
};

// Alias para o perfil de Relator — mantido para os fluxos que só existem
// dentro dessa área (criação de iniciativa, upload de evidências etc.).
export const CURRENT_USER = ROLE_USERS.relator;

// --- Configuração Geral (estrutura básica — ver AGENTS/plano da sessão) ---
// Cadastro de perguntas: semeado a partir de QUESTIONS_INOVADOR/BARREIRAS/
// METODOLOGIA para já conter as perguntas atuais. Não integra com a ficha
// (section-questions.tsx continua lendo as listas estáticas) — isso fica
// para uma próxima etapa.
export interface QuestionRecord extends Question {
  sectionKey: SectionKey;
}

// Cadastro de cargos: percentual de horas elegíveis para inovação por cargo.
// Também não integra ainda com o cálculo em section-despesas.tsx (que segue
// usando o percentual fixo ELIGIBLE_HOURS_RATIO).
export interface JobRole {
  id: string;
  name: string;
  eligibleHoursPercent: number;
}
