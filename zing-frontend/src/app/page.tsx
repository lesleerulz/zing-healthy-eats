"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import Link from "next/link";
import { fetchApi, carouselImageUrl, staticUrl } from "@/lib/api";
import type { CarouselImage, FeaturedProducts, FAQ } from "@/lib/types";
import ProductCard from "@/components/product-card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard, Truck, Phone, ChevronLeft, ChevronRight } from "lucide-react";

import AOS from "aos";
import "aos/dist/aos.css";

export default function HomePage() {
  const [carousel, setCarousel] = useState<CarouselImage[]>([]);
  const heroTitleRef = useRef<HTMLHeadingElement>(null);
  const [featured, setFeatured] = useState<FeaturedProducts | null>(null);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchApi<CarouselImage[]>("/api/carousel"),
      fetchApi<FeaturedProducts>("/api/products/featured"),
      fetchApi<FAQ[]>("/api/faqs"),
    ])
      .then(([c, f, q]) => {
        setCarousel(c);
        setFeatured(f);
        setFaqs(q);
      })
      .catch(console.error)
      .finally(() => {
        setLoading(false);
        setTimeout(() => {
          AOS.refresh();
        }, 100);
      });
  }, []);

  // Auto-advance carousel.
  useEffect(() => {
    if (carousel.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carousel.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [carousel.length]);

  // GSAP Seesaw Animations
  useEffect(() => {
    if (loading) return;
    
    const playSeesaw = (el: HTMLElement) => {
      gsap.killTweensOf(el);
      const tl = gsap.timeline();
      const angle = 4;    // degrees of tilt
      const speed = 0.2;  // seconds per half-swing

      tl.set(el, { rotation: 0 })
        // Swing 1
        .to(el, { duration: speed, rotation: -angle, ease: "power1.inOut" })
        .to(el, { duration: speed * 2, rotation: angle, ease: "power1.inOut" })
        // Swing 2
        .to(el, { duration: speed * 2, rotation: -angle, ease: "power1.inOut" })
        .to(el, { duration: speed * 2, rotation: angle, ease: "power1.inOut" })
        // Swing 3
        .to(el, { duration: speed * 2, rotation: -angle, ease: "power1.inOut" })
        // Settle
        .to(el, { duration: speed * 2, rotation: 0, ease: "elastic.out(1, 0.4)" });
    };

    if (heroTitleRef.current) playSeesaw(heroTitleRef.current);
  }, [loading]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-12">
        <Skeleton className="w-full h-[500px] rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-16 pb-16 bg-brand-cream/30">
      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden bg-brand-cream py-16 md:py-24">
        {/* Decorative Leaf (Top Left) */}
        <div className="absolute top-10 left-10 opacity-10 rotate-12 pointer-events-none hidden lg:block">
          <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M40 160C40 160 60 100 120 80C180 60 160 40 160 40C160 40 140 60 80 120C20 180 40 160 40 160Z" stroke="currentColor" strokeWidth="2" className="text-brand-burgundy"/>
            <path d="M60 140L80 120" stroke="currentColor" strokeWidth="2" className="text-brand-burgundy"/>
            <path d="M80 120L100 100" stroke="currentColor" strokeWidth="2" className="text-brand-burgundy"/>
          </svg>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div data-aos="fade-right">
              <h1 className="text-5xl md:text-7xl font-heading font-bold text-brand-burgundy leading-[1.1] mb-6">
                Premium Nuts.<br />
                <span className="italic">Perfectly Roasted.</span>
              </h1>
              <p className="text-lg md:text-xl text-brand-blue/70 mb-8 max-w-lg font-medium">
                Wholesome. Delicious. Always Zing.
              </p>
              <Link href="/catalog">
                <Button size="lg" className="bg-brand-mustard hover:bg-brand-mustard-dark text-brand-blue font-bold px-8 py-7 text-lg rounded-full group transition-all">
                  SHOP NOW
                  <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>

            {/* Image / Carousel Wrapper */}
            <div className="relative" data-aos="fade-left">
              {/* Roasted Seal */}
              <div className="absolute -bottom-6 -left-6 z-20 bg-white rounded-full p-4 shadow-xl border border-brand-mustard/20 animate-bounce-slow">
                <div className="rounded-full border-2 border-dashed border-brand-mustard p-3 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-tighter text-brand-mustard">Roasted To</p>
                  <p className="text-xs font-heading font-bold text-brand-burgundy">Perfection</p>
                </div>
              </div>

              {/* Main Image Container */}
              <div className="relative aspect-[4/3] rounded-[40px] overflow-hidden shadow-2xl border-8 border-white">
                {carousel.length > 0 ? (
                  carousel.map((img, idx) => (
                    <div
                      key={img.id}
                      className={`absolute inset-0 transition-opacity duration-1000 ${
                        idx === currentSlide ? "opacity-100" : "opacity-0"
                      }`}
                    >
                      <Image
                        src={carouselImageUrl(img.image_filename)}
                        alt={`Premium nut selection ${idx + 1}`}
                        fill
                        className="object-cover"
                        priority={idx === 0}
                        unoptimized
                      />
                    </div>
                  ))
                ) : (
                  <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                    <p className="text-slate-400">Loading premium treats...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Leaf (Bottom Right) */}
        <div className="absolute bottom-10 right-10 opacity-10 -rotate-45 pointer-events-none hidden lg:block">
          <svg width="240" height="240" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M40 160C40 160 60 100 120 80C180 60 160 40 160 40C160 40 140 60 80 120C20 180 40 160 40 160Z" stroke="currentColor" strokeWidth="2" className="text-brand-burgundy"/>
          </svg>
        </div>
      </section>

      {/* ── Top Products ── */}
      {featured && featured.top_selling.length > 0 && (
        <section className="container mx-auto px-4">
          <div className="flex flex-col items-center text-center mb-10" data-aos="fade-up">
            <div className="flex items-center gap-4 mb-2">
              <div className="h-[1px] w-12 md:w-24 bg-brand-burgundy/30" />
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-burgundy" />
                <div className="w-1 h-1 rounded-full bg-brand-burgundy/50 mt-0.5" />
              </div>
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-brand-blue mx-2">Top Products</h2>
              <div className="flex gap-1">
                <div className="w-1 h-1 rounded-full bg-brand-burgundy/50 mt-0.5" />
                <div className="w-1.5 h-1.5 rounded-full bg-brand-burgundy" />
              </div>
              <div className="h-[1px] w-12 md:w-24 bg-brand-burgundy/30" />
            </div>
            <p className="text-slate-500 font-medium">Our best sellers, loved by everyone</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {featured.top_selling.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* ── Latest Products ── */}
      {featured && featured.latest.length > 0 && (
        <section className="container mx-auto px-4">
          <div className="flex flex-col items-center text-center mb-10" data-aos="fade-up">
            <div className="flex items-center gap-4 mb-2">
              <div className="h-[1px] w-12 md:w-24 bg-brand-burgundy/30" />
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-burgundy rotate-45" />
                <div className="w-1 h-1 rounded-full bg-brand-burgundy/50 mt-0.5" />
              </div>
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-brand-blue mx-2">Latest Products</h2>
              <div className="flex gap-1">
                <div className="w-1 h-1 rounded-full bg-brand-burgundy/50 mt-0.5" />
                <div className="w-1.5 h-1.5 rounded-full bg-brand-burgundy rotate-45" />
              </div>
              <div className="h-[1px] w-12 md:w-24 bg-brand-burgundy/30" />
            </div>
            <p className="text-slate-500 font-medium">Fresh arrivals just for you</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {featured.latest.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="text-center mt-12">
            <Link href="/catalog">
              <Button
                size="lg"
                className="bg-brand-blue text-white hover:bg-brand-blue-light font-bold rounded-full px-10 py-6 shadow-xl group transition-all"
              >
                View Full Catalog
                <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform text-brand-mustard" />
              </Button>
            </Link>
          </div>
        </section>
      )}

      {/* ── Features Bar ── */}
      <section className="bg-brand-blue text-white py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-4 divide-x-0 lg:divide-x divide-white/10" data-aos="fade-up">
            {[
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-brand-mustard">
                    <path d="M12 3L4 7V17L12 21L20 17V7L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 8L12 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 12L16 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
                title: "Premium Quality",
                desc: "Carefully selected",
              },
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-brand-mustard">
                    <path d="M12 2C12 2 12 6 12 6M12 18C12 18 12 22 12 22M4.93 4.93C4.93 4.93 7.76 7.76 7.76 7.76M16.24 16.24C16.24 16.24 19.07 19.07 19.07 19.07M2 12C2 12 6 12 6 12M18 12C18 12 22 12 22 12M4.93 19.07C4.93 19.07 7.76 16.24 7.76 16.24M16.24 7.76C16.24 7.76 19.07 4.93 19.07 4.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
                title: "Perfectly Roasted",
                desc: "For maximum flavor",
              },
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-brand-mustard">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.72-8.72 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
                title: "Healthy & Delicious",
                desc: "Good for you always",
              },
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-brand-mustard">
                    <path d="M20 12V22H4V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M22 7H2V12H22V7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 22V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 7H16.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
                title: "Made with Love",
                desc: "Packed with care",
              },
            ].map(({ icon, title, desc }) => (
              <div
                key={title}
                className="flex items-center justify-center gap-4 px-8 py-2"
              >
                <div className="flex-shrink-0">
                  {icon}
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-sm tracking-wide">{title}</h3>
                  <p className="text-[11px] text-white/50 font-medium uppercase tracking-wider mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}

      {/* ── Thanks Banner ── */}
      <section className="container mx-auto px-4" data-aos="fade-up">
        <div className="relative rounded-2xl overflow-hidden">
          <Image
            src={staticUrl("images/thanks.webp")}
            alt="Thanks for visiting"
            width={1200}
            height={200}
            className="w-full h-auto rounded-2xl"
            unoptimized
          />
        </div>
        <p className="text-center mt-4 text-lg font-bold text-brand-mustard-dark">
          Thanks for visiting our store :)
        </p>
      </section>
    </div>
  );
}
