export type PaginationParams = { page: number; limit: number; skip: number; };

const ALLOWED_LIMITS = [10, 20, 50] as const;
export const DEFAULT_LIMIT = 20;

export function parsePaginationParams(searchParams: URLSearchParams): PaginationParams {
  const rawPage  = parseInt(searchParams.get("page")  ?? "", 10);
  const rawLimit = parseInt(searchParams.get("limit") ?? "", 10);
  const page  = Number.isFinite(rawPage)  && rawPage  >= 1 ? rawPage  : 1;
  const limit = (ALLOWED_LIMITS as readonly number[]).includes(rawLimit) ? rawLimit : DEFAULT_LIMIT;
  return { page, limit, skip: (page - 1) * limit };
}

export function buildPaginatedResponse<T>(
  items: T[],
  page: number,
  limit: number,
  total: number,
) {
  const totalPages = total > 0 ? Math.ceil(total / limit) : 1;
  return {
    items,
    page,
    limit,
    total,
    totalPages,
    hasNextPage:     page < totalPages,
    hasPreviousPage: page > 1,
  };
}
