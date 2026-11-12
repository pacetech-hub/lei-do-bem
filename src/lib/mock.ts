import {
  AREAS,
  ALL_REQUIRED_QUESTIONS,
  QUESTIONS_INOVADOR,
  QUESTIONS_BARREIRAS,
  QUESTIONS_METODOLOGIA,
  ROLE_USERS,
  type Agrupamento,
  type Attachment,
  type Invoice,
  type JobRole,
  type JuridicoProjeto,
  type PreProjeto,
  type Project,
  type QuestionRecord,
} from "./types";
import { gerarIdentificacaoProjeto, gerarSecoesProjeto } from "./juridico";

export interface MockEmployee {
  code: string;
  name: string;
  role: string;
}

export const MOCK_EMPLOYEES: MockEmployee[] = [
  { code: "10234", name: "Rafael Almeida", role: "Engenheiro de Software Sênior" },
  { code: "10456", name: "Juliana Ferreira", role: "Pesquisadora P&D" },
  { code: "10789", name: "Marcos Silva", role: "Engenheiro Mecânico" },
  { code: "10812", name: "Patrícia Nunes", role: "Cientista de Dados" },
  { code: "10998", name: "Bruno Cardoso", role: "Engenheiro Eletrônico" },
  { code: "11045", name: "Carolina Mendes", role: "Analista de Qualidade" },
  { code: "11122", name: "Fernando Rocha", role: "Coordenador Técnico" },
];

export interface MockSupplier {
  cnpj: string;
  name: string;
}

export const MOCK_SUPPLIERS: MockSupplier[] = [
  { cnpj: "12.345.678/0001-90", name: "InovaTech Consultoria Ltda" },
  { cnpj: "98.765.432/0001-10", name: "LabX Serviços Técnicos" },
  { cnpj: "45.678.912/0001-33", name: "Componentes MicroTec S.A." },
  { cnpj: "33.221.100/0001-77", name: "Materiais Alfa Indústria" },
  { cnpj: "77.888.999/0001-22", name: "SolucionaAI Software" },
];

const today = new Date();
const daysAgo = (n: number) => new Date(today.getTime() - n * 86400000).toISOString();
const daysFromNow = (n: number) => new Date(today.getTime() + n * 86400000).toISOString();

// IDs determinísticos (não crypto.randomUUID()): este módulo é avaliado tanto
// no servidor (SSR) quanto no cliente (hidratação), e um id diferente a cada
// avaliação causa "hydration mismatch" em qualquer valor derivado do id (ex.:
// a coluna Filial do Revisor, que usa um hash de p.id) — o React descarta e
// reconstrói a árvore, o que pode fazer cliques na tabela parecerem não fazer
// nada. Um contador sequencial produz sempre a mesma sequência dos dois lados.
let idSeq = 0;
function nextId(prefix: string): string {
  idSeq += 1;
  return `${prefix}-${String(idSeq).padStart(4, "0")}`;
}

function emptyProject(over: Partial<Project>): Project {
  const base: Project = {
    id: nextId("proj"),
    name: "Projeto sem nome",
    area: "Pesquisa & Desenvolvimento",
    responsible: "Ana Souza",
    startDate: daysAgo(120),
    endDate: daysFromNow(90),
    hasPatent: false,
    natureza: "produto",
    atividade: "experimental",
    status: "rascunho",
    projectType: "independente",
    createdAt: daysAgo(120),
    updatedAt: daysAgo(2),
    answers: {},
    attachments: {},
    employees: [],
    thirdParties: [],
    materials: [],
    resources: [],
  };
  return { ...base, ...over };
}

const RELATOR_FILIAL = "Matriz — São Paulo/SP";
const RELATOR_SETOR = "Pesquisa & Desenvolvimento";

