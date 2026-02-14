import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy - GoutCare',
  description: 'GoutCare Privacy Policy',
};

export default function PrivacyPolicyPage() {
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

      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Privacy Policy</h1>
      <p style={{ fontSize: 13, color: 'var(--color-gray-500)', marginBottom: 32 }}>
        Effective Date: January 1, 2025
      </p>

      {/* Introduction */}
      <section style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-gray-700)' }}>
          GoutCare (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is committed to protecting your privacy. This Privacy Policy
          explains how we handle information when you use the GoutCare mobile application (&quot;App&quot;). We
          designed GoutCare with a privacy-first approach: your health data stays on your device, and we
          collect as little information as possible.
        </p>
      </section>

      {/* 1. Information We Collect */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10, color: 'var(--foreground)' }}>
          1. Information We Collect
        </h2>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-gray-700)', marginBottom: 12 }}>
          GoutCare is designed to collect minimal information. Here is what the App handles:
        </p>
        <ul style={{ fontSize: 14, lineHeight: 1.9, color: 'var(--color-gray-700)', paddingLeft: 20 }}>
          <li>
            <strong>Health data you enter:</strong> Uric acid readings, food logs, flare events, medication
            schedules, hydration intake, and personal settings (such as daily purine targets). All of this
            data is stored exclusively on your device in local storage.
          </li>
          <li>
            <strong>Food images (temporary):</strong> When you use the AI food scanning feature, the image
            you capture or select is sent to a third-party AI service for analysis. See Section 2 for
            details.
          </li>
          <li>
            <strong>Subscription status:</strong> If you subscribe to GoutCare Premium, Apple manages all
            payment and subscription information. We receive only a confirmation of your subscription status
            -- not your payment details, Apple ID, or personal identity.
          </li>
        </ul>
        <div
          style={{
            background: 'var(--color-green-bg)',
            border: '1px solid var(--color-green)',
            borderRadius: 'var(--radius-sm)',
            padding: 16,
            marginTop: 16,
          }}
        >
          <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-gray-700)', fontWeight: 600 }}>
            We do NOT collect: your name, email address, phone number, location, device identifiers,
            advertising IDs, or any other personally identifiable information.
          </p>
        </div>
      </section>

      {/* 2. How Images Are Processed */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10, color: 'var(--foreground)' }}>
          2. How Images Are Processed
        </h2>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-gray-700)', marginBottom: 12 }}>
          When you use the AI food scanning feature:
        </p>
        <ul style={{ fontSize: 14, lineHeight: 1.9, color: 'var(--color-gray-700)', paddingLeft: 20 }}>
          <li>
            The photo you take or select is sent to Anthropic&apos;s API for food identification and purine
            content analysis.
          </li>
          <li>
            The image is transmitted securely via HTTPS and is processed in real-time by Anthropic&apos;s
            vision model.
          </li>
          <li>
            <strong>We do not store your food images on any server.</strong> The image is sent directly
            from your device to Anthropic&apos;s API and is not retained by us.
          </li>
          <li>
            Anthropic&apos;s data usage policy states that API inputs are not used to train their models. For
            more information, refer to Anthropic&apos;s privacy documentation.
          </li>
          <li>
            A thumbnail of your scanned image may be saved locally on your device as part of your scan
            history, but this never leaves your device.
          </li>
        </ul>
      </section>

      {/* 3. Local Data Storage */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10, color: 'var(--foreground)' }}>
          3. Local Data Storage
        </h2>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-gray-700)' }}>
          All of your health data is stored locally on your device using the browser&apos;s local storage or
          the native app&apos;s on-device storage. This includes:
        </p>
        <ul style={{ fontSize: 14, lineHeight: 1.9, color: 'var(--color-gray-700)', paddingLeft: 20, marginTop: 8 }}>
          <li>Food log entries and purine intake history</li>
          <li>Uric acid readings and trends</li>
          <li>Gout flare events and symptom records</li>
          <li>Medication reminders and schedules</li>
          <li>Hydration tracking data</li>
          <li>Personal settings and preferences</li>
          <li>AI scan history and results</li>
        </ul>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-gray-700)', marginTop: 12 }}>
          This data is never transmitted to our servers or any third party (except food images during
          scanning as described in Section 2). If you delete the App, all locally stored data is permanently
          removed from your device.
        </p>
      </section>

      {/* 4. No User Accounts Required */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10, color: 'var(--foreground)' }}>
          4. No User Accounts Required
        </h2>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-gray-700)' }}>
          GoutCare does not require you to create a user account. There is no sign-up, login, or
          registration process. You can start using the App immediately after downloading it. This means we
          have no way to identify you personally, and there is no user profile stored on our servers.
        </p>
      </section>

      {/* 5. No Tracking or Analytics */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10, color: 'var(--foreground)' }}>
          5. No Tracking or Analytics
        </h2>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-gray-700)' }}>
          GoutCare does not use any analytics services, tracking pixels, advertising SDKs, or third-party
          analytics tools. We do not track your behavior within the App. We do not collect crash reports,
          usage statistics, or session data. We do not use cookies or similar tracking technologies. Your
          use of the App is completely private.
        </p>
      </section>

      {/* 6. Third-Party Services */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10, color: 'var(--foreground)' }}>
          6. Third-Party Services
        </h2>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-gray-700)', marginBottom: 12 }}>
          GoutCare integrates with the following third-party services:
        </p>
        <ul style={{ fontSize: 14, lineHeight: 1.9, color: 'var(--color-gray-700)', paddingLeft: 20 }}>
          <li>
            <strong>Anthropic (food analysis):</strong> Food images are sent to Anthropic&apos;s API for AI-powered
            food identification and purine content estimation. Anthropic processes images in accordance with
            their API data usage policy. API data is not used to train Anthropic&apos;s models.
          </li>
          <li>
            <strong>Apple App Store (subscriptions):</strong> If you purchase a GoutCare Premium
            subscription, the transaction is processed entirely by Apple through the App Store. We do not
            have access to your payment information, Apple ID, or billing details. Apple&apos;s privacy
            policy governs the handling of your payment data.
          </li>
        </ul>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-gray-700)', marginTop: 12 }}>
          We do not share your data with any other third parties for advertising, marketing, or any other
          purpose.
        </p>
      </section>

      {/* 7. Data Export and Deletion */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10, color: 'var(--foreground)' }}>
          7. Data Export and Deletion
        </h2>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-gray-700)' }}>
          Because all your data is stored locally on your device, you have full control over it at all times:
        </p>
        <ul style={{ fontSize: 14, lineHeight: 1.9, color: 'var(--color-gray-700)', paddingLeft: 20, marginTop: 8 }}>
          <li>
            <strong>Export:</strong> You can export your health data from within the App&apos;s settings for
            personal use or to share with your healthcare provider.
          </li>
          <li>
            <strong>Deletion:</strong> You can clear all data from within the App&apos;s settings at any
            time. Alternatively, uninstalling the App will permanently delete all stored data from your
            device.
          </li>
          <li>
            <strong>No server data to delete:</strong> Since we do not store your health data on any
            server, there is no remote data that needs to be requested for deletion.
          </li>
        </ul>
      </section>

      {/* 8. Children's Privacy */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10, color: 'var(--foreground)' }}>
          8. Children&apos;s Privacy
        </h2>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-gray-700)' }}>
          GoutCare is not designed for or directed at children under the age of 13. Gout is predominantly
          an adult condition, and the App&apos;s features are intended for adult users. We do not knowingly
          collect any information from children under 13. If you are a parent or guardian and believe your
          child has provided information through the App, please contact us so we can take appropriate
          action.
        </p>
      </section>

      {/* 9. Data Security */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10, color: 'var(--foreground)' }}>
          9. Data Security
        </h2>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-gray-700)' }}>
          We take reasonable measures to protect the information handled by the App. All communications
          with third-party APIs (such as Anthropic) are encrypted using HTTPS/TLS. Since your health data is
          stored locally on your device, its security is also protected by your device&apos;s built-in
          security features (such as device passcode, Face ID, or Touch ID). We recommend keeping your
          device software up to date and using a strong device passcode to further protect your data.
        </p>
      </section>

      {/* 10. HIPAA Disclaimer */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10, color: 'var(--foreground)' }}>
          10. HIPAA Disclaimer
        </h2>
        <div
          style={{
            background: 'var(--color-yellow-bg)',
            border: '1px solid var(--color-yellow)',
            borderRadius: 'var(--radius-sm)',
            padding: 16,
          }}
        >
          <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-gray-700)' }}>
            GoutCare is not a &quot;covered entity&quot; or &quot;business associate&quot; under the Health Insurance
            Portability and Accountability Act (HIPAA). The App is a consumer wellness product, not a
            medical device or healthcare service. HIPAA regulations do not apply to the data you store in
            the App. While we take your privacy seriously and store all data locally on your device, the
            protections provided are not equivalent to those required under HIPAA for protected health
            information (PHI).
          </p>
        </div>
      </section>

      {/* 11. Changes to This Privacy Policy */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10, color: 'var(--foreground)' }}>
          11. Changes to This Privacy Policy
        </h2>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-gray-700)' }}>
          We may update this Privacy Policy from time to time. If we make material changes, we will notify
          you through the App or by other appropriate means prior to the change becoming effective. We
          encourage you to review this Privacy Policy periodically. The &quot;Effective Date&quot; at the top of
          this policy indicates when it was last updated. Your continued use of the App after any changes
          to this Privacy Policy constitutes your acceptance of the updated policy.
        </p>
      </section>

      {/* 12. Contact Information */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10, color: 'var(--foreground)' }}>
          12. Contact Information
        </h2>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-gray-700)' }}>
          If you have any questions, concerns, or requests regarding this Privacy Policy or our data
          practices, please contact us at:
        </p>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-primary)', marginTop: 8 }}>
          support@goutguard.app
        </p>
      </section>

      {/* Footer */}
      <footer className="disclaimer" style={{ marginTop: 32 }}>
        <p>Your privacy matters. All health data stays on your device.</p>
        <p style={{ marginTop: 4 }}>GoutCare does not sell, share, or collect your personal data.</p>
      </footer>
    </div>
  );
}
