import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { createProductWithImage } from "@/api/products.api";
import { getApiErrorMessage } from "@/lib/api-error";
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

const ALLOWED_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;

type VariantForm = {
  color: string;
  size: string;
  material: string;
  stock: string;
};

type CreateProductForm = {
  name: string;
  description: string;
  image: File | null;
};

const createEmptyVariant = (): VariantForm => ({
  color: "",
  size: "M",
  material: "",
  stock: "0",
});

const initialForm: CreateProductForm = {
  name: "",
  description: "",
  image: null,
};

export const CreateProduct = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState<CreateProductForm>(initialForm);
  const [variants, setVariants] = useState<VariantForm[]>([
    createEmptyVariant(),
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateVariant = (
    index: number,
    key: keyof VariantForm,
    value: string,
  ) => {
    setVariants((previous) => {
      const next = [...previous];
      next[index] = {
        ...next[index],
        [key]: value,
      };
      return next;
    });
  };

  const addVariant = () => {
    setVariants((previous) => [...previous, createEmptyVariant()]);
  };

  const removeVariant = (index: number) => {
    setVariants((previous) => {
      if (previous.length <= 1) {
        return previous;
      }

      return previous.filter((_, currentIndex) => currentIndex !== index);
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedName = form.name.trim();
    const normalizedDescription = form.description.trim();

    if (!form.image) {
      toast.error("Image is required", {
        description: "Please choose a product image before creating.",
      });
      return;
    }

    if (variants.length === 0) {
      toast.error("Add at least one variant", {
        description: "A product must contain at least one variant.",
      });
      return;
    }

    const normalizedVariants = variants.map((variant) => ({
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
      toast.error("Invalid variant details", {
        description:
          "Check color, material, size, and stock values for each variant.",
      });
      return;
    }

    const payload = new FormData();
    payload.append("name", normalizedName);
    payload.append("description", normalizedDescription);
    payload.append("variants", JSON.stringify(normalizedVariants));
    payload.append("image", form.image);

    setIsSubmitting(true);

    try {
      const createProductPromise = createProductWithImage(payload);

      await toast.promise(createProductPromise, {
        loading: "Uploading image and creating product...",
        success: (result) => `${result.name} created successfully`,
        error: (error) =>
          getApiErrorMessage(error, "Failed to create product."),
      });

      const createdProduct = await createProductPromise;

      setForm(initialForm);
      setVariants([createEmptyVariant()]);
      navigate(`/products/${createdProduct.id}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="mx-auto w-full max-w-2xl text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Create Product
        </h1>
        <p className="text-muted-foreground text-sm">
          Upload an image to Cloudinary and create a product with multiple
          variants.
        </p>
      </div>

      <Card className="mx-auto w-full max-w-2xl">
        <CardHeader>
          <CardTitle>New Product</CardTitle>
          <CardDescription>
            Image will be uploaded to the <strong>mo-marketplace</strong> folder
            in Cloudinary.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form className="grid gap-5" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                minLength={2}
                maxLength={120}
                required
                value={form.name}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    name: event.target.value,
                  }))
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                required
                minLength={10}
                maxLength={2000}
                className="border-input bg-background focus-visible:ring-ring/50 min-h-28 rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2"
                value={form.description}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    description: event.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Variants</Label>
                <Button
                  type="button"
                  variant="outline"
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
                      onClick={() => removeVariant(index)}
                      disabled={variants.length <= 1 || isSubmitting}
                    >
                      Remove
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor={`color-${index}`}>Color</Label>
                      <Input
                        id={`color-${index}`}
                        required
                        maxLength={40}
                        value={variant.color}
                        onChange={(event) =>
                          updateVariant(index, "color", event.target.value)
                        }
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor={`size-${index}`}>Size</Label>
                      <select
                        id={`size-${index}`}
                        className="border-input bg-background focus-visible:ring-ring/50 h-8 rounded-md border px-3 text-sm outline-none focus-visible:ring-2"
                        value={variant.size}
                        onChange={(event) =>
                          updateVariant(index, "size", event.target.value)
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
                      <Label htmlFor={`material-${index}`}>Material</Label>
                      <Input
                        id={`material-${index}`}
                        required
                        maxLength={40}
                        value={variant.material}
                        onChange={(event) =>
                          updateVariant(index, "material", event.target.value)
                        }
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor={`stock-${index}`}>Stock</Label>
                      <Input
                        id={`stock-${index}`}
                        type="number"
                        min={0}
                        max={1_000_000}
                        required
                        value={variant.stock}
                        onChange={(event) =>
                          updateVariant(index, "stock", event.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="image">Image</Label>
              <Input
                id="image"
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                required
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    image: event.target.files?.[0] ?? null,
                  }))
                }
              />
            </div>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create product"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
