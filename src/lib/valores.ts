// Dados exatos fornecidos no pedido (ver AJUSTES NO PROTÓTIPO | PERFIL
// CONTROLADORIA, item 6) para as três abas da página Valores. Não recalcular
// nem alterar — "dash" reproduz um traço do original (sem valor lançado),
// "blank" reproduz uma célula vazia (sem dado informado).
export type Celula = number | "dash" | "blank";

export function fmtCelula(c: Celula, opts?: { percent?: boolean }): string {
  if (c === "dash") return "-";
  if (c === "blank") return "";
  if (opts?.percent) return `${c}%`;
  return c.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// --- 6.1 Resumo dos créditos ------------------------------------------------

export interface ResumoCreditoLinha {
  label: string;
  t1: Celula;
  t2: Celula;
  t3: Celula;
  total: Celula;
  destaque?: "total" | "beneficio" | "reducao";
  percentual?: boolean;
}

export const RESUMO_CREDITOS: ResumoCreditoLinha[] = [
  {
    label: "INDUSTRIA - Recursos Humanos",
    t1: 236103.67,
    t2: 275774.15,
    t3: 245192.17,
    total: 757070.0,
  },
  { label: "INDUSTRIA - Materiais", t1: "dash", t2: 973786.06, t3: "dash", total: 973786.06 },
  {
    label: "INDUSTRIA - Serviços de Terceiros",
    t1: 2459940.0,
    t2: 2474837.53,
    t3: 2075798.31,
    total: 7010575.84,
  },
  { label: "INDUSTRIA - Viagens", t1: "dash", t2: "dash", t3: "dash", total: "dash" },
  {
    label: "MODELAGEM - Recursos Humanos",
    t1: 1439929.55,
    t2: 1518187.7,
    t3: 1631080.16,
    total: 4589197.4,
  },
  {
    label: "MODELAGEM - Materiais",
    t1: 2833191.28,
    t2: 2713588.28,
    t3: 4871878.13,
    total: 10418657.69,
  },
  {
    label: "MODELAGEM - Serviços de Terceiros",
    t1: 48167.4,
    t2: 47716.95,
    t3: 47780.7,
    total: 143665.05,
  },
  { label: "MODELAGEM - Viagens", t1: 119810.84, t2: 59766.63, t3: 48226.04, total: 227803.51 },
  { label: "TI - Recursos Humanos", t1: 181644.17, t2: 89751.44, t3: 63756.86, total: 335152.47 },
  { label: "TI - Materiais", t1: "dash", t2: "dash", t3: "dash", total: "dash" },
  {
    label: "TI - Serviços de Terceiros",
    t1: 904506.03,
    t2: 907236.66,
    t3: 1076810.15,
    total: 2888552.84,
  },
  { label: "TI - Viagens", t1: 13887.72, t2: "dash", t3: "dash", total: 13887.72 },
  {
    label: "TOTAL DISPÊNDIOS COM P&D",
    t1: 8237180.66,
    t2: 9060645.41,
    t3: 10060522.52,
    total: 27358348.59,
    destaque: "total",
  },
  {
    label: "% benefício (Incremento de colaboradores)",
    t1: 80,
    t2: 80,
    t3: 80,
    total: 80,
    destaque: "beneficio",
    percentual: true,
  },
  {
    label: "POTENCIAL REDUÇÃO BC DO IRPJ/CSLL",
    t1: 6589744.53,
    t2: 7248516.33,
    t3: 8048418.01,
    total: 21886678.87,
    destaque: "total",
  },
  {
    label: "Redução IRPJ (25%)",
    t1: 1647436.13,
    t2: 1812129.08,
    t3: 2012104.5,
    total: 5471669.72,
    destaque: "reducao",
  },
  {
    label: "Redução CSLL (9%)",
    t1: 593077.01,
    t2: 652366.47,
    t3: 724357.62,
    total: 1969801.1,
    destaque: "reducao",
  },
  {
    label: "POTENCIAL REDUÇÃO IRPJ E CSLL",
    t1: 2240513.14,
    t2: 2464495.55,
    t3: 2736462.12,
    total: 7441470.82,
    destaque: "total",
  },
];

// --- 6.2 Histórico de valores ------------------------------------------------

export interface HistoricoTrimestralLinha {
  periodo: string;
  produto: Celula;
  industrial: Celula;
  ti: Celula;
  total: Celula;
  destaque?: boolean;
}

export const HISTORICO_TRIMESTRAL_2026: HistoricoTrimestralLinha[] = [
  {
    periodo: "1º Trim. / 2026",
    produto: 1207978.95,
    industrial: 733323.88,
    ti: 299210.31,
    total: 2240513.14,
  },
  {
    periodo: "2º Trim. / 2026",
    produto: 1180278.6,
    industrial: 1013036.19,
    ti: 271180.76,
    total: 2464495.55,
  },
  {
    periodo: "3º Trim. / 2026",
    produto: 1794918.49,
    industrial: 631309.41,
    ti: 310234.23,
    total: 2736462.13,
  },
  { periodo: "4º Trim. / 2026", produto: "dash", industrial: "dash", ti: "dash", total: "dash" },
  {
    periodo: "Ac. 2026",
    produto: 4183176.04,
    industrial: 2377669.47,
    ti: 880625.3,
    total: 7441470.81,
    destaque: true,
  },
];

export interface HistoricoAnualLinha {
  ano: string;
  pesquisa: Celula;
  industrial: Celula;
  ti: Celula;
  total: Celula;
}

export const HISTORICO_ANUAL: HistoricoAnualLinha[] = [
  { ano: "2025", pesquisa: 4864595.12, industrial: 1757214.23, ti: 969324.06, total: 7591133.42 },
  { ano: "2024", pesquisa: 2858525.34, industrial: 2154630.08, ti: 1065834.53, total: 6078989.95 },
  { ano: "2023", pesquisa: 2739658.1, industrial: 602714.93, ti: 828832.67, total: 4171205.7 },
  { ano: "2022", pesquisa: 1598510.17, industrial: 433528.77, ti: 456795.37, total: 2488834.31 },
  { ano: "2021", pesquisa: 754774.09, industrial: 139981.57, ti: "blank", total: 894755.66 },
  { ano: "2020", pesquisa: 273127.09, industrial: 261605.8, ti: "blank", total: 534732.89 },
  { ano: "2019", pesquisa: 1052929.14, industrial: 297470.79, ti: "blank", total: 1350399.93 },
  { ano: "2018", pesquisa: 267242.4, industrial: 180743.65, ti: "blank", total: 447986.05 },
  { ano: "2017", pesquisa: 300091.56, industrial: 120049.02, ti: "blank", total: 420140.59 },
  { ano: "2016", pesquisa: 591356.91, industrial: 752130.96, ti: "blank", total: 1343487.87 },
  { ano: "2015", pesquisa: 1048456.29, industrial: 2451496.83, ti: "blank", total: 3499953.12 },
  { ano: "2014", pesquisa: 960859.65, industrial: 2374108.79, ti: "blank", total: 3334968.44 },
  { ano: "2013", pesquisa: 987362.93, industrial: 1270085.43, ti: "blank", total: 2257448.36 },
  { ano: "2012", pesquisa: 921381.19, industrial: 591002.09, ti: "blank", total: 1512383.28 },
  { ano: "2011", pesquisa: 762824.59, industrial: 37390.07, ti: "blank", total: 800214.66 },
  { ano: "2010", pesquisa: 645183.48, industrial: 172007.54, ti: "blank", total: 817191.02 },
  { ano: "2009", pesquisa: 500119.97, industrial: "dash", ti: "blank", total: 500119.97 },
  { ano: "2008", pesquisa: 295056.14, industrial: "dash", ti: "blank", total: 295056.14 },
];

export const HISTORICO_ANUAL_TOTAL: HistoricoAnualLinha = {
  ano: "TOTAL GERAL",
  pesquisa: 10959275.61,
  industrial: 9684316.24,
  ti: 1285628.04,
  total: 21929219.89,
};

// --- 6.3 Lançamento contábil -------------------------------------------------
// O CSV original não foi anexado (o pedido autorizou manter apenas os
// subtotais em texto, ver conversa). Os lançamentos individuais abaixo são
// fictícios, mas somam exatamente os subtotais e o total geral fornecidos.

export interface LancamentoContabilLinha {
  descricao: string;
  conta: string;
  cc: string;
  historico: string;
  debito: number;
  credito: number | null;
  tipo?: "detalhe" | "subtotal" | "total";
}

export const LANCAMENTO_CONTABIL: LancamentoContabilLinha[] = [
  // Salário
  {
    descricao: "Salário",
    conta: "311010",
    cc: "141",
    historico:
      "Folha de pagamento — equipe de P&D alocada em WMS CONNECT LOCAL 67 GESTÃO DE AMOSTRAS E EXPORTAÇÃO INTELIGENTE",
    debito: 420000.0,
    credito: null,
  },
  {
    descricao: "Salário",
    conta: "311010",
    cc: "142",
    historico:
      "Folha de pagamento — equipe de P&D alocada em INTELLIPROCURE BI NA GESTÃO DE COMPRA INTERNA",
    debito: 380500.0,
    credito: null,
  },
  {
    descricao: "Salário",
    conta: "311010",
    cc: "143",
    historico: "Folha de pagamento — equipe de P&D alocada em PUR FILIAL 12",
    debito: 310250.46,
    credito: null,
  },
  {
    descricao: "Salário",
    conta: "311010",
    cc: "144",
    historico: "Folha de pagamento — equipe de P&D alocada em PUR FILIAL 18",
    debito: 389529.0,
    credito: null,
  },
  {
    descricao: "Salário",
    conta: "311010",
    cc: "—",
    historico: "Subtotal — Salário",
    debito: 1500279.46,
    credito: null,
    tipo: "subtotal",
  },
  // FGTS
  {
    descricao: "FGTS",
    conta: "311020",
    cc: "141",
    historico:
      "FGTS sobre folha — WMS CONNECT LOCAL 67 GESTÃO DE AMOSTRAS E EXPORTAÇÃO INTELIGENTE",
    debito: 33600.0,
    credito: null,
  },
  {
    descricao: "FGTS",
    conta: "311020",
    cc: "142",
    historico: "FGTS sobre folha — INTELLIPROCURE BI NA GESTÃO DE COMPRA INTERNA",
    debito: 30440.0,
    credito: null,
  },
  {
    descricao: "FGTS",
    conta: "311020",
    cc: "143",
    historico: "FGTS sobre folha — PUR FILIAL 12",
    debito: 24820.04,
    credito: null,
  },
  {
    descricao: "FGTS",
    conta: "311020",
    cc: "144",
    historico: "FGTS sobre folha — PUR FILIAL 18",
    debito: 22811.39,
    credito: null,
  },
  {
    descricao: "FGTS",
    conta: "311020",
    cc: "—",
    historico: "Subtotal — FGTS",
    debito: 111671.43,
    credito: null,
    tipo: "subtotal",
  },
  // INSS
  {
    descricao: "INSS",
    conta: "311030",
    cc: "141",
    historico: "INSS patronal — WMS CONNECT LOCAL 67 GESTÃO DE AMOSTRAS E EXPORTAÇÃO INTELIGENTE",
    debito: 92400.0,
    credito: null,
  },
  {
    descricao: "INSS",
    conta: "311030",
    cc: "142",
    historico: "INSS patronal — INTELLIPROCURE BI NA GESTÃO DE COMPRA INTERNA",
    debito: 83710.0,
    credito: null,
  },
  {
    descricao: "INSS",
    conta: "311030",
    cc: "143",
    historico: "INSS patronal — PUR FILIAL 12",
    debito: 68255.1,
    credito: null,
  },
  {
    descricao: "INSS",
    conta: "311030",
    cc: "144",
    historico: "INSS patronal — PUR FILIAL 18",
    debito: 83713.2,
    credito: null,
  },
  {
    descricao: "INSS",
    conta: "311030",
    cc: "—",
    historico: "Subtotal — INSS",
    debito: 328078.3,
    credito: null,
    tipo: "subtotal",
  },
  // Total Serviços de Terceiros
  {
    descricao: "TOTAL SERVIÇOS DE TERCEIROS",
    conta: "430501",
    cc: "145",
    historico:
      "EXPORTVISION BI DE INTELIGÊNCIA PARA GESTÃO DE AMOSTRAS — InovaTech Consultoria Ltda",
    debito: 850000.0,
    credito: null,
  },
  {
    descricao: "TOTAL SERVIÇOS DE TERCEIROS",
    conta: "430501",
    cc: "145",
    historico: "AGILIDADE NA CONFERÊNCIA DE CORRUGADOS — LabX Serviços Técnicos",
    debito: 640389.16,
    credito: null,
  },
  {
    descricao: "TOTAL SERVIÇOS DE TERCEIROS",
    conta: "430501",
    cc: "146",
    historico:
      "R.O.B.O. CR – Robótica Operacional para Benefícios e Organização no Compra Rápida — SolucionaAI Software",
    debito: 520000.0,
    credito: null,
  },
  {
    descricao: "TOTAL SERVIÇOS DE TERCEIROS",
    conta: "430501",
    cc: "146",
    historico:
      "IMPLEMENTAÇÃO DE RFID NO PROCESSO DE RECEBIMENTO DE MERCADORIAS — Componentes MicroTec S.A.",
    debito: 480000.0,
    credito: null,
  },
  {
    descricao: "TOTAL SERVIÇOS DE TERCEIROS",
    conta: "430501",
    cc: "147",
    historico:
      "SISTEMA DE CONTROLE DE MANUTENÇÃO PREVENTIVA COM ALERTAS AUTOMATIZADOS — Materiais Alfa Indústria",
    debito: 410000.0,
    credito: null,
  },
  {
    descricao: "TOTAL SERVIÇOS DE TERCEIROS",
    conta: "430501",
    cc: "147",
    historico:
      "AUTOMATIZAÇÃO DA IMPRESSÃO DE ETIQUETA MERCADORIA COM DEFEITO NA TELA WMS3002 — InovaTech Consultoria Ltda",
    debito: 300000.0,
    credito: null,
  },
  {
    descricao: "TOTAL SERVIÇOS DE TERCEIROS",
    conta: "430501",
    cc: "—",
    historico: "Subtotal — Total Serviços de Terceiros",
    debito: 3200389.16,
    credito: null,
    tipo: "subtotal",
  },
  // Gastos com materiais
  {
    descricao: "Gastos com materiais",
    conta: "430601",
    cc: "148",
    historico:
      "OTIMIZAÇÃO DA DISTRIBUIÇÃO DE SEPARAÇÃO NO WMS (ARMAZÉM 100) — Materiais Alfa Indústria",
    debito: 2500000.0,
    credito: null,
  },
  {
    descricao: "Gastos com materiais",
    conta: "430601",
    cc: "148",
    historico: "AUTOMAÇÃO DO PROCESSO DE ENVIO DE PALETES PARA FILIAIS — Componentes MicroTec S.A.",
    debito: 1871878.13,
    credito: null,
  },
  {
    descricao: "Gastos com materiais",
    conta: "430601",
    cc: "149",
    historico: "APLICATIVO PARA CONFERÊNCIA NAS EXPEDIÇÕES — Materiais Alfa Indústria",
    debito: 500000.0,
    credito: null,
  },
  {
    descricao: "Gastos com materiais",
    conta: "430601",
    cc: "—",
    historico: "Subtotal — Gastos com materiais",
    debito: 4871878.13,
    credito: null,
    tipo: "subtotal",
  },
  // Viagens
  {
    descricao: "Viagens",
    conta: "430701",
    cc: "150",
    historico: "AUTOMAÇÃO NA LIBERAÇÃO DE PEDIDOS PARA FATURAMENTO — viagem técnica de implantação",
    debito: 28226.04,
    credito: null,
  },
  {
    descricao: "Viagens",
    conta: "430701",
    cc: "150",
    historico:
      "AUTOMATIZAÇÃO DA GERAÇÃO DE RÓTULOS PARA AMOSTRAS DE EXPORTAÇÃO COM INTEGRAÇÃO DE DADOS E VALIDAÇÃO RFID — viagem técnica",
    debito: 20000.0,
    credito: null,
  },
  {
    descricao: "Viagens",
    conta: "430701",
    cc: "—",
    historico: "Subtotal — Viagens",
    debito: 48226.04,
    credito: null,
    tipo: "subtotal",
  },
  // Total geral
  {
    descricao: "TOTAL GERAL",
    conta: "—",
    cc: "—",
    historico: "Total geral do 3º trimestre de 2026",
    debito: 10060522.52,
    credito: null,
    tipo: "total",
  },
];
