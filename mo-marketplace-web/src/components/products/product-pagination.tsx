import { Button } from "@/components";
import type { IProductListMeta } from "@/models";

type ProductPaginationProps = {
  meta: IProductListMeta;
  onPageChange: (page: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  disabled?: boolean;
};

function getPageItems(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: Array<number | "ellipsis"> = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) {
    pages.push("ellipsis");
  }

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (end < totalPages - 1) {
    pages.push("ellipsis");
  }

  pages.push(totalPages);
  return pages;
}

export function ProductPagination({
  meta,
  onPageChange,
  onPrevious,
  onNext,
  disabled,
}: ProductPaginationProps) {
  const totalPages = Math.max(1, meta.totalPages || 1);
  const pageItems = getPageItems(meta.page, totalPages);

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-background px-4 py-3">
      <p className="text-muted-foreground text-sm whitespace-nowrap">
        Page {meta.page} of {totalPages} • {meta.total} products
      </p>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={meta.page <= 1 || disabled}
        >
          First
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevious}
          disabled={!meta.hasPreviousPage || disabled}
        >
          Previous
        </Button>

        {pageItems.map((item, index) =>
          item === "ellipsis" ? (
            <span
              key={`ellipsis-${index}`}
              className="text-muted-foreground px-1 text-sm"
            >
              ...
            </span>
          ) : (
            <Button
              key={item}
              variant={item === meta.page ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(item)}
              disabled={disabled}
              className="min-w-9"
            >
              {item}
            </Button>
          ),
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={!meta.hasNextPage || disabled}
        >
          Next
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={meta.page >= totalPages || disabled}
        >
          Last
        </Button>
      </div>
    </div>
  );
}
