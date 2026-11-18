import type { MaterialExpense, Project, ThirdPartyExpense } from "./types";

// Visualização da nota fiscal de uma despesa (terceiro ou material) —
// reproduz os campos do sistema legado de referência (print anexado ao
// pedido). Funcionário não tem nota fiscal (é hora/salário, não compra).
export interface NotaFiscalDetalhe {
  despesaId: string;
  despesaTipo: "terceiro" | "material";
  numero: string;
  serie: string;
  fornecedorCodigo: string;
  fornecedorLoja: string;
  fornecedorSeq: string;
  fornecedorNome: string;
  tipoNotaCodigo: string;
  tipoNotaLabel: string;
  tipoDocCodigo: string;
  tipoDocLabel: string;
  dataEmissao: string;
  dataEntrada: string;
  gpoi: string;
  chave: string;
  emitenteEndereco: string;
  emitenteCidade: string;
  emitenteUf: string;
  emitenteCnpj: string;
  destinatarioEmpCodigo: string;
  destinatarioEmpNome: string;
  destinatarioUndCodigo: string;
  destinatarioUndNome: string;
  destinatarioFilialCodigo: string;
  destinatarioFilialNome: string;
  destinatarioCnpj: string;
  valorProdutos: number;
  valorFrete: number;
  valorSeguro: number;
  outrasDesp: number;
  icmsFrete: number;
  totalIpi: number;
  desconto: number;
  totalNota: number;
  baseIcmsSubTrib: number;
  icmsSubTrib: number;
  baseCalculoIcms: number;
  valorIcms: number;
  icmsStMp: number;
  valorIcmsDif: number;
  baseCalculoPis: number;
  valorPis: number;
  baseCalculoCofins: number;
  valorCofins: number;
  irrf: number;
  darfIrrf: string;
  inss: number;
  darfPis: string;
  csll: number;
  darfCsll: string;
  cofinsRetido: number;
  darfCofins: string;
  issqn: number;
  darfIssqn: string;
  csrf: number;
  darfCsrf: string;
  usuario: string;
  integracaoData: string;
  situacaoDoc: string;
  transacoes: NotaFiscalTransacao[];
}

export interface NotaFiscalTransacao {
  id: string;
  transacao: string;
  sec: number;
  centro: string;
  dc: "D" | "C";
  contaContabil: string;
  descricaoConta: string;
  historico: string;
  valor: number;
}

// A empresa destinatária é fixa — é a própria empresa que opera o sistema
// (ver print de referência: "CALÇADOS BEIRA RIO S/A").
const DESTINATARIO = {
  empCodigo: "01",
  empNome: "CALÇADOS BEIRA RIO S/A",
  undCodigo: "07",
  undNome: "ADMINISTRAÇÃO CENTRAL",
  filialCodigo: "20",
  filialNome: "CALÇADOS BEIRA RIO S/A - MATRIZ",
  cnpj: "88.379.771/0001-82",
};

// Códigos DARF são fixos por tipo de tributo (não variam por documento).
const DARF = {
  irrf: "6800",
  pis: "5979",
  csll: "5987",
  cofins: "5960",
  issqn: "6090",
  csrf: "5952",
};

