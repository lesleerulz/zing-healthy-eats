"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import type { PeoplesChoice } from "@/lib/types";
import ProductCard from "@/components/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Star } from "lucide-react";

export default function PeoplesChoicePage() {
  const [data, setData] = useState<PeoplesChoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi<PeoplesChoice>("/api/peoples-choice")
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-10 w-64 mx-auto" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-xl text-slate-400">Page not available</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-brand-mustard/10 px-4 py-2 rounded-full mb-4">
          <Star className="h-5 w-5 text-brand-mustard fill-brand-mustard" />
          <span className="text-sm font-semibold text-brand-mustard-dark">Featured Collection</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-brand-blue">{data.title}</h1>
        <p className="text-slate-500 mt-2">Hand-picked favorites by our community</p>
      </div>

      {data.products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {data.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <p className="text-center text-slate-400 py-10">No featured products yet.</p>
      )}
    </div>
  );
}
