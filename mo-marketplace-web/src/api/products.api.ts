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

type CreateProductsInBatchesOptions = {
  batchSize?: number;
  onProgress?: (progress: {
    processed: number;
    total: number;
    successCount: number;
    failedCount: number;
  }) => void;
};

export const createProductsInBatches = async (
  payloads: ICreateProductPayload[],
  options?: CreateProductsInBatchesOptions,
) => {
  const total = payloads.length;
  const batchSize = Math.max(1, options?.batchSize ?? 20);
  let processed = 0;
  let successCount = 0;
  let failedCount = 0;

  for (let start = 0; start < payloads.length; start += batchSize) {
    const batch = payloads.slice(start, start + batchSize);

    for (const payload of batch) {
      try {
        await createProduct(payload);
        successCount += 1;
      } catch {
        failedCount += 1;
      } finally {
        processed += 1;
        options?.onProgress?.({
          processed,
          total,
          successCount,
          failedCount,
        });
      }
    }
  }

  return {
    total,
    successCount,
    failedCount,
  };
};
