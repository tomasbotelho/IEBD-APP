import { ProductCard } from "../product/ProductCard.jsx";
import { Skeleton } from "../ui/Skeleton.jsx";

export const ProductGrid = ({ products = [], loading = false }) => {
  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="surface-card overflow-hidden p-4">
            <Skeleton className="h-52 w-full" />
            <Skeleton className="mt-4 h-4 w-20" />
            <Skeleton className="mt-3 h-6 w-full" />
            <Skeleton className="mt-3 h-4 w-full" />
            <Skeleton className="mt-5 h-10 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};
