import { valorConsiderado } from "./controladoria";
import type {
  Agrupamento,
  JuridicoHistoryEvent,
  PreProjeto,
  Project,
  ProjetoSection,
} from "./types";
import { PROJETO_SECTION_LABELS } from "./types";

// Iniciativas que já concluíram a análise da Controladoria e chegaram ao
// Jurídico — chegam continuamente, nunca separadas por trimestre/ciclo (ver
// regra importante nº 1/2 do escopo do Jurídico).
export function iniciativasRecebidas(projects: Project[]): Project[] {
  return projects.filter((p) => p.controladoriaStatus === "enviada_juridico");
}

// Valor financeiro de uma iniciativa do ponto de vista do Jurídico: o mesmo
// valor considerado na composição financeira pela Controladoria (exclui
// despesas marcadas como excluídas).
export function iniciativaValor(p: Project): number {
  return valorConsiderado(p);
}

export function agrupamentoIniciativaIds(agrupamentos: Agrupamento[]): Set<string> {
  const ids = new Set<string>();
  agrupamentos.forEach((a) => a.iniciativaIds.forEach((id) => ids.add(id)));
  return ids;
}

// Iniciativas recebidas que ainda não fazem parte de nenhum agrupamento —
// base tanto do indicador quanto das sugestões de agrupamento da IA.
export function iniciativasNaoAgrupadas(
  projects: Project[],
  agrupamentos: Agrupamento[],
): Project[] {
  const agrupadas = agrupamentoIniciativaIds(agrupamentos);
  return iniciativasRecebidas(projects).filter((p) => !agrupadas.has(p.id));
}

export function agrupamentoFor(
  agrupamentos: Agrupamento[],
  iniciativaId: string,
): Agrupamento | undefined {
  return agrupamentos.find((a) => a.iniciativaIds.includes(iniciativaId));
}

export function diretoriasDoAgrupamento(iniciativaIds: string[], projects: Project[]): string[] {
  const areas = new Set<string>();
  iniciativaIds.forEach((id) => {
    const p = projects.find((x) => x.id === id);
    if (p) areas.add(p.area);
  });
  return Array.from(areas);
}

export function valorTotalIniciativas(iniciativaIds: string[], projects: Project[]): number {
  return iniciativaIds.reduce((sum, id) => {
    const p = projects.find((x) => x.id === id);
    return p ? sum + iniciativaValor(p) : sum;
  }, 0);
}

// --- Sugestões de agrupamento pela IA --------------------------------------
// Heurística determinística (não há modelo de IA real neste protótipo): cada
// tema tem um pequeno vocabulário de palavras-chave, buscado no nome e nas
// respostas de objetivo/descrição/atividades da iniciativa. Dois ou mais
// candidatos não agrupados com o mesmo tema viram uma sugestão. Processado em
// ordem, cada iniciativa só entra na primeira sugestão em que se encaixa.
export interface AiSuggestion {
  id: string;
  name: string;
  resumo: string;
  iniciativaIds: string[];
  diretorias: string[];
  valorTotal: number;
}

interface ThemeDef {
  key: string;
  label: string;
  keywords: string[];
}

const THEMES: ThemeDef[] = [
  {
    key: "automacao",
    label: "Automação e Robótica Industrial",
    keywords: ["automação industrial", "robótica", "robô autônomo", "braço robótico"],
  },
  {
    key: "energia",
    label: "Eficiência Energética e Sustentabilidade",
    keywords: [
      "eficiência energética",
      "energia renovável",
      "redução de emissões",
      "sustentabilidade",
    ],
  },
  {
    key: "dados",
    label: "Plataformas de Dados e Inteligência Artificial",
    keywords: [
      "inteligência artificial",
      "machine learning",
      "aprendizado de máquina",
      "análise preditiva de dados",
    ],
  },
];

