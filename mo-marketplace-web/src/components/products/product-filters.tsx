import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from "@/components";
import type { ProductFilters } from "@/lib/products";
import type { ProductSortBy, ProductSortOrder } from "@/models";

type ProductFiltersProps = {
  values: ProductFilters;
  onChange: (next: ProductFilters) => void;
  onApply: () => void;
  onReset: () => void;
  isApplying: boolean;
};

export function ProductFiltersPanel({
  values,
  onChange,
  onApply,
  onReset,
  isApplying,
}: ProductFiltersProps) {
  const update = <K extends keyof ProductFilters>(
    key: K,
    value: ProductFilters[K],
  ) => {
    onChange({ ...values, [key]: value });
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="text-base">Search & Filters</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="product-search">Search</Label>
          <Input
            id="product-search"
            placeholder="Name or description"
            value={values.search}
            onChange={(event) => update("search", event.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-1">
          <div className="space-y-2">
            <Label htmlFor="product-color">Color</Label>
            <Input
              id="product-color"
              placeholder="Black"
              value={values.color}
              onChange={(event) => update("color", event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="product-size">Size</Label>
            <Input
              id="product-size"
              placeholder="M"
              value={values.size}
              onChange={(event) => update("size", event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="product-material">Material</Label>
            <Input
              id="product-material"
              placeholder="Cotton"
              value={values.material}
              onChange={(event) => update("material", event.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <div className="space-y-2">
            <Label htmlFor="sort-by">Sort by</Label>
            <select
              id="sort-by"
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring/50 h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-2"
              value={values.sortBy}
              onChange={(event) =>
                update("sortBy", event.target.value as ProductSortBy)
              }
            >
              <option value="id">Newest</option>
              <option value="name">Name</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sort-order">Order</Label>
            <select
              id="sort-order"
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring/50 h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-2"
              value={values.sortOrder}
              onChange={(event) =>
                update("sortOrder", event.target.value as ProductSortOrder)
              }
            >
              <option value="DESC">Descending</option>
              <option value="ASC">Ascending</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <Button className="flex-1" onClick={onApply} disabled={isApplying}>
            {isApplying ? "Applying..." : "Apply"}
          </Button>
          <Button variant="outline" onClick={onReset} disabled={isApplying}>
            Clear
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
