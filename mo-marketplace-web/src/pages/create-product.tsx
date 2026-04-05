import { useState } from "react";
import { createProductsInBatches } from "@/api/products.api";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components";
import type { ICreateProductPayload } from "@/models";

type SeedProgress = {
  processed: number;
  total: number;
  successCount: number;
  failedCount: number;
};

const initialProgress: SeedProgress = {
  processed: 0,
  total: 0,
  successCount: 0,
  failedCount: 0,
};

export const CreateProduct = () => {
  const [isSeeding, setIsSeeding] = useState(false);
  const [progress, setProgress] = useState<SeedProgress>(initialProgress);
  const [message, setMessage] = useState<string | null>(null);

  const handleSeedProducts = async () => {
    setIsSeeding(true);
    setMessage(null);
    setProgress(initialProgress);

    try {
      const response = await fetch("/seed-products-200.json");

      if (!response.ok) {
        throw new Error("Could not load seed file.");
      }

      const products = (await response.json()) as ICreateProductPayload[];

      if (!Array.isArray(products) || products.length === 0) {
        throw new Error("Seed file is empty or invalid.");
      }

      const result = await createProductsInBatches(products, {
        batchSize: 20,
        onProgress: (nextProgress) => setProgress(nextProgress),
      });

      setMessage(
        `Seeding finished. Created ${result.successCount} of ${result.total} products. Failed: ${result.failedCount}.`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to seed products. Please try again.";
      setMessage(errorMessage);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Create Products</CardTitle>
          <CardDescription>
            Testing utility page to seed products from your local dataset.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Button onClick={handleSeedProducts} disabled={isSeeding}>
            {isSeeding ? "Adding products..." : "Add Products"}
          </Button>

          {(isSeeding || progress.total > 0) && (
            <div className="text-sm text-muted-foreground">
              Processed {progress.processed}/{progress.total} • Success:{" "}
              {progress.successCount} • Failed: {progress.failedCount}
            </div>
          )}

          {message && (
            <p className="text-sm text-muted-foreground">{message}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
