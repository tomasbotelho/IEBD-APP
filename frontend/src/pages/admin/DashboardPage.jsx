import { useState, useEffect, useCallback } from "react";
import {
  TrendingUp, ShoppingCart, Package, Euro, Eye, AlertCircle,
  Users, BarChart2, Award, RefreshCw
} from "lucide-react";
import { adminService } from "../../services/adminService.js";
import { LineChart } from "../../components/admin/charts/LineChart.jsx";
import { BarChart } from "../../components/admin/charts/BarChart.jsx";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fmt = (n) =>
  new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(n || 0);

const fmtNum = (n) =>
  new Intl.NumberFormat("pt-PT").format(n || 0);

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const PeriodSelector = ({ value, onChange }) => (
  <div className="flex rounded-lg border border-slate-200 bg-white p-1 text-xs font-medium">
    {[
      { v: "7d", label: "7 dias" },
      { v: "30d", label: "30 dias" },
      { v: "12m", label: "12 meses" }
    ].map(({ v, label }) => (
      <button
        key={v}
        onClick={() => onChange(v)}
        className={`rounded-md px-3 py-1.5 transition-colors ${
          value === v
            ? "bg-indigo-600 text-white shadow-sm"
            : "text-slate-500 hover:text-slate-800"
        }`}
      >
        {label}
      </button>
    ))}
  </div>
);

const MetricCard = ({ icon: Icon, label, value, sub, color = "indigo", trend }) => {
  const colorMap = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
    slate: "bg-slate-100 text-slate-600"
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className={`rounded-xl p-2.5 ${colorMap[color] || colorMap.indigo}`}>
          <Icon className="h-5 w-5" />
        </div>
        {trend != null && (
          <span className={`text-xs font-medium ${trend >= 0 ? "text-emerald-600" : "text-red-500"}`}>
            {trend >= 0 ? "+" : ""}{trend}%
          </span>
        )}
      </div>
      <div className="mt-4">
        <div className="text-2xl font-bold text-slate-800">{value}</div>
        <div className="mt-1 text-sm font-medium text-slate-500">{label}</div>
        {sub && <div className="mt-0.5 text-xs text-slate-400">{sub}</div>}
      </div>
    </div>
  );
};

const ChartCard = ({ title, children, loading }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <h3 className="mb-4 text-sm font-semibold text-slate-700">{title}</h3>
    {loading ? (
      <div className="flex h-48 items-center justify-center">
        <RefreshCw className="h-5 w-5 animate-spin text-slate-400" />
      </div>
    ) : (
      children
    )}
  </div>
);

const ErrorBanner = ({ message }) => (
  <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
    <AlertCircle className="h-4 w-4 shrink-0" />
    <span>{message}</span>
  </div>
);

// ---------------------------------------------------------------------------
// Main Dashboard
// ---------------------------------------------------------------------------

