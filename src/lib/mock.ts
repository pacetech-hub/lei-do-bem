import {
  AREAS,
  ALL_REQUIRED_QUESTIONS,
  QUESTIONS_INOVADOR,
  QUESTIONS_BARREIRAS,
  QUESTIONS_METODOLOGIA,
  ROLE_USERS,
  type Attachment,
  type Invoice,
  type JobRole,
  type Project,
  type QuestionRecord,
} from "./types";

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
