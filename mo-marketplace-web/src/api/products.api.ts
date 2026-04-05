import type {
  ICreateProductPayload,
  IProduct,
  IProductListQuery,
  IProductListResponse,
} from "@/models";
import api from "./client";

export interface IQuickBuyPayload {
  variantId: number;
  quantity: number;
}

export interface IQuickBuyResponse {
  message: string;
  productId: number;
  variantId: number;
  quantity: number;
  remainingStock: number;
}

export interface IUpdateProductPayload {
  name?: string;
  description?: string;
  imageUrl?: string;
  variants?: Array<{
    color: string;
    size: string;
    material: string;
    stock: number;
  }>;
}

type QueryValue = string | number | boolean | undefined;

function appendQueryParam(
  params: URLSearchParams,
  key: string,
  value: QueryValue,
) {
  if (value === undefined || value === "") {
    return;
  }

  params.set(key, String(value));
}

export const listProducts = async (query: IProductListQuery) => {
  const params = new URLSearchParams();

  appendQueryParam(params, "page", query.page);
  appendQueryParam(params, "limit", query.limit);
  appendQueryParam(params, "search", query.search);
  appendQueryParam(params, "color", query.color);
  appendQueryParam(params, "size", query.size);
  appendQueryParam(params, "material", query.material);
  appendQueryParam(params, "includeVariants", query.includeVariants);
  appendQueryParam(params, "sortBy", query.sortBy);
  appendQueryParam(params, "sortOrder", query.sortOrder);

  const res = await api.get<IProductListResponse>(
    `/products?${params.toString()}`,
  );

  return res.data;
};

export const createProduct = async (payload: ICreateProductPayload) => {
  const res = await api.post<IProduct>("/products", payload);
  return res.data;
};

export const createProductWithImage = async (payload: FormData) => {
  const res = await api.post<IProduct>("/products/with-image", payload, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
};

export const getProductById = async (id: number) => {
  const res = await api.get<IProduct>(`/products/${id}`);
  return res.data;
};

export const quickBuyProduct = async (
  productId: number,
  payload: IQuickBuyPayload,
) => {
  const res = await api.post<IQuickBuyResponse>(
    `/products/${productId}/quick-buy`,
    payload,
  );

  return res.data;
};

export const updateProduct = async (
  productId: number,
  payload: IUpdateProductPayload,
) => {
  const res = await api.patch<IProduct>(`/products/${productId}`, payload);
  return res.data;
};

export const deleteProduct = async (productId: number) => {
  const res = await api.delete<{ message: string }>(`/products/${productId}`);
  return res.data;
};
