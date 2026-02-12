import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service - GoutGuard',
  description: 'GoutGuard Terms of Service',
};

export default function TermsOfServicePage() {
  return (
    <div className="page" style={{ paddingTop: 24, paddingBottom: 48 }}>
      {/* Back Link */}
      <Link
        href="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 14,
          fontWeight: 500,
          color: 'var(--color-primary)',
          textDecoration: 'none',
          marginBottom: 24,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Back
      </Link>

      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Terms of Service</h1>
      <p style={{ fontSize: 13, color: 'var(--color-gray-500)', marginBottom: 32 }}>
        Effective Date: January 1, 2025
      </p>

      {/* Introduction */}
      <section style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-gray-700)' }}>
          Welcome to GoutGuard. These Terms of Service (&quot;Terms&quot;) govern your use of the GoutGuard
          mobile application (&quot;App&quot;), operated by GoutGuard (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). By downloading,
          installing, or using the App, you agree to be bound by these Terms. If you do not agree to
          these Terms, do not use the App.
        </p>
      </section>

      {/* 1. App Description and Purpose */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10, color: 'var(--foreground)' }}>
          1. App Description and Purpose
        </h2>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-gray-700)' }}>
          GoutGuard is a health and wellness application designed to assist individuals managing gout. The
          App provides AI-powered food scanning for purine content estimation, a comprehensive purine food
          database, uric acid level tracking, gout flare logging, medication reminders, and hydration
          tracking. The App is intended to serve as a supplementary tool to help users make more informed
          dietary decisions and track health metrics related to gout management.
        </p>
      </section>

      {/* 2. Medical Disclaimer */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10, color: 'var(--foreground)' }}>
          2. Medical Disclaimer
        </h2>
        <div
          style={{
            background: 'var(--color-red-bg)',
            border: '1px solid var(--color-red)',
            borderRadius: 'var(--radius-sm)',
            padding: 16,
            marginBottom: 12,
          }}
        >
          <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-gray-700)', fontWeight: 600 }}>
            GoutGuard is NOT a medical device and does NOT provide medical advice, diagnosis, or treatment.
          </p>
        </div>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-gray-700)' }}>
          The information provided by the App is for general informational and educational purposes only. It
          is not intended to be a substitute for professional medical advice, diagnosis, or treatment. Always
          seek the advice of your rheumatologist, physician, or other qualified healthcare provider with any
          questions you may have regarding gout or any other medical condition. Never disregard professional
          medical advice or delay in seeking it because of information provided by the App. Do not start,
          stop, or change any medication regimen based on App recommendations without first consulting your
          healthcare provider.
        </p>
      </section>

      {/* 3. Subscription Terms */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10, color: 'var(--foreground)' }}>
          3. Subscription Terms
        </h2>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-gray-700)', marginBottom: 12 }}>
          GoutGuard offers both free and premium subscription tiers:
        </p>
        <ul style={{ fontSize: 14, lineHeight: 1.9, color: 'var(--color-gray-700)', paddingLeft: 20 }}>
          <li>
            <strong>Free Tier:</strong> Includes limited daily AI food scans (3 per day), access to the
            purine food database, basic uric acid tracking, and hydration logging.
          </li>
          <li>
            <strong>Premium Monthly:</strong> $4.99 per month. Includes unlimited AI food scans, full
            analytics and trends, detailed scan history, medication reminders, and all premium features.
          </li>
          <li>
            <strong>Premium Annual:</strong> $29.99 per year (equivalent to $2.50/month). Includes all
            Premium Monthly features at a discounted annual rate.
          </li>
        </ul>
      </section>

      {/* 4. Free Trial */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10, color: 'var(--foreground)' }}>
          4. Free Trial
        </h2>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-gray-700)' }}>
          New users may be eligible for a 7-day free trial of GoutGuard Premium. The free trial provides
          full access to all premium features at no charge for the trial period. At the end of the 7-day
          trial, your subscription will automatically convert to a paid subscription at the rate you
          selected during sign-up unless you cancel before the trial period ends. You may cancel the free
          trial at any time through your Apple ID subscription settings. Only one free trial is available
          per Apple ID.
        </p>
      </section>

      {/* 5. Auto-Renewal and Cancellation */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10, color: 'var(--foreground)' }}>
          5. Auto-Renewal and Cancellation
        </h2>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-gray-700)', marginBottom: 12 }}>
          All subscriptions automatically renew at the end of each billing period (monthly or annually)
          unless you cancel at least 24 hours before the end of the current period. To cancel your
          subscription:
        </p>
        <ol style={{ fontSize: 14, lineHeight: 1.9, color: 'var(--color-gray-700)', paddingLeft: 20 }}>
          <li>Open the Settings app on your iPhone or iPad.</li>
          <li>Tap your name at the top, then tap &quot;Subscriptions.&quot;</li>
          <li>Select GoutGuard and tap &quot;Cancel Subscription.&quot;</li>
        </ol>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-gray-700)', marginTop: 12 }}>
          Upon cancellation, you will retain access to premium features until the end of your current
          billing period. Refunds are handled in accordance with Apple&apos;s App Store refund policies. We
          do not process refunds directly.
        </p>
      </section>

      {/* 6. User Responsibilities */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10, color: 'var(--foreground)' }}>
          6. User Responsibilities
        </h2>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-gray-700)', marginBottom: 12 }}>
          By using GoutGuard, you agree to:
        </p>
        <ul style={{ fontSize: 14, lineHeight: 1.9, color: 'var(--color-gray-700)', paddingLeft: 20 }}>
          <li>Use the App only for its intended purpose of personal health tracking and information.</li>
          <li>Provide accurate information when logging health data.</li>
          <li>Not rely solely on the App for medical decisions.</li>
          <li>Consult a qualified healthcare provider for medical advice.</li>
          <li>Not attempt to reverse-engineer, decompile, or tamper with the App.</li>
          <li>Not use the App in any manner that violates applicable laws or regulations.</li>
          <li>
            Maintain responsibility for backing up your own data, as all data is stored locally on your
            device.
          </li>
        </ul>
      </section>

      {/* 7. Data Privacy */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10, color: 'var(--foreground)' }}>
          7. Data Privacy
        </h2>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-gray-700)' }}>
          Your privacy is fundamental to GoutGuard. All personal health data, including uric acid readings,
          food logs, flare records, and settings, is stored locally on your device. We do not maintain user
          accounts, and we do not collect, transmit, or store your personal health information on external
          servers. When you use the AI food scanning feature, images are sent to a third-party AI service
          (OpenAI) for analysis; however, these images are not stored on our servers and are processed in
          accordance with OpenAI&apos;s data usage policies. For full details, please see our{' '}
          <Link href="/privacy" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>
            Privacy Policy
          </Link>
          .
        </p>
      </section>

      {/* 8. Intellectual Property */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10, color: 'var(--foreground)' }}>
          8. Intellectual Property
        </h2>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-gray-700)' }}>
          All content, features, and functionality of the GoutGuard App, including but not limited to its
          design, graphics, text, logos, icons, software code, purine database, and AI analysis algorithms,
          are the exclusive property of GoutGuard and are protected by copyright, trademark, and other
          intellectual property laws. You may not copy, modify, distribute, sell, or lease any part of the
          App or its content without our prior written consent. Your use of the App does not grant you any
          ownership rights to the App or its content.
        </p>
      </section>

      {/* 9. Limitation of Liability */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10, color: 'var(--foreground)' }}>
          9. Limitation of Liability
        </h2>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-gray-700)' }}>
          TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, GOUTGUARD AND ITS OFFICERS, DIRECTORS,
          EMPLOYEES, AGENTS, AND AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
          CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY
          OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM (A)
          YOUR ACCESS TO, USE OF, OR INABILITY TO USE THE APP; (B) ANY CONDUCT OR CONTENT OF ANY THIRD
          PARTY; (C) ANY HEALTH DECISIONS MADE BASED ON INFORMATION PROVIDED BY THE APP; OR (D) INACCURATE
          PURINE CONTENT ESTIMATES OR AI FOOD ANALYSIS RESULTS. THE APP IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS
          AVAILABLE&quot; BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. OUR TOTAL LIABILITY
          SHALL NOT EXCEED THE AMOUNT YOU PAID FOR THE APP IN THE TWELVE (12) MONTHS PRIOR TO THE EVENT
          GIVING RISE TO THE CLAIM.
        </p>
      </section>

      {/* 10. Indemnification */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10, color: 'var(--foreground)' }}>
          10. Indemnification
        </h2>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-gray-700)' }}>
          You agree to indemnify, defend, and hold harmless GoutGuard and its officers, directors,
          employees, agents, and affiliates from and against any and all claims, damages, losses,
          liabilities, costs, and expenses (including reasonable attorneys&apos; fees) arising out of or
          related to your use of the App, your violation of these Terms, or your violation of any rights of
          another party.
        </p>
      </section>

      {/* 11. Governing Law */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10, color: 'var(--foreground)' }}>
          11. Governing Law
        </h2>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-gray-700)' }}>
          These Terms shall be governed by and construed in accordance with the laws of the State of
          Delaware, United States, without regard to its conflict of law provisions. Any disputes arising
          under or in connection with these Terms shall be subject to the exclusive jurisdiction of the
          state and federal courts located in the State of Delaware. Notwithstanding the foregoing, we may
          seek injunctive or other equitable relief in any court of competent jurisdiction.
        </p>
      </section>

      {/* 12. Changes to These Terms */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10, color: 'var(--foreground)' }}>
          12. Changes to These Terms
        </h2>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-gray-700)' }}>
          We reserve the right to modify these Terms at any time. If we make material changes, we will
          notify you through the App or by other appropriate means. Your continued use of the App after
          such changes constitutes your acceptance of the updated Terms. We encourage you to review these
          Terms periodically for any changes.
        </p>
      </section>

      {/* 13. Termination */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10, color: 'var(--foreground)' }}>
          13. Termination
        </h2>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-gray-700)' }}>
          We may terminate or suspend your access to the App at any time, without prior notice or liability,
          for any reason, including if you breach these Terms. You may stop using the App at any time by
          deleting it from your device. Upon termination, all provisions of these Terms that by their nature
          should survive shall survive, including intellectual property provisions, warranty disclaimers,
          indemnification, and limitations of liability.
        </p>
      </section>

      {/* 14. Contact Information */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10, color: 'var(--foreground)' }}>
          14. Contact Information
        </h2>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-gray-700)' }}>
          If you have any questions or concerns about these Terms of Service, please contact us at:
        </p>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-primary)', marginTop: 8 }}>
          support@goutguard.app
        </p>
      </section>

      {/* Footer */}
      <footer className="disclaimer" style={{ marginTop: 32 }}>
        <p>GoutGuard is not a substitute for professional medical advice.</p>
        <p style={{ marginTop: 4 }}>
          By using GoutGuard, you agree to these Terms of Service.
        </p>
      </footer>
    </div>
  );
}
