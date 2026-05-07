"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Order } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

function statusConfig(status: string) {
  switch (status) {
    case "Paid":
      return { icon: CheckCircle, color: "bg-green-100 text-green-700", label: "Paid" };
    case "Pending":
      return { icon: Clock, color: "bg-yellow-100 text-yellow-700", label: "Pending" };
    case "Awaiting Payment":
      return { icon: AlertCircle, color: "bg-orange-100 text-orange-700", label: "Awaiting" };
    case "Out for Delivery":
      return { icon: Package, color: "bg-blue-100 text-blue-700", label: "Delivering" };
    case "Failed":
      return { icon: XCircle, color: "bg-red-100 text-red-700", label: "Failed" };
    case "Cancelled":
      return { icon: XCircle, color: "bg-slate-100 text-slate-700", label: "Cancelled" };
    default:
      return { icon: Clock, color: "bg-slate-100 text-slate-600", label: status };
  }
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8 max-w-3xl space-y-4"><Skeleton className="h-32 rounded-xl" /></div>}>
      <OrdersContent />
    </Suspense>
  );
}

function OrdersContent() {
  const { user, refreshCart } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    const verifyPaystack = async () => {
      const reference = searchParams.get("reference");
      if (reference) {
        try {
          toast.loading("Verifying payment...", { id: "verify-paystack" });
          const result = await fetchApi<{ status: string }>(`/api/checkout/paystack/verify/${reference}`);
          if (result.status === "Paid") {
            toast.success("Payment verified successfully!", { id: "verify-paystack" });
            refreshCart();
          } else {
            toast.error("Payment verification failed.", { id: "verify-paystack" });
          }
        } catch (err) {
          console.error(err);
          toast.error("An error occurred during verification.", { id: "verify-paystack" });
        }
      }
    };

    const fetchOrders = async () => {
      try {
        const data = await fetchApi<Order[]>("/api/orders");
        setOrders(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    verifyPaystack().then(fetchOrders);
  }, [user, router, searchParams, refreshCart]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold text-brand-blue mb-8">Your Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <Package className="h-16 w-16 mx-auto text-slate-300 mb-4" />
          <p className="text-xl text-slate-400">No orders yet</p>
          <p className="text-slate-500 mt-2">Start shopping to see your orders here!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const config = statusConfig(order.status);
            const StatusIcon = config.icon;

            return (
              <Card key={order.id} className="border shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-brand-blue text-lg">
                        Order #{order.id}
                      </p>
                      <p className="text-xs text-slate-500">
                        {order.created_at
                          ? new Date(order.created_at).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </p>
                    </div>
                    <Badge className={`${config.color} gap-1`}>
                      <StatusIcon className="h-3 w-3" />
                      {config.label}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-slate-600">
                          {item.product_title} × {item.quantity}
                        </span>
                        <span className="text-slate-800 font-medium">
                          KSh {item.subtotal.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t mt-3 pt-3 flex justify-between items-center">
                    <div className="text-sm text-slate-500 space-y-0.5">
                      {order.mpesa_receipt_number && (
                        <p>Receipt: {order.mpesa_receipt_number}</p>
                      )}
                      {order.paystack_reference && (
                        <p className="text-[10px]">Ref: {order.paystack_reference}</p>
                      )}
                    </div>
                    <span className="text-lg font-bold text-brand-blue">
                      KSh {order.total.toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
