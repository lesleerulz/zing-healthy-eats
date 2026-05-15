"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Lock, Eye, Mail } from "lucide-react";

export default function PrivacyPolicyPage() {
  const sections = [
    {
      title: "Information Collection",
      icon: Eye,
      content:
        "We collect information you provide directly to us, such as your name, email, and phone number when you register or place an order. We use this to manage your collections and notify you of order status.",
    },
    {
      title: "Data Security",
      icon: Lock,
      content:
        "We take reasonable measures to help protect information about you from loss, theft, misuse, and unauthorized access. We do not store your credit card or M-Pesa pin; all payments are handled by Paystack.",
    },
    {
      title: "Contact Us",
      icon: Mail,
      content:
        "If you have any questions about this Privacy Policy, please contact us at support@zinghealthytreats.co.ke.",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-brand-blue mb-4">
          Privacy Policy
        </h1>
        <p className="text-slate-500">Last updated: May 15, 2026</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section, index) => (
          <Card
            key={index}
            className={`border shadow-sm overflow-hidden ${
              index === 2 ? "md:col-span-2" : ""
            }`}
          >
            <CardContent className="p-8">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-brand-blue/5 flex items-center justify-center shrink-0">
                  <section.icon className="h-6 w-6 text-brand-blue" />
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
