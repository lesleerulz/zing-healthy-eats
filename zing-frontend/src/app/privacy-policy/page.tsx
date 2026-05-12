export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-3xl font-bold text-brand-blue mb-8">Our Privacy Policy</h1>
      <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed">
        <p className="text-lg">
          We care about your privacy just as much as we care about the quality of ingredients in our healthy treats. This page explains how we handle your personal information and why.
        </p>

        <h2 className="text-brand-blue mt-10 mb-2 font-bold text-xl uppercase tracking-tight">1. The Information We Collect</h2>
        <p>
          When you sign up for an account on Zing Healthy Treats, we collect a few basic details:
        </p>
        <ul className="list-disc pl-5 space-y-2 my-4">
          <li><strong>Basic Profile:</strong> Your name and email address.</li>
          <li><strong>Login Method:</strong> If you use &quot;Sign in with Google,&quot; Google provides us with your name and email address so you don&apos;t have to fill them in manually.</li>
          <li><strong>Order Details:</strong> If you buy something, we collect your delivery address and order history so we can get your treats to you.</li>
        </ul>

        <h2 className="text-brand-blue mt-10 mb-2 font-bold text-xl uppercase tracking-tight">2. How We Use Your Data</h2>
        <p>
          We use your information for three main things:
        </p>
        <ul className="list-disc pl-5 space-y-2 my-4">
          <li><strong>Managing Your Account:</strong> To keep your orders and preferences in one place.</li>
          <li><strong>Getting Your Treats Delivered:</strong> To know where to send your snacks.</li>
          <li><strong>Staying in Touch:</strong> To send you order updates or, if you&apos;ve subscribed to our newsletter, the occasional update about new treats.</li>
        </ul>

        <h2 className="text-brand-blue mt-10 mb-2 font-bold text-xl uppercase tracking-tight">3. No Third-Party Sales</h2>
        <p>
          We will never sell, rent, or trade your personal information to third parties. We only share your data with the services necessary to run our shop (like our payment processor or delivery partners) and only to the extent needed to complete your order.
        </p>

        <h2 className="text-brand-blue mt-10 mb-2 font-bold text-xl uppercase tracking-tight">4. Your Control & Rights</h2>
        <p>
          It&apos;s your data, and you&apos;re in control. You can:
        </p>
        <ul className="list-disc pl-5 space-y-2 my-4">
          <li>View and edit your profile information at any time.</li>
          <li>Request that we delete your account and all associated data by contacting our support team.</li>
          <li>Unsubscribe from our marketing emails whenever you want.</li>
        </ul>

        <h2 className="text-brand-blue mt-10 mb-2 font-bold text-xl uppercase tracking-tight">5. Contact Us</h2>
        <p>
          If you have any questions about how we handle your privacy, feel free to reach out to us through our official social media channels or our support contact details.
        </p>
        
        <p className="mt-12 text-sm text-slate-500 italic border-t border-slate-200 pt-4">
          Last updated: May 12, 2026
        </p>
      </div>
    </div>
  );
}
