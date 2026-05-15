"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { fetchApi, aboutHeroUrl, teamImageUrl } from "@/lib/api";
import type { AboutData } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function AboutPage() {
  const [data, setData] = useState<AboutData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi<AboutData>("/api/about")
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-8">
        <Skeleton className="h-[400px] rounded-2xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-16 pb-16">
      {/* Hero */}
      <section className="container mx-auto px-4 pt-8" data-aos="fade-down">
        <div className="relative h-[300px] md:h-[400px] rounded-2xl overflow-hidden shadow-xl">
          <Image
            src={aboutHeroUrl(data.hero_image)}
            alt="About Zing Healthy Treats"
            fill
            className="object-cover"
            priority
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-blue/80 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <h1 className="text-4xl font-bold text-white mb-2">About Us</h1>
            <p className="text-lg text-slate-200">Our story, our mission, our team</p>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="container mx-auto px-4 max-w-3xl" data-aos="fade-up">
        <h2 className="text-3xl font-bold text-brand-blue text-center mb-6">Our Story</h2>
        <div className="prose prose-lg mx-auto text-slate-600 text-center leading-relaxed">
          <p>{data.our_story}</p>
        </div>
      </section>

      {/* Team */}
      {data.team_members.length > 0 && (
        <section className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-brand-blue text-center mb-8">Our Team</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {data.team_members.map((member, index) => (
              <Card key={member.id} data-aos="fade-up" data-aos-delay={index * 100} className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
                <div className="relative aspect-square">
                  <Image
                    src={teamImageUrl(member.image_filename)}
                    alt={member.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <CardContent className="p-4 text-center">
                  <h3 className="font-semibold text-brand-blue text-lg">{member.name}</h3>
                  <p className="text-sm text-brand-mustard-dark font-medium">{member.role}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* FAQs */}
      {data.faqs && data.faqs.length > 0 && (
        <section className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl font-bold text-brand-blue text-center mb-8">
            Frequently Asked Questions
          </h2>
          <Accordion type="single" className="w-full space-y-4">
            {data.faqs.map((faq, index) => (
              <AccordionItem
                key={faq.id}
                value={`item-${faq.id}`}
                data-aos="fade-up"
                data-aos-delay={index * 50}
                className="border rounded-xl px-4 bg-white shadow-sm hover:shadow-md transition-all"
              >
                <AccordionTrigger className="text-left font-bold text-brand-blue hover:no-underline py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 leading-relaxed pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      )}
    </div>
  );
}
