import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Save, AlertCircle, RefreshCw } from "lucide-react";
import { adminService } from "../../../services/adminService.js";

const Field = ({ label, required, error, hint, children }) => (
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
  discountType: "percentage",
  discountValue: "",
  startDate: "",
  endDate: "",
  bannerTitle: "",
  bannerDescription: "",
  description: "",
  active: true
};

const toDateInput = (iso) => {
  if (!iso) return "";
  return new Date(iso).toISOString().slice(0, 10);
};

export const CampaignFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    if (!isEdit) return;
    adminService.getCampaign(id)
      .then((c) => {
        setForm({
          name: c.name || "",
          discountType: c.discountType || "percentage",
          discountValue: c.discount || "",
          startDate: toDateInput(c.startDate),
          endDate: toDateInput(c.endDate),
          bannerTitle: c.bannerTitle || "",
          bannerDescription: c.bannerDescription || "",
          description: c.description || "",
          active: c.active ?? true
        });
      })
      .catch(() => setServerError("Campanha não encontrada."))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const set = (k) => (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: val }));
    setErrors((er) => ({ ...er, [k]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "O nome é obrigatório.";
    if (!form.discountValue || isNaN(Number(form.discountValue)) || Number(form.discountValue) < 0)
      errs.discountValue = "Introduza um valor de desconto válido.";
    if (form.discountType === "percentage" && Number(form.discountValue) > 100)
      errs.discountValue = "A percentagem não pode exceder 100%.";
    if (form.startDate && form.endDate && form.startDate > form.endDate)
      errs.endDate = "A data de fim deve ser posterior à data de início.";
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
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      bannerTitle: form.bannerTitle.trim(),
      bannerDescription: form.bannerDescription.trim(),
      description: form.description.trim(),
      active: form.active
    };

    try {
      if (isEdit) await adminService.updateCampaign(id, payload);
      else await adminService.createCampaign(payload);
      navigate("/admin/campanhas");
    } catch (err) {
      setServerError(err?.response?.data?.message || "Erro ao guardar campanha.");
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
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
        <Link to="/admin/campanhas" className="flex items-center gap-1 hover:text-indigo-600">
          <ArrowLeft className="h-4 w-4" /> Campanhas
        </Link>
        <span>/</span>
        <span className="text-slate-800">{isEdit ? "Editar campanha" : "Nova campanha"}</span>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {serverError && (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" /> {serverError}
          </div>
        )}

        {/* Basic */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-slate-800">Informação da campanha</h2>
          <div className="grid gap-4">
            <Field label="Nome da campanha" required error={errors.name}>
              <input type="text" value={form.name} onChange={set("name")} className={inputCls} placeholder="Ex: Época de Verão 2025" />
            </Field>
            <Field label="Descrição interna">
              <textarea value={form.description} onChange={set("description")} rows={3} className={inputCls} placeholder="Descrição para uso interno…" />
            </Field>
          </div>
        </div>

        {/* Discount */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-slate-800">Desconto</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tipo de desconto" required>
              <div className="flex gap-3">
                {[
                  { v: "percentage", label: "Percentagem (%)" },
                  { v: "fixed", label: "Valor fixo (€)" }
                ].map(({ v, label }) => (
                  <label key={v} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="discountType"
                      value={v}
                      checked={form.discountType === v}
                      onChange={set("discountType")}
                      className="h-4 w-4 text-indigo-600"
                    />
                    <span className="text-sm text-slate-700">{label}</span>
                  </label>
                ))}
              </div>
            </Field>
            <Field
              label={form.discountType === "percentage" ? "Desconto (%)" : "Valor do desconto (€)"}
              required
              error={errors.discountValue}
            >
              <div className="relative">
                <input
                  type="number"
                  value={form.discountValue}
                  onChange={set("discountValue")}
                  className={inputCls}
                  min="0"
                  max={form.discountType === "percentage" ? 100 : undefined}
                  step={form.discountType === "percentage" ? 1 : 0.01}
                  placeholder="0"
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                  {form.discountType === "percentage" ? "%" : "€"}
                </span>
              </div>
            </Field>
          </div>
        </div>

        {/* Dates */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-slate-800">Período de vigência</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Data de início">
              <input type="date" value={form.startDate} onChange={set("startDate")} className={inputCls} />
            </Field>
            <Field label="Data de fim" error={errors.endDate}>
              <input type="date" value={form.endDate} onChange={set("endDate")} className={inputCls} />
            </Field>
          </div>
        </div>

        {/* Banner */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-slate-800">Textos do banner</h2>
          <div className="grid gap-4">
            <Field label="Título do banner">
              <input type="text" value={form.bannerTitle} onChange={set("bannerTitle")} className={inputCls} placeholder="Ex: Grande Saldo de Verão" />
            </Field>
            <Field label="Descrição do banner">
              <textarea value={form.bannerDescription} onChange={set("bannerDescription")} rows={3} className={inputCls} placeholder="Texto que aparece no banner da campanha…" />
            </Field>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <Link to="/admin/campanhas" className="text-sm text-slate-500 hover:text-slate-800">
            ← Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "A guardar…" : isEdit ? "Guardar alterações" : "Criar campanha"}
          </button>
        </div>
      </form>
    </div>
  );
};
