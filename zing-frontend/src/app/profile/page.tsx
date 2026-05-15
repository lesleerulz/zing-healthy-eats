"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Mail,
  Phone,
  Shield,
  Package,
  ShieldCheck,
  Clock,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import AddressSearch, { type AddressResult } from "@/components/address-search";

const OTP_DURATION_SECS = 10 * 60; // 10 minutes

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [savedPhone, setSavedPhone] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);

  // Verification state
  const [verifyCode, setVerifyCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    setUsername(user.username);
    setEmail(user.email);
    setSavedPhone(user.saved_phone || "");
    setAddress(user.address || "");
  }, [user, router]);

  // Timer cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSecondsLeft(OTP_DURATION_SECS);
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const isExpired = codeSent && secondsLeft === 0;

  const timerColor =
    secondsLeft > 120
      ? "text-green-600"
      : secondsLeft > 30
        ? "text-amber-500"
        : "text-red-500";

  // Send / resend verification code
  const handleSendCode = async () => {
    setResending(true);
    try {
      await fetchApi("/api/auth/verify/resend", { method: "POST" });
      toast.success("Verification code sent to your email!");
      setCodeSent(true);
      setVerifyCode("");
      startTimer();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to send code"
      );
    } finally {
      setResending(false);
    }
  };

  // Verify the OTP code
  const handleVerify = async () => {
    if (verifyCode.trim().length !== 6) {
      toast.error("Please enter the full 6-digit code.");
      return;
    }
    if (!user?.email) return;

    setVerifying(true);
    try {
      const res = await fetchApi<{ message: string }>(
        "/api/auth/verify-email",
        {
          method: "POST",
          body: JSON.stringify({ email: user.email, code: verifyCode.trim() }),
        }
      );
      toast.success(res.message || "Email verified!");
      if (timerRef.current) clearInterval(timerRef.current);
      await refreshUser();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Verification failed."
      );
    } finally {
      setVerifying(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetchApi("/api/auth/profile", {
        method: "PUT",
        body: JSON.stringify({
          username,
          email,
          saved_phone: savedPhone,
          address,
        }),
      });
      await refreshUser();
      toast.success("Profile updated!");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update profile"
      );
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold text-brand-blue mb-8">Your Profile</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Card className="border shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-brand-mustard/10 flex items-center justify-center">
              <Package className="h-5 w-5 text-brand-mustard" />
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-blue">
                {user.orders_count || 0}
              </p>
              <p className="text-xs text-slate-500">Total Orders</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-brand-blue/10 flex items-center justify-center">
              {user.is_verified ? (
                <ShieldCheck className="h-5 w-5 text-green-600" />
              ) : (
                <Shield className="h-5 w-5 text-brand-blue" />
              )}
            </div>
            <div>
              <Badge
                className={
                  user.is_verified
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }
              >
                {user.is_verified ? "Verified" : "Unverified"}
              </Badge>
              <p className="text-xs text-slate-500 mt-1">
                {user.last_order_date
                  ? `Last order: ${user.last_order_date}`
                  : "No orders yet"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Email Verification Card (shown only if unverified) ── */}
      {!user.is_verified && (
        <Card className="border-2 border-amber-300 bg-amber-50/50 shadow-sm mb-8">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-amber-800">
              <Shield className="h-5 w-5" />
              Verify Your Email
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-amber-700 leading-relaxed">
              Your email <strong>{user.email}</strong> is not verified. You need
              a verified email to place orders.
            </p>

            {!codeSent ? (
              /* Step 1: Send the code */
              <Button
                onClick={handleSendCode}
                disabled={resending}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl h-11"
              >
                {resending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Verification Code
                  </>
                )}
              </Button>
            ) : (
              /* Step 2: Enter the code */
              <>
                {/* Countdown timer */}
                <div
                  className={`flex items-center justify-center gap-2 text-sm font-semibold ${timerColor}`}
                >
                  <Clock className="h-4 w-4" />
                  {isExpired ? (
                    <span>Code expired — request a new one</span>
                  ) : (
                    <span>
                      Code expires in{" "}
                      <span className="font-mono text-base">
                        {formatTime(secondsLeft)}
                      </span>
                    </span>
                  )}
                </div>

                {/* OTP Input */}
                <div className="flex justify-center">
                  <Input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="123456"
                    value={verifyCode}
                    disabled={isExpired}
                    onChange={(e) =>
                      setVerifyCode(e.target.value.replace(/\D/g, ""))
                    }
                    className="text-center text-3xl font-bold tracking-[0.5em] h-16 w-52 border-2 border-amber-300 focus:border-brand-mustard rounded-xl disabled:opacity-50"
                    autoFocus
                  />
                </div>

                {/* Verify Button */}
                <Button
                  onClick={handleVerify}
                  disabled={
                    verifying || verifyCode.length !== 6 || isExpired
                  }
                  className="w-full bg-brand-blue hover:bg-brand-blue/90 text-white font-bold rounded-xl h-11"
                >
                  {verifying ? "Verifying..." : "Verify Email"}
                </Button>

                {/* Resend link */}
                <div className="text-center text-sm text-slate-500">
                  Didn&apos;t receive a code?{" "}
                  <button
                    onClick={handleSendCode}
                    disabled={resending}
                    className="text-brand-blue font-semibold hover:underline inline-flex items-center gap-1"
                  >
                    <RefreshCw
                      className={`h-3 w-3 ${resending ? "animate-spin" : ""}`}
                    />
                    {resending ? "Sending..." : "Resend Code"}
                  </button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Profile Form */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Account Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                Saved Phone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  value={savedPhone}
                  onChange={(e) => setSavedPhone(e.target.value)}
                  placeholder="0712345678"
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                Delivery Address
              </label>
              <AddressSearch
                value={address}
                onSelect={(result: AddressResult) =>
                  setAddress(result.displayName)
                }
                onChange={(val: string) => setAddress(val)}
                placeholder="Search for your area, road, or landmark..."
              />
            </div>

            <Button
              type="submit"
              disabled={saving}
              className="w-full bg-brand-mustard text-brand-blue hover:bg-brand-mustard-dark font-bold rounded-xl h-11"
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
