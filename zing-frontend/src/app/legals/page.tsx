"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Info, MapPin, Phone, Mail } from "lucide-react";

export default function LegalsPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl text-center">
      <h1 className="text-4xl font-bold text-brand-blue mb-4">Legal Notice</h1>
      <p className="text-slate-500 mb-12">Zing Healthy Treats — Official Information</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
        <Card className="border shadow-sm">
          <CardContent className="p-6 flex flex-col items-center">
            <Info className="h-8 w-8 text-brand-mustard mb-3" />
            <h3 className="font-bold text-brand-blue mb-1">Company Name</h3>
            <p className="text-sm text-slate-600">Zing Healthy Treats Ltd.</p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="p-6 flex flex-col items-center">
            <MapPin className="h-8 w-8 text-brand-mustard mb-3" />
            <h3 className="font-bold text-brand-blue mb-1">Station Location</h3>
            <p className="text-sm text-slate-600">Zing Hub, Nairobi CBD, Kenya</p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="p-6 flex flex-col items-center">
            <Phone className="h-8 w-8 text-brand-mustard mb-3" />
            <h3 className="font-bold text-brand-blue mb-1">Support</h3>
            <p className="text-sm text-slate-600">+254 712 345 678</p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="p-6 flex flex-col items-center">
            <Mail className="h-8 w-8 text-brand-mustard mb-3" />
            <h3 className="font-bold text-brand-blue mb-1">Email</h3>
            <p className="text-sm text-slate-600">contact@zinghealthytreats.co.ke</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-12 text-slate-400 text-xs">
        <p>Registration Number: PVT-ZING-2026-X</p>
        <p className="mt-1">Licensed by the Nairobi City County Health Department</p>
      </div>
    </div>
  );
}