// 12 iniciativas compartilhadas entre Relator e Responsável Financeiro
// (mesma filial e Diretoria).
export const INITIAL_PROJECTS: Project[] = [
  emptyProject({
    name: "Plataforma de Manutenção Preditiva por IA",
    filial: RELATOR_FILIAL,
    area: RELATOR_SETOR,
    status: "revisao",
    sharedWithArea: true,
    everSharedWithArea: true,
    sharedFilial: "Filial Rio de Janeiro/RJ",
    sharedSetor: "Engenharia de Produto",
    sharedReviewer: "Ricardo Alves",
    sharedStatus: "pendente",
    updatedAt: daysAgo(0),
    startDate: daysAgo(90),
    endDate: daysFromNow(180),
  }),
  emptyProject({
    name: "Novo Compósito de Fibra para Estruturas Leves",
    filial: RELATOR_FILIAL,
    area: RELATOR_SETOR,
    status: "ajustes",
    updatedAt: daysAgo(3),
    startDate: daysAgo(200),
    endDate: daysFromNow(60),
    adjustmentItems: [
      {
        id: nextId("adj"),
        sectionKey: "inovador",
        fieldId: "inov_4",
        fieldLabel: "Comparativo entre a tecnologia anterior e a nova tecnologia desenvolvida.",
        comment:
          "Detalhar melhor o comparativo tecnológico, incluindo métricas objetivas de desempenho.",
      },
      {
        id: nextId("adj"),
        sectionKey: "despesas",
        fieldLabel: "Despesas",
        comment: "Faltam notas fiscais dos materiais utilizados no ano base.",
      },
    ],
    lastAdjustmentNote:
      "Elemento Tecnologicamente Novo ou Inovador — Comparativo entre a tecnologia anterior e a nova tecnologia desenvolvida.: Detalhar melhor o comparativo tecnológico, incluindo métricas objetivas de desempenho.\nDespesas — Despesas: Faltam notas fiscais dos materiais utilizados no ano base.",
  }),
  emptyProject({
    name: "Otimização de Processo de Injeção Plástica",
    filial: RELATOR_FILIAL,
    area: RELATOR_SETOR,
    status: "revisao",
    sharedWithArea: true,
    everSharedWithArea: true,
    sharedFilial: "Filial Campinas/SP",
    sharedSetor: "Automação",
    sharedReviewer: "Patrícia Gomes",
    sharedStatus: "pendente",
    updatedAt: daysAgo(5),
    endDate: daysFromNow(30),
  }),
  emptyProject({
    name: "Sistema de Visão Computacional para Qualidade",
    filial: RELATOR_FILIAL,
    area: RELATOR_SETOR,
    status: "enviado_controladoria",
    updatedAt: daysAgo(10),
    endDate: daysFromNow(15),
    // Recém-chegada à Controladoria — nenhuma despesa analisada ainda.
    employees: [
      {
        id: nextId("emp"),
        code: MOCK_EMPLOYEES[3].code,
        name: MOCK_EMPLOYEES[3].name,
        role: MOCK_EMPLOYEES[3].role,
        activity: "Treinamento do modelo de visão computacional para inspeção de solda",
        totalHours: 320,
        eligibleHours: 320,
      },
    ],
    thirdParties: [
      {
        id: nextId("tp"),
        company: MOCK_SUPPLIERS[1].name,
        cnpj: MOCK_SUPPLIERS[1].cnpj,
        invoice: "NF-000789",
        invoiceTotal: 35000,
        usedInProject: 35000,
      },
    ],
    materials: [
      {
        id: nextId("mat"),
        supplier: MOCK_SUPPLIERS[2].name,
        cnpj: MOCK_SUPPLIERS[2].cnpj,
        invoice: "NF-000790",
        grossValue: 18000,
        netValue: 18000,
        materialDescription: "Câmeras industriais de alta resolução",
        usageDescription: "Montagem da bancada de inspeção visual",
      },
    ],
  }),
  (() => {
    const empId = nextId("emp");
    const tpId = nextId("tp");
    const matId = nextId("mat");
    return emptyProject({
      name: "Modelagem Preditiva de Demanda Energética",
      filial: RELATOR_FILIAL,
      area: RELATOR_SETOR,
      status: "enviado_controladoria",
      updatedAt: daysAgo(25),
      endDate: daysAgo(5),
      // Cenário A: existe pendência em aberto — só "Devolver ao Revisor"
      // fica disponível no rodapé da ficha da Controladoria.
      employees: [
        {
          id: empId,
          code: MOCK_EMPLOYEES[1].code,
          name: MOCK_EMPLOYEES[1].name,
          role: MOCK_EMPLOYEES[1].role,
          activity: "Modelagem estatística da curva de demanda horária",
          totalHours: 260,
          eligibleHours: 260,
        },
      ],
      thirdParties: [
        {
          id: tpId,
          company: MOCK_SUPPLIERS[4].name,
          cnpj: MOCK_SUPPLIERS[4].cnpj,
          invoice: "NF-000911",
          invoiceTotal: 42000,
          usedInProject: 42000,
        },
      ],
      materials: [
        {
          id: matId,
          supplier: MOCK_SUPPLIERS[3].name,
          cnpj: MOCK_SUPPLIERS[3].cnpj,
          invoice: "NF-000912",
          grossValue: 9000,
          netValue: 9000,
          materialDescription: "Sensores de consumo energético",
          usageDescription: "Instalação para coleta de dados de treinamento do modelo",
        },
      ],
      despesaDecisions: {
        [empId]: {
          status: "validada",
          decidedAt: daysAgo(20),
          decidedBy: ROLE_USERS.controladoria.name,
          snapshotValue: 260,
        },
        [tpId]: {
          status: "pendencia",
          comment:
            "O valor utilizado não bate com o item da nota fiscal informado — confirmar com o Financeiro.",
          decidedAt: daysAgo(20),
          decidedBy: ROLE_USERS.controladoria.name,
          snapshotValue: 42000,
        },
      },
      controladoriaHistory: [
        {
          id: nextId("ch"),
          date: daysAgo(25),
          actor: "Revisor",
          description: "encaminhou a iniciativa para a Controladoria",
        },
        {
          id: nextId("ch"),
          date: daysAgo(20),
          actor: ROLE_USERS.controladoria.name,
          description: "sinalizou pendência na despesa de serviço de terceiro",
        },
      ],
    });
  })(),
  (() => {
    const empId = nextId("emp");
    const tpId = nextId("tp");
    const matId = nextId("mat");
    return emptyProject({
      name: "Novo Catalisador para Redução de Emissões",
      filial: RELATOR_FILIAL,
      area: RELATOR_SETOR,
      status: "enviado_controladoria",
      updatedAt: daysAgo(60),
      endDate: daysAgo(30),
      hasPatent: true,
      patentNumber: "BR102023000123-4",
      // Cenário B: todas as despesas já têm decisão e nenhuma pendência em
      // aberto — "Enviar para Jurídico" fica disponível no rodapé.
      employees: [
        {
          id: empId,
          code: MOCK_EMPLOYEES[4].code,
          name: MOCK_EMPLOYEES[4].name,
          role: MOCK_EMPLOYEES[4].role,
          activity: "Testes de bancada do catalisador em diferentes temperaturas",
          totalHours: 410,
          eligibleHours: 410,
        },
      ],
      thirdParties: [
        {
          id: tpId,
          company: MOCK_SUPPLIERS[0].name,
          cnpj: MOCK_SUPPLIERS[0].cnpj,
          invoice: "NF-001033",
          invoiceTotal: 28000,
          usedInProject: 28000,
        },
      ],
      materials: [
        {
          id: matId,
          supplier: MOCK_SUPPLIERS[2].name,
          cnpj: MOCK_SUPPLIERS[2].cnpj,
          invoice: "NF-001034",
          grossValue: 15000,
          netValue: 15000,
          materialDescription: "Compostos metálicos para síntese catalítica",
          usageDescription: "Síntese e caracterização do catalisador",
        },
      ],
      despesaDecisions: {
        [empId]: {
          status: "validada",
          decidedAt: daysAgo(50),
          decidedBy: ROLE_USERS.controladoria.name,
          snapshotValue: 410,
        },
        [tpId]: {
          status: "validada",
          decidedAt: daysAgo(50),
          decidedBy: ROLE_USERS.controladoria.name,
          snapshotValue: 28000,
        },
        [matId]: {
          status: "excluida",
          comment: "Nota fiscal referente a outro centro de custo — retirada da composição.",
          decidedAt: daysAgo(49),
          decidedBy: ROLE_USERS.controladoria.name,
          snapshotValue: 15000,
        },
      },
      controladoriaHistory: [
        {
          id: nextId("ch"),
          date: daysAgo(60),
          actor: "Revisor",
          description: "encaminhou a iniciativa para a Controladoria",
        },
        {
          id: nextId("ch"),
          date: daysAgo(49),
          actor: ROLE_USERS.controladoria.name,
          description: "concluiu a análise de todas as despesas",
        },
      ],
    });
  })(),
  (() => {
    const tpId = nextId("tp");
    return emptyProject({
      name: "Protocolo de Comunicação Industrial Proprietário",
      filial: RELATOR_FILIAL,
      area: RELATOR_SETOR,
      status: "enviado_controladoria",
      updatedAt: daysAgo(80),
      endDate: daysAgo(45),
      // Análise concluída e já encaminhada ao Jurídico — estado terminal
      // dentro da Controladoria.
      controladoriaStatus: "enviada_juridico",
      thirdParties: [
        {
          id: tpId,
          company: MOCK_SUPPLIERS[1].name,
          cnpj: MOCK_SUPPLIERS[1].cnpj,
          invoice: "NF-000654",
          invoiceTotal: 31000,
          usedInProject: 31000,
        },
      ],
      despesaDecisions: {
        [tpId]: {
          status: "validada",
          decidedAt: daysAgo(70),
          decidedBy: ROLE_USERS.controladoria.name,
          snapshotValue: 31000,
        },
      },
      controladoriaHistory: [
        {
          id: nextId("ch"),
          date: daysAgo(80),
          actor: "Revisor",
          description: "encaminhou a iniciativa para a Controladoria",
        },
        {
          id: nextId("ch"),
          date: daysAgo(70),
          actor: ROLE_USERS.controladoria.name,
          description: "concluiu a análise de todas as despesas",
        },
        {
          id: nextId("ch"),
          date: daysAgo(69),
          actor: ROLE_USERS.controladoria.name,
          description: "encaminhou a iniciativa para o Jurídico",
        },
      ],
    });
  })(),
  emptyProject({
    name: "Automação de Linha de Envase com Robótica Colaborativa",
    filial: RELATOR_FILIAL,
    area: RELATOR_SETOR,
    status: "rascunho",
    updatedAt: daysAgo(2),
    endDate: daysFromNow(120),
  }),
  emptyProject({
    name: "Algoritmo de Roteirização Multi-Objetivo",
    filial: RELATOR_FILIAL,
    area: RELATOR_SETOR,
    status: "revisao",
    updatedAt: daysAgo(7),
    endDate: daysFromNow(45),
  }),
  emptyProject({
    name: "Revestimento Antimicrobiano para Superfícies Hospitalares",
    filial: RELATOR_FILIAL,
    area: RELATOR_SETOR,
    status: "rascunho",
    updatedAt: daysAgo(4),
    endDate: daysFromNow(150),
  }),
  (() => {
    const matId = nextId("mat");
    return emptyProject({
      name: "Redução de Consumo Hídrico no Processo Têxtil",
      filial: RELATOR_FILIAL,
      area: RELATOR_SETOR,
      // Devolvida pela Controladoria: volta para a fila do Revisor (mesmo
      // status "revisao" usado pelo pedido de ajuste comum), mas o histórico
      // e as decisões já registradas pela Controladoria são preservados.
      status: "revisao",
      updatedAt: daysAgo(12),
      endDate: daysFromNow(20),
      reviewedBy: "Fernanda Ramos",
      reviewedAt: daysAgo(18),
      controladoriaStatus: "devolvida_revisor",
      materials: [
        {
          id: matId,
          supplier: MOCK_SUPPLIERS[3].name,
          cnpj: MOCK_SUPPLIERS[3].cnpj,
          invoice: "NF-000788",
          grossValue: 22000,
          netValue: 22000,
          materialDescription: "Membranas de filtragem para reuso de água",
          usageDescription: "Instalação do sistema piloto de reaproveitamento hídrico",
        },
      ],
      despesaDecisions: {
        [matId]: {
          status: "pendencia",
          comment:
            "Nota fiscal anexada não corresponde ao fornecedor informado — solicitar correção.",
          decidedAt: daysAgo(14),
          decidedBy: ROLE_USERS.controladoria.name,
          snapshotValue: 22000,
        },
      },
      controladoriaHistory: [
        {
          id: nextId("ch"),
          date: daysAgo(18),
          actor: "Fernanda Ramos",
          description: "encaminhou a iniciativa para a Controladoria",
        },
        {
          id: nextId("ch"),
          date: daysAgo(14),
          actor: ROLE_USERS.controladoria.name,
          description: "sinalizou pendência na despesa de material",
        },
        {
          id: nextId("ch"),
          date: daysAgo(12),
          actor: ROLE_USERS.controladoria.name,
          description: "devolveu a iniciativa ao Revisor por pendências identificadas nas despesas",
        },
      ],
    });
  })(),
  emptyProject({
    name: "Sensor Óptico para Detecção de Contaminantes",
    filial: RELATOR_FILIAL,
    area: RELATOR_SETOR,
    status: "ajustes",
    updatedAt: daysAgo(6),
    endDate: daysFromNow(75),
    adjustmentItems: [
      {
        id: nextId("adj"),
        sectionKey: "barreiras",
        fieldId: "barr_7",
        fieldLabel: "Testes realizados.",
        comment:
          "Descreva os protocolos de teste utilizados e os resultados quantitativos obtidos.",
      },
    ],
    lastAdjustmentNote:
      "Barreiras e Desafios Tecnológicos — Testes realizados.: Descreva os protocolos de teste utilizados e os resultados quantitativos obtidos.",
  }),
  emptyProject({
    name: "Painel de Controle para Linha de Extrusão",
    filial: "Filial Rio de Janeiro/RJ",
    area: "Engenharia de Produto",
    responsible: "João Silva",
    status: "revisao",
    // Origem compartilhada já aceita: sharedWithArea volta a "false" (fluxo de
    // aceite concluído), mas everSharedWithArea permanece — o texto abaixo
    // continua sendo tratado como somente leitura para o Revisor, com uma
    // observação adicional já registrada como exemplo.
    sharedWithArea: false,
    everSharedWithArea: true,
    updatedAt: daysAgo(2),
    startDate: daysAgo(70),
    endDate: daysFromNow(100),
    answers: {
      inov_3:
        "O objetivo do projeto é desenvolver um painel de controle inteligente para a linha de extrusão, reduzindo o tempo de setup entre lotes de produção.",
    },
    sharedAdditionalNotes: {
      inov_3:
        "Revisor: confirmar com a Diretoria de origem se o painel também precisa se integrar ao sistema de supervisório já existente na planta de Engenharia de Produto.",
    },
  }),
];

