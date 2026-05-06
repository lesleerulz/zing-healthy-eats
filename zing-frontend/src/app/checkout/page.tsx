"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { CartData } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Phone, CreditCard, Building2 } from "lucide-react";
import { toast } from "sonner";

export default function CheckoutPage() {
  const { user, cart, refreshCart } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "till">("mpesa");
  const [phone, setPhone] = useState("");
  const [savePhone, setSavePhone] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    refreshCart().finally(() => setLoading(false));
  }, [user, router, refreshCart]);

  useEffect(() => {
    if (user?.saved_phone) setPhone(user.saved_phone);
  }, [user]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    router.push("/cart");
    return null;
  }

  const handleMpesaCheckout = async () => {
    if (!phone.trim()) {
      toast.error("Phone number is required.");
      return;
    }
    setProcessing(true);
    try {
      const result = await fetchApi<{ message: string }>("/api/checkout/mpesa", {
        method: "POST",
        body: JSON.stringify({
          phone_number: phone,
          save_phone: savePhone,
        }),
      });
      toast.success(result.message);
      await refreshCart();
      router.push("/orders");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setProcessing(false);
    }
  };

  const handleTillCheckout = async () => {
    setProcessing(true);
    try {
      const result = await fetchApi<{ message: string }>("/api/checkout/till", {
        method: "POST",
        body: JSON.stringify({}),
      });
      toast.success(result.message);
      await refreshCart();
      router.push("/orders");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold text-brand-blue mb-8">Checkout</h1>

      {/* Order Summary */}
      <Card className="mb-6 border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {cart.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-slate-600">
                {item.product?.title} × {item.quantity}
              </span>
              <span className="font-medium">KSh {item.subtotal.toLocaleString()}</span>
            </div>
          ))}
          <div className="border-t pt-3 mt-3 flex justify-between">
            <span className="text-lg font-semibold">Total</span>
            <span className="text-lg font-bold text-brand-blue">
              KSh {cart.total.toLocaleString()}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-brand-blue">Payment Method</h2>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setPaymentMethod("mpesa")}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              paymentMethod === "mpesa"
                ? "border-brand-mustard bg-brand-mustard/5 shadow-md"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <Phone className="h-6 w-6 text-brand-green mb-2" />
            <p className="font-semibold text-brand-blue">M-Pesa STK Push</p>
            <p className="text-xs text-slate-500 mt-1">Pay instantly from your phone</p>
          </button>

          <button
            onClick={() => setPaymentMethod("till")}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              paymentMethod === "till"
                ? "border-brand-mustard bg-brand-mustard/5 shadow-md"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <Building2 className="h-6 w-6 text-brand-blue mb-2" />
            <p className="font-semibold text-brand-blue">Pay via Till</p>
            <p className="text-xs text-slate-500 mt-1">Till Number: 4243516</p>
          </button>
        </div>

        {/* M-Pesa Form */}
        {paymentMethod === "mpesa" && (
          <Card className="border shadow-sm">
            <CardContent className="pt-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  M-Pesa Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="tel"
                    placeholder="0712345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={savePhone}
                  onChange={(e) => setSavePhone(e.target.checked)}
                  className="rounded"
                />
                Save phone number for future checkouts
              </label>

              <Button
                onClick={handleMpesaCheckout}
                disabled={processing}
                className="w-full bg-brand-green hover:bg-brand-green/90 text-white font-bold rounded-xl h-12 text-base"
              >
                <CreditCard className="h-5 w-5 mr-2" />
                {processing ? "Processing..." : `Pay KSh ${cart.total.toLocaleString()}`}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Till Instructions */}
        {paymentMethod === "till" && (
          <Card className="border shadow-sm">
            <CardContent className="pt-6 space-y-4">
              <div className="bg-brand-blue/5 p-4 rounded-lg">
                <p className="text-sm text-slate-600 leading-relaxed">
                  <strong>Instructions:</strong> Go to M-Pesa on your phone, select{" "}
                  <strong>Lipa na M-Pesa</strong> → <strong>Buy Goods and Services</strong>{" "}
                  → Enter Till Number <strong className="text-brand-blue">4243516</strong>{" "}
                  → Amount{" "}
                  <strong className="text-brand-blue">
                    KSh {cart.total.toLocaleString()}
                  </strong>
                </p>
              </div>

              <Button
                onClick={handleTillCheckout}
                disabled={processing}
                className="w-full bg-brand-mustard text-brand-blue hover:bg-brand-mustard-dark font-bold rounded-xl h-12 text-base"
              >
                {processing ? "Processing..." : "I Have Paid — Place Order"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
