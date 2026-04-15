import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { productSchema } from "@/lib/validators";

export const runtime = "nodejs";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

function normalizeCategory(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeCategories(values: string[]): string[] {
  return Array.from(
    new Set(values.map(normalizeCategory).filter((value) => value.length > 0)),
  ).slice(0, 10);
}

function parseCategoriesInput(value: FormDataEntryValue | null): string[] {
  if (typeof value !== "string" || value.trim().length === 0) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) {
      return normalizeCategories(
        parsed.filter((item): item is string => typeof item === "string"),
      );
    }
  } catch {
    // Fallback to comma-separated string if not JSON.
  }

  return normalizeCategories(value.split(","));
}

function parseNumberInput(value: FormDataEntryValue | null): number {
  if (typeof value !== "string") {
    return Number.NaN;
  }

  // Accept mobile/local formats like "2 000", "2000,50" and trim spaces.
  const normalized = value.replace(/\s+/g, "").replace(",", ".").trim();
  if (!normalized) {
    return Number.NaN;
  }

  return Number(normalized);
}

function parseIntegerInput(value: FormDataEntryValue | null): number {
  const parsed = parseNumberInput(value);
  if (!Number.isFinite(parsed)) {
    return Number.NaN;
  }

  return Math.trunc(parsed);
}

async function saveProductImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Le fichier doit etre une image");
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error("Image trop volumineuse (max 5 MB)");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");

  return `data:${file.type};base64,${base64}`;
}

function parseImageVariantsInput(value: FormDataEntryValue | null): string[] {
  if (typeof value !== "string" || value.trim().length === 0) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) {
      return parsed
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  } catch {
    // Fallback to comma-separated entries.
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  const search = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const category = request.nextUrl.searchParams.get("category")?.trim() ?? "";
  const stockStatus = request.nextUrl.searchParams.get("stock")?.trim() ?? "";

  let stockCondition:
    | { gt: number; lte?: number }
    | { equals: number }
    | undefined;

  if (stockStatus === "low") {
    stockCondition = { gt: 0, lte: 8 };
  } else if (stockStatus === "in_stock") {
    stockCondition = { gt: 8 };
  } else if (stockStatus === "out_of_stock") {
    stockCondition = { equals: 0 };
  }

  const products = await prisma.product.findMany({
    where: {
      userId: session.userId,
      ...(category
        ? {
            OR: [
              {
                category: {
                  equals: category,
                  mode: "insensitive",
                },
              },
              {
                categories: {
                  has: category,
                },
              },
            ],
          }
        : {}),
      ...(stockCondition ? { stock: stockCondition } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { sku: { contains: search, mode: "insensitive" } },
              { category: { contains: search, mode: "insensitive" } },
              { categories: { has: search } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  const categorySource = await prisma.product.findMany({
    where: { userId: session.userId },
    select: { category: true, categories: true },
  });

  const availableCategories = Array.from(
    new Set(
      categorySource
        .flatMap((product) => [
          ...(product.categories ?? []),
          product.category ?? "",
        ])
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ).sort((a, b) => a.localeCompare(b, "fr"));

  return NextResponse.json({ data: products, meta: { categories: availableCategories } });
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") ?? "";

  let body: unknown;

  if (contentType.includes("multipart/form-data")) {
    try {
      const formData = await request.formData();
      const fileField = formData.get("imageFile");
      const variantFileFields = formData.getAll("imageVariantFiles");

      let uploadedImageUrl: string | null = null;
      if (fileField instanceof File && fileField.size > 0) {
        try {
          uploadedImageUrl = await saveProductImage(fileField);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Image invalide";
          return NextResponse.json({ error: message }, { status: 400 });
        }
      }

      const uploadedVariants: string[] = [];
      for (const field of variantFileFields) {
        if (!(field instanceof File) || field.size === 0) {
          continue;
        }

        if (uploadedVariants.length >= 4) {
          break;
        }

        try {
          uploadedVariants.push(await saveProductImage(field));
        } catch (error) {
          const message = error instanceof Error ? error.message : "Image variante invalide";
          return NextResponse.json({ error: message }, { status: 400 });
        }
      }

      const nameValue = String(formData.get("name") ?? "").trim();
      const descriptionValue = String(formData.get("description") ?? "").trim();
      const skuValue = String(formData.get("sku") ?? "").trim();
      const unitPriceValue = parseNumberInput(formData.get("unitPrice"));
      const stockValue = parseIntegerInput(formData.get("stock"));
      const manualImageUrl = String(formData.get("imageUrl") ?? "").trim();
      const categoriesValue = parseCategoriesInput(formData.get("categories"));
      const categoryValue = normalizeCategory(String(formData.get("category") ?? ""));
      const imageVariantUrls = parseImageVariantsInput(formData.get("imageVariants"));
      const mergedCategories = normalizeCategories([
        categoryValue,
        ...categoriesValue,
      ]);
      const mergedImageVariants = Array.from(
        new Set([...imageVariantUrls, ...uploadedVariants].map((item) => item.trim()).filter(Boolean)),
      ).slice(0, 4);

      body = {
        name: nameValue,
        category: mergedCategories[0] || undefined,
        categories: mergedCategories,
        description: descriptionValue || undefined,
        sku: skuValue || undefined,
        unitPrice: unitPriceValue,
        stock: stockValue,
        imageUrl: uploadedImageUrl || manualImageUrl || undefined,
        imageVariants: mergedImageVariants,
      };
    } catch {
      return NextResponse.json(
        { error: "Erreur lors du traitement du formulaire" },
        { status: 400 }
      );
    }
  } else {
    body = await request.json().catch(() => null);
  }

  const result = productSchema.safeParse(body);

  if (!result.success) {
    const firstIssue = result.error.issues[0];
    const issuePath = firstIssue?.path?.join(".") || "champ";
    const issueMessage = firstIssue?.message || "Valeur invalide";

    return NextResponse.json(
      { error: `Donnees invalides (${issuePath}: ${issueMessage})` },
      { status: 400 }
    );
  }

  try {
    const product = await prisma.product.create({
      data: {
        userId: session.userId,
        name: result.data.name.trim(),
        category: result.data.category?.trim() || null,
        categories: normalizeCategories(result.data.categories ?? []),
        description: result.data.description?.trim() || null,
        sku: result.data.sku?.trim() || null,
        unitPrice: String(result.data.unitPrice),
        stock: result.data.stock,
        imageUrl: result.data.imageUrl || null,
        imageVariants: result.data.imageVariants ?? [],
      },
    });

    return NextResponse.json({ data: product }, { status: 201 });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la creation du produit" },
      { status: 500 }
    );
  }
}
