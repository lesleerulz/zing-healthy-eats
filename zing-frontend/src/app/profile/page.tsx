"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, MapPin, Phone, Shield, Package } from "lucide-react";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [savedPhone, setSavedPhone] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    setUsername(user.username);
    setEmail(user.email);
    setSavedPhone(user.saved_phone || "");
    setAddress(user.address || "");
  }, [user, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetchApi("/api/auth/profile", {
        method: "PUT",
        body: JSON.stringify({
          username,
          email,
          saved_phone: savedPhone,
          address,
        }),
      });
      await refreshUser();
      toast.success("Profile updated!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold text-brand-blue mb-8">Your Profile</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Card className="border shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-brand-mustard/10 flex items-center justify-center">
              <Package className="h-5 w-5 text-brand-mustard" />
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-blue">{user.orders_count || 0}</p>
              <p className="text-xs text-slate-500">Total Orders</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-brand-blue/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-brand-blue" />
              </div>
              <div>
                <Badge className={user.is_verified ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>
                  {user.is_verified ? "Verified" : "Unverified"}
                </Badge>
                <p className="text-xs text-slate-500 mt-1">
                  {user.last_order_date ? `Last order: ${user.last_order_date}` : "No orders yet"}
                </p>
              </div>
            </div>
            
            {!user.is_verified && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={async () => {
                  try {
                    await fetchApi("/api/auth/verify/resend", { method: "POST" });
                    toast.success("Verification email sent!");
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Failed to send email");
                  }
                }}
              >
                Resend Email
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Profile Form */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Account Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input value={username} onChange={(e) => setUsername(e.target.value)} className="pl-9" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Saved Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input value={savedPhone} onChange={(e) => setSavedPhone(e.target.value)} placeholder="0712345678" className="pl-9" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Address</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Your delivery address" className="pl-9" />
              </div>
            </div>

            <Button
              type="submit"
              disabled={saving}
              className="w-full bg-brand-mustard text-brand-blue hover:bg-brand-mustard-dark font-bold rounded-xl h-11"
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
