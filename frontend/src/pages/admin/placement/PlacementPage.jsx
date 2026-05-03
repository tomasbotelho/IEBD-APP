import { useState, useEffect, useCallback, useRef } from "react";
import {
  Layers, Star, Tag, Search, X, Plus, Trash2, ChevronUp, ChevronDown,
  ChevronLeft, ChevronRight, RefreshCw, AlertCircle, Save, Check
} from "lucide-react";
import { adminService } from "../../../services/adminService.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fmt = (n) =>
  new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(n || 0);

const PAGE_SIZE = 3;

const usePaged = (items) => {
  const [page, setPage] = useState(0);
  const pages = Math.ceil(items.length / PAGE_SIZE);
  const slice = items.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const reset = useCallback(() => setPage(0), []);
  return { slice, page, pages, setPage, reset };
};

// ---------------------------------------------------------------------------
// Product Picker Modal
// ---------------------------------------------------------------------------

const ProductPicker = ({ title = "Escolher produto", onPick, onClose, exclude = [] }) => {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  const search = useCallback(async (q) => {
    setLoading(true);
    try {
      const data = await adminService.listProducts({ search: q, limit: 40 });
      setProducts(data.products || []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    search("");
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => search(query), 300);
    return () => clearTimeout(t);
  }, [query, search]);

  const excludeSet = new Set(exclude.map(Number));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex w-full max-w-lg flex-col rounded-2xl bg-white shadow-2xl" style={{ maxHeight: "85vh" }}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h3 className="font-semibold text-slate-800">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="border-b border-slate-100 px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pesquisar produto…"
              className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-4 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <RefreshCw className="h-5 w-5 animate-spin text-slate-400" />
            </div>
          ) : products.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">Nenhum produto encontrado.</p>
          ) : (
            <ul className="space-y-1">
              {products.map((p) => {
                const disabled = excludeSet.has(p.id);
                return (
                  <li key={p.id}>
                    <button
                      onClick={() => !disabled && onPick(p)}
                      disabled={disabled}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                        disabled
                          ? "cursor-not-allowed opacity-40"
                          : "hover:bg-indigo-50 hover:text-indigo-700"
                      }`}
                    >
                      {p.image ? (
                        <img src={p.image} alt={p.name} className="h-10 w-10 shrink-0 rounded-lg object-cover border border-slate-200" />
                      ) : (
                        <div className="h-10 w-10 shrink-0 rounded-lg bg-slate-100" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-slate-800">{p.name}</div>
                        <div className="text-xs text-slate-400">{p.categoryName} · {fmt(p.price)}</div>
                      </div>
                      {disabled && <span className="shrink-0 text-xs text-slate-400">Já adicionado</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Section 1 — Hero Carousel (produto_highlight, max 4)
// ---------------------------------------------------------------------------

const HighlightCard = ({ item, index, total, onMoveUp, onMoveDown, onRemove, onUpdate }) => {
  const [title, setTitle] = useState(item.highlightTitle || "");
  const [subtitle, setSubtitle] = useState(item.highlightSubtitle || "");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onUpdate(item.id, { title, subtitle, active: item.active });
    setSaving(false);
    setDirty(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      {/* Thumbnail */}
      <div className="relative shrink-0">
        {item.image ? (
          <img src={item.image} alt={item.name} className="h-20 w-20 rounded-xl object-cover border border-slate-200" />
        ) : (
          <div className="h-20 w-20 rounded-xl bg-slate-100" />
        )}
        <span className="absolute -left-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
          {index + 1}
        </span>
      </div>

      {/* Fields */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="text-xs font-medium text-slate-500 truncate">{item.name} · {fmt(item.price)}</div>
        <input
          value={title}
          onChange={(e) => { setTitle(e.target.value); setDirty(true); }}
          placeholder="Título do slide…"
          className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
        />
        <input
          value={subtitle}
          onChange={(e) => { setSubtitle(e.target.value); setDirty(true); }}
          placeholder="Subtítulo do slide…"
          className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
        />
        {dirty && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? <RefreshCw className="h-3 w-3 animate-spin" /> : saved ? <Check className="h-3 w-3" /> : <Save className="h-3 w-3" />}
            {saving ? "A guardar…" : "Guardar"}
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="flex shrink-0 flex-col items-center gap-1">
        <button
          onClick={() => onMoveUp(index)}
          disabled={index === 0}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-20"
          title="Mover para cima"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
        <button
          onClick={() => onMoveDown(index)}
          disabled={index === total - 1}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-20"
          title="Mover para baixo"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
        <button
          onClick={() => onRemove(item.id)}
          className="mt-1 rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
          title="Remover"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

const HighlightsSection = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [picker, setPicker] = useState(false);
  const [error, setError] = useState("");
  const { slice, page, pages, setPage, reset } = usePaged(items);

  const load = useCallback(async () => {
    try {
      setItems(await adminService.getPlacementHighlights());
    } catch {
      setError("Erro ao carregar carrossel.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (product) => {
    setPicker(false);
    try {
      const updated = await adminService.addPlacementHighlight({
        productId: product.id,
        title: product.name,
        subtitle: ""
      });
      setItems(updated);
      reset();
    } catch (err) {
      setError(err?.response?.data?.message || "Erro ao adicionar.");
    }
  };

  const handleRemove = async (id) => {
    try {
      setItems(await adminService.removePlacementHighlight(id));
    } catch {
      setError("Erro ao remover.");
    }
  };

  const handleUpdate = async (id, payload) => {
    try {
      setItems(await adminService.updatePlacementHighlight(id, payload));
    } catch {
      setError("Erro ao guardar.");
    }
  };

  const handleMove = async (fromIndex, direction) => {
    const next = [...items];
    const toIndex = fromIndex + direction;
    if (toIndex < 0 || toIndex >= next.length) return;
    [next[fromIndex], next[toIndex]] = [next[toIndex], next[fromIndex]];
    setItems(next);
    try {
      await adminService.reorderPlacementHighlights(next.map((i) => i.id));
    } catch {
      setError("Erro ao reordenar.");
    }
  };

  const canAdd = items.length < 4;

  return (
    <SectionShell
      icon={Layers}
      title="Carrossel principal"
      subtitle="Slides em destaque na homepage. Máximo 4 produtos."
      badge={`${items.length}/4`}
      badgeColor={items.length >= 4 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}
      action={
        canAdd && (
          <button
            onClick={() => setPicker(true)}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" /> Adicionar
          </button>
        )
      }
      error={error}
      loading={loading}
      empty={items.length === 0}
      emptyText="Nenhum produto no carrossel. Adicione até 4 produtos."
    >
      {picker && (
        <ProductPicker
          title="Escolher produto para o carrossel"
          exclude={items.map((i) => i.productId)}
          onPick={handleAdd}
          onClose={() => setPicker(false)}
        />
      )}

      <div className="space-y-3">
        {slice.map((item, i) => {
          const realIndex = page * PAGE_SIZE + i;
          return (
            <HighlightCard
              key={item.id}
              item={item}
              index={realIndex}
              total={items.length}
              onMoveUp={(idx) => handleMove(idx, -1)}
              onMoveDown={(idx) => handleMove(idx, 1)}
              onRemove={handleRemove}
              onUpdate={handleUpdate}
            />
          );
        })}
      </div>

      {pages > 1 && (
        <Paginator page={page} pages={pages} onPage={setPage} />
      )}
    </SectionShell>
  );
};

// ---------------------------------------------------------------------------
// Section 2 — Featured products (destaques)
// ---------------------------------------------------------------------------

const FeaturedSection = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [picker, setPicker] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setItems(await adminService.getPlacementFeatured());
    } catch {
      setError("Erro ao carregar produtos em destaque.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (product) => {
    setPicker(false);
    try {
      const updated = await adminService.addPlacementFeatured({ productId: product.id });
      setItems(updated);
    } catch (err) {
      setError(err?.response?.data?.message || "Erro ao adicionar.");
    }
  };

  const handleRemove = async (id) => {
    try {
      setItems(await adminService.removePlacementFeatured(id));
    } catch {
      setError("Erro ao remover.");
    }
  };

  return (
    <SectionShell
      icon={Star}
      title="Produtos em destaque"
      subtitle="Aparecem na secção de destaques da homepage."
      badge={`${items.length} produtos`}
      action={
        <button
          onClick={() => setPicker(true)}
          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" /> Adicionar
        </button>
      }
      error={error}
      loading={loading}
      empty={items.length === 0}
      emptyText="Nenhum produto em destaque."
    >
      {picker && (
        <ProductPicker
          title="Escolher produto para destaque"
          exclude={items.map((i) => i.productId)}
          onPick={handleAdd}
          onClose={() => setPicker(false)}
        />
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            {item.image ? (
              <img src={item.image} alt={item.name} className="h-14 w-14 shrink-0 rounded-xl object-cover border border-slate-200" />
            ) : (
              <div className="h-14 w-14 shrink-0 rounded-xl bg-slate-100" />
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-slate-800">{item.name}</div>
              <div className="text-xs text-slate-400">{fmt(item.price)}</div>
            </div>
            <button
              onClick={() => handleRemove(item.id)}
              className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </SectionShell>
  );
};

// ---------------------------------------------------------------------------
// Section 3 — Campaign products
// ---------------------------------------------------------------------------

const CampaignCard = ({ campaign, onChange }) => {
  const [bannerTitle, setBannerTitle] = useState(campaign.bannerTitle || "");
  const [bannerCopy, setBannerCopy] = useState(campaign.bannerCopy || "");
  const [bannerDirty, setBannerDirty] = useState(false);
  const [bannerSaving, setBannerSaving] = useState(false);
  const [picker, setPicker] = useState(false);
  const [error, setError] = useState("");
  const { slice, page, pages, setPage, reset } = usePaged(campaign.products || []);

  const handleBannerSave = async () => {
    setBannerSaving(true);
    try {
      await adminService.updatePlacementCampaignBanner(campaign.id, { bannerTitle, bannerCopy });
      setBannerDirty(false);
    } catch {
      setError("Erro ao guardar banner.");
    } finally {
      setBannerSaving(false);
    }
  };

  const handleAdd = async (product) => {
    setPicker(false);
    try {
      const updated = await adminService.addPlacementCampaignProduct(campaign.id, { productId: product.id });
      onChange(updated);
      reset();
    } catch (err) {
      setError(err?.response?.data?.message || "Erro ao adicionar.");
    }
  };

  const handleRemove = async (productId) => {
    try {
      await adminService.removePlacementCampaignProduct(campaign.id, productId);
      onChange(null); // trigger reload
    } catch {
      setError("Erro ao remover.");
    }
  };

  const products = campaign.products || [];

  return (
    <>
      {picker && (
        <ProductPicker
          title={`Adicionar produto a "${campaign.name}"`}
          exclude={products.map((p) => p.productId)}
          onPick={handleAdd}
          onClose={() => setPicker(false)}
        />
      )}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Campaign header */}
        <div className="border-b border-slate-100 bg-slate-50 px-5 py-3 flex items-center justify-between gap-3">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Campanha</span>
            <h4 className="text-sm font-bold text-slate-800">{campaign.name}</h4>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{products.length} produto{products.length !== 1 ? "s" : ""}</span>
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
              -{campaign.discount}%
            </span>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
            </div>
          )}

          {/* Banner fields */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Título do banner</label>
              <input
                value={bannerTitle}
                onChange={(e) => { setBannerTitle(e.target.value); setBannerDirty(true); }}
                placeholder="Título principal do banner…"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Subtítulo / Copy</label>
              <input
                value={bannerCopy}
                onChange={(e) => { setBannerCopy(e.target.value); setBannerDirty(true); }}
                placeholder="Texto de apoio ao banner…"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
          {bannerDirty && (
            <button
              onClick={handleBannerSave}
              disabled={bannerSaving}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {bannerSaving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {bannerSaving ? "A guardar…" : "Guardar banner"}
            </button>
          )}

          {/* Products */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Produtos nesta campanha</span>
              <button
                onClick={() => setPicker(true)}
                className="flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
              >
                <Plus className="h-3.5 w-3.5" /> Adicionar produto
              </button>
            </div>

            {products.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-sm text-slate-400">
                Nenhum produto nesta campanha.
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {slice.map((p) => (
                  <div key={p.productId} className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="h-10 w-10 shrink-0 rounded-lg object-cover border border-slate-200" />
                    ) : (
                      <div className="h-10 w-10 shrink-0 rounded-lg bg-slate-200" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-medium text-slate-700">{p.name}</div>
                      <div className="text-xs text-slate-400">{fmt(p.price)}</div>
                    </div>
                    <button
                      onClick={() => handleRemove(p.productId)}
                      className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {pages > 1 && (
              <Paginator page={page} pages={pages} onPage={setPage} />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

const CampaignsSection = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setCampaigns(await adminService.getPlacementCampaigns());
    } catch {
      setError("Erro ao carregar campanhas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleChange = (updated) => {
    if (updated) {
      setCampaigns(updated);
    } else {
      load();
    }
  };

  return (
    <SectionShell
      icon={Tag}
      title="Produtos por campanha"
      subtitle="Gerir produtos em cada campanha ativa e editar o banner."
      error={error}
      loading={loading}
      empty={campaigns.length === 0}
      emptyText="Nenhuma campanha encontrada."
    >
      <div className="space-y-4">
        {campaigns.map((c) => (
          <CampaignCard key={c.id} campaign={c} onChange={handleChange} />
        ))}
      </div>
    </SectionShell>
  );
};

// ---------------------------------------------------------------------------
// Shared: SectionShell + Paginator
// ---------------------------------------------------------------------------

const Paginator = ({ page, pages, onPage }) => (
  <div className="flex items-center justify-between pt-2">
    <span className="text-xs text-slate-400">Página {page + 1} de {pages}</span>
    <div className="flex gap-1">
      <button
        onClick={() => onPage((p) => p - 1)}
        disabled={page === 0}
        className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-30"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        onClick={() => onPage((p) => p + 1)}
        disabled={page >= pages - 1}
        className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-30"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  </div>
);

const SectionShell = ({
  icon: Icon, title, subtitle, badge, badgeColor = "bg-slate-100 text-slate-600",
  action, error, loading, empty, emptyText, children
}) => (
  <div className="rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
    {/* Header */}
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100">
          <Icon className="h-4.5 w-4.5 text-indigo-600 h-4 w-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-800">{title}</h3>
            {badge && (
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badgeColor}`}>
                {badge}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>

    {/* Body */}
    <div className="p-5">
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}
      {loading ? (
        <div className="flex h-24 items-center justify-center">
          <RefreshCw className="h-5 w-5 animate-spin text-slate-400" />
        </div>
      ) : empty ? (
        <p className="py-8 text-center text-sm text-slate-400">{emptyText}</p>
      ) : (
        children
      )}
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Page root
// ---------------------------------------------------------------------------

export const PlacementPage = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-xl font-bold text-slate-800">Gestão de colocação</h2>
      <p className="text-sm text-slate-500">
        Controle quais produtos aparecem no carrossel, em destaque e nas campanhas da homepage.
      </p>
    </div>
    <HighlightsSection />
    <FeaturedSection />
    <CampaignsSection />
  </div>
);
