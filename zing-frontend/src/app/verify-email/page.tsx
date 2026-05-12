"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { fetchApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, XCircle, Loader2 } from "lucide-react";

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email address...");
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();
  const { refreshUser, user } = useAuth();

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link. No token provided.");
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await fetchApi<{ message: string }>("/api/auth/verify-email", {
          method: "POST",
          body: JSON.stringify({ token }),
        });
        setStatus("success");
        setMessage(res.message || "Your email has been successfully verified!");
        if (user) {
          await refreshUser();
        }
      } catch (err) {
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Verification failed. The link may have expired.");
      }
    };

    verifyToken();
  }, [token, refreshUser, user]);

  return (
    <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[70vh]">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto h-16 w-16 rounded-full flex items-center justify-center mb-4">
            {status === "loading" && <Loader2 className="h-8 w-8 text-brand-blue animate-spin" />}
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
            {status === "loading" && "Verifying Email"}
            {status === "success" && "Email Verified!"}
            {status === "error" && "Verification Failed"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <p className="text-slate-600">{message}</p>
          
          <div className="pt-4 flex flex-col gap-3">
            {status === "success" && (
              <Button asChild className="w-full bg-brand-mustard text-brand-blue hover:bg-brand-mustard-dark font-bold rounded-xl h-11">
                <Link href="/profile">Go to Profile</Link>
              </Button>
            )}
            
            {status === "error" && (
              <Button asChild className="w-full bg-brand-mustard text-brand-blue hover:bg-brand-mustard-dark font-bold rounded-xl h-11">
                <Link href={user ? "/profile" : "/login"}>
                  {user ? "Back to Profile" : "Go to Login"}
                </Link>
              </Button>
            )}
            
            <Button asChild variant="ghost" className="w-full text-slate-500 hover:text-brand-blue">
              <Link href="/">Return to Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
