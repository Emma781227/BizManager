import { z } from "zod";

export const registerSchema = z.object({
  fullName: z.string().min(2),
  email: z.email(),
  password: z.string().min(8),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export const productSchema = z.object({
  name: z.string().min(2),
  category: z.string().max(120).optional().or(z.literal("")),
  categories: z.array(z.string().min(1).max(120)).max(10).optional(),
  description: z.string().max(1000).optional(),
  sku: z.string().optional(),
  unitPrice: z.number().nonnegative(),
  stock: z.number().int().nonnegative().default(0),
  imageUrl: z
    .union([
      z.string().url(),
      z.string().regex(/^\/uploads\/products\//),
      z.string().regex(/^data:image\//),
      z.string().length(0),
    ])
    .optional(),
});

export const customerSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(8),
  email: z.string().email().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export const orderItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
});

export const orderSchema = z.object({
  customerId: z.string().min(1),
  items: z.array(orderItemSchema).min(1),
  paymentMethod: z
    .enum(["cash", "mobile_money", "bank_transfer", "cod"])
    .optional(),
});

export const orderStatusSchema = z.enum([
  "pending",
  "new",
  "confirmed",
  "in_progress",
  "ready",
  "delivered",
  "cancelled",
]);

export const paymentStatusSchema = z.enum([
  "unpaid",
  "partial",
  "paid",
  "refunded",
]);

export const paymentMethodSchema = z.enum([
  "cash",
  "mobile_money",
  "bank_transfer",
  "cod",
]);

export const shopSchema = z.object({
  slug: z
    .string()
    .min(3)
    .regex(/^[a-z0-9-]+$/i, "Slug invalide"),
  name: z.string().min(2),
  notificationEmail: z.string().email().optional().or(z.literal("")),
  logoUrl: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z
      .union([
        z.string().url(),
        z.string().regex(/^\/uploads\/shops\//),
        z.string().regex(/^data:image\//),
      ])
      .optional(),
  ),
  coverUrl: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z
      .union([
        z.string().url(),
        z.string().regex(/^\/uploads\/shops\//),
        z.string().regex(/^data:image\//),
      ])
      .optional(),
  ),
  description: z.string().max(500).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  whatsappNumber: z.string().min(8),
  category: z.string().max(120).optional().or(z.literal("")),
  address: z.string().max(255).optional().or(z.literal("")),
  openingHours: z.string().max(120).optional().or(z.literal("")),
  isPublished: z.boolean().optional(),
});

export const publicWhatsAppOrderSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive().default(1),
  customerName: z.string().min(2),
  customerPhone: z.string().min(8),
  address: z.string().optional(),
  note: z.string().optional(),
});

export const updateOrderSchema = z
  .object({
    status: orderStatusSchema.optional(),
    paymentStatus: paymentStatusSchema.optional(),
    paymentMethod: paymentMethodSchema.optional(),
    paidAmount: z.number().nonnegative().optional(),
  })
  .refine(
    (value) =>
      value.status ||
      value.paymentStatus ||
      value.paymentMethod ||
      value.paidAmount !== undefined,
    {
      message: "Au moins un champ est requis",
    },
  );
