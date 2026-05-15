"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { fetchApi, productImageUrl } from "@/lib/api";
import type { Product } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingBag, Minus, Plus, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function ProductDetailPage() {
  const params = useParams();
  const { user, refreshCart } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchApi<Product>(`/api/products/${params.id}`)
      .then(setProduct)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleAddToCart = async () => {
    if (!user) {
      toast.error("Please log in to add items to your cart.");
      return;
    }
    setAdding(true);
    try {
      await fetchApi("/api/cart", {
        method: "POST",
        body: JSON.stringify({ product_id: product!.id, quantity }),
      });
      await refreshCart();
      toast.success(`${product!.title} added to cart!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add to cart");
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <Skeleton className="aspect-square rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-slate-400">Product not found</h1>
      </div>
    );
  }

  const allImages = [product.image, ...product.images.filter((img) => img !== product.image)];
  const outOfStock = product.quantity <= 0;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org/",
            "@type": "Product",
            "name": product.title,
            "image": [productImageUrl(product.image)],
            "description": product.description,
            "offers": {
              "@type": "Offer",
              "url": typeof window !== "undefined" ? `${window.location.origin}/catalog/${product.id}` : "",
              "priceCurrency": "KES",
              "price": product.price,
              "availability": outOfStock ? "https://schema.org/OutOfStock" : "https://schema.org/InStock"
            }
          })
        }}
      />

      {/* Back */}
      <Link
        href="/catalog"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-blue mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Catalog
      </Link>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 shadow-lg">
            <Image
              src={productImageUrl(allImages[selectedImage])}
              alt={product.title}
              fill
              className="object-cover"
              priority
              unoptimized
            />
          </div>
          {allImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`relative h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                    idx === selectedImage
                      ? "border-brand-mustard shadow-md"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={productImageUrl(img)}
                    alt={`${product.title} ${idx + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {product.category_name && (
                <Badge variant="secondary">{product.category_name}</Badge>
              )}
              {product.is_peoples_choice && (
                <Badge className="bg-brand-mustard text-brand-blue font-semibold">
                  ⭐ People&apos;s Choice
                </Badge>
              )}
            </div>
            <h1 className="text-3xl font-bold text-brand-blue">{product.title}</h1>
          </div>

          <p className="text-2xl font-bold text-brand-blue">
            KSh {product.price.toLocaleString()}
          </p>

          <p className="text-slate-600 leading-relaxed">{product.description}</p>

          <div className="text-sm text-slate-500">
            {outOfStock ? (
              <span className="text-red-500 font-semibold">Out of Stock</span>
            ) : (
              <span>{product.quantity} items in stock</span>
            )}
          </div>

          {/* Quantity + Add to Cart */}
          <div className="flex items-center gap-4">
            <div className="flex items-center border rounded-xl overflow-hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={outOfStock}
                className="rounded-none"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="px-4 py-2 font-semibold text-brand-blue min-w-[3rem] text-center">
                {quantity}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setQuantity((q) => Math.min(product.quantity, q + 1))}
                disabled={outOfStock}
                className="rounded-none"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <Button
              onClick={handleAddToCart}
              disabled={outOfStock || adding}
              className="flex-1 bg-brand-mustard text-brand-blue hover:bg-brand-mustard-dark font-bold rounded-xl shadow-lg text-base h-12"
            >
              <ShoppingBag className="h-5 w-5 mr-2" />
              {adding ? "Adding..." : outOfStock ? "Out of Stock" : "Add to Cart"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
