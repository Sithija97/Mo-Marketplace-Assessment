import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  deleteProduct,
  getProductById,
  quickBuyProduct,
  updateProduct,
} from "@/api/products.api";
import { getApiErrorMessage } from "@/lib/api-error";
import { toast } from "sonner";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from "@/components";
import type { IProduct, IVariant } from "@/models";
import { useAuthStore } from "@/store/auth.store";

const ADMIN_ROLE = "admin";
const ALLOWED_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;

type EditableVariant = {
  color: string;
  size: string;
  material: string;
  stock: string;
};

export const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const QUICK_BUY_QUANTITY = 1;

  const [product, setProduct] = useState<IProduct | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    null,
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editVariants, setEditVariants] = useState<EditableVariant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuying, setIsBuying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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
  const isAdmin = user?.role === ADMIN_ROLE;

  const startEditing = () => {
    if (!product) {
      return;
    }

    setEditName(product.name);
    setEditDescription(product.description);
    setEditImageUrl(product.imageUrl ?? "");
    setEditVariants(
      (product.variants ?? []).map((variant) => ({
        color: variant.color,
        size: variant.size,
        material: variant.material,
        stock: String(variant.stock),
      })),
    );
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditVariants([]);
  };

  const updateEditVariant = (
    index: number,
    key: keyof EditableVariant,
    value: string,
  ) => {
    setEditVariants((previous) => {
      const next = [...previous];
      next[index] = { ...next[index], [key]: value };
      return next;
    });
  };

  const addEditVariant = () => {
    setEditVariants((previous) => [
      ...previous,
      { color: "", size: "M", material: "", stock: "0" },
    ]);
  };

  const removeEditVariant = (index: number) => {
    setEditVariants((previous) => {
      if (previous.length <= 1) {
        return previous;
      }

      return previous.filter((_, currentIndex) => currentIndex !== index);
    });
  };

  const handleQuickBuy = async () => {
    if (!selectedVariant || isOutOfStock || isBuying || isAdmin) {
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

  const handleUpdateProduct = async () => {
    if (!product || !isAdmin || isSaving) {
      return;
    }

    const normalizedVariants = editVariants.map((variant) => ({
      color: variant.color.trim().toLowerCase(),
      size: variant.size.trim().toUpperCase(),
      material: variant.material.trim().toLowerCase(),
      stock: Number(variant.stock),
    }));

    const hasInvalidVariant = normalizedVariants.some(
      (variant) =>
        !variant.color ||
        !variant.material ||
        !ALLOWED_SIZES.includes(
          variant.size as (typeof ALLOWED_SIZES)[number],
        ) ||
        !Number.isInteger(variant.stock) ||
        variant.stock < 0,
    );

    if (hasInvalidVariant) {
      toast.error("Invalid variant values", {
        description: "Please check size, stock, color, and material values.",
      });
      return;
    }

    if (normalizedVariants.length === 0) {
      toast.error("At least one variant is required");
      return;
    }

    const payload = {
      name: editName.trim(),
      description: editDescription.trim(),
      ...(editImageUrl.trim() ? { imageUrl: editImageUrl.trim() } : {}),
      variants: normalizedVariants,
    };

    setIsSaving(true);

    try {
      const updatePromise = updateProduct(productId, payload);

      await toast.promise(updatePromise, {
        loading: "Updating product...",
        success: (result) => `${result.name} updated successfully`,
        error: (error) =>
          getApiErrorMessage(error, "Failed to update product."),
      });

      const updatedProduct = await updatePromise;

      setProduct(updatedProduct);
      setSelectedVariantId(updatedProduct.variants?.[0]?.id ?? null);
      setIsEditing(false);
      setEditVariants([]);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!product || !isAdmin || isDeleting) {
      return;
    }

    const confirmed = window.confirm(
      `Delete ${product.name}? This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);

    try {
      const deletePromise = deleteProduct(productId);

      await toast.promise(deletePromise, {
        loading: "Deleting product...",
        success: "Product deleted successfully",
        error: (error) =>
          getApiErrorMessage(error, "Failed to delete product."),
      });

      navigate("/products", { replace: true });
    } finally {
      setIsDeleting(false);
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

        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              {!isEditing ? (
                <Button variant="outline" onClick={startEditing}>
                  Edit product
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={cancelEditing}
                  disabled={isSaving}
                >
                  Cancel edit
                </Button>
              )}

              <Button
                variant="destructive"
                onClick={handleDeleteProduct}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </>
          )}

          <Button asChild variant="outline">
            <Link to="/products">Back to products</Link>
          </Button>
        </div>
      </div>

      {isAdmin && isEditing && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Edit product</CardTitle>
            <CardDescription>
              Update product details and variants. Only admins can perform this
              action.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                minLength={2}
                maxLength={120}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <textarea
                id="edit-description"
                className="border-input bg-background focus-visible:ring-ring/50 min-h-24 rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2"
                value={editDescription}
                onChange={(event) => setEditDescription(event.target.value)}
                minLength={10}
                maxLength={2000}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-image-url">Image URL</Label>
              <Input
                id="edit-image-url"
                type="url"
                placeholder="https://..."
                value={editImageUrl}
                onChange={(event) => setEditImageUrl(event.target.value)}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Variants</Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addEditVariant}
                >
                  Add variant
                </Button>
              </div>

              {editVariants.map((variant, index) => (
                <div
                  key={`${variant.color}-${variant.size}-${index}`}
                  className="space-y-3 rounded-lg border p-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Variant {index + 1}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => removeEditVariant(index)}
                      disabled={editVariants.length <= 1}
                    >
                      Remove
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor={`edit-color-${index}`}>Color</Label>
                      <Input
                        id={`edit-color-${index}`}
                        value={variant.color}
                        onChange={(event) =>
                          updateEditVariant(index, "color", event.target.value)
                        }
                        maxLength={40}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor={`edit-size-${index}`}>Size</Label>
                      <select
                        id={`edit-size-${index}`}
                        className="border-input bg-background focus-visible:ring-ring/50 h-8 rounded-md border px-3 text-sm outline-none focus-visible:ring-2"
                        value={variant.size}
                        onChange={(event) =>
                          updateEditVariant(index, "size", event.target.value)
                        }
                      >
                        {ALLOWED_SIZES.map((sizeOption) => (
                          <option key={sizeOption} value={sizeOption}>
                            {sizeOption}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor={`edit-material-${index}`}>Material</Label>
                      <Input
                        id={`edit-material-${index}`}
                        value={variant.material}
                        onChange={(event) =>
                          updateEditVariant(
                            index,
                            "material",
                            event.target.value,
                          )
                        }
                        maxLength={40}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor={`edit-stock-${index}`}>Stock</Label>
                      <Input
                        id={`edit-stock-${index}`}
                        type="number"
                        min={0}
                        max={1_000_000}
                        value={variant.stock}
                        onChange={(event) =>
                          updateEditVariant(index, "stock", event.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button onClick={handleUpdateProduct} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save changes"}
            </Button>
          </CardContent>
        </Card>
      )}

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

                  {!isAdmin ? (
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
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      Quick buy is available for customer accounts only.
                    </p>
                  )}
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
