import { diretoriasDoAgrupamento, iniciativaValor, valorTotalIniciativas } from "@/lib/juridico";
import type { Agrupamento, PreProjeto, Project } from "@/lib/types";

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export interface SlideContent {
  title: string;
  subtitle?: string;
  bullets: string[];
}

// Estrutura de slides a partir dos dados reais do pré-projeto e das
// iniciativas que o compõem — nunca inventa informações que não estejam
// disponíveis no protótipo (ver escopo do Jurídico, item "Gerar
// apresentação"). Usado tanto para a pré-visualização na tela quanto para a
// geração do arquivo .pptx.
export function gerarSlides(
  preProjeto: PreProjeto,
  agrupamento: Agrupamento | undefined,
  membros: Project[],
): SlideContent[] {
  const iniciativaIds = agrupamento?.iniciativaIds ?? [];
  const diretorias = diretoriasDoAgrupamento(iniciativaIds, membros);
  const valorTotal = valorTotalIniciativas(iniciativaIds, membros);

  const slides: SlideContent[] = [
    {
      title: preProjeto.name,
      subtitle: `Ano de referência: ${preProjeto.ano}`,
      bullets: [
        agrupamento ? `Agrupamento de origem: ${agrupamento.name}` : "Agrupamento de origem: —",
        `Diretorias envolvidas: ${diretorias.join(", ") || "—"}`,
        `Iniciativas que compõem o pré-projeto: ${membros.length}`,
      ],
    },
    {
      title: "Problema e oportunidade identificados",
      bullets: [preProjeto.problema, preProjeto.oportunidade],
    },
    {
      title: "Objetivo principal e proposta de inovação",
      bullets: [preProjeto.objetivoPrincipal, preProjeto.propostaInovacao],
    },
    {
      title: "Elementos tecnologicamente inovadores e desafios tecnológicos",
      bullets: [
        `Atividades de inovação envolvidas: ${preProjeto.atividadesInovacao}`,
        `Resultados esperados (avanço pretendido): ${preProjeto.resultadosEsperados}`,
      ],
    },
    {
      title: "Diretorias envolvidas",
      bullets: [...diretorias, `Valor financeiro total consolidado: ${brl(valorTotal)}`],
    },
    {
      title: "Visão geral das iniciativas",
      bullets:
        membros.length > 0
          ? membros.map((p) => `${p.name} — ${p.area}`)
          : ["Nenhuma iniciativa vinculada."],
    },
  ];

  membros.forEach((p) => {
    const resumo = [p.answers.inov_3, p.answers.inov_9].filter(Boolean).join(" ");
    slides.push({
      title: p.name,
      subtitle: `${p.area} · ${brl(iniciativaValor(p))}`,
      bullets: [
        `Objetivo: ${p.answers.inov_3?.trim() || "Não informado."}`,
        `Resumo: ${resumo || "Não informado."}`,
        `Atividades realizadas: ${p.answers.met_2?.trim() || "Não informado."}`,
      ],
    });
  });

  return slides;
}
