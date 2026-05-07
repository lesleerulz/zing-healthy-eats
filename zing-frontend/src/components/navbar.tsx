"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { staticUrl, fetchApi } from "@/lib/api";
import type { SiteSettings } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Menu,
  Search,
  ShoppingBag,
  User,
  LogOut,
  Package,
  LayoutDashboard,
  Truck,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

export default function Navbar() {
  const { user, cart, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>({});

  useEffect(() => {
    fetchApi<SiteSettings>("/api/site-settings")
      .then(setSettings)
      .catch(() => {});
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/catalog");
    }
    setMobileOpen(false);
  };

  const saleEnabled = settings.sale_page_enabled !== "false";
  const saleTitle = settings.sale_page_title || "People's Choice";
  const cartCount = cart?.count || 0;

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/catalog", label: "Catalog" },
  ];

  return (
    <header className="sticky top-0 z-50">
      <nav className="bg-brand-blue shadow-lg border-b border-white/5">
        <div className="container mx-auto flex items-center justify-between px-4 py-3 h-20">
          {/* Brand Logo */}
          <Link href="/" className="flex flex-col items-start leading-tight group">
            <span className="text-3xl font-heading font-bold text-brand-mustard tracking-tight group-hover:text-brand-mustard-light transition-colors">
              Zing
            </span>
            <span className="text-[10px] font-sans font-semibold text-white/80 tracking-[0.2em] uppercase">
              Healthy Treats
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-8 ml-12">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-white/90 hover:text-brand-mustard transition-colors"
              >
                {link.label}
              </Link>
            ))}
            {saleEnabled && (
              <Link
                href="/peoples-choice"
                className="text-sm font-medium text-brand-mustard hover:text-brand-mustard-light transition-colors"
              >
                {saleTitle}
              </Link>
            )}
          </div>

          {/* Desktop Search & Icons */}
          <div className="hidden lg:flex items-center gap-6 flex-1 justify-end">
            <form onSubmit={handleSearch} className="relative w-full max-w-sm">
              <Search strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                type="search"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 w-full bg-white/5 border-white/10 text-white rounded-full placeholder:text-white/30 focus:bg-white/10 focus:border-brand-mustard transition-all"
              />
            </form>

            <div className="flex items-center gap-4">
              <Link href="/cart" className="relative group transition-transform hover:scale-105">
                <div className="bg-zing-yellow text-zing-navy rounded-md p-2 relative">
                  <ShoppingBag strokeWidth={1.5} className="h-5 w-5" />
                </div>
                {cartCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-[10px] rounded-full border-2 border-zing-navy">
                    {cartCount}
                  </Badge>
                )}
              </Link>

              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="p-2 rounded-full hover:bg-white/5 transition-colors group"
                  >
                    <User strokeWidth={1.5} className="h-6 w-6 text-zing-yellow group-hover:scale-110 transition-transform" />
                  </button>

                  {dropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-2xl border z-50 py-2 animate-in fade-in-0 zoom-in-95">
                        <div className="px-4 py-2 border-b mb-1">
                          <p className="text-xs text-slate-500 font-medium">Signed in as</p>
                          <p className="text-sm font-bold text-slate-800 truncate">{user.username}</p>
                        </div>
                        <Link href="/profile" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                          <User className="h-4 w-4 text-slate-400" /> Profile
                        </Link>
                        <Link href="/orders" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                          <Package className="h-4 w-4 text-slate-400" /> Orders
                        </Link>
                        {user.is_admin && (
                          <a href="http://localhost:5000/dashboard" className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                            <LayoutDashboard className="h-4 w-4 text-slate-400" /> Admin
                          </a>
                        )}
                        <div className="border-t my-1" />
                        <button onClick={() => { logout(); setDropdownOpen(false); router.push("/"); }} className="flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 w-full text-left transition-colors">
                          <LogOut className="h-4 w-4" /> Logout
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <Link href="/login" className="p-2 rounded-full hover:bg-white/5 transition-colors group">
                  <User strokeWidth={1.5} className="h-6 w-6 text-zing-yellow group-hover:scale-110 transition-transform" />
                </Link>
              )}
            </div>
          </div>

          {/* Mobile: Cart + Menu */}
          <div className="flex items-center gap-2 lg:hidden">
            {user && (
              <Link href="/cart">
                <Button variant="ghost" size="icon" className="relative text-white">
                  <ShoppingBag className="h-5 w-5" />
                  {cartCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-red-500 text-white text-[9px] rounded-full">
                      {cartCount}
                    </Badge>
                  )}
                </Button>
              </Link>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="text-white"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Mobile Nav Panel */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-white/10 bg-brand-blue-light">
            <div className="container mx-auto px-4 py-4 space-y-2">
              {/* Mobile Search */}
              <form onSubmit={handleSearch} className="mb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="search"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                  />
                </div>
              </form>

              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-3 text-slate-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              {saleEnabled && (
                <Link
                  href="/peoples-choice"
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-3 font-bold text-brand-mustard hover:bg-white/10 rounded-lg"
                >
                  {saleTitle}
                </Link>
              )}

              <div className="border-t border-white/10 my-2" />

              {user ? (
                <>
                  <Link
                    href="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-3 text-slate-200 hover:text-white hover:bg-white/10 rounded-lg"
                  >
                    Profile ({user.username})
                  </Link>
                  <Link
                    href="/orders"
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-3 text-slate-200 hover:text-white hover:bg-white/10 rounded-lg"
                  >
                    Orders
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setMobileOpen(false);
                      router.push("/");
                    }}
                    className="block w-full text-left px-4 py-3 text-red-400 hover:bg-white/10 rounded-lg"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-3 text-slate-200 hover:bg-white/10 rounded-lg"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-3 text-brand-mustard font-semibold hover:bg-white/10 rounded-lg"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
