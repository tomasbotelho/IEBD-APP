import {
  AlertCircle, Bold, ChevronRight, FileText, Image, Italic,
  Loader2, Plus, Save, Search, Trash2, Underline, Upload, X
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { adminService } from "../../../services/adminService.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const SECTION_LABELS = {
  nav: "Navegação", hero: "Página inicial — Hero", homepage: "Página inicial",
  services: "Serviços", catalog: "Catálogo", category: "Categorias",
  search: "Pesquisa", promotions: "Promoções", cart: "Carrinho",
  checkout: "Checkout", payment: "Pagamento", auth: "Autenticação",
  account: "Conta do cliente", orders: "Encomendas (lista)",
  order_detail: "Detalhe de encomenda", errors: "Páginas de erro",
  product: "Página de produto", category_strip: "Strip de categorias",
  seo: "SEO global",
};
const sectionLabel = (key) => SECTION_LABELS[key] || key;

const LANG_META = {
  pt: { flag: "🇵🇹", label: "Português" },
  en: { flag: "🇬🇧", label: "English" },
};

const IMG_SUFFIX = "__img";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const formatKey = (key) =>
  key.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

const groupBlocks = (texts) => {
  const imgKeys = new Set(
    texts.filter((t) => t.contentKey.endsWith(IMG_SUFFIX)).map((t) => t.contentKey)
  );
  const baseTexts = texts.filter((t) => !t.contentKey.endsWith(IMG_SUFFIX));
  const map = new Map();
  for (const t of baseTexts) {
    if (!map.has(t.contentKey)) map.set(t.contentKey, { contentKey: t.contentKey, translations: [] });
    map.get(t.contentKey).translations.push(t);
  }
  return [...map.values()].map((g) => ({
    ...g,
    imgKey: g.contentKey + IMG_SUFFIX,
    hasImg: imgKeys.has(g.contentKey + IMG_SUFFIX),
  }));
};

const insertFormatting = (taRef, open, close, getValue, setValue) => {
  const el = taRef.current;
  if (!el) return;
  const s = el.selectionStart;
  const e = el.selectionEnd;
  const val = getValue();
  setValue(val.slice(0, s) + open + val.slice(s, e) + close + val.slice(e));
  setTimeout(() => { el.focus(); el.setSelectionRange(s + open.length, e + open.length); }, 0);
};

// ---------------------------------------------------------------------------
// FormatToolbar
// ---------------------------------------------------------------------------
const FormatToolbar = ({ taRef, getValue, setValue }) => (
  <div className="flex gap-0.5">
    {[
      { Icon: Bold,      open: "<b>",  close: "</b>",  title: "Negrito" },
      { Icon: Italic,    open: "<em>", close: "</em>", title: "Itálico" },
      { Icon: Underline, open: "<u>",  close: "</u>",  title: "Sublinhado" },
    ].map(({ Icon, open, close, title }) => (
      <button
        key={title}
        type="button"
        title={title}
        onMouseDown={(e) => { e.preventDefault(); insertFormatting(taRef, open, close, getValue, setValue); }}
        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
      >
        <Icon className="h-3.5 w-3.5" />
      </button>
    ))}
  </div>
);

