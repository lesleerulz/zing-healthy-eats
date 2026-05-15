"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Scale, FileText } from "lucide-react";

export default function TermsPage() {
  const sections = [
    {
      title: "1. Acceptance of Terms",
      icon: ShieldCheck,
      content:
        "By accessing and using Zing Healthy Treats, you agree to be bound by these Terms of Use. If you do not agree to all of these terms, do not use this website.",
    },
    {
      title: "2. Ordering & Collection",
      icon: Scale,
      content:
        "Zing Healthy Treats operates a collection-only service. Orders placed must be collected from our designated station in Nairobi CBD. We do not currently offer home delivery. Orders not collected within 24 hours of notification may be forfeited without refund.",
    },
    {
      title: "3. Payments & Refunds",
      icon: FileText,
      content:
        "Payments are processed through Paystack. Once an order is prepared, we cannot offer refunds due to the perishable nature of our products. Cancellation requests must be made within 30 minutes of order placement.",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-brand-blue mb-4">Terms of Use</h1>
        <p className="text-slate-500">Last updated: May 15, 2026</p>
      </div>

      <div className="space-y-8">
        {sections.map((section, index) => (
          <Card key={index} className="border shadow-sm overflow-hidden">
            <CardContent className="p-8">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-brand-mustard/10 flex items-center justify-center shrink-0">
                  <section.icon className="h-6 w-6 text-brand-mustard-dark" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-brand-blue mb-3">
                    {section.title}
                  </h2>
                  <p className="text-slate-600 leading-relaxed text-sm">
                    {section.content}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
