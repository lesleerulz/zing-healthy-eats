"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import type { PeoplesChoice } from "@/lib/types";
import ProductCard from "@/components/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Snowflake, Sun, Zap, Star, Percent } from "lucide-react";

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

  const getSaleTheme = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes("winter") || t.includes("cold") || t.includes("frost") || t.includes("christmas")) {
      return {
        class: "theme-winter",
        icon: <Snowflake className="h-6 w-6 text-blue-400" />,
        bg: "bg-blue-500/10",
        badge: "Seasonal Winter Offer",
        badgeText: "text-blue-700",
        border: "border-blue-500/20"
      };
    }
    if (t.includes("summer") || t.includes("hot") || t.includes("sun") || t.includes("beach")) {
      return {
        class: "theme-summer",
        icon: <Sun className="h-6 w-6 text-amber-500" />,
        bg: "bg-amber-500/10",
        badge: "Hot Summer Sale",
        badgeText: "text-amber-700",
        border: "border-amber-500/20"
      };
    }
    if (t.includes("black friday") || t.includes("cyber monday") || t.includes("bfcm")) {
      return {
        class: "theme-blackfriday",
        icon: <Zap className="h-6 w-6 text-yellow-500" />,
        bg: "bg-black/5",
        badge: "Black Friday Exclusive",
        badgeText: "text-black",
        border: "border-black/10"
      };
    }
    if (t.includes("sale") || t.includes("discount") || t.includes("offer") || t.includes("clearance")) {
      return {
        class: "theme-promotional",
        icon: <Percent className="h-6 w-6 text-red-500" />,
        bg: "bg-red-500/10",
        badge: "Special Promotion",
        badgeText: "text-red-700",
        border: "border-red-500/20"
      };
    }
    return {
      class: "theme-neutral",
      icon: <Star className="h-6 w-6 text-brand-mustard" />,
      bg: "bg-brand-mustard/10",
      badge: "Exclusive Collection",
      badgeText: "text-brand-mustard-dark",
      border: "border-brand-mustard/20"
    };
  };

  const theme = getSaleTheme(data.title);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-10 relative">
        {/* Decorative Background Icons */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-8 flex gap-8 opacity-20 pointer-events-none">
          <div className="animate-bounce" style={{ animationDuration: '3s' }}>{theme.icon}</div>
          <div className="animate-bounce" style={{ animationDuration: '4s' }}>{theme.icon}</div>
          <div className="animate-bounce" style={{ animationDuration: '3.5s' }}>{theme.icon}</div>
        </div>

        <div className={`inline-flex items-center gap-2 ${theme.bg} px-4 py-2 rounded-full mb-4 border ${theme.border}`}>
          <Percent className={`h-4 w-4 ${theme.badgeText}`} />
          <span className={`text-xs font-bold ${theme.badgeText} uppercase tracking-widest`}>{theme.badge}</span>
        </div>
        
        <h1 className={`text-4xl md:text-6xl font-black ${theme.class} tracking-tight mb-2 drop-shadow-sm`}>
          {data.title}
        </h1>
        <p className="text-slate-400 font-medium italic">Exclusive treats curated just for you</p>
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
