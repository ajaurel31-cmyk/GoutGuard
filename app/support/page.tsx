import Link from 'next/link';

export const metadata = {
  title: 'Support - GoutCare',
  description: 'GoutCare Support and Help',
};

export default function SupportPage() {
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

      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Support</h1>
      <p style={{ fontSize: 13, color: 'var(--color-gray-500)', marginBottom: 32 }}>
        We&apos;re here to help you get the most out of GoutCare.
      </p>

      {/* Contact Us */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10, color: 'var(--foreground)' }}>
          Contact Us
        </h2>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-gray-700)' }}>
          If you need help, have a question, or want to report an issue, please reach out to our support
          team. We typically respond within 24-48 hours.
        </p>
        <div
          style={{
            background: 'var(--color-primary-light)',
            border: '1px solid var(--color-primary)',
            borderRadius: 'var(--radius)',
            padding: 20,
            marginTop: 16,
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: 13, color: 'var(--color-gray-500)', marginBottom: 4 }}>
            Email us at
          </p>
          <a
            href="mailto:support@goutcare.app"
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--color-primary)',
              textDecoration: 'none',
            }}
          >
            support@goutcare.app
          </a>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10, color: 'var(--foreground)' }}>
          Frequently Asked Questions
        </h2>

        {/* FAQ Items */}
        {[
          {
            q: 'How do I scan food for purine content?',
            a: 'Go to the Scan tab from the bottom navigation bar. Tap the camera button to take a photo of your food, or select an image from your photo library. The AI will analyze the food and provide purine content estimates.',
          },
          {
            q: 'How accurate are the purine estimates?',
            a: 'Purine estimates are approximations based on AI food analysis and our built-in food database. Actual purine content can vary depending on preparation, portion size, and ingredients. Always use these estimates as general guidance and consult your healthcare provider for personalized dietary advice.',
          },
          {
            q: 'How do I cancel my subscription?',
            a: 'Open the Settings app on your iPhone or iPad, tap your name at the top, then tap "Subscriptions." Select GoutCare and tap "Cancel Subscription." You will retain access to premium features until the end of your current billing period.',
          },
          {
            q: 'Can I get a refund?',
            a: 'Refunds are handled by Apple through the App Store. To request a refund, visit reportaproblem.apple.com or contact Apple Support directly.',
          },
          {
            q: 'Where is my data stored?',
            a: 'All your health data is stored locally on your device. We do not maintain user accounts and do not store your health information on any server. The only data that leaves your device is food images sent for AI analysis, which are not retained.',
          },
          {
            q: 'How do I export my health data?',
            a: 'Go to Settings > Data Management and tap "Export All Data (JSON)" to download your data as a JSON file. Premium users can also export a PDF health report.',
          },
          {
            q: 'What happens if I delete the app?',
            a: 'Deleting the app will permanently remove all locally stored data from your device, including food logs, uric acid readings, flare records, and settings. This action cannot be undone. We recommend exporting your data first.',
          },
          {
            q: 'Is GoutCare a medical device?',
            a: 'No. GoutCare is a health and wellness tracking tool, not a medical device. It does not provide medical advice, diagnosis, or treatment. Always consult your rheumatologist or healthcare provider for medical decisions regarding your gout management.',
          },
        ].map((item, idx) => (
          <div
            key={idx}
            style={{
              padding: '14px 0',
              borderBottom: '1px solid var(--color-gray-200)',
            }}
          >
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)', marginBottom: 6 }}>
              {item.q}
            </h3>
            <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--color-gray-500)' }}>
              {item.a}
            </p>
          </div>
        ))}
      </section>

      {/* Manage Subscription */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10, color: 'var(--foreground)' }}>
          Manage Your Subscription
        </h2>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-gray-700)', marginBottom: 12 }}>
          Your GoutCare Premium subscription is managed through the Apple App Store. To view, change, or
          cancel your subscription:
        </p>
        <ol style={{ fontSize: 14, lineHeight: 1.9, color: 'var(--color-gray-700)', paddingLeft: 20 }}>
          <li>Open the <strong>Settings</strong> app on your iPhone or iPad.</li>
          <li>Tap your name at the top of the screen.</li>
          <li>Tap <strong>Subscriptions</strong>.</li>
          <li>Select <strong>GoutCare</strong> to manage your plan.</li>
        </ol>
      </section>

      {/* App Version & Troubleshooting */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10, color: 'var(--foreground)' }}>
          Troubleshooting
        </h2>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-gray-700)', marginBottom: 12 }}>
          If you experience any issues with the app, try these steps:
        </p>
        <ul style={{ fontSize: 14, lineHeight: 1.9, color: 'var(--color-gray-700)', paddingLeft: 20 }}>
          <li>Make sure you are running the latest version of GoutCare from the App Store.</li>
          <li>Ensure your device is running a supported version of iOS.</li>
          <li>Restart the app by closing it completely and reopening it.</li>
          <li>Check that you have an internet connection for AI food scanning features.</li>
          <li>If the camera is not working, verify that GoutCare has camera permission in Settings &gt; GoutCare.</li>
        </ul>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-gray-700)', marginTop: 12 }}>
          If the issue persists, please contact us at{' '}
          <a href="mailto:support@goutcare.app" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>
            support@goutcare.app
          </a>{' '}
          with a description of the problem and your device model and iOS version.
        </p>
      </section>

      {/* Legal Links */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10, color: 'var(--foreground)' }}>
          Legal
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Link href="/privacy" style={{ fontSize: 14, color: 'var(--color-primary)', textDecoration: 'underline' }}>
            Privacy Policy
          </Link>
          <Link href="/terms" style={{ fontSize: 14, color: 'var(--color-primary)', textDecoration: 'underline' }}>
            Terms of Service
          </Link>
          <Link href="/disclaimer" style={{ fontSize: 14, color: 'var(--color-primary)', textDecoration: 'underline' }}>
            Medical Disclaimer
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="disclaimer" style={{ marginTop: 32 }}>
        <p>GoutCare is not a substitute for professional medical advice.</p>
        <p style={{ marginTop: 4 }}>
          &copy; {new Date().getFullYear()} GoutCare. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
