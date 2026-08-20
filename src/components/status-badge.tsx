import { cn } from "@/lib/utils";
import { STATUS_LABEL, type ProjectStatus } from "@/lib/types";

export const STATUS_BADGE_CLASS: Record<ProjectStatus, string> = {
  rascunho: "bg-status-draft text-status-draft-fg",
  ajustes: "bg-status-adjust text-status-adjust-fg",
  revisao: "bg-status-review text-status-review-fg",
  pronto: "bg-status-ready text-status-ready-fg",
  submetido: "bg-status-submitted text-status-submitted-fg",
  aprovado: "bg-status-approved text-status-approved-fg",
  indeferido: "bg-status-rejected text-status-rejected-fg",
};

export function StatusBadge({ status, className }: { status: ProjectStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium",
        STATUS_BADGE_CLASS[status],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {STATUS_LABEL[status]}
    </span>
  );
}
