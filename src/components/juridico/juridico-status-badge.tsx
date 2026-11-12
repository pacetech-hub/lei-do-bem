import { cn } from "@/lib/utils";
import {
  PRE_PROJETO_STATUS_LABEL,
  PROJETO_STATUS_LABEL,
  type PreProjetoStatus,
  type ProjetoStatus,
} from "@/lib/types";

// Mesma linguagem visual do StatusBadge/ControladoriaStatusBadge, reutilizando
// os tokens de cor já existentes no design system.
export const PRE_PROJETO_STATUS_BADGE_CLASS: Record<PreProjetoStatus, string> = {
  aguardando_comite: "bg-status-review text-status-review-fg",
  ajustes_solicitados: "bg-status-adjust text-status-adjust-fg",
  revisao_agrupamento: "bg-status-adjust text-status-adjust-fg",
  aprovado: "bg-status-ready text-status-ready-fg",
};

export function PreProjetoStatusBadge({
  status,
  className,
}: {
  status: PreProjetoStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium",
        PRE_PROJETO_STATUS_BADGE_CLASS[status],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {PRE_PROJETO_STATUS_LABEL[status]}
    </span>
  );
}

export const PROJETO_STATUS_BADGE_CLASS: Record<ProjetoStatus, string> = {
  em_elaboracao: "bg-status-review text-status-review-fg",
  aguardando_submissao: "bg-status-adjust text-status-adjust-fg",
  submetido_mcti: "bg-primary/10 text-primary",
  aprovado: "bg-status-ready text-status-ready-fg",
  nao_aprovado: "bg-destructive/10 text-destructive",
};

export function ProjetoStatusBadge({
  status,
  className,
}: {
  status: ProjetoStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium",
        PROJETO_STATUS_BADGE_CLASS[status],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {PROJETO_STATUS_LABEL[status]}
    </span>
  );
}
