"use client";

import { AuthProvider } from "@/lib/auth-context";
import { Suspense, useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    AOS.init({
      duration: 800,
      easing: "ease-out-cubic",
      once: true,
      offset: 50,
    });
  }, []);

  return (
    <Suspense>
      <AuthProvider>{children}</AuthProvider>
    </Suspense>
  );
}
