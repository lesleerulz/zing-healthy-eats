"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { fetchApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, XCircle, MailCheck, RefreshCw, Clock } from "lucide-react";
import { toast } from "sonner";

const OTP_DURATION_SECS = 10 * 60; // 10 minutes

export default function VerifyEmailPage() {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(OTP_DURATION_SECS);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { user, refreshUser } = useAuth();

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

  // Start timer on mount (code was sent at registration)
  useEffect(() => {
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [startTimer]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const isExpired = secondsLeft === 0;

  // Colour shifts from green → amber → red as time runs out
  const timerColor =
    secondsLeft > 120 ? "text-green-600" :
    secondsLeft > 30  ? "text-amber-500" :
                        "text-red-500";

  const handleVerify = async () => {
    if (code.trim().length !== 6) {
      toast.error("Please enter the full 6-digit code.");
      return;
    }
    if (!user?.email) {
      toast.error("You must be logged in to verify your email.");
      return;
    }
    if (isExpired) {
      toast.error("Your code has expired. Please request a new one.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetchApi<{ message: string }>("/api/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ email: user.email, code: code.trim() }),
      });
      clearInterval(timerRef.current!);
      setStatus("success");
      setMessage(res.message);
      await refreshUser();
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Verification failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await fetchApi("/api/auth/verify/resend", { method: "POST" });
      toast.success("A new verification code has been sent to your email!");
      setStatus("idle");
      setCode("");
      startTimer();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to resend code.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[70vh]">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto h-16 w-16 rounded-full flex items-center justify-center mb-4">
            {status === "idle" && (
              <div className="h-full w-full rounded-full bg-blue-100 flex items-center justify-center">
                <MailCheck className="h-8 w-8 text-brand-blue" />
              </div>
            )}
            {status === "success" && (
              <div className="h-full w-full rounded-full bg-green-100 flex items-center justify-center">
                <ShieldCheck className="h-8 w-8 text-green-600" />
              </div>
            )}
            {status === "error" && (
              <div className="h-full w-full rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl text-brand-blue">
            {status === "idle" && "Verify Your Email"}
            {status === "success" && "Email Verified!"}
            {status === "error" && "Verification Failed"}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-5 text-center">
          {status === "idle" && (
            <>
              <p className="text-slate-500 text-sm leading-relaxed">
                We sent a <strong>6-digit code</strong> to{" "}
                <span className="text-brand-blue font-semibold">{user?.email || "your email"}</span>.
                <br />Enter it below to verify your account.
              </p>

              {/* Countdown timer */}
              <div className={`flex items-center justify-center gap-2 text-sm font-semibold ${timerColor}`}>
                <Clock className="h-4 w-4" />
                {isExpired
                  ? <span>Code expired — request a new one</span>
                  : <span>Code expires in <span className="font-mono text-base">{formatTime(secondsLeft)}</span></span>
                }
              </div>

              <div className="flex justify-center">
                <Input
                  id="otp-input"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  value={code}
                  disabled={isExpired}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  className="text-center text-3xl font-bold tracking-[0.5em] h-16 w-48 border-2 border-brand-blue/30 focus:border-brand-mustard rounded-xl disabled:opacity-50"
                  autoFocus
                />
              </div>

              <Button
                id="verify-btn"
                onClick={handleVerify}
                disabled={submitting || code.length !== 6 || isExpired}
                className="w-full bg-brand-blue hover:bg-brand-blue/90 text-white font-bold rounded-xl h-12 text-base"
              >
                {submitting ? "Verifying..." : "Verify Account"}
              </Button>

              <div className="text-sm text-slate-500">
                Didn't receive a code?{" "}
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="text-brand-blue font-semibold hover:underline inline-flex items-center gap-1"
                >
                  <RefreshCw className={`h-3 w-3 ${resending ? "animate-spin" : ""}`} />
                  {resending ? "Sending..." : "Resend Code"}
                </button>
              </div>
            </>
          )}

          {status === "success" && (
            <>
              <p className="text-slate-600">{message}</p>
              <Button
                asChild
                className="w-full bg-brand-mustard text-brand-blue hover:bg-brand-mustard/90 font-bold rounded-xl h-11"
              >
                <Link href="/profile">Go to Profile</Link>
              </Button>
            </>
          )}

          {status === "error" && (
            <>
              <p className="text-slate-600">{message}</p>
              <Button
                onClick={() => { setStatus("idle"); setMessage(""); }}
                className="w-full bg-brand-blue text-white hover:bg-brand-blue/90 font-bold rounded-xl h-11"
              >
                Try Again
              </Button>
              <button
                onClick={handleResend}
                disabled={resending}
                className="w-full text-sm text-brand-blue font-semibold hover:underline inline-flex items-center justify-center gap-1"
              >
                <RefreshCw className={`h-3 w-3 ${resending ? "animate-spin" : ""}`} />
                {resending ? "Sending new code..." : "Send a new code"}
              </button>
            </>
          )}

          <Button asChild variant="ghost" className="w-full text-slate-400 hover:text-brand-blue text-sm">
            <Link href="/">Return to Home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