export const DashboardPage = () => {
  const [period, setPeriod] = useState("30d");
  const [stats, setStats] = useState(null);
  const [bestSellers, setBestSellers] = useState([]);
  const [revenueChart, setRevenueChart] = useState([]);
  const [ordersChart, setOrdersChart] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingCharts, setLoadingCharts] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = useCallback(async (p) => {
    setLoadingStats(true);
    setError("");
    try {
      const data = await adminService.getDashboardStats(p);
      setStats(data);
    } catch (err) {
      setError(
        err?.response?.status === 503
          ? "O dashboard de análise requer USE_FAKE_DB=false no ficheiro .env do backend."
          : "Erro ao carregar estatísticas."
      );
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const fetchCharts = useCallback(async (p) => {
    setLoadingCharts(true);
    try {
      const [sellers, revenue, orders] = await Promise.all([
        adminService.getBestSellers(p),
        adminService.getRevenueChart(p),
        adminService.getOrdersChart(p)
      ]);
      setBestSellers(sellers);
      setRevenueChart(revenue);
      setOrdersChart(orders);
    } catch {
      // Charts non-critical — show empty state
    } finally {
      setLoadingCharts(false);
    }
  }, []);

  useEffect(() => {
    fetchStats(period);
    fetchCharts(period);
  }, [period, fetchStats, fetchCharts]);

  const periodLabel = { "7d": "últimos 7 dias", "30d": "últimos 30 dias", "12m": "últimos 12 meses" }[period];

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Visão geral</h2>
          <p className="text-sm text-slate-500 capitalize">{periodLabel}</p>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      {error && <ErrorBanner message={error} />}

      {/* Key metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={ShoppingCart}
          label="Pedidos pendentes"
          value={loadingStats ? "—" : fmtNum(stats?.pendingOrders)}
          color="amber"
        />
        <MetricCard
          icon={Euro}
          label="Receita hoje"
          value={loadingStats ? "—" : fmt(stats?.todayRevenue)}
          sub="Excluindo cancelados"
          color="emerald"
        />
        <MetricCard
          icon={TrendingUp}
          label="Lucro hoje"
          value={loadingStats ? "—" : fmt(stats?.todayProfit)}
          color="indigo"
        />
        <MetricCard
          icon={BarChart2}
          label={`Pedidos (${period})`}
          value={loadingStats ? "—" : fmtNum(stats?.period?.totalOrders)}
          sub={`Receita: ${fmt(stats?.period?.totalRevenue)}`}
          color="slate"
        />
      </div>

      {/* Period summary strip */}
      {!loadingStats && stats && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-indigo-600 to-indigo-700 p-5 shadow-sm text-white">
            <div className="text-xs font-semibold uppercase tracking-widest text-indigo-200">Receita total</div>
            <div className="mt-2 text-3xl font-bold">{fmt(stats.period.totalRevenue)}</div>
            <div className="mt-1 text-sm text-indigo-200">{periodLabel}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">Lucro total</div>
            <div className="mt-2 text-3xl font-bold text-slate-800">{fmt(stats.period.totalProfit)}</div>
            <div className="mt-1 text-sm text-slate-400">{periodLabel}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">Total de pedidos</div>
            <div className="mt-2 text-3xl font-bold text-slate-800">{fmtNum(stats.period.totalOrders)}</div>
            <div className="mt-1 text-sm text-slate-400">{periodLabel}</div>
          </div>
        </div>
      )}

      {/* Product of the day */}
      {!loadingStats && stats?.productOfDay && (
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600">
              <Award className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold uppercase tracking-widest text-indigo-500">
                Produto do dia
              </div>
              <div className="mt-0.5 font-semibold text-slate-800">{stats.productOfDay.name}</div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-sm font-medium text-slate-600">
                <Eye className="h-4 w-4" />
                {fmtNum(stats.productOfDay.views)} visualizações hoje
              </div>
            </div>
            {stats.productOfDay.image && (
              <img
                src={stats.productOfDay.image}
                alt={stats.productOfDay.name}
                className="h-12 w-12 rounded-xl object-cover"
              />
            )}
          </div>
        </div>
      )}

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Receita e Lucro" loading={loadingCharts}>
          {revenueChart.length > 0 ? (
            <div className="space-y-2">
              <LineChart
                data={revenueChart}
                valueKey="revenue"
                color="#6366f1"
                height={180}
                formatTooltip={(v) => fmt(v)}
              />
              <div className="flex gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2 w-4 rounded bg-indigo-500" /> Receita
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2 w-4 rounded bg-emerald-500" /> Lucro
                </span>
              </div>
              <LineChart
                data={revenueChart}
                valueKey="profit"
                color="#10b981"
                height={120}
                formatTooltip={(v) => fmt(v)}
              />
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center text-sm text-slate-400">
              Sem dados para o período selecionado
            </div>
          )}
        </ChartCard>

        <ChartCard title="Evolução de Pedidos" loading={loadingCharts}>
          <LineChart
            data={ordersChart}
            valueKey="orders"
            color="#f59e0b"
            height={220}
            formatTooltip={(v) => `${v} pedidos`}
          />
        </ChartCard>
      </div>

      {/* Best sellers */}
      <ChartCard title="Produtos mais vendidos" loading={loadingCharts}>
        {bestSellers.length > 0 ? (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Bar chart */}
            <BarChart
              data={bestSellers}
              labelKey="name"
              valueKey="unitsSold"
              color="#6366f1"
              height={240}
              horizontal={true}
              formatTooltip={(v) => `${v} un.`}
            />
            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left">
                    <th className="px-4 py-2.5 text-xs font-semibold text-slate-500">#</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-slate-500">Produto</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 text-right">Un.</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 text-right">Receita</th>
                  </tr>
                </thead>
                <tbody>
                  {bestSellers.map((p, i) => (
                    <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-2.5 text-slate-400">{i + 1}</td>
                      <td className="px-4 py-2.5 font-medium text-slate-700">
                        <div className="flex items-center gap-2">
                          {p.image && (
                            <img src={p.image} alt={p.name} className="h-8 w-8 rounded-lg object-cover" />
                          )}
                          <span className="line-clamp-1">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right text-slate-600">{fmtNum(p.unitsSold)}</td>
                      <td className="px-4 py-2.5 text-right font-medium text-slate-800">{fmt(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex h-48 items-center justify-center text-sm text-slate-400">
            Sem vendas no período selecionado
          </div>
        )}
      </ChartCard>
    </div>
  );
};
