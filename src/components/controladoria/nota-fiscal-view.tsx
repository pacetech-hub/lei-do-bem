import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, Download, ListTree } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { NotaFiscalDetalhe } from "@/lib/nota-fiscal";

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (iso: string) => format(new Date(iso), "dd/MM/yyyy", { locale: ptBR });
const fmtDateTime = (iso: string) => format(new Date(iso), "dd/MM/yy HH:mm", { locale: ptBR });

// Caixa de campo no estilo do sistema legado de referência: rótulo pequeno
// acima/ao lado e um retângulo com borda para o valor — propositalmente
// distinto do design system do restante do app, reproduzindo o print
// fornecido como modelo visual (ver escopo do pedido, item 3).
function Field({
  label,
  value,
  className,
  mono,
}: {
  label: string;
  value?: string | number;
  className?: string;
  mono?: boolean;
}) {
  return (
    <div className={className}>
      <div className="text-[10px] font-medium text-[#3a5a6a]">{label}</div>
      <div
        className={`mt-0.5 min-h-[22px] truncate border border-[#9fb5bd] bg-white px-1.5 py-0.5 text-[12px] text-[#1c2b33] ${
          mono ? "font-mono tabular-nums" : ""
        }`}
      >
        {value ?? ""}
      </div>
    </div>
  );
}

