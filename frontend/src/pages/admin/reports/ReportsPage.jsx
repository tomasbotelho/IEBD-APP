import { useState } from "react";
import { Download, Printer, RefreshCw, AlertCircle, BarChart2, FileText } from "lucide-react";
import { adminService } from "../../../services/adminService.js";

const REPORT_TYPES = [
  { value: "sales", label: "Vendas", description: "Lista detalhada de todas as vendas por pedido." },
  { value: "revenue", label: "Receita", description: "Receita, custo e lucro agrupados por data." },
  { value: "orders", label: "Pedidos", description: "Resumo de todos os pedidos com estado e método de pagamento." },
  { value: "products", label: "Desempenho de produtos", description: "Unidades vendidas, receita e stock atual por produto." },
  { value: "campaigns", label: "Campanhas", description: "Impacto de cada campanha nas vendas." }
];

const PERIODS = [
  { value: "7d", label: "Últimos 7 dias" },
  { value: "30d", label: "Últimos 30 dias" },
  { value: "12m", label: "Últimos 12 meses" },
  { value: "custom", label: "Intervalo personalizado" }
];

const fmt = (n, type = "currency") => {
  if (type === "currency")
    return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(n || 0);
  return new Intl.NumberFormat("pt-PT").format(n || 0);
};

export const ReportsPage = () => {
  const [reportType, setReportType] = useState("sales");
  const [period, setPeriod] = useState("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setData(null);
    try {
      const params = {
        period: period !== "custom" ? period : "30d",
        from: period === "custom" ? customFrom : undefined,
        to: period === "custom" ? customTo : undefined
      };
      const result = await adminService.getReportData(reportType, params);
      setData(result);
    } catch (err) {
      setError(
        err?.response?.status === 503
          ? "Os relatórios requerem USE_FAKE_DB=false no ficheiro .env do backend."
          : err?.response?.data?.message || "Erro ao gerar relatório."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    adminService.downloadReportCSV(reportType, {
      period: period !== "custom" ? period : undefined,
      from: period === "custom" ? customFrom : undefined,
      to: period === "custom" ? customTo : undefined
    });
  };

  const handlePrint = () => window.print();

  const selectedType = REPORT_TYPES.find((r) => r.value === reportType);

  return (
    <div className="space-y-6">
      {/* Configuration panel */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-semibold text-slate-800">Configurar relatório</h2>
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Report type */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Tipo de relatório</label>
            <div className="grid gap-2">
              {REPORT_TYPES.map((r) => (
                <label key={r.value} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${reportType === r.value ? "border-indigo-300 bg-indigo-50" : "border-slate-200 hover:border-slate-300"}`}>
                  <input
                    type="radio"
                    name="reportType"
                    value={r.value}
                    checked={reportType === r.value}
                    onChange={() => { setReportType(r.value); setData(null); }}
                    className="mt-0.5 h-4 w-4 text-indigo-600"
                  />
                  <div>
                    <div className="text-sm font-medium text-slate-800">{r.label}</div>
                    <div className="text-xs text-slate-500">{r.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Period & actions */}
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Período</label>
              <div className="grid gap-2">
                {PERIODS.map((p) => (
                  <label key={p.value} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${period === p.value ? "border-indigo-300 bg-indigo-50" : "border-slate-200 hover:border-slate-300"}`}>
                    <input
                      type="radio"
                      name="period"
                      value={p.value}
                      checked={period === p.value}
                      onChange={() => setPeriod(p.value)}
                      className="h-4 w-4 text-indigo-600"
                    />
                    <span className="text-sm text-slate-700">{p.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {period === "custom" && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">De</label>
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">Até</label>
                  <input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <BarChart2 className="h-4 w-4" />}
              {loading ? "A gerar…" : "Gerar relatório"}
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* Report results */}
      {data && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden print:shadow-none">
          {/* Report header */}
          <div className="flex items-center justify-between border-b border-slate-200 p-5 print:hidden">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-600" />
              <span className="font-semibold text-slate-800">{selectedType?.label}</span>
              <span className="text-sm text-slate-400">
                — {data.rows?.length ?? 0} {data.rows?.length === 1 ? "linha" : "linhas"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadCSV}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              >
                <Download className="h-3.5 w-3.5" /> CSV
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              >
                <Printer className="h-3.5 w-3.5" /> Imprimir / PDF
              </button>
            </div>
          </div>

          {/* Print header */}
          <div className="hidden p-5 print:block">
            <h1 className="text-xl font-bold">Sports Club — {selectedType?.label}</h1>
            <p className="text-sm text-slate-500">Gerado em {new Date(data.generatedAt).toLocaleString("pt-PT")}</p>
          </div>

          {data.rows?.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-slate-400">
              Sem dados para o período selecionado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    {data.columns?.map((col) => (
                      <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 whitespace-nowrap">
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.rows?.map((row, i) => (
                    <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 print:hover:bg-white">
                      {data.columns?.map((col) => {
                        const val = row[col.key];
                        const isNum = typeof val === "number";
                        const isMoney = isNum && ["revenue", "cost", "profit", "total"].some((k) => col.key.includes(k));
                        return (
                          <td key={col.key} className="px-4 py-2.5 whitespace-nowrap text-slate-700">
                            {isMoney ? fmt(val) : isNum ? fmt(val, "number") : (val ?? "—")}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print\\:block, .print\\:block * { visibility: visible; }
          table, table * { visibility: visible; }
          .rounded-2xl { border-radius: 0; }
          .shadow-sm { box-shadow: none; }
        }
      `}</style>
    </div>
  );
};
