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

const textSets = [
  { title: "Fuel Your", highlight: "Active Life.", desc: "Premium nutrition designed for those who move. Wholesome. Delicious. Always Zing." },
  { title: "Nourish Your", highlight: "Body & Soul.", desc: "Carefully crafted meals to keep you energized. Fresh. Healthy. Unstoppable." },
  { title: "Maximize Your", highlight: "Fitness Journey.", desc: "Scientifically backed meals to accelerate recovery and build lean muscle. Fuel your workout." },
];

export default function HomePage() {
  const [carousel, setCarousel] = useState<CarouselImage[]>([]);
  const heroTitleRef = useRef<HTMLHeadingElement>(null);
  const [featured, setFeatured] = useState<FeaturedProducts | null>(null);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AOS.init({
      duration: 800,
      easing: "ease-out-cubic",
      once: true,
      offset: 50,
    });

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

  // Auto-advance carousel and morph text.
  useEffect(() => {
    if (carousel.length <= 1) return;
    const interval = setInterval(() => {
      // Start slide transition immediately
      setCurrentSlide((prev) => (prev + 1) % carousel.length);
      
      if (textContainerRef.current) {
        gsap.to(textContainerRef.current, {
          opacity: 0,
          duration: 0.5,
          ease: "power2.inOut",
          onComplete: () => {
            setCurrentTextIndex((prev) => (prev + 1) % textSets.length);
            gsap.to(textContainerRef.current, { opacity: 1, duration: 0.5, ease: "power2.inOut" });
          }
        });
      } else {
        setCurrentTextIndex((prev) => (prev + 1) % textSets.length);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [carousel.length]);


  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-12 min-h-screen">
        <Skeleton className="w-full h-[85vh] rounded-2xl" />
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
      {/* ── Full-Bleed Hero Section ── */}
      <section className="hero-section relative min-h-[85vh] flex items-center overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32">
        {/* Carousel Background Layer */}
        <div className="absolute inset-0 z-0">
          {carousel.length > 0 ? (
            carousel.map((img, idx) => (
              <div
                key={img.id}
                className={`absolute inset-0 transition-opacity duration-1500 ease-in-out ${
                  idx === currentSlide ? "opacity-100" : "opacity-0"
                }`}
              >
                <div className="absolute inset-0 bg-black/30 z-10" /> {/* Overlay for readability */}
                {img.image_filename ? (
                  <Image
                    src={carouselImageUrl(img.image_filename)}
                    alt="Zing Healthy Treats"
                    fill
                    className="object-cover"
                    priority={idx === 0}
                    sizes="100vw"
                  />
                ) : (
                  <div className="w-full h-full bg-zing-navy/20" />
                )}
              </div>
            ))
          ) : (
            <div className="w-full h-full bg-zing-navy/20 animate-pulse" />
          )}
        </div>

        <div className="hero-content container mx-auto px-4 relative z-20">
          <div className="max-w-3xl" data-aos="fade-up">
            <div ref={textContainerRef}>
              <h1 className="text-5xl md:text-8xl font-heading font-bold text-white leading-[1.1] mb-6 drop-shadow-lg">
                {textSets[currentTextIndex].title} <br />
                <span className="italic text-zing-yellow">{textSets[currentTextIndex].highlight}</span>
              </h1>
              <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-xl font-medium drop-shadow-md">
                {textSets[currentTextIndex].desc}
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link href="/catalog">
                <Button size="lg" className="bg-zing-yellow hover:bg-yellow-500 text-zing-navy shadow-xl font-bold px-10 py-8 text-xl rounded-full group transition-all">
                  EXPLORE CATALOG
                  <ChevronRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Roasted Seal (Positioned relative to full hero) */}
        <div className="absolute bottom-24 right-10 z-30 hidden lg:block animate-bounce-slow">
          <div className="bg-white rounded-full p-4 shadow-2xl border border-brand-mustard/20">
            <div className="rounded-full border-2 border-dashed border-brand-mustard p-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-tighter text-brand-mustard">Peak</p>
              <p className="text-xs font-heading font-bold text-brand-burgundy">Performance</p>
            </div>
          </div>
        </div>

        {/* Torn Paper Effect Bottom (Seamlessly blending) */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0] translate-y-[1px] z-20">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-[calc(100%+1.3px)] h-[60px] md:h-[100px] fill-zing-cream/50 rotate-180">
            <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5,73.84-4.36,147.54,16.88,218.2,35.26,69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-1.11,1200,42.47V0Z" className="fill-zing-cream/30" opacity=".25"></path>
            <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5V0Z" className="fill-zing-cream/30" opacity=".5"></path>
            <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.41,5.29,2.31,10.57,4.59,15.89,6.78,44,18.08,88,33.94,136,33.94,29,0,57-4.94,83.91-15.11,102.34-38.64,134.42-30,195.2-12.79V0Z" className="fill-background"></path>
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
      {faqs && faqs.length > 0 && (
        <section className="container mx-auto px-4 py-12 md:py-16">
          <div className="flex flex-col items-center text-center mb-10" data-aos="fade-up">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-brand-blue mb-2">Frequently Asked Questions</h2>
            <p className="text-slate-500 font-medium max-w-2xl">Everything you need to know about our products and services.</p>
          </div>
          <div className="max-w-3xl mx-auto" data-aos="fade-up" data-aos-delay="100">
            <Accordion className="w-full space-y-4">
              {faqs.map((faq) => (
                <AccordionItem key={faq.id} value={`item-${faq.id}`} className="bg-white border rounded-xl px-6 shadow-sm">
                  <AccordionTrigger className="text-left font-bold text-brand-blue hover:text-brand-mustard py-5 text-lg">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-600 pb-5 leading-relaxed text-base">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      )}

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
