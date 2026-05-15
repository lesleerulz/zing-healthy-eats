"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import type { PaginatedProducts, Category } from "@/lib/types";
import ProductCard from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

export default function CatalogPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8 space-y-8"><Skeleton className="h-10 w-48" /><div className="grid grid-cols-4 gap-6"><Skeleton className="h-64" /><Skeleton className="h-64" /></div></div>}>
      <CatalogContent />
    </Suspense>
  );
}

function CatalogContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [data, setData] = useState<PaginatedProducts | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const page = Number(searchParams.get("page")) || 1;
  const search = searchParams.get("search") || "";
  const sortBy = searchParams.get("sort_by") || "title";
  const categoryId = searchParams.get("category_id") || "";

  const [searchInput, setSearchInput] = useState(search);

  // Sync search input with URL search param
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("sort_by", sortBy);
      if (search) params.set("search", search);
      if (categoryId) params.set("category_id", categoryId);

      const [productData, catData] = await Promise.all([
        fetchApi<PaginatedProducts>(`/api/products?${params}`),
        fetchApi<Category[]>("/api/categories"),
      ]);
      setData(productData);
      setCategories(catData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, sortBy, categoryId]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    // Reset to page 1 when changing filters.
    if (!("page" in updates)) params.set("page", "1");
    router.push(`/catalog?${params}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({ search: searchInput, page: "1" });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-brand-blue">Our Catalog</h1>
        <p className="text-slate-500 mt-2">
          {search ? `Results for "${search}"` : "Browse all our healthy treats"}
        </p>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-3 mb-8 p-4 bg-white rounded-xl shadow-sm border" data-aos="fade-down" suppressHydrationWarning>
        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="search"
              placeholder="Search products..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" className="bg-brand-blue hover:bg-brand-blue-light">
            Search
          </Button>
        </form>

        {/* Category Filter */}
        <Select value={categoryId || "all"} onValueChange={(v: string | null) => updateParams({ category_id: !v || v === "all" ? "" : v })}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={String(cat.id)}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select value={sortBy} onValueChange={(v: string | null) => v && updateParams({ sort_by: v })}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="title">Name (A-Z)</SelectItem>
            <SelectItem value="price_asc">Price (Low → High)</SelectItem>
            <SelectItem value="price_desc">Price (High → Low)</SelectItem>
            <SelectItem value="newest">Newest First</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-xl" />
          ))}
        </div>
      ) : data && data.products.length > 0 ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {data.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Pagination */}
          {data.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <Button
                variant="outline"
                size="sm"
                disabled={!data.has_prev}
                onClick={() => updateParams({ page: String(page - 1) })}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>

              <span className="text-sm text-slate-500 mx-4">
                Page {data.page} of {data.pages}
              </span>

              <Button
                variant="outline"
                size="sm"
                disabled={!data.has_next}
                onClick={() => updateParams({ page: String(page + 1) })}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20">
          <p className="text-xl text-slate-400">No products found</p>
          {search && (
            <Button
              variant="link"
              onClick={() => {
                setSearchInput("");
                updateParams({ search: "" });
              }}
              className="mt-2 text-brand-mustard"
            >
              Clear search
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
