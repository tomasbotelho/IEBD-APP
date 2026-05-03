import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Save, AlertCircle, RefreshCw, Star } from "lucide-react";
import { adminService } from "../../../services/adminService.js";

const Field = ({ label, required, error, children, hint }) => (
  <div>
    <label className="mb-1.5 block text-sm font-medium text-slate-700">
      {label}
      {required && <span className="ml-1 text-red-500">*</span>}
    </label>
    {children}
    {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
);

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400";

const EMPTY = {
  name: "",
  description: "",
  price: "",
  costPrice: "",
  stockStore: "",
  stockWarehouse: "",
  imageUrl: "",
  categoryId: "",
  campaignId: "",
  highlight: null
};

export const ProductFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(EMPTY);
  const [highlight, setHighlight] = useState(false);
  const [highlightData, setHighlightData] = useState({ title: "", subtitle: "", active: true, sortOrder: 0 });
  const [categories, setCategories] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    Promise.all([
      adminService.listCategories(),
      adminService.listCampaigns()
    ]).then(([cats, camps]) => {
      setCategories(cats);
      setCampaigns(camps);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    adminService.getProduct(id).then((product) => {
      setForm({
        name: product.name || "",
        description: product.description || "",
        price: product.price || "",
        costPrice: product.costPrice || "",
        stockStore: product.stockStore || "",
        stockWarehouse: product.stockWarehouse || "",
        imageUrl: product.imageUrl || "",
        categoryId: product.categoryId || "",
        campaignId: product.campaignIds?.[0] || ""
      });
      if (product.highlight) {
        setHighlight(true);
        setHighlightData({
          title: product.highlight.title || "",
          subtitle: product.highlight.subtitle || "",
          active: product.highlight.active ?? true,
          sortOrder: product.highlight.sortOrder || 0
        });
      }
    }).catch(() => setServerError("Produto não encontrado.")).finally(() => setLoading(false));
  }, [id, isEdit]);

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "O nome é obrigatório.";
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0)
      errs.price = "Introduza um preço válido.";
    if (!form.categoryId) errs.categoryId = "Escolha uma categoria.";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) return setErrors(errs);

    setSaving(true);
    setServerError("");

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      costPrice: Number(form.costPrice || 0),
      stockStore: Number(form.stockStore || 0),
      stockWarehouse: Number(form.stockWarehouse || 0),
      imageUrl: form.imageUrl.trim(),
      categoryId: Number(form.categoryId),
      campaignId: form.campaignId ? Number(form.campaignId) : null,
      highlight: highlight ? highlightData : null
    };

    try {
      if (isEdit) {
        await adminService.updateProduct(id, payload);
      } else {
        await adminService.createProduct(payload);
      }
      navigate("/admin/produtos");
    } catch (err) {
      setServerError(err?.response?.data?.message || "Erro ao guardar produto.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
        <Link to="/admin/produtos" className="flex items-center gap-1 hover:text-indigo-600">
          <ArrowLeft className="h-4 w-4" /> Produtos
        </Link>
        <span>/</span>
        <span className="text-slate-800">{isEdit ? "Editar produto" : "Novo produto"}</span>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="space-y-5">
          {serverError && (
            <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {serverError}
            </div>
          )}

          {/* Basic info */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-semibold text-slate-800">Informação básica</h2>
            <div className="grid gap-4">
              <Field label="Nome do produto" required error={errors.name}>
                <input type="text" value={form.name} onChange={set("name")} className={inputCls} placeholder="Ex: Sapatilhas de corrida Pro X" />
              </Field>
              <Field label="Descrição">
                <textarea value={form.description} onChange={set("description")} rows={4} className={inputCls} placeholder="Descrição detalhada do produto…" />
              </Field>
              <Field label="URL da imagem" hint="Cole o endereço URL da imagem do produto">
                <input type="url" value={form.imageUrl} onChange={set("imageUrl")} className={inputCls} placeholder="https://…" />
                {form.imageUrl && (
                  <img src={form.imageUrl} alt="Pré-visualização" className="mt-2 h-24 w-24 rounded-xl object-cover border border-slate-200" onError={(e) => e.target.style.display = "none"} />
                )}
              </Field>
            </div>
          </div>

          {/* Pricing & Stock */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-semibold text-slate-800">Preço e stock</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Preço de venda (€)" required error={errors.price}>
                <input type="number" value={form.price} onChange={set("price")} className={inputCls} min="0" step="0.01" placeholder="0.00" />
              </Field>
              <Field label="Preço de custo (€)" hint="Usado para cálculo de lucro">
                <input type="number" value={form.costPrice} onChange={set("costPrice")} className={inputCls} min="0" step="0.01" placeholder="0.00" />
              </Field>
              <Field label="Stock em loja">
                <input type="number" value={form.stockStore} onChange={set("stockStore")} className={inputCls} min="0" step="1" placeholder="0" />
              </Field>
              <Field label="Stock em armazém">
                <input type="number" value={form.stockWarehouse} onChange={set("stockWarehouse")} className={inputCls} min="0" step="1" placeholder="0" />
              </Field>
            </div>
          </div>

          {/* Category & Campaign */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-semibold text-slate-800">Classificação</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Categoria" required error={errors.categoryId}>
                <select value={form.categoryId} onChange={set("categoryId")} className={inputCls}>
                  <option value="">Selecionar categoria…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Campanha associada" hint="Apenas uma campanha por produto">
                <select value={form.campaignId} onChange={set("campaignId")} className={inputCls}>
                  <option value="">Sem campanha</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.discount}%)</option>
                  ))}
                </select>
              </Field>
            </div>
          </div>

          {/* Homepage Highlight */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-semibold text-slate-800">Destaque na homepage</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Este produto aparecerá no carrossel de destaques da página inicial.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHighlight((h) => !h)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  highlight
                    ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                <Star className={`h-4 w-4 ${highlight ? "fill-amber-500 text-amber-500" : ""}`} />
                {highlight ? "Em destaque" : "Ativar destaque"}
              </button>
            </div>

            {highlight && (
              <div className="mt-4 grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-slate-700">Ativo</label>
                    <input
                      type="checkbox"
                      checked={highlightData.active}
                      onChange={(e) => setHighlightData((h) => ({ ...h, active: e.target.checked }))}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                    />
                  </div>
                  <Field label="Ordem (sort)">
                    <input
                      type="number"
                      value={highlightData.sortOrder}
                      onChange={(e) => setHighlightData((h) => ({ ...h, sortOrder: Number(e.target.value) }))}
                      className={inputCls}
                      min="0"
                    />
                  </Field>
                </div>
                <Field label="Título do banner" hint="Aparece em destaque no slide">
                  <input
                    type="text"
                    value={highlightData.title}
                    onChange={(e) => setHighlightData((h) => ({ ...h, title: e.target.value }))}
                    className={inputCls}
                    placeholder="Ex: Nova Coleção Primavera"
                  />
                </Field>
                <Field label="Subtítulo do banner">
                  <input
                    type="text"
                    value={highlightData.subtitle}
                    onChange={(e) => setHighlightData((h) => ({ ...h, subtitle: e.target.value }))}
                    className={inputCls}
                    placeholder="Ex: Descubra o conforto que muda tudo"
                  />
                </Field>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <Link to="/admin/produtos" className="text-sm text-slate-500 hover:text-slate-800">
              ← Cancelar
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "A guardar…" : isEdit ? "Guardar alterações" : "Criar produto"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