const masterProjectId = nextId("proj");

INITIAL_PROJECTS.push(
  emptyProject({
    id: masterProjectId,
    name: "Desenvolvimento de Nova Tecnologia",
    filial: RELATOR_FILIAL,
    area: RELATOR_SETOR,
    projectType: "mestre",
    status: "revisao",
    updatedAt: daysAgo(3),
    startDate: daysAgo(150),
    endDate: daysFromNow(90),
  }),
  emptyProject({
    name: "Projeto A — Novo Sistema de Controle",
    filial: RELATOR_FILIAL,
    area: RELATOR_SETOR,
    projectType: "dependente",
    masterProjectId,
    status: "revisao",
    updatedAt: daysAgo(3),
    startDate: daysAgo(140),
    endDate: daysFromNow(80),
  }),
  emptyProject({
    name: "Projeto B — Novo Processo de Produção",
    filial: "Filial Porto Alegre/RS",
    area: "Engenharia de Produto",
    responsible: "Carlos Silva",
    projectType: "dependente",
    masterProjectId,
    status: "revisao",
    updatedAt: daysAgo(0),
    startDate: daysAgo(120),
    endDate: daysFromNow(100),
  }),
  emptyProject({
    name: "Projeto C — Nova Solução Tecnológica",
    filial: RELATOR_FILIAL,
    area: RELATOR_SETOR,
    projectType: "dependente",
    masterProjectId,
    status: "enviado_controladoria",
    updatedAt: daysAgo(8),
    startDate: daysAgo(130),
    endDate: daysFromNow(40),
  }),
);

// Projeto de teste com todos os campos preenchidos, para validar o fluxo de
// "Enviar para Revisão" (as respostas obrigatórias já atendem os 80% mínimos).
const FULL_TEST_ANSWER =
  "Resposta completa preenchida para fins de teste, cobrindo o contexto técnico, os objetivos, a metodologia empregada e os resultados esperados desta pergunta com o nível de detalhe exigido pela Lei do Bem.";

function fullAnswers(): Record<string, string> {
  const map: Record<string, string> = {};
  ALL_REQUIRED_QUESTIONS.forEach((id) => {
    map[id] = FULL_TEST_ANSWER;
  });
  return map;
}

// Textos variados para simular respostas "aleatórias" em iniciativas que já
// deveriam estar com a ficha completa (Enviado para Controladoria). Não usa
// Math.random(): este módulo roda tanto no servidor quanto no cliente, e um
// valor diferente a cada avaliação causaria "hydration mismatch" — o seed
// escolhe determinísticamente dentro do pool.
const RANDOM_ANSWER_POOL = [
  "A iniciativa consolida um conjunto de estudos técnicos conduzidos internamente, com testes de bancada que validaram as hipóteses iniciais e orientaram os ajustes de escopo ao longo do desenvolvimento.",
  "O time avaliou soluções disponíveis no mercado antes de decidir pelo desenvolvimento próprio, já que nenhuma alternativa atendia às restrições operacionais e de integração exigidas pela planta.",
  "Foram realizados ciclos iterativos de prototipagem, com medições comparativas entre a abordagem anterior e a nova solução, documentando ganhos de desempenho e pontos de atenção remanescentes.",
  "A equipe multidisciplinar reuniu competências de engenharia, dados e operação para mapear os requisitos técnicos, priorizando entregas que reduzissem risco tecnológico nas etapas seguintes.",
  "O desenvolvimento exigiu adaptação de processos já existentes, com testes de integração em ambiente controlado antes da validação em escala real junto às Diretorias envolvidas.",
  "Os resultados obtidos até o momento indicam ganhos consistentes frente à linha de base, ainda que alguns parâmetros continuem sendo monitorados para garantir estabilidade em produção.",
  "A metodologia adotada seguiu ciclos curtos de experimentação, com revisões periódicas de escopo e registro sistemático das decisões técnicas tomadas em cada etapa.",
  "Entre as principais dificuldades enfrentadas está a escassez de referências técnicas específicas para o contexto da empresa, o que exigiu validação experimental própria.",
  "O conhecimento gerado ao longo do projeto já vem sendo incorporado a outras iniciativas da Diretoria, servindo como base técnica para desdobramentos futuros.",
  "A avaliação de riscos identificou pontos críticos relacionados à integração com sistemas legados, mitigados por meio de testes incrementais e planos de contingência.",
];

function randomAnswers(seed: number): Record<string, string> {
  const map: Record<string, string> = {};
  ALL_REQUIRED_QUESTIONS.forEach((id, idx) => {
    map[id] = RANDOM_ANSWER_POOL[(seed + idx) % RANDOM_ANSWER_POOL.length];
  });
  return map;
}

// --- Notas fiscais compartilhadas entre projetos (Despesas) ---------------
// Registradas uma vez (leitura da chave de acesso ou busca por CNPJ) e
// reutilizáveis por qualquer iniciativa do Responsável Financeiro. O quanto
// já foi consumido de cada item nunca é armazenado aqui — é sempre somado a
// partir dos lançamentos das próprias iniciativas (ver src/lib/invoices.ts).
const invInovaTechId = nextId("inv");
const invInovaTechItemConsultoriaId = nextId("item");
const invInovaTechItemAutomacaoId = nextId("item");
const invAlfaId = nextId("inv");
const invAlfaItemId = nextId("item");

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: invInovaTechId,
    cnpj: MOCK_SUPPLIERS[0].cnpj,
    companyName: MOCK_SUPPLIERS[0].name,
    invoiceNumber: "NF-000123",
    accessKey: "35240613456789000123550010000001231987654321",
    issueDate: daysAgo(62),
    items: [
      {
        id: invInovaTechItemConsultoriaId,
        description: "Consultoria técnica em IA aplicada",
        totalValue: 80000,
      },
      {
        id: invInovaTechItemAutomacaoId,
        description: "Consultoria em automação de testes",
        totalValue: 20000,
      },
    ],
    createdAt: daysAgo(60),
  },
  {
    id: invAlfaId,
    cnpj: MOCK_SUPPLIERS[3].cnpj,
    companyName: MOCK_SUPPLIERS[3].name,
    invoiceNumber: "NF-000456",
    accessKey: "35240613456789000456550010000004561987654321",
    issueDate: daysAgo(47),
    items: [
      {
        id: invAlfaItemId,
        description: "Componentes eletrônicos para protótipo",
        totalValue: 12000,
      },
    ],
    createdAt: daysAgo(45),
  },
];

const testProjectEvidences: Attachment[] = [
  {
    id: nextId("att"),
    name: "relatorio-tecnico-completo.pdf",
    type: "application/pdf",
    category: "relatorio",
    uploadedAt: daysAgo(1),
    uploadedBy: "Ana Souza",
    size: 850 * 1024,
  },
  {
    id: nextId("att"),
    name: "fotos-bancada-testes.jpg",
    type: "image/jpeg",
    category: "fotos",
    uploadedAt: daysAgo(1),
    uploadedBy: "Ana Souza",
    size: 1200 * 1024,
  },
];

INITIAL_PROJECTS.push(
  emptyProject({
    name: "Projeto de Teste — Pronto para Envio",
    filial: RELATOR_FILIAL,
    area: RELATOR_SETOR,
    status: "rascunho",
    updatedAt: daysAgo(0),
    startDate: daysAgo(60),
    endDate: daysFromNow(120),
    hasPatent: true,
    patentNumber: "BR102024005555-0",
    answers: fullAnswers(),
    attachments: { _evidencias: testProjectEvidences },
    employees: [
      {
        id: nextId("emp"),
        code: MOCK_EMPLOYEES[0].code,
        name: MOCK_EMPLOYEES[0].name,
        role: MOCK_EMPLOYEES[0].role,
        activity: "Desenvolvimento do algoritmo de controle preditivo",
        totalHours: 480,
        eligibleHours: 400,
      },
    ],
    thirdParties: [
      {
        id: nextId("tp"),
        company: MOCK_SUPPLIERS[0].name,
        cnpj: MOCK_SUPPLIERS[0].cnpj,
        invoice: "NF-000123",
        invoiceTotal: 80000,
        usedInProject: 45000,
        invoiceId: invInovaTechId,
        itemId: invInovaTechItemConsultoriaId,
      },
    ],
    materials: [
      {
        id: nextId("mat"),
        supplier: MOCK_SUPPLIERS[3].name,
        cnpj: MOCK_SUPPLIERS[3].cnpj,
        invoice: "NF-000456",
        grossValue: 12000,
        netValue: 10500,
        materialDescription: "Componentes eletrônicos para protótipo",
        usageDescription: "Montagem do protótipo funcional de validação",
        invoiceId: invAlfaId,
        itemId: invAlfaItemId,
      },
    ],
  }),
);

