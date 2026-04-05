type ProtectedLayoutFooterProps = {
  year: number;
  brandName: string;
};

export function ProtectedLayoutFooter({
  year,
  brandName,
}: ProtectedLayoutFooterProps) {
  return (
    <footer className="border-t bg-background/70">
      <div className="mx-auto w-full max-w-6xl px-4 py-3 text-center text-xs text-muted-foreground sm:px-6">
        {"\u00A9"} {year} {brandName}
      </div>
    </footer>
  );
}
