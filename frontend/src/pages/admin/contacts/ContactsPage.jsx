import { useState, useEffect, useCallback } from "react";
import {
  Mail, RefreshCw, AlertCircle, Archive, Trash2, MessageSquare,
  ChevronDown, ChevronUp, MailOpen
} from "lucide-react";
import { adminService } from "../../../services/adminService.js";

const fmtDate = (iso) => {
  if (!iso) return "";
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  }).format(new Date(iso));
};

const FILTERS = [
  { v: "all", label: "Todas" },
  { v: "unread", label: "Não lidas" },
  { v: "replied", label: "Respondidas" },
  { v: "archived", label: "Arquivo" }
];

const ConfirmModal = ({ text, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
      <h3 className="font-semibold text-slate-800">{text}</h3>
      <div className="mt-5 flex gap-3">
        <button onClick={onCancel} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
          Cancelar
        </button>
        <button onClick={onConfirm} className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700">
          Confirmar
        </button>
      </div>
    </div>
  </div>
);

const ContactCard = ({ msg, onReply, onArchive, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const [replyText, setReplyText] = useState(msg.reply || "");
  const [showReply, setShowReply] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setSaving(true);
    await onReply(msg.id, replyText.trim());
    setSaving(false);
    setShowReply(false);
  };

  return (
    <>
      {confirmDelete && (
        <ConfirmModal
          text="Eliminar mensagem?"
          onConfirm={() => { setConfirmDelete(false); onDelete(msg.id); }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
      <div className={`rounded-2xl border bg-white shadow-sm ${!msg.isRead ? "border-indigo-200" : "border-slate-200"}`}>
        {/* Header */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-start gap-4 p-5 text-left"
        >
          <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${!msg.isRead ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"}`}>
            {!msg.isRead ? <Mail className="h-4 w-4" /> : <MailOpen className="h-4 w-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold ${!msg.isRead ? "text-slate-900" : "text-slate-700"}`}>
                  {msg.name}
                </span>
                {msg.reply && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    Respondida
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-400 shrink-0">{fmtDate(msg.createdAt)}</span>
            </div>
            <div className="mt-0.5 truncate text-xs text-slate-400">{msg.email}</div>
            <div className={`mt-1 text-sm ${!msg.isRead ? "font-medium text-slate-800" : "text-slate-600"}`}>
              {msg.subject || "(sem assunto)"}
            </div>
          </div>
          {expanded ? <ChevronUp className="mt-1 h-4 w-4 shrink-0 text-slate-400" /> : <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-slate-400" />}
        </button>

        {/* Expanded content */}
        {expanded && (
          <div className="border-t border-slate-100 px-5 pb-5 pt-4 space-y-4">
            <div>
              <p className="text-xs font-medium text-slate-400 mb-1">Mensagem</p>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{msg.message}</p>
            </div>

            {msg.phone && (
              <p className="text-xs text-slate-400">Telefone: <span className="text-slate-700">{msg.phone}</span></p>
            )}

            {msg.reply && !showReply && (
              <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2.5">
                <p className="text-xs font-medium text-indigo-700 mb-1">Resposta enviada em {fmtDate(msg.repliedAt)}</p>
                <p className="text-sm text-indigo-700 whitespace-pre-wrap">{msg.reply}</p>
              </div>
            )}

            {showReply && (
              <div className="space-y-2">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={4}
                  placeholder="Escreva a sua resposta…"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleReply}
                    disabled={saving || !replyText.trim()}
                    className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {saving ? "A enviar…" : "Enviar resposta"}
                  </button>
                  <button
                    onClick={() => setShowReply(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
              <button
                onClick={() => setShowReply((v) => !v)}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                {msg.reply ? "Editar resposta" : "Responder"}
              </button>
              <button
                onClick={() => onArchive(msg.id, !msg.isArchived)}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                <Archive className="h-3.5 w-3.5" />
                {msg.isArchived ? "Restaurar" : "Arquivar"}
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Eliminar
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export const ContactsPage = () => {
  const [messages, setMessages] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    setError("");
    try {
      const data = await adminService.listContacts({ filter, page: p, limit: 20 });
      setMessages(data.messages || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
      setPage(p);
    } catch {
      setError("Erro ao carregar mensagens.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(1); }, [load]);

  const handleReply = async (id, reply) => {
    await adminService.replyToContact(id, reply);
    setMessages((prev) => prev.map((m) =>
      m.id === id ? { ...m, reply, repliedAt: new Date().toISOString() } : m
    ));
  };

  const handleArchive = async (id, archived) => {
    await adminService.archiveContact(id, archived);
    setMessages((prev) => prev.filter((m) => m.id !== id));
    setTotal((t) => t - 1);
  };

  const handleDelete = async (id) => {
    await adminService.deleteContact(id);
    setMessages((prev) => prev.filter((m) => m.id !== id));
    setTotal((t) => t - 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Contactos</h2>
          <p className="text-sm text-slate-500">{total} mensagens</p>
        </div>

        <div className="flex rounded-lg border border-slate-200 bg-white p-1 text-xs font-medium">
          {FILTERS.map(({ v, label }) => (
            <button
              key={v}
              onClick={() => setFilter(v)}
              className={`rounded-md px-3 py-1.5 transition-colors ${filter === v ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-800"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white py-16 text-center">
          <Mail className="h-10 w-10 text-slate-300" />
          <p className="text-slate-500">Nenhuma mensagem encontrada.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => (
            <ContactCard
              key={m.id}
              msg={m}
              onReply={handleReply}
              onArchive={handleArchive}
              onDelete={handleDelete}
            />
          ))}

          {pages > 1 && (
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <span className="text-sm text-slate-500">Página {page} de {pages}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => load(page - 1)}
                  disabled={page <= 1}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  Anterior
                </button>
                <button
                  onClick={() => load(page + 1)}
                  disabled={page >= pages}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  Seguinte
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
