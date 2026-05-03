import { Minus, Plus, ShoppingCart, Star, Pencil, Trash2, X, Check, LogIn } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { ProductGrid } from "../components/catalog/ProductGrid.jsx";
import { Seo } from "../components/common/Seo.jsx";
import { Breadcrumbs } from "../components/ui/Breadcrumbs.jsx";
import { ErrorState } from "../components/ui/ErrorState.jsx";
import { SectionHeading } from "../components/ui/SectionHeading.jsx";
import { useCart } from "../contexts/CartContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useTexts } from "../contexts/SiteTextsContext.jsx";
import { useAsyncData } from "../hooks/useAsyncData.js";
import { buildCanonicalUrl } from "../lib/seo.js";
import { adminService } from "../services/adminService.js";
import { catalogService } from "../services/catalogService.js";
import { formatPrice } from "../utils/format.js";

// ---------------------------------------------------------------------------
// Star rating component
// ---------------------------------------------------------------------------
const StarRating = ({ value, onChange, readonly = false }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        type={readonly ? "button" : "button"}
        onClick={readonly ? undefined : () => onChange(n)}
        className={readonly ? "cursor-default" : "transition-transform hover:scale-110"}
        tabIndex={readonly ? -1 : 0}
      >
        <Star
          className={`h-5 w-5 ${n <= value ? "fill-amber-400 text-amber-400" : "fill-none text-zinc-300"}`}
        />
      </button>
    ))}
  </div>
);

