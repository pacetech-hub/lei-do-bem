import {
  AREAS,
  ALL_REQUIRED_QUESTIONS,
  type Attachment,
  type MctiParecer,
  type Project,
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
  };
  return { ...base, ...over };
}

const RELATOR_FILIAL = "Matriz — São Paulo/SP";
const RELATOR_SETOR = "Pesquisa & Desenvolvimento";

// 12 projetos compartilhados entre Relator e Responsável Financeiro
// (mesma filial e setor).
export const INITIAL_PROJECTS: Project[] = [
  emptyProject({
    name: "Plataforma de Manutenção Preditiva por IA",
    filial: RELATOR_FILIAL,
    area: RELATOR_SETOR,
    status: "revisao",
    sharedWithArea: true,
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
    status: "pronto",
    updatedAt: daysAgo(10),
    endDate: daysFromNow(15),
  }),
  emptyProject({
    name: "Modelagem Preditiva de Demanda Energética",
    filial: RELATOR_FILIAL,
    area: RELATOR_SETOR,
    status: "submetido",
    updatedAt: daysAgo(25),
    endDate: daysAgo(5),
  }),
  emptyProject({
    name: "Novo Catalisador para Redução de Emissões",
    filial: RELATOR_FILIAL,
    area: RELATOR_SETOR,
    status: "aprovado",
    updatedAt: daysAgo(60),
    endDate: daysAgo(30),
    hasPatent: true,
    patentNumber: "BR102023000123-4",
  }),
  emptyProject({
    name: "Protocolo de Comunicação Industrial Proprietário",
    filial: RELATOR_FILIAL,
    area: RELATOR_SETOR,
    status: "indeferido",
    updatedAt: daysAgo(80),
    endDate: daysAgo(45),
  }),
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
  emptyProject({
    name: "Redução de Consumo Hídrico no Processo Têxtil",
    filial: RELATOR_FILIAL,
    area: RELATOR_SETOR,
    status: "pronto",
    updatedAt: daysAgo(12),
    endDate: daysFromNow(20),
  }),
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
    status: "pronto",
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
        invoiceTotal: 45000,
        usedInProject: 45000,
      },
    ],
    materials: [
      {
        id: nextId("mat"),
        supplier: MOCK_SUPPLIERS[1].name,
        cnpj: MOCK_SUPPLIERS[1].cnpj,
        invoice: "NF-000456",
        grossValue: 12000,
        netValue: 10500,
        materialDescription: "Componentes eletrônicos para protótipo",
        usageDescription: "Montagem do protótipo funcional de validação",
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
  "pronto",
  "submetido",
  "aprovado",
  "indeferido",
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

// --- Ciclo do Jurídico ---------------------------------------------------
// A partir do momento em que o Revisor aprova e encaminha (status "pronto"),
// o projeto passa a ter também um legalStatus, que segue o próprio ciclo do
// Jurídico (aguardando análise > pronto para submissão > submetido > parecer
// do MCTI). Projetos "aprovado"/"indeferido" já representam o desfecho final.
let legalCounter = 0;
INITIAL_PROJECTS.forEach((p) => {
  if (p.status === "aprovado") {
    p.legalStatus = "aprovado";
  } else if (p.status === "indeferido") {
    p.legalStatus = "indeferido";
  } else if (p.status === "submetido") {
    legalCounter++;
    p.legalStatus = legalCounter % 4 === 0 ? "ajustes_mcti" : "submetido";
    if (p.legalStatus === "ajustes_mcti") {
      p.mctiReason = "Complementar informações sobre os testes realizados.";
    }
  } else if (p.status === "pronto") {
    legalCounter++;
    p.legalStatus = legalCounter % 2 === 0 ? "pronto_submissao" : "aguardando_juridico";
  }

  if (p.legalStatus) {
    p.reviewedBy = p.reviewedBy ?? REVISOR_NAMES[legalCounter % REVISOR_NAMES.length];
    p.reviewedAt = p.reviewedAt ?? p.updatedAt;
  }
  if (
    p.legalStatus &&
    p.legalStatus !== "aguardando_juridico" &&
    p.legalStatus !== "pronto_submissao"
  ) {
    p.submissionDate = p.submissionDate ?? p.updatedAt;
    p.submissionDoc = p.submissionDoc ?? "comprovante-submissao-mcti.pdf";
  }
});

// --- Parecer do MCTI (exemplo) -------------------------------------------
const seedParecerId = nextId("parecer");
const seedParecerCandidates = INITIAL_PROJECTS.filter(
  (p) => p.legalStatus === "aprovado" || p.legalStatus === "ajustes_mcti",
).slice(0, 10);

seedParecerCandidates.forEach((p) => {
  p.mctiParecerId = seedParecerId;
  p.mctiResult = p.legalStatus as "aprovado" | "ajustes_mcti";
});

export const INITIAL_PARECERES: MctiParecer[] = [
  {
    id: seedParecerId,
    year: today.getFullYear(),
    quarter: (Math.floor(today.getMonth() / 3) + 1) as 1 | 2 | 3 | 4,
    fileName: "parecer-mcti-trimestre.pdf",
    uploadedAt: daysAgo(15),
    uploadedBy: "Ana Souza",
    results: seedParecerCandidates.map((p) => ({
      projectId: p.id,
      projectName: p.name,
      suggested: p.mctiResult as "aprovado" | "ajustes_mcti",
      reason: p.mctiReason,
      confirmed: true,
    })),
  },
];