const EXTRA_NAMES = [
  "Redes Neurais para Detecção de Fraudes",
  "Biopolímero Biodegradável para Embalagens",
  "Gêmeo Digital de Linha de Produção",
  "Célula Solar de Perovskita Flexível",
  "Plataforma IoT para Monitoramento Agrícola",
  "Otimização Genética de Ligas Metálicas",
  "Sistema de Recuperação de Calor Residual",
  "Impressão 3D de Órteses Personalizadas",
  "Blockchain para Rastreabilidade de Insumos",
  "Modelo LLM para Suporte Técnico Interno",
  "Nanoemulsão para Aplicações Farmacêuticas",
  "Filtro Cerâmico para Efluentes Industriais",
  "Robô Autônomo para Inspeção de Dutos",
  "Compilador Especializado para GPU",
  "Sistema de Refrigeração por Absorção Solar",
  "Bateria de Estado Sólido de Alta Densidade",
  "Software de Simulação de Fluidos Multifásicos",
  "Tinta Condutiva para Circuitos Impressos",
  "Realidade Aumentada para Treinamento Fabril",
  "Sensor MEMS para Detecção de Gases",
  "Análise Preditiva de Falhas em Turbinas",
  "Bioplástico a Partir de Resíduos Agrícolas",
  "Sistema de Comunicação por Luz Visível (LiFi)",
  "Algoritmo de Otimização Combinatória Quântica",
  "Membrana Osmótica de Alta Seletividade",
  "Drone Autônomo para Pulverização Precisa",
  "Sistema de Reconhecimento Facial Anti-Spoof",
  "Concreto Autocicatrizante com Bactérias",
  "Plataforma de Federação de Dados Clínicos",
  "Motor Elétrico de Fluxo Axial de Alto Torque",
  "Solvente Verde para Extração de Óleos",
  "Sistema Anti-Colisão para Veículos Pesados",
  "Reator Contínuo de Micro-ondas",
  "Framework de Machine Learning Federado",
  "Adesivo Estrutural Reversível por Calor",
  "Analisador Espectral em Tempo Real",
  "Cabo Supercondutor para Alta Tensão",
  "Sistema de Purificação de Ar por Fotocatálise",
  "Software de Otimização de Rotas Multimodais",
  "Antena Reconfigurável para 5G/6G",
];

const NATUREZAS: Array<Project["natureza"]> = ["produto", "processo", "servico"];
const ATIVIDADES: Array<Project["atividade"]> = ["basica", "aplicada", "experimental"];
const STATUSES: Array<Project["status"]> = [
  "rascunho",
  "ajustes",
  "revisao",
  "enviado_controladoria",
];
const RELATOR_NAMES = ["Ana Souza", "João Silva", "Carlos Silva", "Mariana Costa", "Beatriz Lima"];
export const REVISOR_NAMES = ["Fernanda Ramos", "Ricardo Alves", "Patrícia Gomes"];

for (let i = 0; i < EXTRA_NAMES.length; i++) {
  const upd = 1 + ((i * 3) % 90);
  INITIAL_PROJECTS.push(
    emptyProject({
      name: EXTRA_NAMES[i],
      area: AREAS[i % AREAS.length],
      responsible: RELATOR_NAMES[i % RELATOR_NAMES.length],
      status: STATUSES[i % STATUSES.length],
      natureza: NATUREZAS[i % NATUREZAS.length],
      atividade: ATIVIDADES[i % ATIVIDADES.length],
      updatedAt: daysAgo(upd),
      startDate: daysAgo(120 + i * 4),
      endDate: daysFromNow(30 + ((i * 7) % 200)),
      hasPatent: i % 5 === 0,
      patentNumber: i % 5 === 0 ? `BR10202400${1000 + i}-${i % 10}` : undefined,
    }),
  );
}

// Iniciativas "Enviado para Controladoria" já concluíram o preenchimento da
// ficha do Relator — completa a resposta de todas as perguntas obrigatórias
// (100% preenchido) sempre que ainda estiverem vazias.
INITIAL_PROJECTS.forEach((p, idx) => {
  if (p.status === "enviado_controladoria" && Object.keys(p.answers).length === 0) {
    p.answers = randomAnswers(idx);
  }
});

// Controladoria — toda iniciativa "Enviado para Controladoria" chega como
// "Aguardando análise", com data/responsável de recebimento (reviewedAt/
// reviewedBy, preenchidos pelo Revisor no momento do encaminhamento).
// Cenários específicos (pendência, tudo decidido, devolvida, enviada ao
// Jurídico) já vêm com esses campos definidos explicitamente acima.
INITIAL_PROJECTS.forEach((p) => {
  if (p.status === "enviado_controladoria") {
    if (!p.controladoriaStatus) p.controladoriaStatus = "aguardando_analise";
    if (!p.reviewedAt) p.reviewedAt = p.updatedAt;
    if (!p.reviewedBy) p.reviewedBy = "Fernanda Ramos";
  }
});

// Preenche a iniciativa que hoje aparece primeiro na lista da Controladoria
// (maior reviewedAt) com despesas variadas e SEM nenhuma decisão registrada
// — serve de "massa de teste" para experimentar validar/sinalizar
// pendência/excluir e devolver ao Revisor.
(() => {
  const target = INITIAL_PROJECTS.find(
    (p) => p.name === "Sistema Anti-Colisão para Veículos Pesados",
  );
  if (!target) return;
  target.employees = [
    {
      id: nextId("emp"),
      code: MOCK_EMPLOYEES[0].code,
      name: MOCK_EMPLOYEES[0].name,
      role: MOCK_EMPLOYEES[0].role,
      activity: "Validação de sensores anticolisão em bancada",
      totalHours: 220,
      eligibleHours: 180,
    },
    {
      id: nextId("emp"),
      code: MOCK_EMPLOYEES[1].code,
      name: MOCK_EMPLOYEES[1].name,
      role: MOCK_EMPLOYEES[1].role,
      activity: "Pesquisa de algoritmos de frenagem preditiva",
      totalHours: 300,
      eligibleHours: 300,
    },
    {
      id: nextId("emp"),
      code: MOCK_EMPLOYEES[2].code,
      name: MOCK_EMPLOYEES[2].name,
      role: MOCK_EMPLOYEES[2].role,
      activity: "Testes de campo em pista fechada",
      totalHours: 150,
      eligibleHours: 90,
    },
  ];
  target.thirdParties = [
    {
      id: nextId("tp"),
      company: MOCK_SUPPLIERS[0].name,
      cnpj: MOCK_SUPPLIERS[0].cnpj,
      invoice: "NF-002001",
      invoiceTotal: 60000,
      usedInProject: 60000,
    },
    {
      id: nextId("tp"),
      company: MOCK_SUPPLIERS[1].name,
      cnpj: MOCK_SUPPLIERS[1].cnpj,
      invoice: "NF-002002",
      invoiceTotal: 25000,
      usedInProject: 18000,
    },
    {
      id: nextId("tp"),
      company: MOCK_SUPPLIERS[4].name,
      cnpj: MOCK_SUPPLIERS[4].cnpj,
      invoice: "NF-002003",
      invoiceTotal: 40000,
      usedInProject: 40000,
    },
  ];
  target.materials = [
    {
      id: nextId("mat"),
      supplier: MOCK_SUPPLIERS[2].name,
      cnpj: MOCK_SUPPLIERS[2].cnpj,
      invoice: "NF-002004",
      grossValue: 15000,
      netValue: 13500,
      materialDescription: "Sensores LiDAR de curto alcance",
      usageDescription: "Montagem do protótipo de teste",
    },
    {
      id: nextId("mat"),
      supplier: MOCK_SUPPLIERS[3].name,
      cnpj: MOCK_SUPPLIERS[3].cnpj,
      invoice: "NF-002005",
      grossValue: 9000,
      netValue: 9000,
      materialDescription: "Estrutura de fixação para sensores",
      usageDescription: "Instalação no veículo de testes",
    },
  ];
  target.controladoriaHistory = [
    {
      id: nextId("ch"),
      date: target.reviewedAt ?? target.updatedAt,
      actor: target.reviewedBy ?? "Revisor",
      description: "encaminhou a iniciativa para a Controladoria",
    },
  ];
})();

// Iniciativas concluídas em 2025 — já fora da responsabilidade do Revisor.
// Datas fixas em ISO (não daysAgo/daysFromNow, que são relativas a "hoje")
// para que o ano de 2025 apareça de forma estável no filtro de Ano.
INITIAL_PROJECTS.push(
  emptyProject({
    name: "Sistema de Empacotamento Automatizado com Visão 3D",
    filial: RELATOR_FILIAL,
    area: RELATOR_SETOR,
    responsible: "Beatriz Lima",
    status: "enviado_controladoria",
    natureza: "produto",
    atividade: "experimental",
    hasPatent: true,
    patentNumber: "BR102025000456-1",
    createdAt: "2025-01-20T09:00:00.000Z",
    startDate: "2025-01-20T09:00:00.000Z",
    endDate: "2025-06-30T18:00:00.000Z",
    updatedAt: "2025-07-08T14:30:00.000Z",
    answers: randomAnswers(101),
  }),
  emptyProject({
    name: "Liga Metálica de Baixo Custo para Componentes Estruturais",
    filial: "Filial Campinas/SP",
    area: "Automação",
    responsible: "Carlos Silva",
    status: "enviado_controladoria",
    natureza: "processo",
    atividade: "aplicada",
    createdAt: "2025-03-05T09:00:00.000Z",
    startDate: "2025-03-05T09:00:00.000Z",
    endDate: "2025-09-15T18:00:00.000Z",
    updatedAt: "2025-10-02T11:00:00.000Z",
    answers: randomAnswers(102),
  }),
  emptyProject({
    name: "Sistema de Climatização Inteligente por Zonas",
    filial: RELATOR_FILIAL,
    area: RELATOR_SETOR,
    responsible: "Mariana Costa",
    status: "enviado_controladoria",
    natureza: "servico",
    atividade: "basica",
    createdAt: "2025-02-10T09:00:00.000Z",
    startDate: "2025-02-10T09:00:00.000Z",
    endDate: "2025-05-30T18:00:00.000Z",
    updatedAt: "2025-06-18T16:00:00.000Z",
    answers: randomAnswers(103),
  }),
  emptyProject({
    name: "Plataforma de Recomendação para Manutenção de Frota",
    filial: "Filial Porto Alegre/RS",
    area: "Engenharia de Produto",
    responsible: "João Silva",
    status: "enviado_controladoria",
    natureza: "produto",
    atividade: "experimental",
    createdAt: "2025-08-01T09:00:00.000Z",
    startDate: "2025-08-01T09:00:00.000Z",
    endDate: "2025-11-20T18:00:00.000Z",
    updatedAt: "2025-12-05T10:00:00.000Z",
    answers: randomAnswers(104),
  }),
);

