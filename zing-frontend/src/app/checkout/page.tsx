"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Phone, CreditCard, Building2, MapPin, Truck } from "lucide-react";
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
  const [deliveryType, setDeliveryType] = useState<"delivery" | "pickup">("delivery");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryLat, setDeliveryLat] = useState<number | null>(null);
  const [deliveryLng, setDeliveryLng] = useState<number | null>(null);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [deliveryMessage, setDeliveryMessage] = useState("");
  const [calculatingLocation, setCalculatingLocation] = useState(false);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "paystack">("mpesa");
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
    if (user?.address && !deliveryAddress) setDeliveryAddress(user.address);
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

  const handleCalculateFee = async (lat: number, lng: number) => {
    setCalculatingLocation(true);
    try {
      const result = await fetchApi<{ fee: number; distance: number; message: string }>("/api/checkout/calculate-delivery", {
        method: "POST",
        body: JSON.stringify({
          delivery_type: deliveryType,
          delivery_lat: lat,
          delivery_lng: lng,
        }),
      });
      setDeliveryFee(result.fee);
      setDeliveryMessage(result.message);
      setDeliveryLat(lat);
      setDeliveryLng(lng);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to calculate delivery fee");
    } finally {
      setCalculatingLocation(false);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setCalculatingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        handleCalculateFee(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        setCalculatingLocation(false);
        console.error(error);
        toast.error("Unable to retrieve your location. We will contact you to arrange delivery.");
        setDeliveryMessage("Location unavailable. We will contact you to arrange delivery and confirm the fee.");
        setDeliveryFee(0);
      }
    );
  };

  const handleContinueToPayment = () => {
    if (deliveryType === "delivery" && !deliveryAddress.trim()) {
      toast.error("Please enter a delivery address.");
      return;
    }
    setStep("payment");
  };

  const handleMpesaCheckout = async () => {
    if (!phone.trim()) {
      toast.error("Phone number is required.");
      return;
    }
    setProcessing(true);
    try {
      const result = await fetchApi<{ message: string; order: any; reference: string }>("/api/checkout/mpesa", {
        method: "POST",
        body: JSON.stringify({
          phone_number: phone,
          save_phone: savePhone,
          delivery_type: deliveryType,
          delivery_address: deliveryAddress,
          delivery_lat: deliveryLat,
          delivery_lng: deliveryLng,
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

  const handlePaystackCheckout = async () => {
    setProcessing(true);
    try {
      const result = await fetchApi<{ authorization_url: string }>("/api/checkout/paystack/initialize", {
        method: "POST",
        body: JSON.stringify({
          delivery_type: deliveryType,
          delivery_address: deliveryAddress,
          delivery_lat: deliveryLat,
          delivery_lng: deliveryLng,
        }),
      });
      // Redirect to Paystack
      window.location.href = result.authorization_url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Paystack initialization failed");
      setProcessing(false);
    }
  };

  const totalAmount = cart.total + (deliveryType === "delivery" ? deliveryFee : 0);

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold text-brand-blue mb-8">Checkout</h1>

      {/* Checkout Steps Indicator */}
      <div className="flex items-center mb-8">
        <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${step === "delivery" ? "bg-brand-mustard text-brand-blue" : "bg-brand-blue text-white"}`}>1</div>
        <div className={`flex-1 h-1 mx-4 ${step === "payment" ? "bg-brand-blue" : "bg-slate-200"}`}></div>
        <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${step === "payment" ? "bg-brand-mustard text-brand-blue" : "bg-slate-200 text-slate-500"}`}>2</div>
      </div>

      {step === "delivery" && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-brand-blue">Delivery Information</h2>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => {
                setDeliveryType("delivery");
                setDeliveryFee(0);
                setDeliveryMessage("");
              }}
              className={`p-4 rounded-xl border-2 text-left transition-all flex flex-col items-center justify-center gap-2 ${
                deliveryType === "delivery"
                  ? "border-brand-mustard bg-brand-mustard/5 shadow-md"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <Truck className={`h-8 w-8 ${deliveryType === "delivery" ? "text-brand-blue" : "text-slate-400"}`} />
              <p className={`font-bold ${deliveryType === "delivery" ? "text-brand-blue" : "text-slate-500"}`}>Home Delivery</p>
            </button>

            <button
              onClick={() => {
                setDeliveryType("pickup");
                setDeliveryFee(0);
                setDeliveryMessage("Pickup is free at our Nairobi CBD station.");
              }}
              className={`p-4 rounded-xl border-2 text-left transition-all flex flex-col items-center justify-center gap-2 ${
                deliveryType === "pickup"
                  ? "border-brand-mustard bg-brand-mustard/5 shadow-md"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <Building2 className={`h-8 w-8 ${deliveryType === "pickup" ? "text-brand-blue" : "text-slate-400"}`} />
              <p className={`font-bold ${deliveryType === "pickup" ? "text-brand-blue" : "text-slate-500"}`}>Pickup Station</p>
            </button>
          </div>

          {deliveryType === "delivery" && (
            <Card className="border shadow-sm border-brand-mustard/30">
              <CardContent className="pt-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">
                    Street Address / Building / Landmark
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="e.g. Westlands, Nairobi"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <p className="text-sm text-blue-800 mb-3">
                    We calculate delivery fees based on your distance from our store. (0-5km: KSh 250, 5-10km: KSh 350)
                  </p>
                  <Button 
                    onClick={handleGetLocation} 
                    disabled={calculatingLocation}
                    variant="outline"
                    className="w-full bg-white border-blue-200 text-blue-600 hover:bg-blue-50"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    {calculatingLocation ? "Calculating..." : "Get Location & Calculate Fee"}
                  </Button>

                  {deliveryMessage && (
                    <div className="mt-3 p-3 bg-white rounded-md border border-blue-100 text-sm text-slate-700 font-medium">
                      {deliveryMessage}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {deliveryType === "pickup" && (
            <Card className="border shadow-sm border-brand-mustard/30 bg-brand-mustard/5">
              <CardContent className="pt-6">
                <p className="text-sm text-brand-blue font-medium leading-relaxed">
                  You can pick up your order from our main station located in Nairobi CBD. 
                  <br /><br />
                  <strong>Fee:</strong> Free
                </p>
              </CardContent>
            </Card>
          )}

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

      {step === "payment" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-brand-blue">Payment</h2>
            <Button variant="ghost" onClick={() => setStep("delivery")} className="text-sm text-slate-500">
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
                  <span className="font-medium">KSh {item.subtotal.toLocaleString()}</span>
                </div>
              ))}
              <div className="border-t pt-3 mt-3 flex justify-between text-sm">
                <span className="text-slate-600">Delivery ({deliveryType})</span>
                <span className="font-medium">KSh {deliveryType === "delivery" ? deliveryFee.toLocaleString() : "0"}</span>
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
                <p className="text-[10px] text-slate-500 mt-1">STK Push via Paystack</p>
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
                <p className="font-semibold text-brand-blue text-sm">Card/Other</p>
                <p className="text-[10px] text-slate-500 mt-1">Via Paystack</p>
              </button>
            </div>

            {/* Paystack Form */}
            {paymentMethod === "paystack" && (
              <Card className="border shadow-sm">
                <CardContent className="pt-6 space-y-4">
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <p className="text-sm text-slate-600 leading-relaxed">
                      You will be redirected to <strong>Paystack</strong> to securely complete your payment using Card, Bank Transfer, or other available methods.
                    </p>
                  </div>

                  <Button
                    onClick={handlePaystackCheckout}
                    disabled={processing}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl h-12 text-base"
                  >
                    <CreditCard className="h-5 w-5 mr-2" />
                    {processing ? "Redirecting..." : `Pay KSh ${totalAmount.toLocaleString()}`}
                  </Button>
                </CardContent>
              </Card>
            )}

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
                    {processing ? "Processing..." : `Pay KSh ${totalAmount.toLocaleString()}`}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
