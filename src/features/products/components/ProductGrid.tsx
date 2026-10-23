import { Skeleton } from "@/components/ui/skeleton";
import type { Product, ProductAction } from "@/features/products/types/product-list.types";
import ProductCard from "@/features/products/components/ProductCard";

type ProductGridProps = {
  products: Product[];
  selectedIds?: string[];
  onToggle?: (id: string) => void;
  onAction?: (action: ProductAction, product: Product) => void;
};

const gridClass = "grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5";

export default function ProductGrid({ products, selectedIds = [], onToggle, onAction }: ProductGridProps) {
  return (
    <div className={gridClass}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} selected={selectedIds.includes(product.id)} onToggle={onToggle} onAction={onAction} />
      ))}
    </div>
  );
}

export function ProductGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className={gridClass}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <Skeleton className="aspect-square w-full rounded-none" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}
