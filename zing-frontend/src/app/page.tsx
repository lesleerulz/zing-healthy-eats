"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import Link from "next/link";
import { fetchApi, carouselImageUrl, staticUrl } from "@/lib/api";
import type { CarouselImage, FeaturedProducts, FAQ } from "@/lib/types";
import ProductCard from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Leaf, Flame, Heart, Gift } from "lucide-react";

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
    <div className="space-y-16 pb-16 bg-zing-cream/50">
      {/* ── Hero Section ── */}
      <section className="hero-section relative bg-zing-cream bg-noise pt-16 pb-24 md:pt-24 md:pb-32">
        {/* Decorative Leaf (Top Left) */}
        <div className="absolute top-10 left-10 opacity-10 rotate-12 pointer-events-none hidden lg:block">
          <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M40 160C40 160 60 100 120 80C180 60 160 40 160 40C160 40 140 60 80 120C20 180 40 160 40 160Z" stroke="currentColor" strokeWidth="2" className="text-brand-burgundy"/>
            <path d="M60 140L80 120" stroke="currentColor" strokeWidth="2" className="text-brand-burgundy"/>
            <path d="M80 120L100 100" stroke="currentColor" strokeWidth="2" className="text-brand-burgundy"/>
          </svg>
        </div>

        <div className="hero-content container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div data-aos="fade-right">
              <h1 className="text-5xl md:text-7xl font-heading font-bold text-zing-navy leading-[1.1] mb-6">
                Premium Nuts.<br />
                <span className="italic text-zing-burgundy">Perfectly Roasted.</span>
              </h1>
              <p className="text-lg md:text-xl text-zing-burgundy mb-8 max-w-lg font-medium">
                Wholesome. Delicious. Always Zing.
              </p>
              <Link href="/catalog">
                <Button size="lg" className="bg-zing-yellow hover:bg-yellow-500 text-zing-navy shadow-[0_4px_14px_0_rgba(229,169,40,0.39)] font-bold px-8 py-7 text-lg rounded-full group transition-all">
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
              <div className="relative aspect-[4/3] w-full mt-8 lg:mt-0">
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
                        className="object-contain"
                        priority={idx === 0}
                        unoptimized
                      />
                    </div>
                  ))
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
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

        {/* Torn Paper Effect Bottom */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0] translate-y-[1px]">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-[calc(100%+1.3px)] h-[40px] md:h-[60px] fill-brand-cream/30 rotate-180">
            <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5,73.84-4.36,147.54,16.88,218.2,35.26,69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-1.11,1200,42.47V0Z" className="fill-brand-cream/30" opacity=".25"></path>
            <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5V0Z" className="fill-brand-cream/30" opacity=".5"></path>
            <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.41,5.29,2.31,10.57,4.59,15.89,6.78,44,18.08,88,33.94,136,33.94,29,0,57-4.94,83.91-15.11,102.34-38.64,134.42-30,195.2-12.79V0Z" className="fill-brand-cream"></path>
          </svg>
        </div>

        {/* Torn Paper Divider */}
        <div className="absolute -bottom-1 left-0 right-0 pointer-events-none z-10">
          <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="w-full h-[50px] md:h-[70px] drop-shadow-[0_-4px_6px_rgba(0,0,0,0.04)]" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,60 C12,52 18,68 36,54 C48,44 58,72 78,56 C92,45 102,70 120,52 C132,42 146,68 162,50 C174,40 188,66 204,48 C218,36 230,64 248,46 C262,34 276,62 294,44 C308,34 320,60 338,42 C352,32 366,58 384,40 C398,30 412,56 430,38 C444,28 458,54 476,36 C490,26 504,52 522,34 C536,24 550,50 568,32 C582,22 596,48 614,30 C628,20 642,46 660,28 C674,18 688,44 706,26 C720,16 734,42 752,24 C766,14 780,40 798,22 C812,12 826,38 844,20 C858,10 872,36 890,22 C904,14 918,40 936,26 C950,18 964,44 982,30 C996,22 1010,48 1028,34 C1042,26 1056,52 1074,38 C1088,30 1102,56 1120,42 C1134,34 1148,60 1166,46 C1180,38 1194,64 1212,50 C1226,42 1240,66 1258,52 C1272,44 1286,68 1304,54 C1318,46 1332,70 1350,56 C1364,48 1378,72 1396,58 C1410,50 1424,68 1440,58 L1440,120 L0,120 Z" fill="#FCF8F3"/>
          </svg>
        </div>
      </section>

      {/* ── Top Products ── */}
      {featured && featured.top_selling.length > 0 && (
        <section className="container mx-auto px-4">
          <div className="flex flex-col items-center text-center mb-10" data-aos="fade-up">
            <div className="flex items-center gap-4 mb-2">
              <div className="flex items-center w-16 md:w-32 relative">
                <div className="absolute inset-0 flex items-center"><div className="h-[1px] w-full bg-zing-burgundy/40" /></div>
                <div className="relative mx-auto w-2 h-2 rotate-45 border border-zing-burgundy bg-zing-cream" />
              </div>
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-zing-navy mx-2">Top Products</h2>
              <div className="flex items-center w-16 md:w-32 relative">
                <div className="absolute inset-0 flex items-center"><div className="h-[1px] w-full bg-zing-burgundy/40" /></div>
                <div className="relative mx-auto w-2 h-2 rotate-45 border border-zing-burgundy bg-zing-cream" />
              </div>
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
              <div className="flex items-center w-16 md:w-32 relative">
                <div className="absolute inset-0 flex items-center"><div className="h-[1px] w-full bg-zing-burgundy/40" /></div>
                <div className="relative mx-auto w-2 h-2 rotate-45 border border-zing-burgundy bg-zing-cream" />
              </div>
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-zing-navy mx-2">Latest Products</h2>
              <div className="flex items-center w-16 md:w-32 relative">
                <div className="absolute inset-0 flex items-center"><div className="h-[1px] w-full bg-zing-burgundy/40" /></div>
                <div className="relative mx-auto w-2 h-2 rotate-45 border border-zing-burgundy bg-zing-cream" />
              </div>
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
      <section className="bg-zing-navy py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-4 divide-x-0 lg:divide-x divide-white/10" data-aos="fade-up">
            {[
              { icon: <Leaf strokeWidth={1.5} className="h-8 w-8 text-zing-yellow" />, title: "Premium Quality", desc: "Carefully selected" },
              { icon: <Flame strokeWidth={1.5} className="h-8 w-8 text-zing-yellow" />, title: "Perfectly Roasted", desc: "For maximum flavor" },
              { icon: <Heart strokeWidth={1.5} className="h-8 w-8 text-zing-yellow" />, title: "Healthy & Delicious", desc: "Good for you always" },
              { icon: <Gift strokeWidth={1.5} className="h-8 w-8 text-zing-yellow" />, title: "Made with Love", desc: "Packed with care" },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex items-center justify-center gap-4 px-8 py-2">
                <div className="flex-shrink-0">{icon}</div>
                <div className="text-left">
                  <h3 className="font-bold text-sm tracking-wide text-zing-yellow">{title}</h3>
                  <p className="text-[11px] text-white/60 font-medium uppercase tracking-wider mt-0.5">{desc}</p>
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
