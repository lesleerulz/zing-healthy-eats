"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import type { SocialLink } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Home, Info, ShoppingBag, ShoppingCart } from "lucide-react";

// Map Bootstrap icon classes to simple labels for display.
function socialIcon(iconClass: string): string {
  if (iconClass.includes("facebook")) return "Facebook";
  if (iconClass.includes("instagram")) return "Instagram";
  if (iconClass.includes("twitter") || iconClass.includes("x-")) return "X";
  if (iconClass.includes("tiktok")) return "TikTok";
  if (iconClass.includes("youtube")) return "YouTube";
  if (iconClass.includes("whatsapp")) return "WhatsApp";
  return iconClass.replace("bi bi-", "").replace("-", " ");
}

export default function Footer() {
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);

  useEffect(() => {
    fetchApi<SocialLink[]>("/api/social-links")
      .then(setSocialLinks)
      .catch(() => {});
  }, []);

  return (
    <footer className="mt-auto bg-brand-blue text-slate-200">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sitemap */}
          <div className="hidden lg:block">
            <h5 className="text-lg font-semibold text-white mb-4">Site Map</h5>
            <ul className="space-y-2">
              {[
                { href: "/", label: "Home", icon: Home },
                { href: "/about", label: "About", icon: Info },
                { href: "/catalog", label: "Catalog", icon: ShoppingBag },
                { href: "/cart", label: "Cart", icon: ShoppingCart },
              ].map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="flex items-center gap-2 text-slate-300 hover:text-brand-mustard transition-colors text-sm"
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h5 className="text-lg font-semibold text-white mb-1">
              Subscribe to our newsletter
            </h5>
            <p className="text-sm text-slate-400 mb-4">
              Monthly digest of what&apos;s new and exciting from us.
            </p>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Email address"
                className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-brand-mustard"
              />
              <Button className="bg-brand-mustard hover:bg-brand-mustard-dark text-brand-blue font-bold whitespace-nowrap">
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        <Separator className="my-6 bg-white/10" />

        <div className="flex flex-col-reverse lg:flex-row items-center justify-between gap-4">
          {/* Legal */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>© {new Date().getFullYear()} Zing Healthy Treats</span>
            <span className="opacity-50">|</span>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms of Use
            </Link>
            <span className="opacity-50">|</span>
            <Link href="/privacy-policy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <span className="opacity-50">|</span>
            <Link href="/legals" className="hover:text-white transition-colors">
              Legals
            </Link>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-3">
            {socialLinks.length > 0 ? (
              socialLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-300 hover:text-brand-mustard transition-colors text-sm font-medium"
                  aria-label={link.platform}
                >
                  {socialIcon(link.icon_class)}
                </a>
              ))
            ) : (
              <span className="text-xs text-slate-500">No social links configured</span>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
