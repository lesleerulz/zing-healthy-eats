"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { productImageUrl } from "@/lib/api";
import type { Product } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { fetchApi } from "@/lib/api";
import { toast } from "sonner";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { user, refreshCart } = useAuth();
  const [saleTitle, setSaleTitle] = useState("People's Choice");

  useEffect(() => {
    fetchApi<{ sale_page_title?: string }>("/api/site-settings")
      .then((settings) => {
        if (settings.sale_page_title) setSaleTitle(settings.sale_page_title);
      })
      .catch(() => {});
  }, []);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error("Please log in to add items to your cart.");
      return;
    }

    try {
      await fetchApi("/api/cart", {
        method: "POST",
        body: JSON.stringify({ product_id: product.id, quantity: 1 }),
      });
      await refreshCart();
      toast.success(`${product.title} added to cart!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add to cart");
    }
  };

  const outOfStock = product.quantity <= 0;
  const hasDiscount = product.original_price && product.original_price > product.price;
  const discountPercentage = hasDiscount 
    ? Math.round(((product.original_price! - product.price) / product.original_price!) * 100) 
    : 0;

  return (
    <Link href={`/catalog/${product.id}`}>
      <Card data-aos="zoom-in" className="group overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2 bg-white rounded-3xl will-change-transform">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-[#F0EDE8] m-2 rounded-2xl">
          <Image
            src={productImageUrl(product.image)}
            alt={product.title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-700 p-2"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            unoptimized
          />
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.is_peoples_choice && (
              <Badge className="bg-zing-burgundy text-white text-[9px] font-bold rounded-full px-2.5 py-0.5 border-0 shadow-lg">
                {saleTitle}
              </Badge>
            )}
            {hasDiscount && (
              <Badge className="bg-red-600 text-white text-[10px] font-black rounded-full px-2.5 py-1 border-0 shadow-md animate-pulse">
                -{discountPercentage}% OFF
              </Badge>
            )}
            {outOfStock && (
              <Badge variant="destructive" className="text-[10px] rounded-full">
                Sold Out
              </Badge>
            )}
          </div>
          {product.category_name && (
            <Badge
              variant="outline"
              className="absolute top-2 right-2 text-[9px] bg-white text-slate-600 font-medium rounded-full border-slate-300 px-2.5 py-0.5"
            >
              {product.category_name}
            </Badge>
          )}
        </div>

        {/* Content */}
        <CardContent className="p-4 pt-2">
          <h3 className="font-bold text-sm text-zing-navy truncate group-hover:text-zing-burgundy transition-colors">
            {product.title}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
            {product.description}
          </p>

          <div className="flex flex-col mt-4">
            {hasDiscount && (
              <span className="text-[10px] text-slate-400 line-through mb-0.5">
                KSh {product.original_price?.toLocaleString()}
              </span>
            )}
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-zing-burgundy">
                KSh {product.price.toLocaleString()}
              </span>

              <Button
                size="sm"
                onClick={handleAddToCart}
                disabled={outOfStock}
                className="bg-zing-yellow text-zing-navy hover:bg-yellow-500 font-bold rounded-full shadow-md text-xs h-9 px-4 flex items-center gap-1.5 group/btn"
              >
                <ShoppingBag strokeWidth={1.5} className="h-3.5 w-3.5" />
                {outOfStock ? "Sold Out" : "Add"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
