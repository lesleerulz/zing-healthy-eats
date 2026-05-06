import type { Metadata } from "next";
import "./globals.css";
import { Geist, Playfair_Display } from "next/font/google";
import { cn } from "@/lib/utils";
import { Providers } from "./providers";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Toaster } from "@/components/ui/sonner";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-heading" });

export const metadata: Metadata = {
  title: {
    default: "Zing Healthy Treats",
    template: "%s | Zing Healthy Treats",
  },
  description:
    "Discover delicious, healthy treats delivered to your doorstep. Zing Healthy Treats — your amazing online store for wholesome snacks and meals.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable, playfair.variable)}>
      <body className="min-h-screen flex flex-col">
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <Toaster richColors position="bottom-right" />
        </Providers>
      </body>
    </html>
  );
}
