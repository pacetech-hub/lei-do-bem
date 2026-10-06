import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProjectsStore } from "@/lib/store";

export const Route = createFileRoute("/configuracao-geral/cargos")({
  head: () => ({
    meta: [{ title: "Cadastro de cargos — Configuração Geral | Lei do Bem" }],
  }),
  component: CargosPage,
});

function CargosPage() {
  const jobRoles = useProjectsStore((s) => s.jobRoles);
  const addJobRole = useProjectsStore((s) => s.addJobRole);
  const updateJobRole = useProjectsStore((s) => s.updateJobRole);
  const removeJobRole = useProjectsStore((s) => s.removeJobRole);

  const [name, setName] = useState("");
  const [percent, setPercent] = useState("");

  const submit = () => {
    if (!name.trim() || !percent) {
      toast.error("Informe o nome do cargo e o percentual de horas elegíveis.");
      return;
    }
    addJobRole({
      id: crypto.randomUUID(),
      name: name.trim(),
      eligibleHoursPercent: Number(percent),
    });
    setName("");
    setPercent("");
    toast.success("Cargo cadastrado.");
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader current="Cadastro de cargos" role="configuracaoGeral" />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <Link
          to="/configuracao-geral"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Configuração Geral
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Cadastro de cargos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cargos/funções utilizados no sistema, com o percentual de horas elegíveis para inovação de
          cada um (ex.: Pesquisador 100%, Industriário 30%).
        </p>

        <div className="mt-6 rounded-lg border border-border bg-surface p-4">
          <h4 className="mb-3 text-sm font-semibold">Adicionar cargo</h4>
          <div className="grid gap-3 sm:grid-cols-[1fr_200px_auto]">
            <div className="space-y-2">
              <Label>Cargo</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Pesquisador"
              />
            </div>
            <div className="space-y-2">
              <Label>Horas elegíveis (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={percent}
                onChange={(e) => setPercent(e.target.value)}
                placeholder="Ex.: 100"
              />
            </div>
            <div className="flex items-end">
              <Button className="w-full gap-2" onClick={submit}>
                <Plus className="size-4" /> Adicionar
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-lg border border-border bg-surface">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cargo</TableHead>
                <TableHead className="text-right">Horas elegíveis</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobRoles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="h-20 text-center text-sm text-muted-foreground">
                    Nenhum cargo cadastrado.
                  </TableCell>
                </TableRow>
              )}
              {jobRoles.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={r.eligibleHoursPercent}
                        onChange={(e) =>
                          updateJobRole(r.id, { eligibleHoursPercent: Number(e.target.value) })
                        }
                        className="h-8 w-20 text-right"
                      />
                      %
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8"
                      onClick={() => removeJobRole(r.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
}
