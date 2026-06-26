import { z } from "zod";

// Shared by the register/edit form (client validation/UX) and the Server Actions
// (authoritative re-validation — TECH-STACK rule 10: validate first, query second).
// US-2.1: full name required; contact optional; notes optional. Email is an
// optional extra (the Client entity carries it) — kept lenient.

export const clientSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "Full name is required")
    .max(120, "Name is too long"),
  contactNumber: z
    .string()
    .trim()
    .max(40, "Contact number is too long")
    .optional()
    .or(z.literal("")),
  email: z.union([z.literal(""), z.email("Enter a valid email")]).optional(),
  notes: z
    .string()
    .trim()
    .max(1000, "Notes are too long")
    .optional()
    .or(z.literal("")),
});

export type ClientFormValues = z.infer<typeof clientSchema>;

export const clientFormDefaults: ClientFormValues = {
  fullName: "",
  contactNumber: "",
  email: "",
  notes: "",
};