// ---------------------------------------------------------------------------
// TranslationRow
// ---------------------------------------------------------------------------
const TranslationRow = ({ t, onSave }) => {
  const [content, setContent] = useState(t.content);
  const [saving, setSaving] = useState(false);
  const dirty = content !== t.content;
  const taRef = useRef(null);
  const isReadOnly = !t.isEditable;

  const handleSave = async () => {
    if (isReadOnly) return;
    setSaving(true);
    try { await onSave(t.id, content); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">
            {LANG_META[t.lang]?.flag} {LANG_META[t.lang]?.label}
          </span>
          {isReadOnly && (
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              Bloqueado
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {!isReadOnly && <FormatToolbar taRef={taRef} getValue={() => content} setValue={setContent} />}
          <button
            disabled={!dirty || saving || isReadOnly}
            onClick={handleSave}
            className="ml-1 flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors
              bg-indigo-50 text-indigo-600 hover:bg-indigo-100 disabled:opacity-40 disabled:hover:bg-indigo-50"
          >
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            Guardar
          </button>
        </div>
      </div>
      <textarea
        ref={taRef}
        value={content}
        onChange={(e) => !isReadOnly && setContent(e.target.value)}
        readOnly={isReadOnly}
        rows={content.length > 80 ? 3 : 2}
        className={`w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800
          outline-none transition ${isReadOnly ? 'bg-slate-100 cursor-not-allowed' : 'bg-white focus:border-indigo-400 focus:bg-white focus:ring-1 focus:ring-indigo-400'}`}
      />
      {dirty && !isReadOnly && <p className="text-[11px] text-amber-600">Alterações não guardadas</p>}
    </div>
  );
};

// ---------------------------------------------------------------------------
// ImageRow — URL manual + upload de ficheiro
// ---------------------------------------------------------------------------
const ImageRow = ({ sectionKey, contentKey, imgEntry, allTexts, onReload }) => {
  const [show, setShow] = useState(!!imgEntry);
  const [url, setUrl] = useState(imgEntry?.content || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const persist = async (finalUrl) => {
    setSaving(true);
    try {
      if (imgEntry) {
        await adminService.updateSiteText(imgEntry.id, { content: finalUrl });
      } else {
        await adminService.createSiteText({
          sectionKey,
          contentKey: contentKey + IMG_SUFFIX,
          lang: "pt",
          content: finalUrl,
        });
      }
      onReload();
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploadedUrl = await adminService.uploadMedia(file);
      const fullUrl = `http://localhost:4000${uploadedUrl}`;
      setUrl(fullUrl);
      await persist(fullUrl);
    } catch {
      alert("Erro ao carregar o ficheiro.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleRemove = async () => {
    if (imgEntry) {
      setSaving(true);
      try { await adminService.deleteSiteText(imgEntry.id); onReload(); }
      finally { setSaving(false); }
    }
    setShow(false);
    setUrl("");
  };

  if (!show) {
    return (
      <button
        type="button"
        onClick={() => setShow(true)}
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-600 transition-colors"
      >
        <Image className="h-3.5 w-3.5" /> Adicionar imagem
      </button>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center gap-2">
        <Image className="h-4 w-4 shrink-0 text-slate-400" />
        <span className="text-xs font-medium text-slate-500">Imagem</span>
        <button onClick={handleRemove} disabled={saving} className="ml-auto text-slate-400 hover:text-red-500 transition-colors">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Upload from computer */}
      <button
        type="button"
        disabled={uploading}
        onClick={() => fileRef.current?.click()}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-2 text-xs font-medium
          text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors disabled:opacity-60"
      >
        {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
        {uploading ? "A carregar…" : "Carregar do computador"}
      </button>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      {/* URL manual */}
      <div className="flex items-center gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="ou cole um URL externo…"
          className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-indigo-400"
        />
        <button
          disabled={saving || !url}
          onClick={() => persist(url)}
          className="shrink-0 rounded-lg bg-indigo-100 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-200 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : "Guardar URL"}
        </button>
      </div>

      {/* Preview */}
      {url && (
        <img
          src={url}
          alt="preview"
          className="h-24 w-full rounded-lg object-cover border border-slate-200"
          onError={(e) => { e.target.style.display = "none"; }}
          onLoad={(e) => { e.target.style.display = "block"; }}
        />
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// TextBlockCard
// ---------------------------------------------------------------------------
const TextBlockCard = ({ group, allTexts, sectionKey, onDelete, onSave, onReload }) => {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(`Eliminar o bloco "${formatKey(group.contentKey)}" (todas as línguas)?`)) return;
    setDeleting(true);
    try { await onDelete(group.translations[0]?.id); } finally { setDeleting(false); }
  };

  const imgEntry = allTexts.find(
    (t) => t.sectionKey === sectionKey && t.contentKey === group.imgKey && t.lang === "pt"
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-300 transition-colors">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-800">{formatKey(group.contentKey)}</p>
          <code className="text-[11px] font-mono text-slate-400">{group.contentKey}</code>
        </div>
        <button
          disabled={deleting}
          onClick={handleDelete}
          className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-50"
        >
          {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </button>
      </div>

      <div className="space-y-4">
        {group.translations
          .sort((a, b) => a.lang.localeCompare(b.lang))
          .map((t) => (
            <TranslationRow key={t.id} t={t} onSave={onSave} />
          ))}
      </div>

      <div className="mt-3 border-t border-slate-100 pt-3">
        <ImageRow
          sectionKey={sectionKey}
          contentKey={group.contentKey}
          imgEntry={imgEntry}
          allTexts={allTexts}
          onReload={onReload}
        />
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// AddBlockForm
// ---------------------------------------------------------------------------
const AddBlockForm = ({ sectionKey, sections, onSave, onClose }) => {
  const [sk, setSk] = useState(sectionKey || "");
  const [ck, setCk] = useState("");
  const [content, setContent] = useState("");
  const [lang, setLang] = useState("pt");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanSk = sk.trim().toLowerCase().replace(/\s+/g, "_");
    const cleanCk = ck.trim().toLowerCase().replace(/\s+/g, "_");
    if (!cleanSk || !cleanCk || !content.trim()) {
      setErr("Preencha todos os campos obrigatórios.");
      return;
    }
    setSaving(true);
    setErr("");
    try {
      await onSave({ sectionKey: cleanSk, contentKey: cleanCk, lang, content });
      onClose();
    } catch (ex) {
      setErr(ex?.response?.data?.message || "Erro ao criar bloco.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-indigo-200 bg-indigo-50 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">Novo bloco de texto</h3>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <X className="h-4 w-4" />
        </button>
      </div>

      {err && <p className="text-sm text-red-600">{err}</p>}

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Página / Secção *</label>
          <input
            value={sk}
            onChange={(e) => setSk(e.target.value)}
            list="sect-opts"
            placeholder="ex: homepage"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400"
          />
          <datalist id="sect-opts">{sections.map((s) => <option key={s} value={s} />)}</datalist>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Chave (key) *</label>
          <input
            value={ck}
            onChange={(e) => setCk(e.target.value.replace(/\s+/g, "_"))}
            placeholder="ex: hero_title"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Língua *</label>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400"
          >
            <option value="pt">🇵🇹 Português</option>
            <option value="en">🇬🇧 English</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Conteúdo *</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          placeholder="Texto a guardar… (suporta <b>negrito</b>, <em>itálico</em>)"
          className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400"
        />
        <p className="mt-1 text-xs text-slate-400">A tradução para a outra língua será gerada automaticamente.</p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {saving ? "A criar…" : "Criar bloco"}
        </button>
        <button type="button" onClick={onClose} className="text-sm text-slate-500 hover:text-slate-800">
          Cancelar
        </button>
      </div>
    </form>
  );
};

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export const SiteTextsPage = () => {
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState(null);
  const [search, setSearch] = useState("");
  const [blockSearch, setBlockSearch] = useState("");
  const [showAddBlock, setShowAddBlock] = useState(false);
  const contentRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try { setTexts(await adminService.listSiteTexts()); }
    catch { setError("Erro ao carregar textos."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const sections = [...new Set(
    texts.filter((t) => !t.contentKey.endsWith(IMG_SUFFIX)).map((t) => t.sectionKey)
  )].sort();

  const filteredSections = search
    ? sections.filter((s) =>
        s.toLowerCase().includes(search.toLowerCase()) ||
        sectionLabel(s).toLowerCase().includes(search.toLowerCase())
      )
    : sections;

  const sectionCounts = Object.fromEntries(
    sections.map((s) => [
      s,
      texts.filter((t) => t.sectionKey === s && !t.contentKey.endsWith(IMG_SUFFIX)).length,
    ])
  );

  const sectionTexts = activeSection ? texts.filter((t) => t.sectionKey === activeSection) : [];
  const blocks = groupBlocks(sectionTexts);
  const filteredBlocks = blockSearch
    ? blocks.filter(
        (b) =>
          b.contentKey.toLowerCase().includes(blockSearch.toLowerCase()) ||
          formatKey(b.contentKey).toLowerCase().includes(blockSearch.toLowerCase()) ||
          b.translations.some((t) => t.content.toLowerCase().includes(blockSearch.toLowerCase()))
      )
    : blocks;

  const openAddBlock = () => {
    setShowAddBlock(true);
    setTimeout(() => contentRef.current?.scrollTo({ top: 0, behavior: "smooth" }), 50);
  };

  const handleSave = async (id, content) => {
    await adminService.updateSiteText(id, { content });
    await load();
  };

  const handleDelete = async (id) => {
    await adminService.deleteSiteText(id);
    await load();
  };

  const handleCreate = async (payload) => {
    await adminService.createSiteText(payload);
    if (payload.sectionKey && !sections.includes(payload.sectionKey)) {
      setActiveSection(payload.sectionKey);
    }
    setShowAddBlock(false);
    await load();
  };

  return (
    <div className="-m-4 md:-m-6 flex overflow-hidden" style={{ height: "calc(100vh - 4rem)" }}>
      {/* ── Left sidebar ── */}
      <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="border-b border-slate-100 p-3">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrar páginas…"
              className="min-w-0 flex-1 bg-transparent text-xs outline-none text-slate-700 placeholder-slate-400"
            />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
            </div>
          ) : filteredSections.length === 0 ? (
            <p className="px-2 py-4 text-center text-xs text-slate-400">Nenhuma página encontrada</p>
          ) : (
            filteredSections.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setActiveSection(s);
                  setShowAddBlock(false);
                  setBlockSearch("");
                }}
                className={`group flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left transition-colors ${
                  activeSection === s
                    ? "bg-indigo-600 text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <FileText className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate text-sm font-medium">{sectionLabel(s)}</span>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                      activeSection === s
                        ? "bg-white/20 text-white"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {sectionCounts[s] ?? 0}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-60" />
                </div>
              </button>
            ))
          )}
        </nav>

        <div className="border-t border-slate-100 p-3">
          <button
            onClick={() => {
              setActiveSection(null);
              setShowAddBlock(true);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-indigo-300 py-2.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            <Plus className="h-4 w-4" /> Nova página
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex flex-1 flex-col overflow-hidden bg-slate-50">
        {error && (
          <div className="flex items-center gap-3 border-b border-red-200 bg-red-50 px-6 py-3 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        {!activeSection && !showAddBlock ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-slate-400">
            <FileText className="h-14 w-14 opacity-20" />
            <div className="text-center">
              <p className="font-medium text-slate-600">Selecione uma página</p>
              <p className="mt-1 text-sm">Escolha uma secção na barra lateral para editar os seus textos.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4">
              <div>
                {activeSection ? (
                  <>
                    <h2 className="text-lg font-bold text-slate-800">{sectionLabel(activeSection)}</h2>
                    <p className="font-mono text-xs text-slate-400">{activeSection}</p>
                  </>
                ) : (
                  <h2 className="text-lg font-bold text-slate-800">Nova página / bloco</h2>
                )}
              </div>
              {activeSection && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <Search className="h-3.5 w-3.5 text-slate-400" />
                    <input
                      value={blockSearch}
                      onChange={(e) => setBlockSearch(e.target.value)}
                      placeholder="Pesquisar blocos…"
                      className="w-36 bg-transparent text-xs outline-none placeholder-slate-400"
                    />
                  </div>
                  <button
                    onClick={openAddBlock}
                    className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" /> Adicionar bloco
                  </button>
                </div>
              )}
            </div>

            {/* Scrollable content */}
            <div ref={contentRef} className="flex-1 overflow-y-auto p-6 space-y-4">
              {showAddBlock && (
                <AddBlockForm
                  sectionKey={activeSection}
                  sections={sections}
                  onSave={handleCreate}
                  onClose={() => setShowAddBlock(false)}
                />
              )}

              {activeSection &&
                (filteredBlocks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 py-16 text-slate-400">
                    <FileText className="h-10 w-10 opacity-30" />
                    <p className="text-sm">
                      {blockSearch ? "Nenhum bloco encontrado." : "Sem blocos nesta secção."}
                    </p>
                  </div>
                ) : (
                  filteredBlocks.map((group) => (
                    <TextBlockCard
                      key={group.contentKey}
                      group={group}
                      allTexts={texts}
                      sectionKey={activeSection}
                      onSave={handleSave}
                      onDelete={handleDelete}
                      onReload={load}
                    />
                  ))
                ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
};
