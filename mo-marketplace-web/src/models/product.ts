export type ProductSortBy = "id" | "name";
export type ProductSortOrder = "ASC" | "DESC";

export interface IVariant {
  id: number;
  color: string;
  size: string;
  material: string;
  stock: number;
}

export interface ICreateVariantPayload {
  color: string;
  size: string;
  material: string;
  stock: number;
}

export interface ICreateProductPayload {
  name: string;
  description: string;
  imageUrl?: string;
  variants: ICreateVariantPayload[];
}

export interface IProduct {
  id: number;
  name: string;
  description: string;
  imageUrl?: string | null;
  variants?: IVariant[];
}

export interface IProductListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface IProductListResponse {
  data: IProduct[];
  meta: IProductListMeta;
}

export interface IProductListQuery {
  page: number;
  limit: number;
  search?: string;
  color?: string;
  size?: string;
  material?: string;
  includeVariants?: boolean;
  sortBy?: ProductSortBy;
  sortOrder?: ProductSortOrder;
}
