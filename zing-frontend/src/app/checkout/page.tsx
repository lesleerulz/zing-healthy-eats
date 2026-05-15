"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Phone,
  CreditCard,
  Building2,
  Truck,
  MapPin,
  Navigation,
  ShieldCheck,
  Loader2,
  Info,
} from "lucide-react";
import { toast } from "sonner";

type CheckoutStep = "delivery" | "payment";

export default function CheckoutPage() {
  const { user, cart, refreshCart } = useAuth();
  const router = useRouter();

  // App state
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState<CheckoutStep>("delivery");

  // Delivery State
  const [deliveryType] = useState<"pickup">("pickup");
  const [deliveryAddress] = useState("Pickup Station - Nairobi CBD");
  const [deliveryFee] = useState<number>(0);


  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "paystack">(
    "mpesa"
  );

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    refreshCart().finally(() => setLoading(false));
  }, [user, router, refreshCart]);



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


  // ─── Continue to Payment Step ──────────────────────────
  const handleContinueToPayment = () => {
    setStep("payment");
  };


  // ─── Checkout Handlers ─────────────────────────────────
  const handleCheckout = async (method: "mpesa" | "card") => {
    setProcessing(true);
    try {
      const result = await fetchApi<{ authorization_url: string }>(
        "/api/checkout/paystack/initialize",
        {
          method: "POST",
          body: JSON.stringify({
            delivery_type: "pickup",
            delivery_address: "Pickup Station - Nairobi CBD",
            method,
          }),
        }
      );
      // Redirect to Paystack
      window.location.href = result.authorization_url;
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Payment initialization failed"
      );
      setProcessing(false);
    }
  };

  const totalAmount = cart.total;


  // If user is logged in but not verified, show a warning (placed after all hooks)
  if (user && !user.is_verified && !loading) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md shadow-xl border-t-4 border-brand-mustard">
          <CardHeader className="text-center">
            <div className="mx-auto h-16 w-16 bg-brand-mustard/10 rounded-full flex items-center justify-center mb-4">
              <ShieldCheck className="h-8 w-8 text-brand-mustard" />
            </div>
            <CardTitle className="text-2xl text-brand-blue">Verification Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <p className="text-slate-600 leading-relaxed">
              To ensure a secure shopping experience, please verify your email address 
              (<span className="font-semibold">{user.email}</span>) before placing an order.
            </p>
            
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3 text-left">
              <Info className="h-5 w-5 text-brand-blue shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-brand-blue mb-1">Check your inbox</p>
                <p className="text-xs text-slate-600">
                  We sent a 6-digit code to your email. <strong>Don't forget to check your spam or junk folder</strong> if you don't see it!
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={() => router.push("/verify-email")}
                className="w-full bg-brand-blue hover:bg-brand-blue/90 text-white font-bold rounded-xl h-12"
              >
                Go to Verification Page
              </Button>
              <Button 
                variant="ghost"
                onClick={() => router.push("/cart")}
                className="w-full text-slate-400 hover:text-slate-600"
              >
                Back to Cart
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold text-brand-blue mb-8">Checkout</h1>

      {/* Checkout Steps Indicator */}
      <div className="flex items-center mb-8">
        <div className="flex flex-col items-center">
          <div
            className={`flex items-center justify-center w-9 h-9 rounded-full font-bold text-sm transition-colors ${
              step === "delivery"
                ? "bg-brand-mustard text-brand-blue shadow-md"
                : "bg-brand-blue text-white"
            }`}
          >
            1
          </div>
          <span className="text-[10px] mt-1 text-slate-500 font-medium">
            Info
          </span>
        </div>
        <div
          className={`flex-1 h-0.5 mx-3 rounded transition-colors ${
            step === "payment" ? "bg-brand-blue" : "bg-slate-200"
          }`}
        />
        <div className="flex flex-col items-center">
          <div
            className={`flex items-center justify-center w-9 h-9 rounded-full font-bold text-sm transition-colors ${
              step === "payment"
                ? "bg-brand-mustard text-brand-blue shadow-md"
                : "bg-slate-200 text-slate-500"
            }`}
          >
            2
          </div>
          <span className="text-[10px] mt-1 text-slate-500 font-medium">
            Payment
          </span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/*  STEP 1: DELIVERY                                   */}
      {/* ═══════════════════════════════════════════════════ */}
      {step === "delivery" && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-brand-blue">
            Collection Information
          </h2>



          <Card className="border shadow-sm border-brand-mustard/30 bg-brand-mustard/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-brand-mustard/20 flex items-center justify-center shrink-0">
                    <MapPin className="h-5 w-5 text-brand-blue" />
                  </div>
                  <div>
                    <p className="text-sm text-brand-blue font-semibold mb-1">
                      Pickup Station — Nairobi CBD
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      You can pick up your order from our main station. We will
                      notify you when it is ready.
                    </p>
                    <p className="text-sm font-bold text-brand-green mt-2">
                      Fee: Free
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

          {/* Continue Button */}
          <div className="pt-4 flex justify-end">
            <Button
              onClick={handleContinueToPayment}
              className="bg-brand-blue hover:bg-brand-blue/90 text-white font-bold rounded-xl px-8 h-12"
            >
              Continue to Payment
            </Button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/*  STEP 2: PAYMENT                                    */}
      {/* ═══════════════════════════════════════════════════ */}
      {step === "payment" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-brand-blue">Payment</h2>
            <Button
              variant="ghost"
              onClick={() => setStep("delivery")}
              className="text-sm text-slate-500"
            >
              &larr; Back to Delivery
            </Button>
          </div>

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
                  <span className="font-medium">
                    KSh {item.subtotal.toLocaleString()}
                  </span>
                </div>
              ))}

              {/* Collection info */}
              <div className="border-t pt-3 mt-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5" />
                    Pickup (Free)
                  </span>
                  <span className="font-medium text-brand-green">
                    KSh 0
                  </span>
                </div>
                <p className="text-xs text-slate-400 ml-5">
                  Nairobi CBD Collection Station
                </p>
              </div>

              <div className="border-t pt-3 mt-3 flex justify-between">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-lg font-bold text-brand-blue">
                  KSh {totalAmount.toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <div className="space-y-4">
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
                <p className="font-semibold text-brand-blue text-sm">M-Pesa</p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Hosted Checkout
                </p>
              </button>

              <button
                onClick={() => setPaymentMethod("paystack")}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  paymentMethod === "paystack"
                    ? "border-brand-mustard bg-brand-mustard/5 shadow-md"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <CreditCard className="h-6 w-6 text-orange-500 mb-2" />
                <p className="font-semibold text-brand-blue text-sm">
                  Card/Other
                </p>
                <p className="text-[10px] text-slate-500 mt-1">Via Paystack</p>
              </button>
            </div>

            <Card className="border shadow-sm">
              <CardContent className="pt-6 space-y-4">
                <div className="bg-brand-blue/5 p-4 rounded-xl border border-brand-blue/10">
                  <p className="text-sm text-slate-600 leading-relaxed">
                    You will be redirected to <strong>Paystack</strong> to
                    securely complete your payment using {paymentMethod === "mpesa" ? "M-Pesa" : "Card, Bank Transfer, or other methods"}.
                  </p>
                </div>

                <Button
                  onClick={() => handleCheckout(paymentMethod === "mpesa" ? "mpesa" : "card")}
                  disabled={processing}
                  className="w-full bg-brand-blue hover:bg-brand-blue/90 text-white font-bold rounded-xl h-12 text-base shadow-lg shadow-brand-blue/20"
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Redirecting to Paystack...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5 mr-2" />
                      {`Pay KSh ${totalAmount.toLocaleString()}`}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
