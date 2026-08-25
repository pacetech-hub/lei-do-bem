import { useState } from "react";
import { Barcode, Check, Search, X } from "lucide-react";
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

interface InvoiceItemPickerProps {
  onSelect: (invoice: Invoice, item: InvoiceItem) => void;
  onClear: () => void;
}

// Fluxo compartilhado por Serviços de Terceiros e Materiais: buscar a nota
// fiscal por CNPJ (reaproveitando notas já lançadas por qualquer projeto),
// ou registrar uma nova por leitura simulada da chave de acesso, e então
// selecionar um item específico da nota, mostrando quanto do valor daquele
// item ainda está disponível (o que já foi consumido por outros projetos é
// sempre somado a partir dos próprios lançamentos — nunca guardado aqui).
export function InvoiceItemPicker({ onSelect, onClear }: InvoiceItemPickerProps) {
  const invoices = useProjectsStore((s) => s.invoices);
  const allProjects = useProjectsStore((s) => s.projects);
  const addInvoice = useProjectsStore((s) => s.addInvoice);

  const [cnpj, setCnpj] = useState("");
  const [searched, setSearched] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [selected, setSelected] = useState<{ invoice: Invoice; item: InvoiceItem } | null>(null);

  const [newAccessKey, setNewAccessKey] = useState("");
  const [newInvoiceNumber, setNewInvoiceNumber] = useState("");
  const [newItemDescription, setNewItemDescription] = useState("");
  const [newItemValue, setNewItemValue] = useState("");

  const matches = searched ? findInvoicesByCnpj(invoices, cnpj) : [];
  const directoryCompany = MOCK_SUPPLIERS.find(
    (s) => normalizeCnpj(s.cnpj) === normalizeCnpj(cnpj),
  );

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
    onClear();
  };

  const handleRegisterInvoice = () => {
    if (
      !newAccessKey.trim() ||
      !newInvoiceNumber.trim() ||
      !newItemDescription.trim() ||
      !newItemValue
    ) {
      toast.warning("Preencha a chave de acesso, o número da nota, a descrição e o valor do item.");
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
      accessKey: newAccessKey.trim(),
      items: [item],
    });
    const invoice: Invoice = {
      id: invoiceId,
      cnpj,
      companyName: directoryCompany?.name ?? "Empresa não cadastrada",
      invoiceNumber: newInvoiceNumber.trim(),
      accessKey: newAccessKey.trim(),
      items: [item],
      createdAt: new Date().toISOString(),
    };
    toast.success("Nota fiscal registrada.");
    setRegistering(false);
    setNewAccessKey("");
    setNewInvoiceNumber("");
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

  return (
    <div className="space-y-3 rounded-lg border border-border bg-surface p-4">
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
          {matches.length > 0 ? (
            <>
              <Label>Notas já lançadas para este CNPJ</Label>
              <div className="space-y-2">
                {matches.map((inv) => (
                  <div key={inv.id} className="rounded-md border border-border bg-background p-3">
                    <div className="mb-2 text-xs font-medium text-muted-foreground">
                      {inv.invoiceNumber}
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
            <Barcode className="size-4" /> Ler chave da nota
          </Button>
        </div>
      )}

      {registering && (
        <div className="space-y-3 rounded-md border border-dashed border-border p-3">
          <div className="flex items-center justify-between">
            <Label>Leitura da chave de acesso</Label>
            <button
              type="button"
              onClick={() => setRegistering(false)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Cancelar leitura"
            >
              <X className="size-4" />
            </button>
          </div>
          <Input
            value={newAccessKey}
            onChange={(e) => setNewAccessKey(e.target.value)}
            placeholder="Chave de acesso da NF-e (44 dígitos)"
          />
          <Input
            value={newInvoiceNumber}
            onChange={(e) => setNewInvoiceNumber(e.target.value)}
            placeholder="Número da nota fiscal"
          />
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
