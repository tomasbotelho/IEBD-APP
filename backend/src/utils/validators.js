import { z } from "zod";
import validator from "validator";

const portuguesePhoneRegex = /^(\+351)?9[1236]\d{7}$/;
const postalCodeRegex = /^\d{4}-\d{3}$/;

const emailField = z
  .string()
  .trim()
  .refine((value) => validator.isEmail(value), "Indique um email válido.");

const phoneField = z
  .string()
  .trim()
  .regex(portuguesePhoneRegex, "Indique um telemóvel português válido.");

const postalCodeField = z
  .string()
  .trim()
  .regex(postalCodeRegex, "Indique um código-postal válido.");

export const registerSchema = z
  .object({
    firstName: z.string().trim().min(2, "Indique o primeiro nome."),
    lastName: z.string().trim().min(2, "Indique o último nome."),
    email: emailField,
    phone: phoneField,
    postalCode: postalCodeField,
    password: z.string().min(8, "A palavra-passe deve ter pelo menos 8 caracteres."),
    confirmPassword: z.string().min(1, "Confirme a palavra-passe.")
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "As palavras-passe não coincidem.",
    path: ["confirmPassword"]
  });

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Indique a palavra-passe.")
});

export const forgotPasswordSchema = z.object({
  email: emailField
});

export const resetPasswordSchema = z
  .object({
    token: z.string().trim().min(1, "A ligação de recuperação é inválida."),
    password: z.string().min(8, "A palavra-passe deve ter pelo menos 8 caracteres."),
    confirmPassword: z.string().min(1, "Confirme a palavra-passe.")
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "As palavras-passe não coincidem.",
    path: ["confirmPassword"]
  });

export const checkoutCreateSchema = z.object({
  paymentMethod: z.enum(["card", "paypal"]),
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        quantity: z.number().int().positive().max(99)
      })
    )
    .min(1, "Adicione pelo menos um produto ao carrinho."),
  shipping: z.object({
    firstName: z.string().trim().min(2, "Indique o primeiro nome."),
    lastName: z.string().trim().min(2, "Indique o último nome."),
    email: emailField,
    phone: phoneField,
    street: z.string().trim().min(5, "Indique a rua."),
    district: z.string().trim().min(1, "Selecione o distrito ou ilha."),
    municipalityCode: z.string().trim().min(1, "Selecione o município."),
    parishCode: z.string().trim().min(1, "Selecione a freguesia."),
    postalCode: postalCodeField,
    notes: z.string().trim().max(500, "As observações não podem exceder 500 caracteres.").optional()
  })
});

export const confirmCardPaymentSchema = z.object({
  paymentIntentId: z.string().trim().min(1, "O identificador do pagamento é obrigatório.")
});

export const capturePayPalSchema = z.object({
  orderId: z.string().trim().min(1, "O identificador do PayPal é obrigatório.")
});

export const cancelOrderSchema = z.object({
  reason: z.string().trim().min(5, "Indique o motivo do cancelamento.").max(500)
});

export const orderListQuerySchema = z.object({
  sort: z.enum(["date_desc", "date_asc", "cost_desc", "cost_asc"]).default("date_desc"),
  status: z.enum(["all", "active", "delivered", "cancelled"]).default("all")
});
