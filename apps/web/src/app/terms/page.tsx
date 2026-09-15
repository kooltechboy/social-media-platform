import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service — TUKUBI',
  description: 'TUKUBI Terms of Service governing use of the Caribbean Digital Ecosystem.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#080D18] py-12 px-4 sm:px-6 lg:px-8">
      <article className="max-w-3xl mx-auto prose prose-invert prose-sm">
        <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
          Terms of Service
        </h1>
        <p className="text-sm text-[#FDF2E9]/50 mb-8">
          Effective Date: September 15, 2026 &middot; Last Updated: September 15, 2026
        </p>

        <section className="space-y-4 text-[#FDF2E9]/80 text-sm leading-relaxed">
          <h2 className="text-lg font-bold text-white mt-8">1. Acceptance of Terms</h2>
          <p>
            By accessing or using TUKUBI (&ldquo;the Platform&rdquo;), operated by TUKUBI Inc., you agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;). If you do not agree, you may not use the Platform.
          </p>

          <h2 className="text-lg font-bold text-white mt-8">2. Platform Description</h2>
          <p>
            TUKUBI is a Caribbean Digital Ecosystem providing social networking, media streaming, creator patronage, community organizing, marketplace commerce, and financial services to Caribbean nationals and the global diaspora.
          </p>

          <h2 className="text-lg font-bold text-white mt-8">3. Eligibility</h2>
          <p>
            You must be at least 16 years of age to create an account. By registering, you represent that all information you provide is accurate and that you will maintain the accuracy of such information.
          </p>

          <h2 className="text-lg font-bold text-white mt-8">4. Account Responsibilities</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account credentials. You agree to notify TUKUBI immediately of any unauthorized access. TUKUBI is not liable for losses arising from unauthorized use of your account.
          </p>

          <h2 className="text-lg font-bold text-white mt-8">5. Community Standards</h2>
          <p>
            TUKUBI is committed to a safe, inclusive, and respectful environment celebrating Caribbean culture and identity. You agree not to post content that is hateful, harassing, violent, sexually exploitative, fraudulent, or that infringes on intellectual property rights. TUKUBI reserves the right to remove content and suspend accounts that violate these standards.
          </p>

          <h2 className="text-lg font-bold text-white mt-8">6. Creator Patronage &amp; Monetization</h2>
          <p>
            Creators may earn revenue through subscriber patronage tiers, tips, and media streaming. All financial transactions are processed through our double-entry accounting system with platform and payment processing fees deducted before net payouts. Fee schedules are displayed transparently in Creator Studio before you publish monetized content.
          </p>

          <h2 className="text-lg font-bold text-white mt-8">7. Marketplace Commerce</h2>
          <p>
            The TUKUBI Marketplace enables merchants to sell authentic Caribbean goods and services. All marketplace transactions utilize escrow protection. Sellers are responsible for accurate product descriptions, fulfillment, and compliance with applicable trade and customs regulations.
          </p>

          <h2 className="text-lg font-bold text-white mt-8">8. Payments &amp; Financial Services</h2>
          <p>
            TUKUBI partners with regulated payment service providers. Digital goods purchased through mobile applications are processed through the respective platform&rsquo;s in-app purchase system (Apple App Store, Google Play) in compliance with their policies. TUKUBI does not provide banking, lending, or investment services.
          </p>

          <h2 className="text-lg font-bold text-white mt-8">9. Intellectual Property</h2>
          <p>
            You retain ownership of content you create and post on TUKUBI. By posting content, you grant TUKUBI a non-exclusive, worldwide, royalty-free license to display, distribute, and promote your content within the Platform. TUKUBI&rsquo;s name, logo, and design elements are proprietary and may not be used without written permission.
          </p>

          <h2 className="text-lg font-bold text-white mt-8">10. Privacy</h2>
          <p>
            Your use of TUKUBI is also governed by our{' '}
            <a href="/privacy" className="text-[#00B4D8] underline underline-offset-2">Privacy Policy</a>.
            Caribbean identity and location are optional and private by default.
          </p>

          <h2 className="text-lg font-bold text-white mt-8">11. Termination</h2>
          <p>
            TUKUBI may suspend or terminate your account for violations of these Terms. You may delete your account at any time through your profile settings. Upon termination, your right to use the Platform ceases immediately.
          </p>

          <h2 className="text-lg font-bold text-white mt-8">12. Disclaimers &amp; Limitation of Liability</h2>
          <p>
            TUKUBI is provided &ldquo;as is&rdquo; without warranties of any kind. To the maximum extent permitted by law, TUKUBI shall not be liable for indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform.
          </p>

          <h2 className="text-lg font-bold text-white mt-8">13. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with applicable laws. Any disputes shall be resolved through binding arbitration.
          </p>

          <h2 className="text-lg font-bold text-white mt-8">14. Changes to Terms</h2>
          <p>
            TUKUBI reserves the right to modify these Terms at any time. Material changes will be communicated via the Platform. Continued use after changes constitutes acceptance of the revised Terms.
          </p>

          <h2 className="text-lg font-bold text-white mt-8">15. Contact</h2>
          <p>
            For questions about these Terms, contact us at{' '}
            <a href="mailto:legal@tukubi.com" className="text-[#00B4D8] underline underline-offset-2">legal@tukubi.com</a>.
          </p>
        </section>

        <div className="mt-12 pt-6 border-t border-[#2A1B38] text-xs text-[#FDF2E9]/30">
          <p>TUKUBI — The Caribbean Connected.</p>
        </div>
      </article>
    </div>
  );
}
