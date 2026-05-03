import { zodResolver } from "@hookform/resolvers/zod";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { OrderSummary } from "../../components/checkout/OrderSummary.jsx";
import { Seo } from "../../components/common/Seo.jsx";
import { EmptyState } from "../../components/ui/EmptyState.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useCart } from "../../contexts/CartContext.jsx";
import { useTexts } from "../../contexts/SiteTextsContext.jsx";
import { buildCanonicalUrl } from "../../lib/seo.js";
import { checkoutService } from "../../services/checkoutService.js";
import { formatPrice } from "../../utils/format.js";
import { checkoutSchema } from "../../validators/checkoutSchema.js";

export const CheckoutPage = () => {
  const t = useTexts();
  const { user } = useAuth();
  const { items, subtotal, deliveryFee, total, updateQuantity, removeItem } = useCart();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState("");
  const [cartMessage, setCartMessage] = useState("");
  const [options, setOptions] = useState({ districts: [], municipalities: [], parishes: [], paymentOptions: [] });
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      firstName: user?.firstName || user?.name?.split(" ")?.[0] || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: user?.phone || "",
      street: "",
      district: "",
      municipalityCode: "",
      parishCode: "",
      postalCode: user?.postalCode || "",
      notes: "",
      paymentMethod: "card"
    }
  });

  const district = watch("district");
  const municipalityCode = watch("municipalityCode");
  const paymentMethod = watch("paymentMethod");

  useEffect(() => {
    let active = true;
    checkoutService.getOptions({ district, municipalityCode }).then((payload) => {
      if (!active) return;
      setOptions(payload);
      const enabledMethod = payload.paymentOptions.find((o) => o.enabled)?.id || "card";
      if (!payload.paymentOptions.some((o) => o.id === paymentMethod && o.enabled)) {
        setValue("paymentMethod", enabledMethod);
      }
    }).catch((error) => {
      if (!active) return;
      setApiError(error.response?.data?.message || t("checkout", "error_load", "Não foi possível carregar o checkout."));
    });
    return () => { active = false; };
  }, [district, municipalityCode, paymentMethod, setValue]);

  useEffect(() => { setValue("municipalityCode", ""); setValue("parishCode", ""); }, [district, setValue]);
  useEffect(() => { setValue("parishCode", ""); }, [municipalityCode, setValue]);

  const changeQuantity = (productId, quantity) => {
    const result = updateQuantity(productId, quantity);
    setCartMessage(result.ok ? "" : result.message || "");
  };

  const onSubmit = async (values) => {
    setApiError("");
    try {
      const response = await checkoutService.createCheckoutSession({
        paymentMethod: values.paymentMethod,
        shipping: {
          firstName: values.firstName, lastName: values.lastName, email: values.email,
          phone: values.phone, street: values.street, district: values.district,
          municipalityCode: values.municipalityCode, parishCode: values.parishCode,
          postalCode: values.postalCode, notes: values.notes || ""
        },
        items: items.map((item) => ({ productId: item.id, quantity: item.quantity }))
      });
      sessionStorage.setItem("checkout_session", JSON.stringify({ ...response, customer: values }));
      navigate("/metodos-pagamento");
    } catch (error) {
      const response = error.response?.data;
      const firstFieldError = Object.values(response?.details?.fieldErrors || {}).flat().find(Boolean);
      setApiError(firstFieldError || response?.message || t("checkout", "error_create", "Não foi possível criar o checkout."));
    }
  };

  if (!items.length) {
    return (
      <section className="container-shell py-10">
        <EmptyState
          action={{ href: "/produtos", label: t("checkout", "empty_action", "Explorar produtos") }}
          description={t("checkout", "empty_desc", "Adicione artigos ao carrinho antes de iniciar o checkout.")}
          title={t("checkout", "empty_title", "Carrinho vazio")}
        />
      </section>
    );
  }

  const addressFields = [
    ["firstName",  t("checkout", "label_first_name",   "Primeiro nome")],
    ["lastName",   t("checkout", "label_last_name",    "Último nome")],
    ["email",      t("checkout", "label_email",        "Email")],
    ["phone",      t("checkout", "label_phone",        "Telemóvel")],
    ["street",     t("checkout", "label_street",       "Rua")],
    ["postalCode", t("checkout", "label_postcode",     "Código-postal")]
  ];

  const selectPlaceholder = t("checkout", "select_placeholder", "Selecione");

  return (
    <section className="container-shell py-10">
      <Seo
        canonical={buildCanonicalUrl("/checkout")}
        description={t("checkout", "seo_description", "Checkout seguro com morada obrigatória, validação robusta e pagamento real.")}
        title={t("checkout", "seo_title", "Checkout | Sports Club")}
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <form className="surface-card p-6 md:p-8" onSubmit={handleSubmit(onSubmit)}>
          <h1 className="text-3xl font-bold">{t("checkout", "heading", "Checkout")}</h1>
          <p className="mt-2 text-sm text-slate-600">
            {t("checkout", "subheading", "Confirme a morada de envio, ajuste o carrinho e selecione o método de pagamento.")}
          </p>

          <div className="mt-8">
            <h2 className="text-xl font-bold">{t("checkout", "cart_heading", "Carrinho")}</h2>
            <div className="mt-4 space-y-4">
              {items.map((item) => (
                <article key={item.id} className="rounded-[1.5rem] border border-zinc-200 bg-white p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center">
                    <img alt={item.name} className="h-24 w-full rounded-2xl object-cover md:w-24" src={item.image} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="font-semibold">{item.name}</div>
                          <div className="text-sm text-slate-500">
                            {item.stock} {t("checkout", "stock_units", "unidades em stock")}
                          </div>
                        </div>
                        <button className="rounded-full p-2 text-red-600 hover:bg-red-50" onClick={() => removeItem(item.id)} type="button">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center rounded-2xl border border-zinc-200">
                          <button className="px-4 py-3" onClick={() => changeQuantity(item.id, item.quantity - 1)} type="button">
                            <Minus className="h-4 w-4" />
                          </button>
                          <input
                            className="w-16 border-x border-zinc-200 py-3 text-center"
                            min="1" max={item.stock} type="number" value={item.quantity}
                            onChange={(e) => changeQuantity(item.id, e.target.value)}
                          />
                          <button className="px-4 py-3" onClick={() => changeQuantity(item.id, item.quantity + 1)} type="button">
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="text-right text-sm font-semibold">
                          {formatPrice(Number(item.quantity) * Number(item.price))}
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            {cartMessage ? <p className="mt-4 text-sm text-red-600">{cartMessage}</p> : null}
          </div>

          <div className="mt-10">
            <h2 className="text-xl font-bold">{t("checkout", "address_heading", "Morada de envio")}</h2>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              {addressFields.map(([name, label]) => (
                <label key={name} className={name === "street" ? "md:col-span-2" : ""}>
                  <span className="mb-2 block text-sm font-semibold">{label}</span>
                  <input className="input-base" {...register(name)} />
                  {errors[name] ? <span className="mt-1 block text-sm text-red-600">{errors[name].message}</span> : null}
                </label>
              ))}

              <label>
                <span className="mb-2 block text-sm font-semibold">{t("checkout", "label_district", "Distrito / ilha")}</span>
                <select className="input-base" {...register("district")}>
                  <option value="">{selectPlaceholder}</option>
                  {options.districts.map((o) => <option key={o.code} value={o.name}>{o.name}</option>)}
                </select>
                {errors.district ? <span className="mt-1 block text-sm text-red-600">{errors.district.message}</span> : null}
              </label>

              <label>
                <span className="mb-2 block text-sm font-semibold">{t("checkout", "label_municipality", "Município")}</span>
                <select className="input-base disabled:bg-zinc-100" disabled={!district} {...register("municipalityCode")}>
                  <option value="">{selectPlaceholder}</option>
                  {options.municipalities.map((o) => <option key={o.code} value={o.code}>{o.name}</option>)}
                </select>
                {errors.municipalityCode ? <span className="mt-1 block text-sm text-red-600">{errors.municipalityCode.message}</span> : null}
              </label>

              <label>
                <span className="mb-2 block text-sm font-semibold">{t("checkout", "label_parish", "Freguesia")}</span>
                <select className="input-base disabled:bg-zinc-100" disabled={!municipalityCode} {...register("parishCode")}>
                  <option value="">{selectPlaceholder}</option>
                  {options.parishes.map((o) => <option key={o.code} value={o.code}>{o.name}</option>)}
                </select>
                {errors.parishCode ? <span className="mt-1 block text-sm text-red-600">{errors.parishCode.message}</span> : null}
              </label>

              <label className="md:col-span-2">
                <span className="mb-2 block text-sm font-semibold">{t("checkout", "label_notes", "Observações")}</span>
                <textarea className="input-base h-28 py-3" {...register("notes")} />
                {errors.notes ? <span className="mt-1 block text-sm text-red-600">{errors.notes.message}</span> : null}
              </label>
            </div>
          </div>

          <div className="mt-10">
            <h2 className="text-xl font-bold">{t("checkout", "payment_heading", "Método de pagamento")}</h2>
            <div className="mt-4 grid gap-3">
              {options.paymentOptions.map((method) => (
                <label key={method.id} className={`surface-card flex items-start gap-3 px-4 py-4 ${!method.enabled ? "opacity-60" : ""}`}>
                  <input disabled={!method.enabled} type="radio" value={method.id} {...register("paymentMethod")} />
                  <span>
                    <span className="block font-semibold">{method.label}</span>
                    <span className="block text-sm text-slate-500">{method.description}</span>
                  </span>
                </label>
              ))}
            </div>
            {errors.paymentMethod ? <span className="mt-1 block text-sm text-red-600">{errors.paymentMethod.message}</span> : null}
          </div>

          {apiError ? <p className="mt-4 text-sm text-red-600">{apiError}</p> : null}
          <button className="button-primary mt-8" disabled={isSubmitting} type="submit">
            {isSubmitting ? t("checkout", "btn_loading", "A preparar pagamento…") : t("checkout", "btn_continue", "Continuar para pagamento")}
          </button>
        </form>
        <OrderSummary deliveryFee={deliveryFee} items={items} subtotal={subtotal} total={total} />
      </div>
    </section>
  );
};
