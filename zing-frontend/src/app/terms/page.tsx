export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-3xl font-bold text-brand-blue mb-8">Terms of Use</h1>
      <div className="prose prose-slate max-w-none">
        <p>Welcome to Zing Healthy Treats. By accessing and using this website, you agree to the following terms and conditions:</p>
        <h2>1. General</h2>
        <p>This website is operated by Zing Healthy Treats. Throughout the site, the terms &quot;we&quot;, &quot;us&quot; and &quot;our&quot; refer to Zing Healthy Treats.</p>
        <h2>2. Products</h2>
        <p>All products displayed on this website are subject to availability. Prices are in Kenyan Shillings (KSh) and are subject to change without notice.</p>
        <h2>3. Orders & Payments</h2>
        <p>Orders are processed upon successful M-Pesa payment. We reserve the right to cancel any order at our discretion.</p>
        <h2>4. Delivery</h2>
        <p>Delivery timelines are estimates and may vary depending on location and availability.</p>
        <h2>5. Privacy</h2>
        <p>
          We respect your privacy. Please review our full <a href="/privacy-policy" className="text-brand-mustard hover:underline">Privacy Policy</a> to understand how we handle your personal data.
        </p>
      </div>
    </div>
  );
}
