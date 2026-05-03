import { useState, useEffect, useCallback } from "react";
import { Star, RefreshCw, AlertCircle, Eye, EyeOff, Flag, Trash2, MessageSquare } from "lucide-react";
import { adminService } from "../../../services/adminService.js";

const fmtDate = (iso) => {
  if (!iso) return "";
  return new Intl.DateTimeFormat("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(iso));
};

const Stars = ({ rating }) => (
  <span className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star
        key={i}
        className={`h-3.5 w-3.5 ${i <= rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
      />
    ))}
  </span>
);

const FILTERS = [
  { v: "all", label: "Todas" },
  { v: "unanswered", label: "Sem resposta" },
  { v: "offensive", label: "Ofensivas" },
  { v: "hidden", label: "Ocultas" }
];

const ConfirmModal = ({ onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
      <h3 className="font-semibold text-slate-800">Eliminar avaliação?</h3>
      <p className="mt-2 text-sm text-slate-500">Esta ação não pode ser revertida.</p>
      <div className="mt-5 flex gap-3">
        <button onClick={onCancel} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
          Cancelar
        </button>
        <button onClick={onConfirm} className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700">
          Eliminar
        </button>
      </div>
    </div>
  </div>
);

const ReviewCard = ({ review, onReply, onModerate, onDelete }) => {
  const [replyText, setReplyText] = useState(review.reply || "");
  const [showReply, setShowReply] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setSaving(true);
    await onReply(review.id, replyText.trim());
    setSaving(false);
    setShowReply(false);
  };

  return (
    <>
      {confirmDelete && (
        <ConfirmModal
          onConfirm={() => { setConfirmDelete(false); onDelete(review.id); }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
      <div className={`rounded-2xl border bg-white p-5 shadow-sm ${review.isOffensive ? "border-red-200" : "border-slate-200"}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Stars rating={review.rating} />
              <span className="text-xs font-medium text-slate-700">{review.userName}</span>
              {review.userEmail && (
                <span className="text-xs text-slate-400">&lt;{review.userEmail}&gt;</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">em</span>
              <a
                href={`/produto/${review.productId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-indigo-600 hover:underline"
              >
                {review.productName}
              </a>
              <span className="text-xs text-slate-400">· {fmtDate(review.createdAt)}</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {review.isOffensive && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">
                Ofensiva
              </span>
            )}
            {!review.isVisible && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                Oculta
              </span>
            )}
          </div>
        </div>

        <p className="mt-3 text-sm text-slate-700 leading-relaxed">{review.comment}</p>

        {review.reply && !showReply && (
          <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2.5">
            <p className="text-xs font-medium text-indigo-700 mb-1">Resposta da loja</p>
            <p className="text-sm text-indigo-700">{review.reply}</p>
          </div>
        )}

        {showReply && (
          <div className="mt-3 space-y-2">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={3}
              placeholder="Escreva a sua resposta…"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleReply}
                disabled={saving || !replyText.trim()}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? "A guardar…" : "Guardar resposta"}
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
        <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
          <button
            onClick={() => setShowReply((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            {review.reply ? "Editar resposta" : "Responder"}
          </button>
          <button
            onClick={() => onModerate(review.id, { isVisible: !review.isVisible })}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
          >
            {review.isVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {review.isVisible ? "Ocultar" : "Mostrar"}
          </button>
          <button
            onClick={() => onModerate(review.id, { isOffensive: !review.isOffensive })}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium hover:bg-slate-100 ${review.isOffensive ? "text-red-600" : "text-slate-600"}`}
          >
            <Flag className="h-3.5 w-3.5" />
            {review.isOffensive ? "Desmarcar ofensiva" : "Marcar ofensiva"}
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
    </>
  );
};

export const ReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
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
      const data = await adminService.listReviews({ filter, page: p, limit: 20 });
      setReviews(data.reviews || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
      setPage(p);
    } catch {
      setError("Erro ao carregar avaliações.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(1); }, [load]);

  const handleReply = async (id, reply) => {
    await adminService.replyToReview(id, reply);
    setReviews((prev) => prev.map((r) => r.id === id ? { ...r, reply, repliedAt: new Date().toISOString() } : r));
  };

  const handleModerate = async (id, flags) => {
    await adminService.moderateReview(id, flags);
    setReviews((prev) => prev.map((r) => r.id === id ? { ...r, ...flags } : r));
  };

  const handleDelete = async (id) => {
    await adminService.deleteReview(id);
    setReviews((prev) => prev.filter((r) => r.id !== id));
    setTotal((t) => t - 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Avaliações</h2>
          <p className="text-sm text-slate-500">{total} avaliações</p>
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
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white py-16 text-center">
          <Star className="h-10 w-10 text-slate-300" />
          <p className="text-slate-500">Nenhuma avaliação encontrada.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <ReviewCard
              key={r.id}
              review={r}
              onReply={handleReply}
              onModerate={handleModerate}
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