// Retorno à Controladoria após devolução ao Revisor: demonstra o cenário de
// "Retorno de uma iniciativa" — histórico da primeira análise preservado,
// decisões antigas mantidas, e uma despesa já corrigida pelo Financeiro cujo
// valor diverge do snapshot registrado na decisão anterior (precisa de nova
// conferência).
(() => {
  const empId = nextId("emp");
  const tpOkId = nextId("tp");
  const tpFixedId = nextId("tp");
  INITIAL_PROJECTS.push(
    emptyProject({
      name: "Linha de Pasteurização Contínua com Controle Adaptativo",
      filial: RELATOR_FILIAL,
      area: RELATOR_SETOR,
      responsible: "Beatriz Lima",
      status: "enviado_controladoria",
      updatedAt: daysAgo(5),
      createdAt: daysAgo(150),
      startDate: daysAgo(150),
      endDate: daysAgo(10),
      answers: randomAnswers(105),
      reviewedBy: "Ricardo Alves",
      reviewedAt: daysAgo(5),
      controladoriaStatus: "aguardando_analise",
      employees: [
        {
          id: empId,
          code: MOCK_EMPLOYEES[2].code,
          name: MOCK_EMPLOYEES[2].name,
          role: MOCK_EMPLOYEES[2].role,
          activity: "Ajuste do controle adaptativo de temperatura da linha",
          totalHours: 300,
          eligibleHours: 300,
        },
      ],
      thirdParties: [
        {
          id: tpOkId,
          company: MOCK_SUPPLIERS[0].name,
          cnpj: MOCK_SUPPLIERS[0].cnpj,
          invoice: "NF-000501",
          invoiceTotal: 26000,
          usedInProject: 26000,
        },
        {
          id: tpFixedId,
          company: MOCK_SUPPLIERS[4].name,
          cnpj: MOCK_SUPPLIERS[4].cnpj,
          invoice: "NF-000502",
          // Valor corrigido pelo Financeiro após a devolução — diverge do
          // snapshot registrado na decisão de pendência abaixo.
          invoiceTotal: 17500,
          usedInProject: 17500,
        },
      ],
      despesaDecisions: {
        [empId]: {
          status: "validada",
          decidedAt: daysAgo(30),
          decidedBy: ROLE_USERS.controladoria.name,
          snapshotValue: 300,
        },
        [tpOkId]: {
          status: "validada",
          decidedAt: daysAgo(30),
          decidedBy: ROLE_USERS.controladoria.name,
          snapshotValue: 26000,
        },
        [tpFixedId]: {
          status: "pendencia",
          comment: "Valor utilizado divergia do item da nota fiscal — corrigir com o Financeiro.",
          decidedAt: daysAgo(29),
          decidedBy: ROLE_USERS.controladoria.name,
          snapshotValue: 21000,
        },
      },
      controladoriaHistory: [
        {
          id: nextId("ch"),
          date: daysAgo(30),
          actor: "Ricardo Alves",
          description: "encaminhou a iniciativa para a Controladoria",
        },
        {
          id: nextId("ch"),
          date: daysAgo(29),
          actor: ROLE_USERS.controladoria.name,
          description: "sinalizou pendência na despesa de serviço de terceiro",
        },
        {
          id: nextId("ch"),
          date: daysAgo(28),
          actor: ROLE_USERS.controladoria.name,
          description: "devolveu a iniciativa ao Revisor por pendências identificadas nas despesas",
        },
        {
          id: nextId("ch"),
          date: daysAgo(5),
          actor: "Ricardo Alves",
          description: "reencaminhou a iniciativa à Controladoria após o ajuste do Financeiro",
        },
      ],
    }),
  );
})();

// --- Jurídico — iniciativas recebidas, agrupamentos, pré-projetos e ------
// projetos (dados fictícios cobrindo o fluxo completo: sugestão de
// agrupamento pela IA, transformação em pré-projeto, decisão do comitê nos
// três sentidos, elaboração do projeto e as etapas de submissão/devolutiva
// do MCTI, incluindo o cenário de segunda submissão).

// Datas explícitas (não crypto.randomUUID()/new Date() soltos) pelo mesmo
// motivo do nextId: este módulo roda em SSR e CSR, e um valor diferente a
// cada avaliação causaria hydration mismatch.
function seedHistory(actor: string, description: string, date: string) {
  return { id: nextId("jh"), date, actor, description };
}

interface JuridicoSeedIniciativa {
  name: string;
  area: string;
  responsible: string;
  objetivo: string;
  problema: string;
  atividades: string;
  resultados: string;
  descricao: string;
  valorTerceiro: number;
  valorMaterial: number;
  ano: number;
}

