import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components";
import { Link } from "react-router-dom";
import { getTotalVariantsCount } from "@/lib/products";
import type { IProduct } from "@/models";

type ProductCardProps = {
  product: IProduct;
};

export function ProductCard({ product }: ProductCardProps) {
  const totalStock = getTotalVariantsCount(product.variants);

  return (
    <Link to={`/products/${product.id}`} className="block h-full">
      <Card className="h-full overflow-hidden py-0 transition-shadow hover:shadow-md">
      <div className="bg-muted/40 aspect-4/3 w-full overflow-hidden border-b">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
            No image
          </div>
        )}
      </div>

      <CardHeader className="space-y-2 px-4 pt-4">
        <CardTitle className="line-clamp-1 text-base">{product.name}</CardTitle>
        <CardDescription className="line-clamp-2 min-h-10">
          {product.description || "No description provided."}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex items-center justify-between px-4 pb-4 text-xs">
        <span className="text-muted-foreground">
          {product.variants?.length ?? 0} variants
        </span>
        <span className="rounded-full border px-2 py-1 font-medium">Stock: {totalStock}</span>
      </CardContent>
      </Card>
    </Link>
  );
}
