import type { IProductListQuery, ProductSortBy, ProductSortOrder } from "@/models";

export type ProductFilters = {
  search: string;
  color: string;
  size: string;
  material: string;
  sortBy: ProductSortBy;
  sortOrder: ProductSortOrder;
};

export const DEFAULT_PRODUCT_LIST_QUERY: IProductListQuery = {
  page: 1,
  limit: 12,
  includeVariants: true,
  sortBy: "id",
  sortOrder: "DESC",
};

export const DEFAULT_PRODUCT_FILTERS: ProductFilters = {
  search: "",
  color: "",
  size: "",
  material: "",
  sortBy: "id",
  sortOrder: "DESC",
};

function normalizeText(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function buildQueryFromFilters(
  filters: ProductFilters,
  baseQuery: IProductListQuery,
): IProductListQuery {
  return {
    ...baseQuery,
    page: 1,
    search: normalizeText(filters.search),
    color: normalizeText(filters.color)?.toLowerCase(),
    size: normalizeText(filters.size)?.toUpperCase(),
    material: normalizeText(filters.material)?.toLowerCase(),
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  };
}

export function getTotalVariantsCount(
  variants?: Array<{ stock: number }> | undefined,
) {
  if (!variants || variants.length === 0) {
    return 0;
  }

  return variants.reduce((total, variant) => total + variant.stock, 0);
}
