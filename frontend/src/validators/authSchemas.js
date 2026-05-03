import { z } from "zod";
import validator from "validator";

export const loginSchema = z.object({
  email: z.string().email("Indique um email válido."),
  password: z.string().min(1, "Indique a palavra-passe.")
});

export const registerSchema = z
  .object({
    firstName: z.string().min(2, "Indique o primeiro nome."),
    lastName: z.string().min(2, "Indique o último nome."),
    email: z.string().email("Indique um email válido."),
    phone: z
      .string()
      .refine(
        (value) => validator.isMobilePhone(value, "pt-PT"),
        "Indique um telemóvel português válido."
      ),
    postalCode: z
      .string()
      .refine(
        (value) => validator.isPostalCode(value, "PT"),
        "Indique um código-postal português válido."
      ),
    password: z.string().min(8, "A palavra-passe deve ter pelo menos 8 caracteres."),
    confirmPassword: z.string()
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "As palavras-passe não coincidem."
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Indique um email válido.")
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "A palavra-passe deve ter pelo menos 8 caracteres."),
    confirmPassword: z.string().min(1, "Confirme a palavra-passe.")
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "As palavras-passe não coincidem."
  });
