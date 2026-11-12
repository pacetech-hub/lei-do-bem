import { cn } from "@/lib/utils";
import { CONTROLADORIA_STATUS_LABEL, type ControladoriaStatus } from "@/lib/types";

// Mesma linguagem visual do StatusBadge (ver status-badge.tsx), reaproveitando
// os tokens de cor já existentes: "aguardando análise" ~ "em revisão",
// "devolvida" ~ "ajuste solicitado", "enviada ao Jurídico" ~ "pronta/enviada".
export const CONTROLADORIA_STATUS_BADGE_CLASS: Record<ControladoriaStatus, string> = {
  aguardando_analise: "bg-status-review text-status-review-fg",
  devolvida_revisor: "bg-status-adjust text-status-adjust-fg",
  enviada_juridico: "bg-status-ready text-status-ready-fg",
};

export function ControladoriaStatusBadge({
  status,
  className,
}: {
  status: ControladoriaStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium",
        CONTROLADORIA_STATUS_BADGE_CLASS[status],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {CONTROLADORIA_STATUS_LABEL[status]}
    </span>
  );
}