function textoBusca(p: Project): string {
  return [p.name, p.answers.inov_3, p.answers.inov_9, p.answers.met_2, p.answers.inov_6]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function gerarSugestoesAgrupamento(
  projects: Project[],
  agrupamentos: Agrupamento[],
): AiSuggestion[] {
  const candidatos = iniciativasNaoAgrupadas(projects, agrupamentos);
  const usados = new Set<string>();
  const sugestoes: AiSuggestion[] = [];

  THEMES.forEach((theme) => {
    const membros = candidatos.filter(
      (p) => !usados.has(p.id) && theme.keywords.some((k) => textoBusca(p).includes(k)),
    );
    if (membros.length < 2) return;
    membros.forEach((p) => usados.add(p.id));
    sugestoes.push({
      id: `ia-${theme.key}`,
      name: theme.label,
      resumo: `A IA identificou ${membros.length} iniciativas com objetivos, atividades de inovação e tecnologias relacionadas a ${theme.label.toLowerCase()}.`,
      iniciativaIds: membros.map((p) => p.id),
      diretorias: Array.from(new Set(membros.map((p) => p.area))),
      valorTotal: membros.reduce((sum, p) => sum + iniciativaValor(p), 0),
    });
  });

  return sugestoes;
}

// Consolidação (nome/resumo/objetivo/relação/justificativa) sugerida pela IA
// para um conjunto de iniciativas — usada tanto ao abrir uma sugestão quanto
// quando o usuário pede uma nova consolidação manualmente. Nunca sobrescreve
// o resumo sozinha: a tela de revisão decide se aplica o resultado.
export function gerarConsolidacaoAgrupamento(
  iniciativaIds: string[],
  projects: Project[],
): {
  name: string;
  resumo: string;
  objetivoComum: string;
  relacaoAtividades: string;
  justificativa: string;
} {
  const membros = iniciativaIds
    .map((id) => projects.find((p) => p.id === id))
    .filter((p): p is Project => !!p);
  const nomes = membros.map((p) => p.name);
  const diretorias = Array.from(new Set(membros.map((p) => p.area)));
  const objetivos = membros.map((p) => p.answers.inov_3).filter(Boolean);
  const atividades = membros.map((p) => p.answers.met_2).filter(Boolean);

  return {
    name: nomes.length > 0 ? `Agrupamento — ${nomes[0]} e correlatas` : "Novo agrupamento",
    resumo:
      membros.length > 0
        ? `Agrupamento de ${membros.length} iniciativas das Diretorias ${diretorias.join(", ")}, relacionadas por objetivos e atividades de inovação em comum: ${nomes.join("; ")}.`
        : "Selecione iniciativas para gerar um resumo consolidado.",
    objetivoComum: objetivos[0] ?? "Objetivo comum a ser definido pelo Jurídico.",
    relacaoAtividades:
      atividades.length > 0
        ? `As iniciativas compartilham atividades de inovação relacionadas: ${atividades.slice(0, 3).join(" | ")}`
        : "Relação entre as atividades de inovação a ser definida pelo Jurídico.",
    justificativa:
      membros.length > 0
        ? "As iniciativas foram agrupadas por tratarem de objetivos, tecnologias, produtos ou oportunidades convergentes, permitindo uma avaliação consolidada pelo comitê."
        : "Justificativa a ser definida pelo Jurídico.",
  };
}

// Conteúdo inicial do pré-projeto, a partir do agrupamento consolidado e das
// respostas originais das iniciativas de origem (sempre consultáveis).
export function gerarPreProjetoConteudo(
  agrupamento: Pick<
    Agrupamento,
    "resumo" | "justificativa" | "objetivoComum" | "relacaoAtividades"
  >,
  iniciativaIds: string[],
  projects: Project[],
): {
  resumoExecutivo: string;
  problema: string;
  objetivoPrincipal: string;
  propostaInovacao: string;
  atividadesInovacao: string;
  resultadosEsperados: string;
} {
  const membros = iniciativaIds
    .map((id) => projects.find((p) => p.id === id))
    .filter((p): p is Project => !!p);
  const problemas = membros.map((p) => p.answers.inov_8).filter(Boolean);
  const resultados = membros.map((p) => p.answers.inov_6 || p.answers.inov_10).filter(Boolean);

  return {
    resumoExecutivo: agrupamento.resumo,
    problema: problemas[0] ?? "Problema ou oportunidade a ser detalhado pelo Jurídico.",
    objetivoPrincipal: agrupamento.objetivoComum,
    propostaInovacao: agrupamento.justificativa,
    atividadesInovacao: agrupamento.relacaoAtividades,
    resultadosEsperados: resultados[0] ?? "Resultados esperados a serem detalhados pelo Jurídico.",
  };
}

// Seções iniciais do conteúdo do projeto, geradas a partir do pré-projeto
// aprovado — o Jurídico edita, complementa e pode incluir novas seções.
export function gerarSecoesProjeto(preProjeto: PreProjeto): ProjetoSection[] {
  return [
    { key: "problema", label: PROJETO_SECTION_LABELS.problema, content: preProjeto.problema },
    {
      key: "objetivo",
      label: PROJETO_SECTION_LABELS.objetivo,
      content: preProjeto.objetivoPrincipal,
    },
    {
      key: "proposta",
      label: PROJETO_SECTION_LABELS.proposta,
      content: preProjeto.propostaInovacao,
    },
    {
      key: "atividades",
      label: PROJETO_SECTION_LABELS.atividades,
      content: preProjeto.atividadesInovacao,
    },
    {
      key: "resultados",
      label: PROJETO_SECTION_LABELS.resultados,
      content: preProjeto.resultadosEsperados,
    },
  ];
}

// Código de identificação do projeto — sequencial por ano (ex.: LB-2026-0003).
export function gerarIdentificacaoProjeto(
  ano: number,
  existentes: { identificacao: string }[],
): string {
  const prefix = `LB-${ano}-`;
  const seq = existentes.filter((p) => p.identificacao.startsWith(prefix)).length + 1;
  return `${prefix}${String(seq).padStart(4, "0")}`;
}

export function juridicoHistoryEvent(actor: string, description: string): JuridicoHistoryEvent {
  return { id: crypto.randomUUID(), date: new Date().toISOString(), actor, description };
}
