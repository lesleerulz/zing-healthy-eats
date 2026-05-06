"use client";

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

  return (
    <Link href={`/catalog/${product.id}`}>
      <Card data-aos="zoom-in" className="group overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2 bg-white rounded-3xl">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-[#F9F9F9] m-2 rounded-2xl">
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
              <div className="bg-brand-burgundy text-white w-10 h-10 rounded-full flex items-center justify-center text-[8px] font-bold text-center leading-tight shadow-lg border border-white/20">
                People's Choice
              </div>
            )}
            {outOfStock && (
              <Badge variant="destructive" className="text-[10px] rounded-full">
                Sold Out
              </Badge>
            )}
          </div>
          {product.category_name && (
            <Badge
              variant="secondary"
              className="absolute top-2 right-2 text-[9px] bg-slate-100/80 backdrop-blur-sm text-slate-600 font-medium rounded-full border-0 px-2"
            >
              {product.category_name}
            </Badge>
          )}
        </div>

        {/* Content */}
        <CardContent className="p-4 pt-2">
          <h3 className="font-bold text-sm text-brand-blue truncate group-hover:text-brand-burgundy transition-colors">
            {product.title}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
            {product.description}
          </p>

          <div className="flex items-center justify-between mt-4">
            <span className="text-base font-bold text-brand-burgundy">
              KSh {product.price.toLocaleString()}
            </span>

            <Button
              size="sm"
              onClick={handleAddToCart}
              disabled={outOfStock}
              className="bg-brand-mustard text-brand-blue hover:bg-brand-mustard-dark font-bold rounded-xl shadow-md text-xs h-9 px-4 flex items-center gap-1 group/btn"
            >
              <div className="bg-brand-blue/10 rounded-md p-0.5 group-hover/btn:bg-brand-blue/20 transition-colors">
                <ShoppingBag className="h-3 w-3" />
              </div>
              {outOfStock ? "Sold Out" : "Add"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
