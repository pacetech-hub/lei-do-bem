import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useProjectsStore } from "@/lib/store";
import { gerarSlides } from "@/lib/apresentacao";
import type { PreProjeto, Project } from "@/lib/types";

export function JuridicoGerarApresentacao({ preProjeto }: { preProjeto: PreProjeto }) {
  const projects = useProjectsStore((s) => s.projects);
  const agrupamentos = useProjectsStore((s) => s.agrupamentos);
  const agrupamento = agrupamentos.find((a) => a.id === preProjeto.agrupamentoId);
  const iniciativaIds = useMemo(() => agrupamento?.iniciativaIds ?? [], [agrupamento]);
  const membros = useMemo(
    () =>
      iniciativaIds.map((id) => projects.find((p) => p.id === id)).filter((p): p is Project => !!p),
    [iniciativaIds, projects],
  );
  const slides = useMemo(
    () => gerarSlides(preProjeto, agrupamento, membros),
    [preProjeto, agrupamento, membros],
  );
  const [gerando, setGerando] = useState(false);

  const handleGerarPptx = async () => {
    setGerando(true);
    try {
      // Import dinâmico — a biblioteca só é necessária quando o usuário pede
      // o arquivo, e nunca deve ser carregada durante SSR.
      const mod = await import("pptxgenjs");
      const PptxGenJS = mod.default ?? mod;
      const pptx = new PptxGenJS();
      slides.forEach((slide) => {
        const s = pptx.addSlide();
        s.addText(slide.title, { x: 0.5, y: 0.4, w: 9, h: 0.8, fontSize: 24, bold: true });
        if (slide.subtitle) {
          s.addText(slide.subtitle, {
            x: 0.5,
            y: 1.1,
            w: 9,
            h: 0.4,
            fontSize: 14,
            color: "666666",
          });
        }
        s.addText(
          slide.bullets.map((b) => ({ text: b, options: { bullet: true, breakLine: true } })),
          { x: 0.5, y: slide.subtitle ? 1.7 : 1.3, w: 9, h: 4.6, fontSize: 14, valign: "top" },
        );
      });
      await pptx.writeFile({ fileName: `${preProjeto.name.slice(0, 60)}.pptx` });
      toast.success("Apresentação gerada.");
    } catch {
      toast.error("Não foi possível gerar o arquivo PPTX.");
    } finally {
      setGerando(false);
    }
  };

  return (
    <main className="mx-auto max-w-[1100px] px-6 py-8">
      <Link
        to="/juridico/pre-projetos/$id"
        params={{ id: preProjeto.id }}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> {preProjeto.name}
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Gerar apresentação</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pré-visualização dos slides gerados a partir dos dados do pré-projeto e das iniciativas
          que o compõem. A estrutura é flexível e reflete apenas as informações disponíveis no
          protótipo — revise o conteúdo abaixo antes de gerar o arquivo.
        </p>
      </div>

      <div className="mb-6 space-y-3">
        {slides.map((slide, i) => (
          <div key={i} className="rounded-lg border border-border bg-surface p-4">
            <div className="mb-1 flex items-center gap-2">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                {i + 1}
              </span>
              <h2 className="text-sm font-semibold text-foreground">{slide.title}</h2>
            </div>
            {slide.subtitle && (
              <p className="mb-2 pl-8 text-xs text-muted-foreground">{slide.subtitle}</p>
            )}
            <ul className="list-disc space-y-1 pl-9 text-sm leading-relaxed text-foreground">
              {slide.bullets.map((b, j) => (
                <li key={j}>{b}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Button className="gap-2" onClick={handleGerarPptx} disabled={gerando}>
          <Download className="size-4" /> {gerando ? "Gerando…" : "Gerar arquivo PPTX"}
        </Button>
      </div>
    </main>
  );
}