// ---------------------------------------------------------------------------
// Individual review card
// ---------------------------------------------------------------------------
const ReviewCard = ({ review, currentUserId, onEdit, onDelete }) => {
  const isOwn = currentUserId && Number(review.userId) === Number(currentUserId);
  const date = review.createdAt ? new Date(review.createdAt).toLocaleDateString("pt-PT") : "";

  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm truncate">{review.userName}</span>
            <span className="text-xs text-slate-400">{date}</span>
          </div>
          <StarRating value={review.rating} readonly />
        </div>
        {isOwn && (
          <div className="flex shrink-0 gap-1">
            <button
              onClick={() => onEdit(review)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-zinc-100 hover:text-slate-700"
              title="Editar"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(review.id)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
              title="Eliminar"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
      <p className="mt-3 text-sm text-slate-700 leading-relaxed">{review.comment}</p>
      {review.reply && (
        <div className="mt-3 rounded-xl bg-pine-50 border border-pine-100 p-3">
          <div className="text-xs font-semibold text-pine-700 mb-1">Resposta da loja</div>
          <p className="text-sm text-slate-700">{review.reply}</p>
        </div>
      )}
    </article>
  );
};

// ---------------------------------------------------------------------------
// Reviews section
// ---------------------------------------------------------------------------
const ReviewsSection = ({ slug, productId }) => {
  const { user, isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingReview, setEditingReview] = useState(null);
  const [formRating, setFormRating] = useState(5);
  const [formComment, setFormComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      setReviews(await catalogService.getReviews(slug));
    } catch {
      setError("Não foi possível carregar as avaliações.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { loadReviews(); }, [loadReviews]);

  const userReview = isAuthenticated
    ? reviews.find((r) => r.userId && Number(r.userId) === Number(user?.id))
    : null;

  const startEdit = (review) => {
    setEditingReview(review);
    setFormRating(review.rating);
    setFormComment(review.comment);
    setSubmitError("");
  };

  const cancelEdit = () => {
    setEditingReview(null);
    setFormRating(5);
    setFormComment("");
    setSubmitError("");
  };

  const handleSubmit = async () => {
    if (!formRating) { setSubmitError("Selecione uma classificação."); return; }
    if (formComment.trim().length < 3) { setSubmitError("O comentário deve ter pelo menos 3 caracteres."); return; }
    setSubmitting(true);
    setSubmitError("");
    try {
      if (editingReview) {
        await catalogService.updateReview(editingReview.id, { rating: formRating, comment: formComment.trim() });
      } else {
        await catalogService.createReview(slug, { rating: formRating, comment: formComment.trim() });
      }
      cancelEdit();
      await loadReviews();
    } catch (err) {
      setSubmitError(err.response?.data?.message || "Não foi possível guardar a avaliação.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm("Tem a certeza de que pretende eliminar a sua avaliação?")) return;
    try {
      await catalogService.deleteReview(reviewId);
      await loadReviews();
    } catch {
      setError("Não foi possível eliminar a avaliação.");
    }
  };

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <section className="mt-12">
      <div className="flex items-end gap-4 flex-wrap">
        <SectionHeading eyebrow="Comunidade" title="Avaliações" />
        {avgRating && (
          <div className="mb-1 flex items-center gap-2 text-sm text-slate-600">
            <StarRating value={Math.round(Number(avgRating))} readonly />
            <span className="font-semibold">{avgRating}</span>
            <span>({reviews.length})</span>
          </div>
        )}
      </div>

      {/* Auth gate / write form */}
      <div className="mt-6">
        {!isAuthenticated ? (
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 flex items-center gap-4">
            <LogIn className="h-5 w-5 shrink-0 text-slate-400" />
            <p className="text-sm text-slate-600">
              <Link to="/entrar" className="font-semibold text-pine-600 underline underline-offset-2">Inicie sessão</Link>
              {" "}para deixar a sua avaliação.
            </p>
          </div>
        ) : userReview && !editingReview ? (
          <div className="rounded-2xl border border-pine-200 bg-pine-50 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-pine-700">A sua avaliação</p>
                <StarRating value={userReview.rating} readonly />
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => startEdit(userReview)}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-pine-700 hover:bg-pine-100 flex items-center gap-1"
                >
                  <Pencil className="h-3.5 w-3.5" /> Editar
                </button>
                <button
                  onClick={() => handleDelete(userReview.id)}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-1"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Eliminar
                </button>
              </div>
            </div>
            <p className="mt-2 text-sm text-slate-700">{userReview.comment}</p>
          </div>
        ) : isAuthenticated && !userReview || editingReview ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-4">
            <p className="text-sm font-semibold text-slate-700">
              {editingReview ? "Editar avaliação" : "Escrever uma avaliação"}
            </p>
            <div>
              <div className="mb-1 text-xs text-slate-500">Classificação</div>
              <StarRating value={formRating} onChange={setFormRating} />
            </div>
            <div>
              <div className="mb-1 text-xs text-slate-500">Comentário</div>
              <textarea
                className="input-base min-h-[90px] resize-none"
                value={formComment}
                onChange={(e) => setFormComment(e.target.value)}
                placeholder="Partilhe a sua experiência com este produto…"
                maxLength={1000}
              />
            </div>
            {submitError && <p className="text-xs text-red-600">{submitError}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="button-primary gap-2 disabled:opacity-60"
              >
                <Check className="h-4 w-4" />
                {submitting ? "A guardar…" : editingReview ? "Guardar alterações" : "Publicar avaliação"}
              </button>
              {editingReview && (
                <button onClick={cancelEdit} className="button-secondary gap-2">
                  <X className="h-4 w-4" /> Cancelar
                </button>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* Reviews list */}
      <div className="mt-6 space-y-4">
        {loading && <p className="text-sm text-slate-500">A carregar avaliações…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!loading && !error && reviews.length === 0 && (
          <p className="text-sm text-slate-500">Ainda não existem avaliações para este produto.</p>
        )}
        {reviews
          .filter((r) => !editingReview || r.id !== editingReview.id)
          .map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              currentUserId={user?.id}
              onEdit={startEdit}
              onDelete={handleDelete}
            />
          ))}
      </div>
    </section>
  );
};

export const ProductPage = () => {
  const { slug } = useParams();
  const { addItem } = useCart();
  const t = useTexts();
  const { data, loading, error } = useAsyncData(() => catalogService.getProduct(slug), [slug]);
  const [quantity, setQuantity] = useState(1);
  const [selectedPhoto, setSelectedPhoto] = useState("");
  const [feedback, setFeedback] = useState("");
  const [feedbackType, setFeedbackType] = useState("error");

  useEffect(() => {
    setQuantity(1);
    setFeedback("");
    setFeedbackType("error");
  }, [slug]);

  useEffect(() => {
    if (data?.product?.id) adminService.trackProductView(data.product.id);
  }, [data?.product?.id]);

  useEffect(() => {
    const photo = data?.product?.photos?.[0]?.url || data?.product?.image || "";
    setSelectedPhoto(photo);
  }, [data?.product]);

  if (error) {
    return (
      <div className="container-shell py-12">
        <ErrorState title={t("errors", "product_not_found", "Produto não encontrado")} />
      </div>
    );
  }

  const product = data?.product;
  const photos = product?.photos?.length ? product.photos : product?.image ? [{ url: product.image }] : [];

  const changeQuantity = (nextValue) => {
    const parsed = Math.max(1, Math.min(Number(product?.stock || 1), Number(nextValue) || 1));
    setQuantity(parsed);
  };

  const handleAddToCart = () => {
    const result = addItem(product, quantity);

    if (!result.ok) {
      setFeedbackType("error");
      setFeedback(result.message);
      return;
    }

    setFeedbackType("success");
    setFeedback(t("product", "added_to_cart", "Produto adicionado ao carrinho."));
  };

  return (
    <section className="container-shell py-10">
      <Seo
        canonical={buildCanonicalUrl(`/produto/${slug}`)}
        description={product?.description || t("product", "seo_description", "Detalhe de produto")}
        image={product?.image}
        title={`${product?.name || t("product", "seo_title_fallback", "Produto")} | Sports Club`}
      />
      <Breadcrumbs
        items={[
          { label: t("nav", "home", "Início"), href: "/" },
          { label: t("nav", "products", "Produtos"), href: "/produtos" },
          { label: product?.name || t("product", "seo_title_fallback", "Produto") }
        ]}
      />
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_420px]">
        <div className="grid gap-4 lg:grid-cols-[96px_1fr]">
          <div className="order-2 grid grid-cols-4 gap-3 lg:order-1 lg:grid-cols-1">
            {photos.map((photo, index) => (
              <button
                key={`${photo.url}-${index}`}
                className={`overflow-hidden rounded-2xl border ${
                  selectedPhoto === photo.url ? "border-black" : "border-zinc-200"
                }`}
                onClick={() => setSelectedPhoto(photo.url)}
                type="button"
              >
                <img
                  alt={`${product?.name || t("product", "seo_title_fallback", "Produto")} ${index + 1}`}
                  className="h-20 w-full object-cover"
                  src={photo.url}
                />
              </button>
            ))}
          </div>
          <div className="order-1 surface-card overflow-hidden lg:order-2">
            {product ? (
              <img
                alt={product.name}
                className="h-full min-h-[360px] w-full object-cover"
                src={selectedPhoto || product.image}
              />
            ) : null}
          </div>
        </div>
        <div className="surface-card p-8">
          {loading ? null : (
            <>
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-pine-600">
                {product.brand}
              </div>
              <h1 className="mt-3 text-4xl font-bold">{product.name}</h1>
              <p className="mt-4 text-slate-600">{product.description}</p>
              <div className="mt-6 flex items-end gap-3">
                <span className="text-4xl font-bold text-pine-600">{formatPrice(product.price)}</span>
                {product.originalPrice > product.price ? (
                  <span className="text-lg text-slate-400 line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                ) : null}
              </div>
              <div className="mt-3 text-sm text-slate-500">
                {t("product", "label_stock", "Stock disponível:")}{" "}{product.stock} | {t("product", "label_unit", "Unidade:")}{" "}{product.unit}
              </div>

              <div className="mt-8">
                <div className="mb-2 text-sm font-semibold">{t("product", "label_qty", "Quantidade")}</div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center rounded-2xl border border-zinc-200">
                    <button
                      className="px-4 py-3 text-zinc-700"
                      onClick={() => changeQuantity(quantity - 1)}
                      type="button"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <input
                      className="w-16 border-x border-zinc-200 py-3 text-center"
                      min="1"
                      max={product.stock}
                      type="number"
                      value={quantity}
                      onChange={(event) => changeQuantity(event.target.value)}
                    />
                    <button
                      className="px-4 py-3 text-zinc-700"
                      onClick={() => changeQuantity(quantity + 1)}
                      type="button"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="text-sm text-slate-500">
                    {t("product", "label_max_stock", "Máximo disponível:")}{" "}{product.stock}
                  </span>
                </div>
              </div>

              {feedback ? (
                <p className={`mt-4 text-sm ${feedbackType === "error" ? "text-red-600" : "text-zinc-700"}`}>
                  {feedback}
                </p>
              ) : null}

              <button
                className="button-primary mt-8 w-full gap-2 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={product.stock <= 0}
                onClick={handleAddToCart}
                type="button"
              >
                <ShoppingCart className="h-4 w-4" />
                {product.stock > 0 ? t("product", "btn_add_cart", "Adicionar ao carrinho") : t("product", "btn_no_stock", "Sem stock")}
              </button>
            </>
          )}
        </div>
      </div>
      {product && (
        <ReviewsSection slug={slug} productId={product.id} />
      )}

      <section className="mt-12">
        <SectionHeading
          eyebrow={t("product", "label_related_eyebrow", "Sugestões")}
          title={t("product", "label_related", "Produtos relacionados")}
        />
        <div className="mt-8">
          <ProductGrid loading={loading} products={data?.relatedProducts || []} />
        </div>
      </section>
    </section>
  );
};
