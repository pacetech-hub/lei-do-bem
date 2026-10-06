import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Search } from "lucide-react";
import { toast } from "sonner";

import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProjectsStore } from "@/lib/store";
import { MOCK_EMPLOYEES } from "@/lib/mock";

export const Route = createFileRoute("/configuracao-geral/pesquisadores")({
  head: () => ({
    meta: [{ title: "Cadastro de pesquisadores — Configuração Geral | Lei do Bem" }],
  }),
  component: PesquisadoresPage,
});

function PesquisadoresPage() {
  const researcherCodes = useProjectsStore((s) => s.researcherCodes);
  const setResearcher = useProjectsStore((s) => s.setResearcher);

  const [badge, setBadge] = useState("");
  const [found, setFound] = useState<(typeof MOCK_EMPLOYEES)[number] | null>(null);

  const search = () => {
    const e = MOCK_EMPLOYEES.find((x) => x.code === badge.trim());
    if (!e) {
      toast.error("Colaborador não encontrado", { description: `Nenhum crachá ${badge}.` });
      setFound(null);
      return;
    }
    setFound(e);
  };

  const researchers = MOCK_EMPLOYEES.filter((e) => researcherCodes.includes(e.code));

  return (
    <div className="min-h-screen bg-background">
      <AppHeader current="Cadastro de pesquisadores" role="configuracaoGeral" />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <Link
          to="/configuracao-geral"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Configuração Geral
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Cadastro de pesquisadores</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Busque um funcionário pelo crachá e marque-o como pesquisador.
        </p>

        <div className="mt-6 rounded-lg border border-border bg-surface p-4">
          <h4 className="mb-3 text-sm font-semibold">Buscar funcionário</h4>
          <div className="grid gap-3 sm:grid-cols-[220px_1fr_auto]">
            <div className="space-y-2">
              <Label>Crachá</Label>
              <div className="flex gap-2">
                <Input
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  placeholder="Ex.: 10234"
                />
                <Button variant="outline" size="icon" onClick={search}>
                  <Search className="size-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nome / Função</Label>
              <Input
                value={found ? `${found.name} — ${found.role}` : ""}
                disabled
                placeholder="Busque pelo crachá…"
              />
            </div>
            {found && (
              <div className="flex items-end gap-2">
                <Switch
                  checked={researcherCodes.includes(found.code)}
                  onCheckedChange={(checked) => setResearcher(found.code, checked)}
                />
                <span className="text-sm text-muted-foreground">Pesquisador</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-lg border border-border bg-surface">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Crachá</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Função</TableHead>
                <TableHead className="text-right">Pesquisador</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {researchers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-20 text-center text-sm text-muted-foreground">
                    Nenhum pesquisador cadastrado ainda.
                  </TableCell>
                </TableRow>
              )}
              {researchers.map((e) => (
                <TableRow key={e.code}>
                  <TableCell className="font-mono text-xs">{e.code}</TableCell>
                  <TableCell className="font-medium">{e.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{e.role}</TableCell>
                  <TableCell className="text-right">
                    <Switch
                      checked={researcherCodes.includes(e.code)}
                      onCheckedChange={(checked) => setResearcher(e.code, checked)}
                    />
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