const JURIDICO_SEED_INICIATIVAS: JuridicoSeedIniciativa[] = [
  // Cluster A — Automação e Robótica Industrial
  {
    name: "Célula Robotizada de Solda para Linha de Montagem",
    area: "Automação",
    responsible: "Carlos Silva",
    objetivo:
      "Desenvolver uma célula de automação industrial com solda robotizada para a linha de montagem principal.",
    problema: "Alto índice de retrabalho e variabilidade na solda manual da linha de montagem.",
    atividades:
      "Projeto e integração de braço robótico, programação de trajetórias de solda e testes de automação industrial em bancada.",
    resultados: "Redução do retrabalho e aumento de produtividade na linha de montagem.",
    descricao:
      "Célula robotizada para solda automatizada, reduzindo a variabilidade do processo manual.",
    valorTerceiro: 42000,
    valorMaterial: 18000,
    ano: 2026,
  },
  {
    name: "Braço Robótico Colaborativo para Picking",
    area: "Engenharia de Produto",
    responsible: "João Silva",
    objetivo:
      "Avaliar a aplicação de robótica colaborativa em operações de picking para automação industrial do centro de distribuição.",
    problema: "Baixa produtividade e riscos ergonômicos na separação manual de pedidos.",
    atividades:
      "Testes com braço robótico colaborativo, calibração de garras e integração com o sistema de gestão de armazém.",
    resultados:
      "Ganhos de produtividade e redução de riscos ergonômicos nas operações de separação.",
    descricao:
      "Avaliação de robô colaborativo aplicado à separação de pedidos no centro de distribuição.",
    valorTerceiro: 35000,
    valorMaterial: 12000,
    ano: 2026,
  },
  {
    name: "Sistema de Visão para Controle de Automação Industrial",
    area: "Processos Industriais",
    responsible: "Mariana Costa",
    objetivo:
      "Implementar visão computacional para controle de qualidade em uma célula de automação industrial.",
    problema: "Falta de rastreabilidade visual nos pontos críticos da linha automatizada.",
    atividades:
      "Desenvolvimento de algoritmos de visão, integração com controladores da célula de automação industrial e testes de campo.",
    resultados: "Maior rastreabilidade e redução de falhas não detectadas na linha.",
    descricao: "Sistema de visão computacional integrado à automação industrial da linha.",
    valorTerceiro: 50000,
    valorMaterial: 9000,
    ano: 2025,
  },
  // Cluster B — Eficiência Energética e Sustentabilidade
  {
    name: "Sistema de Recuperação de Energia em Compressores",
    area: "Processos Industriais",
    responsible: "Beatriz Lima",
    objetivo:
      "Desenvolver um sistema de recuperação de calor para aumentar a eficiência energética dos compressores industriais.",
    problema: "Alto desperdício de energia térmica no processo de compressão.",
    atividades:
      "Modelagem térmica, testes de eficiência energética e validação do sistema de recuperação em escala piloto.",
    resultados:
      "Redução do consumo energético e melhoria da sustentabilidade do processo produtivo.",
    descricao:
      "Recuperação de calor residual dos compressores para ganhos de eficiência energética.",
    valorTerceiro: 38000,
    valorMaterial: 21000,
    ano: 2026,
  },
  {
    name: "Painel Solar Modular para Autoconsumo Industrial",
    area: "Automação",
    responsible: "Ana Souza",
    objetivo:
      "Desenvolver um painel solar modular voltado à energia renovável para autoconsumo em unidades industriais.",
    problema: "Dependência de fontes de energia não renováveis em unidades remotas.",
    atividades:
      "Testes de módulos fotovoltaicos, integração com o sistema elétrico e avaliação de sustentabilidade do autoconsumo.",
    resultados: "Maior participação de energia renovável na matriz da unidade.",
    descricao: "Solução modular de energia renovável para autoconsumo industrial.",
    valorTerceiro: 46000,
    valorMaterial: 15000,
    ano: 2025,
  },
  {
    name: "Programa de Redução de Emissões na Linha de Pintura",
    area: "Qualidade e Inovação",
    responsible: "Carlos Silva",
    objetivo:
      "Reduzir emissões de compostos orgânicos voláteis na linha de pintura, com foco em sustentabilidade.",
    problema:
      "Emissões acima do desejável na etapa de pintura, impactando a sustentabilidade da operação.",
    atividades:
      "Testes com tintas de menor impacto, ajuste de parâmetros de cura e monitoramento da redução de emissões.",
    resultados: "Redução de emissões e avanço nas metas de sustentabilidade ambiental.",
    descricao: "Programa técnico de redução de emissões na linha de pintura.",
    valorTerceiro: 29000,
    valorMaterial: 11000,
    ano: 2026,
  },
  // Cluster C — Plataformas de Dados e Inteligência Artificial
  {
    name: "Plataforma de Inteligência Artificial para Previsão de Demanda",
    area: "Tecnologia da Informação",
    responsible: "Mariana Costa",
    objetivo:
      "Desenvolver uma plataforma de inteligência artificial para previsão de demanda de produtos acabados.",
    problema: "Baixa acurácia nas previsões atuais, gerando excesso ou falta de estoque.",
    atividades:
      "Treinamento de modelos de machine learning, validação estatística e testes de análise preditiva de dados históricos de vendas.",
    resultados: "Maior acurácia na previsão de demanda e redução de rupturas de estoque.",
    descricao: "Plataforma de IA para previsão de demanda com base em dados históricos.",
    valorTerceiro: 55000,
    valorMaterial: 6000,
    ano: 2026,
  },
  {
    name: "Modelo de Machine Learning para Detecção de Defeitos",
    area: "Qualidade e Inovação",
    responsible: "João Silva",
    objetivo:
      "Aplicar machine learning para detecção automática de defeitos em imagens de inspeção de qualidade.",
    problema: "Inspeção visual manual sujeita a falhas e baixa padronização.",
    atividades:
      "Rotulagem de imagens, treinamento de modelo de machine learning e testes de análise preditiva de dados de inspeção.",
    resultados: "Maior padronização e redução de defeitos não detectados.",
    descricao: "Modelo de inteligência artificial para inspeção visual automatizada.",
    valorTerceiro: 48000,
    valorMaterial: 4000,
    ano: 2025,
  },
  {
    name: "Motor de Análise Preditiva de Dados de Sensores",
    area: "Pesquisa & Desenvolvimento",
    responsible: "Ana Souza",
    objetivo:
      "Criar um motor de análise preditiva de dados de sensores para antecipar falhas em equipamentos críticos.",
    problema: "Paradas não programadas por falhas não antecipadas em equipamentos críticos.",
    atividades:
      "Coleta de dados de sensores, testes de inteligência artificial para manutenção preditiva e validação em campo.",
    resultados: "Redução de paradas não programadas e aumento da disponibilidade dos equipamentos.",
    descricao:
      "Motor preditivo baseado em inteligência artificial para manutenção de equipamentos.",
    valorTerceiro: 33000,
    valorMaterial: 8000,
    ano: 2026,
  },
  // Sem tema compartilhado — ficam disponíveis para agrupamento manual ou
  // para os cenários individuais de Pré-projetos/Projetos abaixo.
  {
    name: "Sistema Modular de Embalagem Retornável",
    area: "Engenharia de Produto",
    responsible: "Beatriz Lima",
    objetivo:
      "Desenvolver um sistema modular de embalagem retornável para redução de descarte logístico.",
    problema: "Alto volume de descarte de embalagens descartáveis no transporte entre unidades.",
    atividades:
      "Prototipagem de módulos de embalagem, testes de resistência e ciclos de reutilização.",
    resultados: "Redução do descarte de embalagens e menor custo logístico recorrente.",
    descricao: "Embalagem modular retornável para uso recorrente entre unidades.",
    valorTerceiro: 21000,
    valorMaterial: 17000,
    ano: 2025,
  },
  {
    name: "Sistema de Rastreamento RFID para Expedição",
    area: "Processos Industriais",
    responsible: "Carlos Silva",
    objetivo:
      "Implementar rastreamento por RFID dos lotes na expedição para reduzir erros de separação.",
    problema: "Erros recorrentes de expedição por identificação manual de lotes.",
    atividades:
      "Testes de antenas RFID, integração com o sistema de gestão de armazém e validação de leitura em docas de carregamento.",
    resultados: "Redução de erros de expedição e maior rastreabilidade de lotes.",
    descricao: "Solução de rastreamento por radiofrequência aplicada à expedição.",
    valorTerceiro: 31000,
    valorMaterial: 14000,
    ano: 2026,
  },
  {
    name: "Unidade de Testes Climáticos Acelerados para Componentes",
    area: "Qualidade e Inovação",
    responsible: "Mariana Costa",
    objetivo:
      "Desenvolver uma câmara de testes climáticos acelerados para validação de componentes críticos.",
    problema:
      "Falta de estrutura própria para simular condições climáticas extremas em componentes.",
    atividades: "Projeto da câmara climática, calibração de sensores e ciclos de teste acelerado.",
    resultados: "Maior confiabilidade dos componentes validados antes do uso em campo.",
    descricao: "Câmara própria de testes climáticos acelerados para componentes críticos.",
    valorTerceiro: 27000,
    valorMaterial: 19000,
    ano: 2025,
  },
  {
    name: "Reator Modular de Testes de Corrosão Acelerada",
    area: "Automação",
    responsible: "João Silva",
    objetivo:
      "Construir um reator modular para testes de corrosão acelerada de revestimentos industriais.",
    problema:
      "Dependência de laboratórios externos para ensaios de corrosão, com alto custo e prazo.",
    atividades:
      "Montagem do reator modular, calibração de parâmetros de ensaio e testes comparativos de revestimentos.",
    resultados: "Redução de custo e prazo nos ensaios de corrosão acelerada.",
    descricao: "Reator próprio para ensaios acelerados de corrosão em revestimentos.",
    valorTerceiro: 24000,
    valorMaterial: 10000,
    ano: 2026,
  },
];

JURIDICO_SEED_INICIATIVAS.forEach((seed, idx) => {
  const tpId = nextId("tp");
  const matId = nextId("mat");
  const reviewedAt = daysAgo(20 + idx * 3);
  INITIAL_PROJECTS.push(
    emptyProject({
      name: seed.name,
      filial: RELATOR_FILIAL,
      area: seed.area,
      responsible: seed.responsible,
      status: "enviado_controladoria",
      natureza: "produto",
      atividade: "aplicada",
      createdAt: `${seed.ano}-02-10T09:00:00.000Z`,
      startDate: `${seed.ano}-02-10T09:00:00.000Z`,
      endDate: `${seed.ano}-08-20T18:00:00.000Z`,
      updatedAt: reviewedAt,
      answers: {
        inov_3: seed.objetivo,
        inov_8: seed.problema,
        inov_9: seed.descricao,
        inov_6: seed.resultados,
        met_2: seed.atividades,
      },
      reviewedBy: "Ricardo Alves",
      reviewedAt,
      controladoriaStatus: "enviada_juridico",
      thirdParties: [
        {
          id: tpId,
          company: MOCK_SUPPLIERS[idx % MOCK_SUPPLIERS.length].name,
          cnpj: MOCK_SUPPLIERS[idx % MOCK_SUPPLIERS.length].cnpj,
          invoice: `NF-003${String(100 + idx).padStart(3, "0")}`,
          invoiceTotal: seed.valorTerceiro,
          usedInProject: seed.valorTerceiro,
        },
      ],
      materials: [
        {
          id: matId,
          supplier: MOCK_SUPPLIERS[(idx + 1) % MOCK_SUPPLIERS.length].name,
          cnpj: MOCK_SUPPLIERS[(idx + 1) % MOCK_SUPPLIERS.length].cnpj,
          invoice: `NF-004${String(100 + idx).padStart(3, "0")}`,
          grossValue: seed.valorMaterial,
          netValue: seed.valorMaterial,
          materialDescription: `Insumos técnicos — ${seed.name}`,
          usageDescription: "Aplicação direta na iniciativa.",
        },
      ],
      despesaDecisions: {
        [tpId]: {
          status: "validada",
          decidedAt: reviewedAt,
          decidedBy: ROLE_USERS.controladoria.name,
          snapshotValue: seed.valorTerceiro,
        },
        [matId]: {
          status: "validada",
          decidedAt: reviewedAt,
          decidedBy: ROLE_USERS.controladoria.name,
          snapshotValue: seed.valorMaterial,
        },
      },
      controladoriaHistory: [
        {
          id: nextId("ch"),
          date: reviewedAt,
          actor: "Ricardo Alves",
          description: "encaminhou a iniciativa para a Controladoria",
        },
        {
          id: nextId("ch"),
          date: reviewedAt,
          actor: ROLE_USERS.controladoria.name,
          description: "concluiu a análise de todas as despesas",
        },
        {
          id: nextId("ch"),
          date: reviewedAt,
          actor: ROLE_USERS.controladoria.name,
          description: "encaminhou a iniciativa para o Jurídico",
        },
      ],
    }),
  );
});

