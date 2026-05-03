import { z } from "zod";
import validator from "validator";

export const checkoutSchema = z.object({
  firstName: z.string().min(2, "Indique o primeiro nome."),
  lastName: z.string().min(2, "Indique o último nome."),
  email: z.string().email("Indique um email válido."),
  phone: z
    .string()
    .refine(
      (value) => validator.isMobilePhone(value, "pt-PT"),
      "Indique um telemóvel português válido."
    ),
  street: z.string().min(5, "Indique a rua."),
  district: z.string().min(1, "Selecione o distrito ou ilha."),
  municipalityCode: z.string().min(1, "Selecione o município."),
  parishCode: z.string().min(1, "Selecione a freguesia."),
  postalCode: z
    .string()
    .refine(
      (value) => validator.isPostalCode(value, "PT"),
      "Indique um código-postal válido."
    ),
  notes: z.string().max(500, "As observações não podem exceder 500 caracteres.").optional(),
  paymentMethod: z.enum(["card", "paypal"])
});
