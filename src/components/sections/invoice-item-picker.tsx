import { useState } from "react";
import { ArrowDownUp, Barcode, Check, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useProjectsStore } from "@/lib/store";
import { MOCK_SUPPLIERS } from "@/lib/mock";
import { findInvoicesByCnpj, getItemAvailable } from "@/lib/invoices";
import type { Invoice, InvoiceItem } from "@/lib/types";

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const normalizeCnpj = (v: string) => v.replace(/\D/g, "");
const formatDate = (iso: string) => new Date(iso).toLocaleDateString("pt-BR");

interface InvoiceItemPickerProps {
  onSelect: (invoice: Invoice, item: InvoiceItem) => void;
  onClear: () => void;
}

// Fluxo compartilhado por Serviços de Terceiros e Materiais:
// 1) ler a chave de acesso da nota;
// 2) a partir dela, buscar/identificar a nota pelo CNPJ (reaproveitando notas
//    já lançadas por qualquer projeto, ou registrando uma nova);
// 3) informar/visualizar número e data da nota;
// 4) permitir ordenar as notas já lançadas por data;
// 5) selecionar o item específico da nota, mostrando quanto do valor daquele
//    item ainda está disponível (o que já foi consumido por outros projetos é
//    sempre somado a partir dos próprios lançamentos — nunca guardado aqui).
export function InvoiceItemPicker({ onSelect, onClear }: InvoiceItemPickerProps) {
  const invoices = useProjectsStore((s) => s.invoices);
  const allProjects = useProjectsStore((s) => s.projects);
  const addInvoice = useProjectsStore((s) => s.addInvoice);

  const [accessKey, setAccessKey] = useState("");
  const [keyRead, setKeyRead] = useState(false);

  const [cnpj, setCnpj] = useState("");
  const [searched, setSearched] = useState(false);
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [registering, setRegistering] = useState(false);
  const [selected, setSelected] = useState<{ invoice: Invoice; item: InvoiceItem } | null>(null);

  const [newInvoiceNumber, setNewInvoiceNumber] = useState("");
  const [newIssueDate, setNewIssueDate] = useState("");
  const [newItemDescription, setNewItemDescription] = useState("");
  const [newItemValue, setNewItemValue] = useState("");

  const matches = searched ? findInvoicesByCnpj(invoices, cnpj) : [];
  const sortedMatches = [...matches].sort((a, b) => {
    const diff = new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime();
    return sortDir === "asc" ? diff : -diff;
  });
  const directoryCompany = MOCK_SUPPLIERS.find(
    (s) => normalizeCnpj(s.cnpj) === normalizeCnpj(cnpj),
  );

  const handleReadKey = () => {
    if (accessKey.trim().length < 10) {
      toast.error("Leia ou informe a chave de acesso da NF-e.");
      return;
    }
    setKeyRead(true);
  };

  const handleSearch = () => {
    if (!normalizeCnpj(cnpj)) {
      toast.error("Informe o CNPJ para buscar.");
      return;
    }
    setSearched(true);
    setRegistering(false);
  };

  const pick = (invoice: Invoice, item: InvoiceItem) => {
    setSelected({ invoice, item });
    onSelect(invoice, item);
  };

  const changeSelection = () => {
    setSelected(null);
    setAccessKey("");
    setKeyRead(false);
    setCnpj("");
    setSearched(false);
    onClear();
  };

  const handleRegisterInvoice = () => {
    if (!newInvoiceNumber.trim() || !newIssueDate || !newItemDescription.trim() || !newItemValue) {
      toast.warning("Preencha o número da nota, a data, a descrição e o valor do item.");
      return;
    }
    const item: InvoiceItem = {
      id: crypto.randomUUID(),
      description: newItemDescription.trim(),
      totalValue: Number(newItemValue),
    };
    const invoiceId = addInvoice({
      cnpj,
      companyName: directoryCompany?.name ?? "Empresa não cadastrada",
      invoiceNumber: newInvoiceNumber.trim(),
      accessKey: accessKey.trim(),
      issueDate: new Date(newIssueDate).toISOString(),
      items: [item],
    });
    const invoice: Invoice = {
      id: invoiceId,
      cnpj,
      companyName: directoryCompany?.name ?? "Empresa não cadastrada",
      invoiceNumber: newInvoiceNumber.trim(),
      accessKey: accessKey.trim(),
      issueDate: new Date(newIssueDate).toISOString(),
      items: [item],
      createdAt: new Date().toISOString(),
    };
    toast.success("Nota fiscal registrada.");
    setRegistering(false);
    setNewInvoiceNumber("");
    setNewIssueDate("");
    setNewItemDescription("");
    setNewItemValue("");
    pick(invoice, item);
  };

  if (selected) {
    const available = getItemAvailable(selected.item, allProjects);
    return (
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Check className="size-4 text-primary" /> {selected.invoice.companyName} —{" "}
              {selected.invoice.invoiceNumber}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Emitida em {formatDate(selected.invoice.issueDate)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{selected.item.description}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Valor do item: {brl(selected.item.totalValue)} · Disponível:{" "}
              <span className="font-medium text-foreground">{brl(available)}</span>
            </p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={changeSelection}>
            Trocar
          </Button>
        </div>
      </div>
    );
  }

  if (!keyRead) {
    return (
      <div className="space-y-3 rounded-lg border border-border bg-surface p-4">
        <Label>Leitura da chave de acesso</Label>
        <p className="text-xs text-muted-foreground">
          Leia (ou digite) a chave de acesso da NF-e para iniciar o lançamento.
        </p>
        <div className="flex gap-2">
          <Input
            value={accessKey}
            onChange={(e) => setAccessKey(e.target.value)}
            placeholder="Chave de acesso da NF-e (44 dígitos)"
          />
          <Button type="button" variant="outline" size="icon" onClick={handleReadKey}>
            <Barcode className="size-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center justify-between rounded-md bg-surface-muted/60 px-3 py-2 text-xs text-muted-foreground">
        <span>
          Chave lida: <span className="font-mono">{accessKey}</span>
        </span>
        <button
          type="button"
          onClick={changeSelection}
          className="font-medium text-primary hover:underline"
        >
          Ler outra chave
        </button>
      </div>

      <div className="space-y-2">
        <Label>CNPJ</Label>
        <div className="flex gap-2">
          <Input
            value={cnpj}
            onChange={(e) => {
              setCnpj(e.target.value);
              setSearched(false);
            }}
            placeholder="00.000.000/0000-00"
          />
          <Button type="button" variant="outline" size="icon" onClick={handleSearch}>
            <Search className="size-4" />
          </Button>
        </div>
        {searched && directoryCompany && (
          <p className="text-xs text-muted-foreground">Empresa: {directoryCompany.name}</p>
        )}
      </div>

      {searched && !registering && (
        <div className="space-y-2">
          {sortedMatches.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <Label>Notas já lançadas para este CNPJ</Label>
                <button
                  type="button"
                  onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
                  className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  <ArrowDownUp className="size-3.5" />
                  {sortDir === "desc" ? "Mais recentes primeiro" : "Mais antigas primeiro"}
                </button>
              </div>
              <div className="space-y-2">
                {sortedMatches.map((inv) => (
                  <div key={inv.id} className="rounded-md border border-border bg-background p-3">
                    <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
                      <span>{inv.invoiceNumber}</span>
                      <span>{formatDate(inv.issueDate)}</span>
                    </div>
                    <div className="space-y-1.5">
                      {inv.items.map((item) => {
                        const available = getItemAvailable(item, allProjects);
                        return (
                          <label
                            key={item.id}
                            className="flex cursor-pointer items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-surface-muted"
                          >
                            <span className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="invoice-item"
                                className="size-4 accent-primary"
                                onChange={() => pick(inv, item)}
                              />
                              {item.description}
                            </span>
                            <span
                              className={
                                available > 0
                                  ? "text-xs text-muted-foreground"
                                  : "text-xs text-status-adjust-fg"
                              }
                            >
                              Disponível: {brl(available)}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma nota encontrada para este CNPJ.</p>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setRegistering(true)}
          >
            Registrar nova nota com esta chave
          </Button>
        </div>
      )}

      {registering && (
        <div className="space-y-3 rounded-md border border-dashed border-border p-3">
          <Label>Número e data da nota</Label>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              value={newInvoiceNumber}
              onChange={(e) => setNewInvoiceNumber(e.target.value)}
              placeholder="Número da nota fiscal"
            />
            <Input
              type="date"
              value={newIssueDate}
              onChange={(e) => setNewIssueDate(e.target.value)}
              placeholder="Data da nota"
            />
          </div>
          <Input
            value={newItemDescription}
            onChange={(e) => setNewItemDescription(e.target.value)}
            placeholder="Descrição do item"
          />
          <Input
            type="number"
            step="0.01"
            value={newItemValue}
            onChange={(e) => setNewItemValue(e.target.value)}
            placeholder="Valor do item (R$)"
          />
          <Button type="button" size="sm" className="w-full" onClick={handleRegisterInvoice}>
            Registrar nota
          </Button>
        </div>
      )}
    </div>
  );
}
