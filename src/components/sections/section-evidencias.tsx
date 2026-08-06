import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CloudUpload,
  FileText,
  Image as ImageIcon,
  Receipt,
  Presentation,
  Files,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdjustmentItem, Attachment, Project } from "@/lib/types";
import { CURRENT_USER } from "@/lib/types";
import { useProjectsStore } from "@/lib/store";
import { format } from "date-fns";

const CATEGORIES: {
  key: NonNullable<Attachment["category"]>;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: "fotos", label: "Fotos", icon: ImageIcon },
  { key: "nota_fiscal", label: "Nota fiscal", icon: Receipt },
  { key: "relatorio", label: "Relatório", icon: FileText },
  { key: "apresentacao", label: "Apresentação", icon: Presentation },
  { key: "outros", label: "Outros documentos", icon: Files },
];

export function SectionEvidencias({
  project,
  pendingItems,
  readOnly = false,
}: {
  project: Project;
  pendingItems?: AdjustmentItem[];
  readOnly?: boolean;
}) {
  const addAttachment = useProjectsStore((s) => s.addAttachment);
  const removeAttachment = useProjectsStore((s) => s.removeAttachment);
  const [category, setCategory] = useState<NonNullable<Attachment["category"]>>("relatorio");

  const items = project.attachments["_evidencias"] ?? [];
  const byCategory = useMemo(() => {
    const map: Record<string, Attachment[]> = {};
    items.forEach((a) => {
      const key = a.category ?? "outros";
      (map[key] ??= []).push(a);
    });
    return map;
  }, [items]);

  const handleUpload = () => {
    const cat = CATEGORIES.find((c) => c.key === category)!;
    const ext = category === "fotos" ? "jpg" : category === "apresentacao" ? "pptx" : "pdf";
    addAttachment(project.id, "_evidencias", {
      id: crypto.randomUUID(),
      name: `${cat.label.toLowerCase().replace(/\s+/g, "-")}-${Math.floor(Math.random() * 900 + 100)}.${ext}`,
      type: ext,
      category,
      uploadedAt: new Date().toISOString(),
      uploadedBy: CURRENT_USER.name,
      size: Math.floor(Math.random() * 2000 + 200) * 1024,
    });
  };

  return (
    <div className="max-w-4xl">
      <header className="mb-6">
        <h2 className="text-lg font-semibold tracking-tight">Evidências</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Anexe documentos que comprovem as atividades de inovação: fotos, notas fiscais,
          relatórios, apresentações e outros.
        </p>
      </header>

      {pendingItems && pendingItems.length > 0 && (
        <div className="mb-6 flex items-start gap-2 rounded-lg border border-status-adjust-fg/40 bg-status-adjust/5 p-4 text-sm text-status-adjust-fg">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <div className="space-y-1">
            {pendingItems.map((item) => (
              <p key={item.id}>Ajuste solicitado: {item.comment}</p>
            ))}
          </div>
        </div>
      )}

      {!readOnly && (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-border bg-surface p-5">
          <div className="grid size-10 place-items-center rounded-md bg-primary/10 text-primary">
            <CloudUpload className="size-5" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium">Anexar nova evidência</div>
            <div className="text-xs text-muted-foreground">
              Arquivos até 20MB. PDF, imagens, planilhas e apresentações.
            </div>
          </div>
          <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.key} value={c.key}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleUpload} className="gap-2">
            <CloudUpload className="size-4" /> Anexar
          </Button>
        </div>
      )}

      <div className="space-y-6">
        {CATEGORIES.map((c) => {
          const list = byCategory[c.key] ?? [];
          const Icon = c.icon;
          return (
            <section key={c.key} className="rounded-lg border border-border bg-surface">
              <header className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="flex items-center gap-2">
                  <Icon className="size-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">{c.label}</h3>
                  <span className="text-xs text-muted-foreground">({list.length})</span>
                </div>
              </header>
              {list.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                  Nenhum arquivo nesta categoria.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Data de envio</TableHead>
                      <TableHead>Enviado por</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {list.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.name}</TableCell>
                        <TableCell className="uppercase text-xs text-muted-foreground">
                          {a.type}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(a.uploadedAt), "dd/MM/yyyy HH:mm")}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {a.uploadedBy}
                        </TableCell>
                        <TableCell>
                          {!readOnly && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-8 text-muted-foreground hover:text-primary"
                              onClick={() => removeAttachment(project.id, "_evidencias", a.id)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
