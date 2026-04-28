import { useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";
import { createProductWithImage, updateProduct } from "@/api/products.api";
import { getApiErrorMessage } from "@/lib/api-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { IProduct } from "@/models";

const ALLOWED_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;

type VariantForm = {
  color: string;
  size: string;
  material: string;
  stock: string;
};

const createEmptyVariant = (): VariantForm => ({
  color: "",
  size: "M",
  material: "",
  stock: "0",
});

type CreateMode = {
  mode: "create";
  product?: undefined;
  onCreated: (product: IProduct) => void;
  onUpdated?: undefined;
};

type EditMode = {
  mode: "edit";
  product: IProduct;
  onCreated?: undefined;
  onUpdated: (product: IProduct) => void;
};

type ProductFormDrawerProps = (CreateMode | EditMode) & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ProductFormDrawer({
  open,
  onOpenChange,
  mode,
  product,
  onCreated,
  onUpdated,
}: ProductFormDrawerProps) {
  const isEdit = mode === "edit";

  const [name, setName] = useState(isEdit ? product.name : "");
  const [description, setDescription] = useState(
    isEdit ? product.description : "",
  );
  const [imageUrl, setImageUrl] = useState(
    isEdit ? (product.imageUrl ?? "") : "",
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [variants, setVariants] = useState<VariantForm[]>(
    isEdit && product.variants && product.variants.length > 0
      ? product.variants.map((v) => ({
          color: v.color,
          size: v.size,
          material: v.material,
          stock: String(v.stock),
        }))
      : [createEmptyVariant()],
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when product changes (drawer re-opened with different product)
  const resetForCreate = () => {
    setName("");
    setDescription("");
    setImageUrl("");
    setImageFile(null);
    setVariants([createEmptyVariant()]);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && !isSubmitting) {
      if (!isEdit) resetForCreate();
      onOpenChange(false);
    }
  };

  const updateVariant = (
    index: number,
    key: keyof VariantForm,
    value: string,
  ) => {
    setVariants((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value };
      return next;
    });
  };

  const addVariant = () => {
    setVariants((prev) => [...prev, createEmptyVariant()]);
  };

  const removeVariant = (index: number) => {
    setVariants((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  const validateVariants = (
    normalized: {
      color: string;
      size: string;
      material: string;
      stock: number;
    }[],
  ) => {
    return normalized.every(
      (v) =>
        v.color &&
        v.material &&
        ALLOWED_SIZES.includes(v.size as (typeof ALLOWED_SIZES)[number]) &&
        Number.isInteger(v.stock) &&
        v.stock >= 0,
    );
  };

  const handleCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!imageFile) {
      toast.error("Image is required", {
        description: "Please choose a product image before creating.",
      });
      return;
    }

    const normalizedVariants = variants.map((v) => ({
      color: v.color.trim().toLowerCase(),
      size: v.size.trim().toUpperCase(),
      material: v.material.trim().toLowerCase(),
      stock: Number(v.stock),
    }));

    if (!validateVariants(normalizedVariants)) {
      toast.error("Invalid variant details", {
        description:
          "Check color, material, size, and stock values for each variant.",
      });
      return;
    }

    const payload = new FormData();
    payload.append("name", name.trim());
    payload.append("description", description.trim());
    payload.append("variants", JSON.stringify(normalizedVariants));
    payload.append("image", imageFile);

    setIsSubmitting(true);

    try {
      const promise = createProductWithImage(payload);

      await toast.promise(promise, {
        loading: "Uploading image and creating product...",
        success: (result) => `${result.name} created successfully`,
        error: (error) =>
          getApiErrorMessage(error, "Failed to create product."),
      });

      const created = await promise;
      resetForCreate();
      onOpenChange(false);
      onCreated?.(created);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!product) return;

    const normalizedVariants = variants.map((v) => ({
      color: v.color.trim().toLowerCase(),
      size: v.size.trim().toUpperCase(),
      material: v.material.trim().toLowerCase(),
      stock: Number(v.stock),
    }));

    if (!validateVariants(normalizedVariants)) {
      toast.error("Invalid variant values", {
        description: "Please check size, stock, color, and material values.",
      });
      return;
    }

    const payload = {
      name: name.trim(),
      description: description.trim(),
      ...(imageUrl.trim() ? { imageUrl: imageUrl.trim() } : {}),
      variants: normalizedVariants,
    };

    setIsSubmitting(true);

    try {
      const promise = updateProduct(product.id, payload);

      await toast.promise(promise, {
        loading: "Updating product...",
        success: (result) => `${result.name} updated successfully`,
        error: (error) =>
          getApiErrorMessage(error, "Failed to update product."),
      });

      const updated = await promise;
      onOpenChange(false);
      onUpdated!(updated);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="flex w-1/2 flex-col gap-0 overflow-y-auto p-0 sm:max-w-[50vw]"
      >
        <div className="border-b px-6 py-5">
          <SheetHeader className="p-0">
            <SheetTitle>
              {isEdit ? "Edit product" : "Create product"}
            </SheetTitle>
            <SheetDescription>
              {isEdit
                ? "Update product details and variants. Only admins can perform this action."
                : "Upload an image to Cloudinary and create a product with multiple variants."}
            </SheetDescription>
          </SheetHeader>
        </div>

        <form
          className="flex flex-1 flex-col gap-6 px-6 py-6"
          onSubmit={isEdit ? handleEditSubmit : handleCreateSubmit}
        >
          <div className="grid gap-2">
            <Label htmlFor="drawer-name">Name</Label>
            <Input
              id="drawer-name"
              minLength={2}
              maxLength={120}
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="drawer-description">Description</Label>
            <textarea
              id="drawer-description"
              required
              minLength={10}
              maxLength={2000}
              className="border-input bg-background focus-visible:ring-ring/50 min-h-24 rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 disabled:opacity-50"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {isEdit ? (
            <div className="grid gap-2">
              <Label htmlFor="drawer-image-url">Image URL</Label>
              <Input
                id="drawer-image-url"
                type="url"
                placeholder="https://..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          ) : (
            <div className="grid gap-2">
              <Label htmlFor="drawer-image-file">Image</Label>
              <Input
                id="drawer-image-file"
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                required
                disabled={isSubmitting}
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              />
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Variants</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addVariant}
                disabled={isSubmitting}
              >
                Add variant
              </Button>
            </div>

            {variants.map((variant, index) => (
              <div key={index} className="space-y-3 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Variant {index + 1}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeVariant(index)}
                    disabled={variants.length <= 1 || isSubmitting}
                  >
                    Remove
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor={`drawer-color-${index}`}>Color</Label>
                    <Input
                      id={`drawer-color-${index}`}
                      required
                      maxLength={40}
                      value={variant.color}
                      onChange={(e) =>
                        updateVariant(index, "color", e.target.value)
                      }
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor={`drawer-size-${index}`}>Size</Label>
                    <select
                      id={`drawer-size-${index}`}
                      className="border-input bg-background focus-visible:ring-ring/50 h-9 rounded-md border px-3 text-sm outline-none focus-visible:ring-2 disabled:opacity-50"
                      value={variant.size}
                      onChange={(e) =>
                        updateVariant(index, "size", e.target.value)
                      }
                      disabled={isSubmitting}
                    >
                      {ALLOWED_SIZES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor={`drawer-material-${index}`}>Material</Label>
                    <Input
                      id={`drawer-material-${index}`}
                      required
                      maxLength={40}
                      value={variant.material}
                      onChange={(e) =>
                        updateVariant(index, "material", e.target.value)
                      }
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor={`drawer-stock-${index}`}>Stock</Label>
                    <Input
                      id={`drawer-stock-${index}`}
                      type="number"
                      min={0}
                      max={1_000_000}
                      required
                      value={variant.stock}
                      onChange={(e) =>
                        updateVariant(index, "stock", e.target.value)
                      }
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-auto border-t pt-6">
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting
                ? isEdit
                  ? "Saving..."
                  : "Creating..."
                : isEdit
                  ? "Save changes"
                  : "Create product"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
