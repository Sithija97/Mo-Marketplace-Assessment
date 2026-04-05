import { useCallback, useEffect, useMemo, useState } from "react";
import { listProducts } from "@/api/products.api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
} from "@/components";
import {
  ProductFiltersPanel,
  ProductGrid,
  ProductPagination,
} from "@/components/products";
import {
  buildQueryFromFilters,
  DEFAULT_PRODUCT_FILTERS,
  DEFAULT_PRODUCT_LIST_QUERY,
  type ProductFilters,
} from "@/lib/products";
import type { IProduct, IProductListMeta } from "@/models";

const emptyMeta: IProductListMeta = {
  page: 1,
  limit: DEFAULT_PRODUCT_LIST_QUERY.limit,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

export const ProductList = () => {
  const [query, setQuery] = useState(DEFAULT_PRODUCT_LIST_QUERY);
  const [filters, setFilters] = useState<ProductFilters>(
    DEFAULT_PRODUCT_FILTERS,
  );
  const [products, setProducts] = useState<IProduct[]>([]);
  const [meta, setMeta] = useState<IProductListMeta>(emptyMeta);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isFiltering = useMemo(
    () => Boolean(query.search || query.color || query.size || query.material),
    [query.color, query.material, query.search, query.size],
  );

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await listProducts(query);
      setProducts(res.data);
      setMeta(res.meta);
    } catch {
      setErrorMessage("Could not load products. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleApplyFilters = () => {
    setQuery((previous) => buildQueryFromFilters(filters, previous));
  };

  const handleClearFilters = () => {
    setFilters(DEFAULT_PRODUCT_FILTERS);
    setQuery((previous) =>
      buildQueryFromFilters(DEFAULT_PRODUCT_FILTERS, previous),
    );
  };

  const handleNextPage = () => {
    if (!meta.hasNextPage) {
      return;
    }

    setQuery((previous) => ({ ...previous, page: previous.page + 1 }));
  };

  const handlePreviousPage = () => {
    if (!meta.hasPreviousPage) {
      return;
    }

    setQuery((previous) => ({ ...previous, page: previous.page - 1 }));
  };

  const handlePageChange = (page: number) => {
    const totalPages = Math.max(1, meta.totalPages || 1);
    const normalizedPage = Math.min(totalPages, Math.max(1, page));

    setQuery((previous) => ({ ...previous, page: normalizedPage }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
        <p className="text-muted-foreground text-sm">
          Explore the marketplace catalog with search and variant filters.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="lg:self-start">
          <ProductFiltersPanel
            values={filters}
            onChange={setFilters}
            onApply={handleApplyFilters}
            onReset={handleClearFilters}
            isApplying={isLoading}
          />
        </aside>

        <div className="h-full">
          <section className="h-full">
            {isLoading ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Loading products</CardTitle>
                  <CardDescription>Please wait a moment.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="size-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
                    Fetching product list...
                  </div>
                </CardContent>
              </Card>
            ) : errorMessage ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Something went wrong
                  </CardTitle>
                  <CardDescription>{errorMessage}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" onClick={fetchProducts}>
                    Retry
                  </Button>
                </CardContent>
              </Card>
            ) : products.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">No products found</CardTitle>
                  <CardDescription>
                    {isFiltering
                      ? "Try adjusting your filters to find more results."
                      : "No products are available right now."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isFiltering && (
                    <Button variant="outline" onClick={handleClearFilters}>
                      Clear filters
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="flex min-h-full flex-col">
                <ProductGrid products={products} />

                <div className="mt-auto">
                  <ProductPagination
                    meta={meta}
                    onPageChange={handlePageChange}
                    onPrevious={handlePreviousPage}
                    onNext={handleNextPage}
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
