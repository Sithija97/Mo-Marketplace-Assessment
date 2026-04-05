import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getProductById, quickBuyProduct } from "@/api/products.api";
import { getApiErrorMessage } from "@/lib/api-error";
import { toast } from "sonner";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components";
import type { IProduct, IVariant } from "@/models";

export const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const QUICK_BUY_QUANTITY = 1;

  const [product, setProduct] = useState<IProduct | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isBuying, setIsBuying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const productId = Number(id);
  const isInvalidProductId = !id || Number.isNaN(productId) || productId <= 0;

  useEffect(() => {
    if (isInvalidProductId) {
      setErrorMessage("Invalid product id.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    getProductById(productId)
      .then((res) => {
        setProduct(res);
        const firstVariant = res.variants?.[0] ?? null;
        setSelectedVariantId(firstVariant?.id ?? null);
      })
      .catch(() => {
        setErrorMessage("Product not found or could not be loaded.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isInvalidProductId, productId]);

  const variants = useMemo(() => product?.variants ?? [], [product]);

  const selectedVariant = useMemo<IVariant | null>(() => {
    if (variants.length === 0 || selectedVariantId === null) {
      return null;
    }

    return variants.find((variant) => variant.id === selectedVariantId) ?? null;
  }, [selectedVariantId, variants]);

  const isOutOfStock = (selectedVariant?.stock ?? 0) <= 0;

  const handleQuickBuy = async () => {
    if (!selectedVariant || isOutOfStock || isBuying) {
      return;
    }

    const selectedVariantSnapshot = selectedVariant;
    const productName = product?.name ?? "Product";

    setIsBuying(true);

    try {
      await toast.promise(
        quickBuyProduct(productId, {
          variantId: selectedVariantSnapshot.id,
          quantity: QUICK_BUY_QUANTITY,
        }).then((result) => {
          setProduct((previous) => {
            if (!previous?.variants) {
              return previous;
            }

            return {
              ...previous,
              variants: previous.variants.map((variant) =>
                variant.id === result.variantId
                  ? { ...variant, stock: result.remainingStock }
                  : variant,
              ),
            };
          });

          return result;
        }),
        {
          loading: "Placing your order...",
          success: (result) =>
            `${productName}: ${selectedVariantSnapshot.color} / ${selectedVariantSnapshot.size} / ${selectedVariantSnapshot.material}. Remaining stock: ${result.remainingStock}`,
          error: (error) =>
            getApiErrorMessage(error, "Could not complete quick buy."),
        },
      );
    } finally {
      setIsBuying(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Loading product</CardTitle>
          <CardDescription>Please wait a moment.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="size-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
            Fetching product details...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (errorMessage || !product) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cannot open product</CardTitle>
          <CardDescription>
            {errorMessage ?? "This product is not available."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Go back
          </Button>
          <Button asChild>
            <Link to="/products">Back to products</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {product.name}
          </h1>
          <p className="text-muted-foreground text-sm">
            Product details and variant selection.
          </p>
        </div>

        <Button asChild variant="outline">
          <Link to="/products">Back to products</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Card className="overflow-hidden py-0">
          <div className="bg-muted/40 aspect-4/3 w-full overflow-hidden border-b">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
                No image
              </div>
            )}
          </div>

          <CardHeader className="space-y-2 px-4 pt-4 pb-4">
            <CardTitle className="text-xl">{product.name}</CardTitle>
            <CardDescription className="text-sm leading-6">
              {product.description || "No description provided."}
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Select a variant</CardTitle>
              <CardDescription>
                Choose color, size, and material combination.
              </CardDescription>
            </CardHeader>

            <CardContent className="grid gap-2">
              {variants.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  This product does not have any variants yet.
                </p>
              ) : (
                variants.map((variant) => {
                  const isSelected = selectedVariantId === variant.id;
                  const isVariantOutOfStock = variant.stock <= 0;

                  return (
                    <Button
                      key={variant.id}
                      variant={isSelected ? "default" : "outline"}
                      className="h-auto justify-start px-3 py-2 text-left"
                      onClick={() => setSelectedVariantId(variant.id)}
                    >
                      <span className="truncate">
                        {variant.color} / {variant.size} / {variant.material}
                      </span>
                      <span className="ml-auto text-xs opacity-80">
                        {isVariantOutOfStock
                          ? "Out of stock"
                          : `Stock: ${variant.stock}`}
                      </span>
                    </Button>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Selected variant</CardTitle>
              <CardDescription>
                Current stock and attributes for your selected option.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {selectedVariant ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Color</p>
                      <p className="font-medium capitalize">
                        {selectedVariant.color}
                      </p>
                    </div>

                    <div>
                      <p className="text-muted-foreground">Size</p>
                      <p className="font-medium uppercase">
                        {selectedVariant.size}
                      </p>
                    </div>

                    <div>
                      <p className="text-muted-foreground">Material</p>
                      <p className="font-medium capitalize">
                        {selectedVariant.material}
                      </p>
                    </div>

                    <div>
                      <p className="text-muted-foreground">Stock</p>
                      <p className="font-medium">{selectedVariant.stock}</p>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    disabled={isBuying || isOutOfStock}
                    onClick={handleQuickBuy}
                  >
                    {isOutOfStock
                      ? "Out of stock"
                      : isBuying
                        ? "Processing..."
                        : "Buy now"}
                  </Button>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No variant selected.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