function hash(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 97;
  return h;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// Chave de acesso fictícia (44 dígitos), só para preencher visualmente o
// campo — determinística a partir do id da despesa.
function gerarChaveFicticia(seed: number): string {
  let out = "";
  for (let i = 0; i < 44; i++) {
    out += ((seed * (i + 7) + i * 13) % 10).toString();
  }
  return out;
}

function gerarTransacoesGenericas(
  despesa: ThirdPartyExpense | MaterialExpense,
  tipo: "terceiro" | "material",
  totalNota: number,
  seed: number,
  nomeDespesa: string,
  descricaoAtividade: string,
): NotaFiscalTransacao[] {
  const transacaoBase = 11000000 + seed * 137;
  const centro = String(140 + (seed % 20));
  const contaCredito = tipo === "terceiro" ? "200003" : "200010";
  const descricaoCredito = tipo === "terceiro" ? "Fornecedores MI" : "Fornecedores de Materiais";
  const contaDebito = tipo === "terceiro" ? "430502" : "430601";
  const descricaoDebito =
    tipo === "terceiro" ? "Serviços de Terceiros P&D" : "Materiais Aplicados em P&D";

  return [
    {
      id: `${despesa.id}-tr1`,
      transacao: String(transacaoBase),
      sec: 2,
      centro,
      dc: "C",
      contaContabil: contaCredito,
      descricaoConta: descricaoCredito,
      historico: `Valor compra CF ${despesa.invoice} entrada`,
      valor: totalNota,
    },
    {
      id: `${despesa.id}-tr2`,
      transacao: String(transacaoBase + 1),
      sec: 69,
      centro: String(141 + (seed % 10)),
      dc: "D",
      contaContabil: contaDebito,
      descricaoConta: descricaoDebito,
      historico: `Valor referente à nota ${despesa.invoice} — ${nomeDespesa} (${descricaoAtividade})`,
      valor: totalNota,
    },
  ];
}

function montarNotaFiscal(
  project: Project,
  despesa: ThirdPartyExpense | MaterialExpense,
  tipo: "terceiro" | "material",
  fornecedorNome: string,
  cnpj: string,
  totalNota: number,
  nomeDespesa: string,
  descricaoAtividade: string,
): NotaFiscalDetalhe {
  const seed = hash(despesa.id);
  const dataEntrada = project.reviewedAt ?? project.updatedAt;
  const dataEmissao = new Date(+new Date(dataEntrada) - 10 * 86400000).toISOString();

  const isServico = tipo === "terceiro";

  return {
    despesaId: despesa.id,
    despesaTipo: tipo,
    numero: String(1 + (seed % 9999)),
    serie: "1",
    fornecedorCodigo: String(1100000 + seed * 7),
    fornecedorLoja: "1",
    fornecedorSeq: "13",
    fornecedorNome: fornecedorNome.toUpperCase(),
    tipoNotaCodigo: isServico ? "13" : "1",
    tipoNotaLabel: isServico ? "NOTA FISCAL DE SERVIÇO" : "NOTA FISCAL DE ENTRADA",
    tipoDocCodigo: isServico ? "23" : "55",
    tipoDocLabel: isServico ? "NOTA DE SERVIÇO" : "ENTRADA DE MERCADORIA",
    dataEmissao,
    dataEntrada,
    gpoi: "12",
    chave: isServico ? "" : gerarChaveFicticia(seed),
    emitenteEndereco: "PADRE MANUEL PRIMO 780",
    emitenteCidade: "FORTALEZA",
    emitenteUf: "CE",
    emitenteCnpj: cnpj,
    destinatarioEmpCodigo: DESTINATARIO.empCodigo,
    destinatarioEmpNome: DESTINATARIO.empNome,
    destinatarioUndCodigo: DESTINATARIO.undCodigo,
    destinatarioUndNome: DESTINATARIO.undNome,
    destinatarioFilialCodigo: DESTINATARIO.filialCodigo,
    destinatarioFilialNome: DESTINATARIO.filialNome,
    destinatarioCnpj: DESTINATARIO.cnpj,
    valorProdutos: totalNota,
    valorFrete: 0,
    valorSeguro: 0,
    outrasDesp: 0,
    icmsFrete: 0,
    totalIpi: 0,
    desconto: 0,
    totalNota,
    baseIcmsSubTrib: 0,
    icmsSubTrib: 0,
    baseCalculoIcms: totalNota,
    valorIcms: isServico ? 0 : round2(totalNota * 0.18),
    icmsStMp: 0,
    valorIcmsDif: 0,
    baseCalculoPis: totalNota,
    valorPis: isServico ? 0 : round2(totalNota * 0.0165),
    baseCalculoCofins: totalNota,
    valorCofins: isServico ? 0 : round2(totalNota * 0.076),
    irrf: 0,
    darfIrrf: isServico ? DARF.irrf : "",
    inss: 0,
    darfPis: isServico ? DARF.pis : "",
    csll: 0,
    darfCsll: isServico ? DARF.csll : "",
    cofinsRetido: 0,
    darfCofins: isServico ? DARF.cofins : "",
    issqn: 0,
    darfIssqn: "",
    csrf: 0,
    darfCsrf: isServico ? DARF.csrf : "",
    usuario: "LETÍCIA SCHNEIDERS",
    integracaoData: dataEntrada,
    situacaoDoc: "0",
    transacoes: gerarTransacoesGenericas(
      despesa,
      tipo,
      totalNota,
      seed,
      nomeDespesa,
      descricaoAtividade,
    ),
  };
}

// Nota fiscal de referência — reproduz exatamente o print anexado ao pedido
// (fornecedor, valores e as duas transações de exemplo fornecidas), para a
// despesa de teste "Felipe Rane M Feliciano Personal".
function montarNotaFiscalReferencia(despesa: ThirdPartyExpense): NotaFiscalDetalhe {
  return {
    despesaId: despesa.id,
    despesaTipo: "terceiro",
    numero: "1",
    serie: "1",
    fornecedorCodigo: "1107490",
    fornecedorLoja: "1",
    fornecedorSeq: "13",
    fornecedorNome: "FELIPE RANE M FELICIANO PERSONAL",
    tipoNotaCodigo: "13",
    tipoNotaLabel: "NOTA FISCAL DE SERVIÇO",
    tipoDocCodigo: "23",
    tipoDocLabel: "NOTA DE SERVIÇO",
    dataEmissao: "2026-11-06T00:00:00.000Z",
    dataEntrada: "2026-11-16T00:00:00.000Z",
    gpoi: "12",
    chave: "",
    emitenteEndereco: "PADRE MANUEL PRIMO 780",
    emitenteCidade: "FORTALEZA",
    emitenteUf: "CE",
    emitenteCnpj: "22.824.765/0001-89",
    destinatarioEmpCodigo: DESTINATARIO.empCodigo,
    destinatarioEmpNome: DESTINATARIO.empNome,
    destinatarioUndCodigo: DESTINATARIO.undCodigo,
    destinatarioUndNome: DESTINATARIO.undNome,
    destinatarioFilialCodigo: DESTINATARIO.filialCodigo,
    destinatarioFilialNome: DESTINATARIO.filialNome,
    destinatarioCnpj: DESTINATARIO.cnpj,
    valorProdutos: 4000,
    valorFrete: 0,
    valorSeguro: 0,
    outrasDesp: 0,
    icmsFrete: 0,
    totalIpi: 0,
    desconto: 0,
    totalNota: 4000,
    baseIcmsSubTrib: 0,
    icmsSubTrib: 0,
    baseCalculoIcms: 4000,
    valorIcms: 0,
    icmsStMp: 0,
    valorIcmsDif: 0,
    baseCalculoPis: 4000,
    valorPis: 0,
    baseCalculoCofins: 4000,
    valorCofins: 0,
    irrf: 0,
    darfIrrf: "",
    inss: 0,
    darfPis: "5979",
    csll: 0,
    darfCsll: "5987",
    cofinsRetido: 0,
    darfCofins: "5960",
    issqn: 0,
    darfIssqn: "",
    csrf: 0,
    darfCsrf: "5952",
    usuario: "LETÍCIA SCHNEIDERS",
    integracaoData: "2026-11-16T13:54:00.000Z",
    situacaoDoc: "0",
    transacoes: [
      {
        id: `${despesa.id}-tr1`,
        transacao: "11465410",
        sec: 2,
        centro: "146",
        dc: "C",
        contaContabil: "200003",
        descricaoConta: "Fornecedores MI",
        historico: "Valor compra CF livros entrada",
        valor: 4000,
      },
      {
        id: `${despesa.id}-tr2`,
        transacao: "11465487",
        sec: 69,
        centro: "147",
        dc: "D",
        contaContabil: "430502",
        descricaoConta: "Feiras e eventos",
        historico: "Valor referente à nota 1 por Felipe Rani Feliciano",
        valor: 4000,
      },
    ],
  };
}

// Gera a nota fiscal de uma despesa específica (terceiro ou material) de uma
// iniciativa. Funcionário não tem nota fiscal — retorna undefined.
export function gerarNotaFiscal(
  project: Project,
  despesaId: string,
): NotaFiscalDetalhe | undefined {
  const tp = project.thirdParties.find((t) => t.id === despesaId);
  if (tp) {
    if (tp.invoice === "1" && tp.cnpj === "22.824.765/0001-89") {
      return montarNotaFiscalReferencia(tp);
    }
    return montarNotaFiscal(
      project,
      tp,
      "terceiro",
      tp.company,
      tp.cnpj,
      tp.usedInProject,
      tp.company,
      "serviço de terceiro",
    );
  }
  const mat = project.materials.find((m) => m.id === despesaId);
  if (mat) {
    return montarNotaFiscal(
      project,
      mat,
      "material",
      mat.supplier,
      mat.cnpj,
      mat.netValue,
      mat.supplier,
      mat.materialDescription,
    );
  }
  return undefined;
}

// --- Consolidação das Contas contábeis da iniciativa -----------------------
// Nível diferente da visualização de transações de UMA nota fiscal: aqui
// reúne-se, para TODAS as despesas (terceiro/material) da iniciativa, as
// contas contábeis que recebem lançamentos, consolidando valores e
// centro(s) de custo, com rastreabilidade até a nota fiscal/despesa de
// origem de cada lançamento.
export interface ContaContabilOrigem {
  despesaId: string;
  despesaTitulo: string;
  notaNumero: string;
  dc: "D" | "C";
  valor: number;
}

export interface ContaContabilConsolidada {
  contaContabil: string;
  descricaoConta: string;
  centros: string[];
  valorTotal: number;
  origem: ContaContabilOrigem[];
}

export function consolidarContasContabeis(project: Project): ContaContabilConsolidada[] {
  const despesas: (ThirdPartyExpense | MaterialExpense)[] = [
    ...project.thirdParties,
    ...project.materials,
  ];
  const map = new Map<string, ContaContabilConsolidada>();

  despesas.forEach((d) => {
    const nota = gerarNotaFiscal(project, d.id);
    if (!nota) return;
    const titulo = "company" in d ? d.company : d.supplier;
    const notaNumero = `${nota.numero}/${nota.serie}`;

    nota.transacoes.forEach((t) => {
      const entry = map.get(t.contaContabil) ?? {
        contaContabil: t.contaContabil,
        descricaoConta: t.descricaoConta,
        centros: [],
        valorTotal: 0,
        origem: [],
      };
      if (!entry.centros.includes(t.centro)) entry.centros.push(t.centro);
      entry.valorTotal += t.valor;
      entry.origem.push({
        despesaId: d.id,
        despesaTitulo: titulo,
        notaNumero,
        dc: t.dc,
        valor: t.valor,
      });
      map.set(t.contaContabil, entry);
    });
  });

  return Array.from(map.values()).sort((a, b) => a.contaContabil.localeCompare(b.contaContabil));
}