function money(n: number, forceShow = false): string {
  if (!forceShow && n === 0) return "";
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function NotaFiscalView({
  nota,
  iniciativaId,
}: {
  nota: NotaFiscalDetalhe;
  iniciativaId: string;
}) {
  return (
    <main className="mx-auto max-w-[1000px] px-6 py-8">
      <Link
        to="/controladoria/iniciativas/$id"
        params={{ id: iniciativaId }}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Iniciativa
      </Link>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            Nota fiscal — {nota.fornecedorNome}
          </h1>
          <p className="text-sm text-muted-foreground">
            Documento simulado, reproduzindo a apresentação do sistema de origem.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() =>
              toast.info("Documento simulado", {
                description:
                  "Representação visual da nota fiscal para fins de protótipo — não há arquivo real para download.",
              })
            }
          >
            <Download className="size-4" /> Baixar PDF
          </Button>
          <Button asChild className="gap-2">
            <Link
              to="/controladoria/iniciativas/$id/notas-fiscais/$despesaId/transacoes"
              params={{ id: iniciativaId, despesaId: nota.despesaId }}
            >
              <ListTree className="size-4" /> Transações contábeis
            </Link>
          </Button>
        </div>
      </div>

      {/* Documento — reproduz o print de referência (sistema legado) */}
      <div className="overflow-hidden rounded-md border border-[#6f8e98] shadow-sm">
        <div className="bg-[#2f4f5c] px-4 py-2 text-center text-sm font-semibold text-white">
          Notas Fiscais de Retorno de Beneficiamento
        </div>
        <div className="border-b border-[#9fb5bd] bg-[#dce7e4] px-4 py-1.5 text-center text-xs font-medium text-[#1c2b33]">
          Consulta Nota Fiscal de Entrada
        </div>

        <div className="space-y-3 bg-[#eef3ea] p-4">
          {/* Identificação */}
          <div className="grid grid-cols-6 gap-2">
            <Field label="Número" value={nota.numero} className="col-span-1" mono />
            <Field label="Série" value={nota.serie} className="col-span-1" mono />
            <Field
              label="Fornecedor"
              value={`${nota.fornecedorCodigo}  ${nota.fornecedorLoja}  ${nota.fornecedorSeq}  ${nota.fornecedorNome}`}
              className="col-span-4"
            />
          </div>
          <div className="grid grid-cols-6 gap-2">
            <Field label="Número" value={nota.numero} className="col-span-1" mono />
            <Field label="Série" value={nota.serie} className="col-span-1" mono />
            <Field
              label="Tipo Nota"
              value={`${nota.tipoNotaCodigo}  ${nota.tipoNotaLabel}`}
              className="col-span-2"
            />
            <Field
              label="Data Entrada"
              value={fmtDate(nota.dataEntrada)}
              className="col-span-2"
              mono
            />
          </div>
          <div className="grid grid-cols-6 gap-2">
            <Field
              label="Data Emissão"
              value={fmtDate(nota.dataEmissao)}
              className="col-span-2"
              mono
            />
            <Field label="G.POI" value={nota.gpoi} className="col-span-1" mono />
            <Field
              label="Tipo Doc."
              value={`${nota.tipoDocCodigo}  ${nota.tipoDocLabel}`}
              className="col-span-3"
            />
          </div>
          <Field label="Chave" value={nota.chave} mono />

          {/* Emitente */}
          <div className="border-t border-[#9fb5bd] pt-3">
            <div className="mb-2 text-xs font-semibold text-[#2f4f5c]">Emitente</div>
            <div className="grid grid-cols-6 gap-2">
              <Field
                label="Fornec."
                value={`${nota.fornecedorCodigo}  ${nota.fornecedorLoja}  ${nota.fornecedorSeq}  ${nota.fornecedorNome}`}
                className="col-span-6"
              />
            </div>
            <div className="mt-2 grid grid-cols-6 gap-2">
              <Field label="Endereço" value={nota.emitenteEndereco} className="col-span-4" />
              <Field label="Cidade" value={nota.emitenteCidade} className="col-span-1" />
              <Field label="UF" value={nota.emitenteUf} className="col-span-1" />
            </div>
            <div className="mt-2 grid grid-cols-6 gap-2">
              <Field label="CNPJ" value={nota.emitenteCnpj} className="col-span-3" mono />
            </div>
          </div>

          {/* Destinatário */}
          <div className="border-t border-[#9fb5bd] pt-3">
            <div className="mb-2 text-xs font-semibold text-[#2f4f5c]">Destinatário</div>
            <div className="grid grid-cols-6 gap-2">
              <Field
                label="Emp."
                value={`${nota.destinatarioEmpCodigo}  ${nota.destinatarioEmpNome}`}
                className="col-span-3"
              />
              <Field
                label="Und. Negócio"
                value={`${nota.destinatarioUndCodigo}  ${nota.destinatarioUndNome}`}
                className="col-span-3"
              />
            </div>
            <div className="mt-2 grid grid-cols-6 gap-2">
              <Field
                label="Filial"
                value={`${nota.destinatarioFilialCodigo}  ${nota.destinatarioFilialNome}`}
                className="col-span-4"
              />
              <Field label="CNPJ" value={nota.destinatarioCnpj} className="col-span-2" mono />
            </div>
          </div>

          {/* Valores */}
          <div className="border-t border-[#9fb5bd] pt-3">
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              <Field label="Valor Produtos" value={money(nota.valorProdutos)} mono />
              <Field label="Valor Frete" value={money(nota.valorFrete)} mono />
              <Field label="Valor Seguro" value={money(nota.valorSeguro)} mono />
              <Field label="Outras Desp." value={money(nota.outrasDesp)} mono />
              <Field label="Base ICMS Sub. Trib." value={money(nota.baseIcmsSubTrib)} mono />
              <Field label="ICMS Sub Trib." value={money(nota.icmsSubTrib)} mono />
              <Field label="Base Cálculo ICMS" value={money(nota.baseCalculoIcms)} mono />
              <Field label="Valor ICMS" value={money(nota.valorIcms)} mono />
              <Field label="ICMS ST MP" value={money(nota.icmsStMp)} mono />
              <Field label="Valor ICMS Dif." value={money(nota.valorIcmsDif, true)} mono />
              <Field label="Base Cálculo PIS" value={money(nota.baseCalculoPis)} mono />
              <Field label="Valor PIS" value={money(nota.valorPis, true)} mono />
              <Field label="Base Calc. COFINS" value={money(nota.baseCalculoCofins)} mono />
              <Field label="Valor COFINS" value={money(nota.valorCofins, true)} mono />
              <Field label="ICMS Frete" value={money(nota.icmsFrete)} mono />
              <Field label="Total IPI" value={money(nota.totalIpi)} mono />
              <Field label="Desconto" value={money(nota.desconto)} mono />
              <Field label="Total Nota" value={money(nota.totalNota, true)} mono />
            </div>
          </div>

          {/* Retenções / DARF */}
          <div className="border-t border-[#9fb5bd] pt-3">
            <div className="grid grid-cols-4 gap-2">
              <Field label="IRRF" value="" mono />
              <Field label="DARF IRRF" value={nota.darfIrrf} mono />
              <Field label="IRRF2" value="" mono />
              <Field label="DARF IRRF2" value="" mono />
              <Field label="PIS" value="" mono />
              <Field label="DARF PIS" value={nota.darfPis} mono />
              <Field label="INSS" value="" mono />
              <Field label="DARF INSS" value="" mono />
              <Field label="CSLL" value="" mono />
              <Field label="DARF CSLL" value={nota.darfCsll} mono />
              <Field label="COFINS" value="" mono />
              <Field label="DARF COFINS" value={nota.darfCofins} mono />
              <Field label="ISSQN" value="" mono />
              <Field label="DARF ISSQN" value={nota.darfIssqn} mono />
              <Field label="CSRF" value="" mono />
              <Field label="DARF CSRF" value={nota.darfCsrf} mono />
            </div>
          </div>

          {/* Rodapé */}
          <div className="border-t border-[#9fb5bd] pt-3">
            <div className="grid grid-cols-3 gap-2">
              <Field label="Usuário" value={nota.usuario} className="col-span-2" />
              <Field label="Integração" value={fmtDateTime(nota.integracaoData)} mono />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