export const INITIAL_AGRUPAMENTOS: Agrupamento[] = [];
export const INITIAL_PRE_PROJETOS: PreProjeto[] = [];
export const INITIAL_JURIDICO_PROJETOS: JuridicoProjeto[] = [];

(() => {
  const byName = (name: string) => INITIAL_PROJECTS.find((p) => p.name === name)!;

  // Clusters A (Automação e Robótica Industrial) e B (Eficiência Energética e
  // Sustentabilidade) ficam deliberadamente SEM agrupamento — são a massa de
  // teste para as sugestões de agrupamento da IA na tela de Iniciativas (ver
  // gerarSugestoesAgrupamento em lib/juridico.ts). Só o cluster C já vem
  // agrupado, para demonstrar as etapas seguintes do fluxo.
  const clusterC = [
    "Plataforma de Inteligência Artificial para Previsão de Demanda",
    "Modelo de Machine Learning para Detecção de Defeitos",
    "Motor de Análise Preditiva de Dados de Sensores",
  ].map((n) => byName(n).id);

  const rfidId = byName("Sistema de Rastreamento RFID para Expedição").id;
  const climaticosId = byName("Unidade de Testes Climáticos Acelerados para Componentes").id;
  const reatorId = byName("Reator Modular de Testes de Corrosão Acelerada").id;
  const protocoloId = byName("Protocolo de Comunicação Industrial Proprietário").id;

  // Agrupamento — aprovado pelo comitê, já virou Projeto em elaboração.
  const agrupamentoC: Agrupamento = {
    id: nextId("agr"),
    name: "Plataformas de Dados e Inteligência Artificial",
    resumo:
      "Agrupamento de 3 iniciativas das Diretorias Tecnologia da Informação, Qualidade e Inovação e Pesquisa & Desenvolvimento, relacionadas por inteligência artificial aplicada a dados industriais.",
    objetivoComum:
      "Consolidar iniciativas de inteligência artificial para previsão, detecção e manutenção preditiva.",
    relacaoAtividades:
      "As iniciativas envolvem treinamento de modelos de machine learning e análise preditiva de dados.",
    justificativa:
      "Agrupadas por tratarem de tecnologias convergentes de inteligência artificial aplicada a dados industriais.",
    iniciativaIds: clusterC,
    aiSuggested: true,
    createdAt: daysAgo(60),
    updatedAt: daysAgo(20),
    history: [
      seedHistory(
        ROLE_USERS.juridico.name,
        "criou o agrupamento a partir de uma sugestão da IA",
        daysAgo(60),
      ),
      seedHistory(
        ROLE_USERS.juridico.name,
        "transformou o agrupamento em pré-projeto",
        daysAgo(55),
      ),
    ],
  };
  const preProjetoC: PreProjeto = {
    id: nextId("prep"),
    agrupamentoId: agrupamentoC.id,
    name: "Pré-projeto — Plataformas de Dados e Inteligência Artificial",
    ano: 2025,
    resumoExecutivo: agrupamentoC.resumo,
    problema:
      "Decisões de previsão, qualidade e manutenção ainda dependem de análise manual de dados.",
    objetivoPrincipal: agrupamentoC.objetivoComum,
    propostaInovacao: agrupamentoC.justificativa,
    atividadesInovacao: agrupamentoC.relacaoAtividades,
    resultadosEsperados: "Maior acurácia preditiva e redução de falhas e rupturas na operação.",
    status: "aprovado",
    createdAt: daysAgo(55),
    updatedAt: daysAgo(20),
    decisoes: [
      {
        id: nextId("dec"),
        decisao: "aprovar",
        data: daysAgo(20),
        responsavel: ROLE_USERS.juridico.name,
        observacoes:
          "Comitê aprovou por unanimidade, considerando o potencial de ganho operacional.",
      },
    ],
    history: [
      seedHistory(
        ROLE_USERS.juridico.name,
        "criou o pré-projeto a partir do agrupamento",
        daysAgo(55),
      ),
      seedHistory(ROLE_USERS.juridico.name, "apresentou o pré-projeto ao comitê", daysAgo(21)),
      seedHistory(ROLE_USERS.juridico.name, "o comitê aprovou o pré-projeto", daysAgo(20)),
    ],
  };
  const projetoC: JuridicoProjeto = {
    id: nextId("pj"),
    preProjetoId: preProjetoC.id,
    agrupamentoId: agrupamentoC.id,
    iniciativaIds: clusterC,
    name: "Projeto — Plataformas de Dados e Inteligência Artificial",
    identificacao: gerarIdentificacaoProjeto(2025, INITIAL_JURIDICO_PROJETOS),
    ano: 2025,
    objetivos: preProjetoC.objetivoPrincipal,
    sections: gerarSecoesProjeto(preProjetoC),
    documents: [],
    status: "em_elaboracao",
    createdAt: daysAgo(20),
    updatedAt: daysAgo(20),
    submissions: [],
    history: [
      seedHistory(
        ROLE_USERS.juridico.name,
        "criou o projeto a partir do pré-projeto aprovado pelo comitê",
        daysAgo(20),
      ),
    ],
  };
  preProjetoC.projetoId = projetoC.id;
  agrupamentoC.preProjetoId = preProjetoC.id;

  INITIAL_AGRUPAMENTOS.push(agrupamentoC);
  INITIAL_PRE_PROJETOS.push(preProjetoC);
  INITIAL_JURIDICO_PROJETOS.push(projetoC);

  // --- Projetos individuais, em diferentes estágios do fluxo com o MCTI ----

  function soloAgrupamentoEPreProjeto(
    nomeBase: string,
    iniciativaId: string,
    ano: number,
    diasAtras: number,
  ): { agrupamento: Agrupamento; preProjeto: PreProjeto } {
    const criadoEm = daysAgo(diasAtras + 10);
    const aprovadoEm = daysAgo(diasAtras + 5);
    const agrupamento: Agrupamento = {
      id: nextId("agr"),
      name: nomeBase,
      resumo: `Agrupamento individual criado manualmente a partir da iniciativa "${nomeBase}".`,
      objetivoComum: "Objetivo detalhado na ficha da iniciativa de origem.",
      relacaoAtividades: "Agrupamento de uma única iniciativa, sem relação com outras nesta etapa.",
      justificativa:
        "Iniciativa com escopo suficientemente consolidado para avaliação individual pelo comitê.",
      iniciativaIds: [iniciativaId],
      aiSuggested: false,
      createdAt: criadoEm,
      updatedAt: aprovadoEm,
      history: [
        seedHistory(ROLE_USERS.juridico.name, "criou o agrupamento manualmente", criadoEm),
        seedHistory(ROLE_USERS.juridico.name, "transformou o agrupamento em pré-projeto", criadoEm),
      ],
    };
    const preProjeto: PreProjeto = {
      id: nextId("prep"),
      agrupamentoId: agrupamento.id,
      name: `Pré-projeto — ${nomeBase}`,
      ano,
      resumoExecutivo: agrupamento.resumo,
      problema: "Detalhado a partir da ficha original encaminhada pela Controladoria.",
      objetivoPrincipal: agrupamento.objetivoComum,
      propostaInovacao: agrupamento.justificativa,
      atividadesInovacao: agrupamento.relacaoAtividades,
      resultadosEsperados: "Detalhados a partir da ficha original encaminhada pela Controladoria.",
      status: "aprovado",
      createdAt: criadoEm,
      updatedAt: aprovadoEm,
      decisoes: [
        {
          id: nextId("dec"),
          decisao: "aprovar",
          data: aprovadoEm,
          responsavel: ROLE_USERS.juridico.name,
        },
      ],
      history: [
        seedHistory(
          ROLE_USERS.juridico.name,
          "criou o pré-projeto a partir do agrupamento",
          criadoEm,
        ),
        seedHistory(ROLE_USERS.juridico.name, "o comitê aprovou o pré-projeto", aprovadoEm),
      ],
    };
    agrupamento.preProjetoId = preProjeto.id;
    INITIAL_AGRUPAMENTOS.push(agrupamento);
    INITIAL_PRE_PROJETOS.push(preProjeto);
    return { agrupamento, preProjeto };
  }

  // Projeto X — finalizado, aguardando submissão ao MCTI.
  {
    const { agrupamento, preProjeto } = soloAgrupamentoEPreProjeto(
      "Protocolo de Comunicação Industrial Proprietário",
      protocoloId,
      2025,
      30,
    );
    const finalizadoEm = daysAgo(18);
    const projeto: JuridicoProjeto = {
      id: nextId("pj"),
      preProjetoId: preProjeto.id,
      agrupamentoId: agrupamento.id,
      iniciativaIds: [protocoloId],
      name: "Projeto — Protocolo de Comunicação Industrial Proprietário",
      identificacao: gerarIdentificacaoProjeto(2025, INITIAL_JURIDICO_PROJETOS),
      ano: 2025,
      objetivos: preProjeto.objetivoPrincipal,
      sections: gerarSecoesProjeto(preProjeto),
      documents: [
        {
          id: nextId("att"),
          name: "memorial-descritivo-protocolo.pdf",
          type: "pdf",
          uploadedAt: finalizadoEm,
          uploadedBy: ROLE_USERS.juridico.name,
          size: 820000,
        },
      ],
      status: "aguardando_submissao",
      createdAt: daysAgo(25),
      updatedAt: finalizadoEm,
      finalizadoEm,
      finalizadoPor: ROLE_USERS.juridico.name,
      submissions: [],
      history: [
        seedHistory(
          ROLE_USERS.juridico.name,
          "criou o projeto a partir do pré-projeto aprovado pelo comitê",
          daysAgo(25),
        ),
        seedHistory(
          ROLE_USERS.juridico.name,
          'anexou o documento "memorial-descritivo-protocolo.pdf"',
          finalizadoEm,
        ),
        seedHistory(ROLE_USERS.juridico.name, "finalizou o projeto", finalizadoEm),
      ],
    };
    preProjeto.projetoId = projeto.id;
    INITIAL_JURIDICO_PROJETOS.push(projeto);
  }

  // Projeto Y — submetido ao MCTI, aguardando devolutiva (sem resultado).
  {
    const { agrupamento, preProjeto } = soloAgrupamentoEPreProjeto(
      "Reator Modular de Testes de Corrosão Acelerada",
      reatorId,
      2026,
      45,
    );
    const finalizadoEm = daysAgo(16);
    const submissionDate = daysAgo(14);
    const projeto: JuridicoProjeto = {
      id: nextId("pj"),
      preProjetoId: preProjeto.id,
      agrupamentoId: agrupamento.id,
      iniciativaIds: [reatorId],
      name: "Projeto — Reator Modular de Testes de Corrosão Acelerada",
      identificacao: gerarIdentificacaoProjeto(2026, INITIAL_JURIDICO_PROJETOS),
      ano: 2026,
      objetivos: preProjeto.objetivoPrincipal,
      sections: gerarSecoesProjeto(preProjeto),
      documents: [],
      status: "submetido_mcti",
      createdAt: daysAgo(40),
      updatedAt: submissionDate,
      finalizadoEm,
      finalizadoPor: ROLE_USERS.juridico.name,
      submissions: [
        { numero: 1, submittedAt: submissionDate, submittedBy: ROLE_USERS.juridico.name },
      ],
      history: [
        seedHistory(
          ROLE_USERS.juridico.name,
          "criou o projeto a partir do pré-projeto aprovado pelo comitê",
          daysAgo(40),
        ),
        seedHistory(ROLE_USERS.juridico.name, "finalizou o projeto", finalizadoEm),
        seedHistory(
          ROLE_USERS.juridico.name,
          "registrou a submissão do projeto ao MCTI",
          submissionDate,
        ),
      ],
    };
    preProjeto.projetoId = projeto.id;
    INITIAL_JURIDICO_PROJETOS.push(projeto);
  }

  // Projeto W — devolutiva negativa já registrada, pronto para reabrir e
  // preparar a segunda (e última) submissão.
  {
    const { agrupamento, preProjeto } = soloAgrupamentoEPreProjeto(
      "Unidade de Testes Climáticos Acelerados para Componentes",
      climaticosId,
      2025,
      70,
    );
    const finalizadoEm = daysAgo(52);
    const submissionDate = daysAgo(50);
    const resultDate = daysAgo(22);
    const devolutivaDocId = nextId("att");
    const projeto: JuridicoProjeto = {
      id: nextId("pj"),
      preProjetoId: preProjeto.id,
      agrupamentoId: agrupamento.id,
      iniciativaIds: [climaticosId],
      name: "Projeto — Unidade de Testes Climáticos Acelerados para Componentes",
      identificacao: gerarIdentificacaoProjeto(2025, INITIAL_JURIDICO_PROJETOS),
      ano: 2025,
      objetivos: preProjeto.objetivoPrincipal,
      sections: gerarSecoesProjeto(preProjeto),
      documents: [
        {
          id: devolutivaDocId,
          name: "devolutiva-mcti-camara-climatica.pdf",
          type: "pdf",
          uploadedAt: resultDate,
          uploadedBy: ROLE_USERS.juridico.name,
          size: 540000,
        },
      ],
      status: "nao_aprovado",
      createdAt: daysAgo(65),
      updatedAt: resultDate,
      finalizadoEm,
      finalizadoPor: ROLE_USERS.juridico.name,
      submissions: [
        {
          numero: 1,
          submittedAt: submissionDate,
          submittedBy: ROLE_USERS.juridico.name,
          resultado: "nao_aprovado",
          resultadoData: resultDate,
          devolutivaDocumentoId: devolutivaDocId,
          devolutivaResumo:
            "O MCTI considerou insuficiente a comprovação do caráter inovador da câmara de testes frente ao estado da técnica apresentado.",
        },
      ],
      history: [
        seedHistory(
          ROLE_USERS.juridico.name,
          "criou o projeto a partir do pré-projeto aprovado pelo comitê",
          daysAgo(65),
        ),
        seedHistory(ROLE_USERS.juridico.name, "finalizou o projeto", finalizadoEm),
        seedHistory(
          ROLE_USERS.juridico.name,
          "registrou a submissão do projeto ao MCTI",
          submissionDate,
        ),
        seedHistory(
          ROLE_USERS.juridico.name,
          "registrou a devolutiva do MCTI: projeto não aprovado",
          resultDate,
        ),
      ],
    };
    preProjeto.projetoId = projeto.id;
    INITIAL_JURIDICO_PROJETOS.push(projeto);
  }

  // Projeto Z — aprovado pelo MCTI no exercício atual, disponibilizando
  // automaticamente os dados financeiros para a Controladoria (ver
  // controladoria-contas-contabeis.tsx).
  {
    const anoAtual = new Date().getFullYear();
    const { agrupamento, preProjeto } = soloAgrupamentoEPreProjeto(
      "Sistema de Rastreamento RFID para Expedição",
      rfidId,
      anoAtual,
      90,
    );
    const finalizadoEm = daysAgo(78);
    const submissionDate = daysAgo(75);
    const resultDate = daysAgo(6);
    const devolutivaDocId = nextId("att");
    const projeto: JuridicoProjeto = {
      id: nextId("pj"),
      preProjetoId: preProjeto.id,
      agrupamentoId: agrupamento.id,
      iniciativaIds: [rfidId],
      name: "Projeto — Sistema de Rastreamento RFID para Expedição",
      identificacao: gerarIdentificacaoProjeto(anoAtual, INITIAL_JURIDICO_PROJETOS),
      ano: anoAtual,
      objetivos: preProjeto.objetivoPrincipal,
      sections: gerarSecoesProjeto(preProjeto),
      documents: [
        {
          id: devolutivaDocId,
          name: "devolutiva-mcti-rfid-expedicao.pdf",
          type: "pdf",
          uploadedAt: resultDate,
          uploadedBy: ROLE_USERS.juridico.name,
          size: 610000,
        },
      ],
      status: "aprovado",
      createdAt: daysAgo(85),
      updatedAt: resultDate,
      finalizadoEm,
      finalizadoPor: ROLE_USERS.juridico.name,
      submissions: [
        {
          numero: 1,
          submittedAt: submissionDate,
          submittedBy: ROLE_USERS.juridico.name,
          resultado: "aprovado",
          resultadoData: resultDate,
          devolutivaDocumentoId: devolutivaDocId,
          devolutivaResumo:
            "O MCTI aprovou integralmente o projeto, reconhecendo o caráter inovador das atividades apresentadas.",
        },
      ],
      history: [
        seedHistory(
          ROLE_USERS.juridico.name,
          "criou o projeto a partir do pré-projeto aprovado pelo comitê",
          daysAgo(85),
        ),
        seedHistory(ROLE_USERS.juridico.name, "finalizou o projeto", finalizadoEm),
        seedHistory(
          ROLE_USERS.juridico.name,
          "registrou a submissão do projeto ao MCTI",
          submissionDate,
        ),
        seedHistory(
          ROLE_USERS.juridico.name,
          "registrou a devolutiva do MCTI: projeto aprovado",
          resultDate,
        ),
      ],
    };
    preProjeto.projetoId = projeto.id;
    INITIAL_JURIDICO_PROJETOS.push(projeto);
  }
})();

// --- Configuração Geral — cadastros básicos ------------------------------

// Semeado a partir das perguntas que já existem no sistema (QUESTIONS_*), só
// para que o cadastro já nasça com o conteúdo atual. Ver comentário em
// types.ts: ainda não integra com a ficha.
export const INITIAL_QUESTIONS: QuestionRecord[] = [
  ...QUESTIONS_INOVADOR.map((q) => ({ ...q, sectionKey: "inovador" as const })),
  ...QUESTIONS_BARREIRAS.map((q) => ({ ...q, sectionKey: "barreiras" as const })),
  ...QUESTIONS_METODOLOGIA.map((q) => ({ ...q, sectionKey: "metodologia" as const })),
];

export const INITIAL_JOB_ROLES: JobRole[] = [
  { id: nextId("cargo"), name: "Pesquisador", eligibleHoursPercent: 100 },
  { id: nextId("cargo"), name: "Industriário", eligibleHoursPercent: 30 },
  { id: nextId("cargo"), name: "Engenheiro", eligibleHoursPercent: 50 },
  { id: nextId("cargo"), name: "Analista", eligibleHoursPercent: 30 },
];
