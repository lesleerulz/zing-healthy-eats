"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { fetchApi, productImageUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { CartData } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const { user, cart, refreshCart } = useAuth();
  const router = useRouter();
  const [updating, setUpdating] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      refreshCart().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user, refreshCart]);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <ShoppingBag className="h-16 w-16 mx-auto text-slate-300 mb-4" />
        <h1 className="text-2xl font-bold text-brand-blue mb-2">Your Cart</h1>
        <p className="text-slate-500 mb-6">Please log in to view your cart.</p>
        <Link href="/login">
          <Button className="bg-brand-mustard text-brand-blue hover:bg-brand-mustard-dark font-semibold rounded-xl">
            Log In
          </Button>
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <ShoppingBag className="h-16 w-16 mx-auto text-slate-300 mb-4" />
        <h1 className="text-2xl font-bold text-brand-blue mb-2">Your Cart is Empty</h1>
        <p className="text-slate-500 mb-6">Add some healthy treats to get started!</p>
        <Link href="/catalog">
          <Button className="bg-brand-mustard text-brand-blue hover:bg-brand-mustard-dark font-semibold rounded-xl">
            Browse Catalog
          </Button>
        </Link>
      </div>
    );
  }

  const updateQuantity = async (productId: number, quantity: number) => {
    setUpdating(productId);
    try {
      await fetchApi(`/api/cart/${productId}`, {
        method: "PUT",
        body: JSON.stringify({ quantity }),
      });
      await refreshCart();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update cart");
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (productId: number) => {
    setUpdating(productId);
    try {
      await fetchApi(`/api/cart/${productId}`, { method: "DELETE" });
      await refreshCart();
      toast.success("Item removed from cart.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove item");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-brand-blue mb-8">Your Cart</h1>

      <div className="space-y-4">
        {cart.items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-4 p-4 bg-white rounded-xl border shadow-sm"
          >
            {/* Image */}
            {item.product && (
              <Link href={`/catalog/${item.product_id}`} className="flex-shrink-0">
                <div className="relative h-20 w-20 rounded-lg overflow-hidden bg-slate-100">
                  <Image
                    src={productImageUrl(item.product.image)}
                    alt={item.product.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              </Link>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-brand-blue truncate">
                {item.product?.title || "Product"}
              </h3>
              <p className="text-sm text-slate-500">
                KSh {item.product?.price.toLocaleString()} each
              </p>
            </div>

            {/* Quantity */}
            <div className="flex items-center border rounded-lg overflow-hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                disabled={updating === item.product_id || item.quantity <= 1}
                className="h-8 w-8 p-0 rounded-none"
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="px-3 text-sm font-semibold min-w-[2rem] text-center">
                {item.quantity}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                disabled={updating === item.product_id}
                className="h-8 w-8 p-0 rounded-none"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            {/* Subtotal */}
            <p className="text-lg font-bold text-brand-blue min-w-[6rem] text-right">
              KSh {item.subtotal.toLocaleString()}
            </p>

            {/* Remove */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeItem(item.product_id)}
              disabled={updating === item.product_id}
              className="text-red-400 hover:text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Total + Checkout */}
      <div className="mt-8 p-6 bg-white rounded-xl border shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <span className="text-lg text-slate-600">Total</span>
          <span className="text-2xl font-bold text-brand-blue">
            KSh {cart.total.toLocaleString()}
          </span>
        </div>
        <Button
          onClick={() => router.push("/checkout")}
          className="w-full bg-brand-mustard text-brand-blue hover:bg-brand-mustard-dark font-bold rounded-xl shadow-lg text-lg h-12"
        >
          Proceed to Checkout
          <ArrowRight className="h-5 w-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
