import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Pencil, Trash2, Image, AlertCircle, RefreshCw, Check, X, Upload } from "lucide-react";
import { adminService } from "../../../services/adminService.js";

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400";

const emptyForm = {
  pageSlug: "",
  title: "",
  subtitle: "",
  imageUrl: "",
  active: true,
  sortOrder: 1
};

const BannerModal = ({ banner, pages = [], onSave, onClose }) => {
  const [form, setForm] = useState(banner || emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const set = (k) => (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    let finalVal = val;
    if (k === "sortOrder") {
      finalVal = Math.max(1, Number(val) || 1);
    }
    setForm((f) => ({ ...f, [k]: finalVal }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/png", "image/jpeg"];
    if (!validTypes.includes(file.type)) {
      setError("Apenas ficheiros PNG e JPEG são aceitos.");
      e.target.value = "";
      return;
    }

    // Validate file extension
    const validExts = [".png", ".jpg", ".jpeg"];
    const fileExt = ("." + file.name.split(".").pop()).toLowerCase();
    if (!validExts.includes(fileExt)) {
      setError("Apenas ficheiros PNG e JPEG são aceitos.");
      e.target.value = "";
      return;
    }

    setUploading(true);
    setError("");
    try {
      const uploadedUrl = await adminService.uploadMedia(file);
      setForm((f) => ({ ...f, imageUrl: uploadedUrl }));
    } catch (err) {
      setError(err?.response?.data?.message || "Erro ao carregar ficheiro.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.pageSlug) return setError("Selecione uma página.");
    if (form.sortOrder < 1) return setError("Ordem deve ser no mínimo 1.");
    setSaving(true);
    setError("");
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "Erro ao guardar banner.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">{banner?.id ? "Editar banner" : "Novo banner"}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Página *</label>
            <select value={form.pageSlug} onChange={set("pageSlug")} className={inputCls}>
              <option value="">Selecionar página…</option>
              {pages.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Título</label>
            <input type="text" value={form.title} onChange={set("title")} className={inputCls} placeholder="Título do banner" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Subtítulo</label>
            <input type="text" value={form.subtitle} onChange={set("subtitle")} className={inputCls} placeholder="Texto adicional" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Imagem *</label>
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-6 text-sm font-medium text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 transition-colors disabled:opacity-60"
            >
              {uploading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  A carregar…
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Carregar imagem (PNG, JPG, JPEG)
                </>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,image/png,image/jpeg"
              onChange={handleFileChange}
              className="hidden"
              disabled={uploading}
            />
            {form.imageUrl && (
              <img
                src={form.imageUrl}
                alt="Pré-visualização"
                className="mt-3 h-24 w-full rounded-xl object-cover border border-slate-200"
                onError={(e) => e.target.style.display = "none"}
              />
            )}
          </div>
          <div className="flex items-center gap-6">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Ordem *</label>
              <input type="number" value={form.sortOrder} onChange={set("sortOrder")} className={`${inputCls} w-24`} min="1" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer pt-5">
              <input type="checkbox" checked={form.active} onChange={set("active")} className="h-4 w-4 rounded border-slate-300 text-indigo-600" />
              <span className="text-sm text-slate-700">Ativo</span>
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {saving ? "A guardar…" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const BannersPage = () => {
  const [banners, setBanners] = useState([]);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null); // null | 'new' | banner object
  const [deleting, setDeleting] = useState(null);
  const [filterPage, setFilterPage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [bannersList, pagesList] = await Promise.all([
        adminService.listBanners(),
        adminService.getBannerPages()
      ]);
      setBanners(bannersList);
      setPages(pagesList);
    } catch {
      setError("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (form) => {
    if (form.id) await adminService.updateBanner(form.id, form);
    else await adminService.createBanner(form);
    load();
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await adminService.deleteBanner(id);
      load();
    } catch (err) {
      setError(err?.response?.data?.message || "Erro ao eliminar banner.");
    } finally {
      setDeleting(null);
    }
  };

  const pageOptions = [...new Set(banners.map((b) => b.pageSlug))].sort();
  const filtered = filterPage ? banners.filter((b) => b.pageSlug === filterPage) : banners;

  return (
    <div className="space-y-5">
      {modal && (
        <BannerModal
          banner={modal === "new" ? null : modal}
          pages={pages}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filterPage}
          onChange={(e) => setFilterPage(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400"
        >
          <option value="">Todas as páginas</option>
          {pages.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        <div className="flex-1" />
        <button
          onClick={() => setModal("new")}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> Novo banner
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 text-slate-400">
            <Image className="h-10 w-10 opacity-40" />
            <p>Nenhum banner criado ainda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500">Imagem</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500">Página</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500">Título</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 text-center">Estado</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 text-center">Ordem</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      {b.imageUrl ? (
                        <img src={b.imageUrl} alt={b.title} className="h-12 w-20 rounded-lg object-cover border border-slate-200" onError={(e) => e.target.style.display = "none"} />
                      ) : (
                        <div className="flex h-12 w-20 items-center justify-center rounded-lg bg-slate-100">
                          <Image className="h-5 w-5 text-slate-300" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-mono text-slate-600">{b.pageSlug}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{b.title || "—"}</div>
                      {b.subtitle && <div className="text-xs text-slate-400 line-clamp-1">{b.subtitle}</div>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${b.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {b.active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-500">{b.sortOrder}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setModal(b)} className="rounded-lg p-2 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors" title="Editar">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(b.id)}
                          disabled={deleting === b.id}
                          className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="Eliminar"
                        >
                          {deleting === b.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
