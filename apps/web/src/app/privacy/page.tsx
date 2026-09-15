import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — TUKUBI',
  description: 'TUKUBI Privacy Policy governing the collection, use, and protection of personal data.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#080D18] py-12 px-4 sm:px-6 lg:px-8">
      <article className="max-w-3xl mx-auto prose prose-invert prose-sm">
        <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm text-[#FDF2E9]/50 mb-8">
          Effective Date: September 15, 2026 &middot; Last Updated: September 15, 2026
        </p>

        <section className="space-y-4 text-[#FDF2E9]/80 text-sm leading-relaxed">
          <h2 className="text-lg font-bold text-white mt-8">1. Introduction</h2>
          <p>
            TUKUBI Inc. (&ldquo;TUKUBI,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;) is committed to protecting the privacy and security of your personal information. This Privacy Policy explains how we collect, use, share, and safeguard data when you use the TUKUBI platform and associated services.
          </p>

          <h2 className="text-lg font-bold text-white mt-8">2. Information We Collect</h2>
          <p><strong className="text-white">Account Information:</strong> Name, email address, username, and password when you register.</p>
          <p><strong className="text-white">Profile Information:</strong> Avatar, bio, and any additional details you choose to provide.</p>
          <p><strong className="text-white">Content:</strong> Posts, media, messages, and other content you create or share on TUKUBI.</p>
          <p><strong className="text-white">Usage Data:</strong> Device information, IP address, browser type, pages visited, and interaction patterns collected automatically.</p>
          <p><strong className="text-white">Payment Information:</strong> Transaction details processed by our regulated payment service providers. TUKUBI does not store full payment card numbers.</p>

          <h2 className="text-lg font-bold text-white mt-8">3. Caribbean Identity &amp; Location Privacy</h2>
          <div className="bg-[#1D1429] border border-[#8B5CF6]/20 rounded-xl p-4">
            <p className="text-[#FFB347] font-semibold text-sm mb-2">Your Identity, Your Choice</p>
            <p>
              Caribbean cultural identity and geographic location are <strong className="text-white">optional and private by default</strong>. You control what identity information is visible to others. TUKUBI will never infer or expose cultural, ethnic, or national attributes as facts. Any location or identity data you share can be modified or removed at any time through your privacy settings.
            </p>
          </div>

          <h2 className="text-lg font-bold text-white mt-8">4. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Provide, maintain, and improve the TUKUBI platform</li>
            <li>Process transactions and send related communications</li>
            <li>Personalize your experience and surface relevant content</li>
            <li>Enforce our Terms of Service and Community Standards</li>
            <li>Detect and prevent fraud, abuse, and security threats</li>
            <li>Comply with legal obligations</li>
          </ul>

          <h2 className="text-lg font-bold text-white mt-8">5. Information Sharing</h2>
          <p>We do not sell your personal information. We may share information with:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-white">Service Providers:</strong> Payment processors, cloud hosting, and analytics services that help us operate the Platform</li>
            <li><strong className="text-white">Legal Requirements:</strong> When required by law, regulation, or legal process</li>
            <li><strong className="text-white">Safety:</strong> To protect the rights, safety, and property of TUKUBI, our users, and the public</li>
          </ul>

          <h2 className="text-lg font-bold text-white mt-8">6. Data Security</h2>
          <p>
            We implement industry-standard security measures including encryption in transit and at rest, row-level security policies on all database tables, and regular security audits. However, no method of transmission or storage is 100% secure.
          </p>

          <h2 className="text-lg font-bold text-white mt-8">7. Data Retention</h2>
          <p>
            We retain your personal information for as long as your account is active or as needed to provide services. Upon account deletion, we will remove or anonymize your personal data within 30 days, except where retention is required by law.
          </p>

          <h2 className="text-lg font-bold text-white mt-8">8. Your Rights</h2>
          <p>Depending on your jurisdiction, you may have the right to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Access and receive a copy of your personal data</li>
            <li>Correct inaccurate personal data</li>
            <li>Request deletion of your personal data</li>
            <li>Object to or restrict certain processing</li>
            <li>Data portability</li>
            <li>Withdraw consent at any time</li>
          </ul>
          <p>
            To exercise these rights, contact us at{' '}
            <a href="mailto:privacy@tukubi.com" className="text-[#00B4D8] underline underline-offset-2">privacy@tukubi.com</a>.
          </p>

          <h2 className="text-lg font-bold text-white mt-8">9. Cookies &amp; Tracking</h2>
          <p>
            TUKUBI uses essential cookies for authentication and session management. Analytics cookies are used only with your consent to help us understand how the Platform is used and to improve your experience.
          </p>

          <h2 className="text-lg font-bold text-white mt-8">10. Children&rsquo;s Privacy</h2>
          <p>
            TUKUBI is not directed to children under 16 years of age. We do not knowingly collect personal information from children under 16. If we become aware that we have collected data from a child under 16, we will take steps to delete that information.
          </p>

          <h2 className="text-lg font-bold text-white mt-8">11. International Transfers</h2>
          <p>
            Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place for such transfers in compliance with GDPR and applicable data protection laws.
          </p>

          <h2 className="text-lg font-bold text-white mt-8">12. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy periodically. Material changes will be communicated through the Platform. Your continued use of TUKUBI after changes constitutes acceptance of the revised policy.
          </p>

          <h2 className="text-lg font-bold text-white mt-8">13. Contact Us</h2>
          <p>
            For privacy-related inquiries, contact our Data Protection team at{' '}
            <a href="mailto:privacy@tukubi.com" className="text-[#00B4D8] underline underline-offset-2">privacy@tukubi.com</a>.
          </p>
        </section>

        <div className="mt-12 pt-6 border-t border-[#2A1B38] text-xs text-[#FDF2E9]/30">
          <p>TUKUBI — The Caribbean Connected.</p>
        </div>
      </article>
    </div>
  );
}
