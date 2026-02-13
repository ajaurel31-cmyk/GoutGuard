import Link from 'next/link';

export const metadata = {
  title: 'Medical Disclaimer - GoutGuard',
  description: 'GoutGuard Medical Disclaimer',
};

export default function DisclaimerPage() {
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

      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Medical Disclaimer</h1>
      <p style={{ fontSize: 13, color: 'var(--color-gray-500)', marginBottom: 24 }}>
        Please read this disclaimer carefully before using GoutGuard.
      </p>

      {/* Critical Warning Box */}
      <div
        style={{
          background: 'var(--color-red-bg)',
          border: '2px solid var(--color-red)',
          borderRadius: 'var(--radius)',
          padding: 20,
          marginBottom: 28,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-red)' }}>
            Important Medical Notice
          </h2>
        </div>
        <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--color-gray-700)', fontWeight: 600 }}>
          GoutGuard is NOT a substitute for professional medical advice, diagnosis, or treatment. This
          application is not intended to diagnose, treat, cure, or prevent any disease or medical condition.
        </p>
      </div>

      {/* 1. Not Medical Advice */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10, color: 'var(--foreground)' }}>
          1. Not a Substitute for Professional Medical Advice
        </h2>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-gray-700)' }}>
          The information, tools, and features provided by GoutGuard are designed for general informational
          and educational purposes only. The App does not provide medical advice. Nothing contained in the
          App should be construed as medical advice, a medical opinion, or a recommendation for any specific
          treatment plan. The content is not intended to be a substitute for professional medical advice,
          diagnosis, or treatment from a licensed healthcare provider.
        </p>
      </section>

      {/* 2. Always Consult Your Healthcare Provider */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10, color: 'var(--foreground)' }}>
          2. Always Consult Your Healthcare Provider
        </h2>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-gray-700)' }}>
          Always seek the advice of your rheumatologist, physician, or other qualified healthcare provider
          with any questions you may have regarding gout, hyperuricemia, or any other medical condition. Do
          not disregard professional medical advice or delay in seeking it because of something you have
          read, seen, or interpreted from the GoutGuard App. If you think you may have a medical emergency,
          call your doctor, go to the emergency room, or call 911 immediately.
        </p>
      </section>

      {/* 3. Purine Content Estimates */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10, color: 'var(--foreground)' }}>
          3. Purine Content Estimates Are Approximations
        </h2>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-gray-700)' }}>
          The purine content values displayed in GoutGuard, whether from the built-in food database or from
          AI food scanning analysis, are estimates and approximations only. Actual purine content can vary
          significantly based on:
        </p>
        <ul style={{ fontSize: 14, lineHeight: 1.9, color: 'var(--color-gray-700)', paddingLeft: 20, marginTop: 8 }}>
          <li>Food preparation methods and cooking techniques</li>
          <li>Specific varieties, breeds, or cultivars of foods</li>
          <li>Serving sizes and portions</li>
          <li>Ingredient combinations and recipes</li>
          <li>Freshness, storage conditions, and seasonality</li>
          <li>Regional and brand-specific variations</li>
        </ul>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-gray-700)', marginTop: 12 }}>
          These estimates should be used as general guidance only and should not be relied upon as precise
          nutritional data.
        </p>
      </section>

      {/* 4. AI Food Analysis Limitations */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10, color: 'var(--foreground)' }}>
          4. AI Food Analysis Limitations
        </h2>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-gray-700)' }}>
          The AI-powered food scanning feature uses artificial intelligence to identify foods and estimate
          purine content from photographs. While we strive for accuracy, this technology has inherent
          limitations:
        </p>
        <ul style={{ fontSize: 14, lineHeight: 1.9, color: 'var(--color-gray-700)', paddingLeft: 20, marginTop: 8 }}>
          <li>The AI may not correctly identify all foods, especially complex dishes or regional cuisines.</li>
          <li>Hidden ingredients may not be detected from a photograph alone.</li>
          <li>Portion size estimation from images is inherently imprecise.</li>
          <li>The AI may occasionally misclassify foods or provide incorrect purine estimates.</li>
          <li>Image quality, lighting, and angle can affect analysis accuracy.</li>
          <li>Processed and packaged foods may contain ingredients not visible in the image.</li>
        </ul>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-gray-700)', marginTop: 12, fontWeight: 600 }}>
          AI food analysis results should be verified and should not be the sole basis for dietary decisions
          related to gout management.
        </p>
      </section>

      {/* 5. Do Not Change Medications */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10, color: 'var(--foreground)' }}>
          5. Do Not Change Medications Based on App Recommendations
        </h2>
        <div
          style={{
            background: 'var(--color-red-bg)',
            border: '1px solid var(--color-red)',
            borderRadius: 'var(--radius-sm)',
            padding: 16,
          }}
        >
          <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-gray-700)', fontWeight: 600 }}>
            Never start, stop, increase, decrease, or otherwise change your medication regimen based on
            information or suggestions provided by GoutGuard.
          </p>
        </div>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-gray-700)', marginTop: 12 }}>
          Gout medications such as allopurinol, febuxostat, colchicine, and others require careful medical
          supervision. Dosage changes, even those that seem minor, can have significant health consequences.
          The medication reminder feature in GoutGuard is designed only to help you remember to take
          medications as prescribed by your doctor -- it is not a recommendation system.
        </p>
      </section>

      {/* 6. Emergency Situations */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10, color: 'var(--foreground)' }}>
          6. Emergency Situations
        </h2>
        <div
          style={{
            background: 'var(--color-red-bg)',
            border: '2px solid var(--color-red)',
            borderRadius: 'var(--radius-sm)',
            padding: 16,
          }}
        >
          <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--color-gray-700)', fontWeight: 700, marginBottom: 8 }}>
            If you are experiencing a medical emergency, call 911 or go to your nearest emergency room
            immediately.
          </p>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-gray-700)' }}>
            Do not use GoutGuard or any mobile application as a substitute for emergency medical services.
            Severe gout symptoms, signs of infection in a joint, sudden severe pain accompanied by fever,
            or any other acute medical symptoms require immediate professional medical attention.
          </p>
        </div>
      </section>

      {/* 7. Uric Acid Tracking */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10, color: 'var(--foreground)' }}>
          7. Uric Acid Tracking Is for Informational Purposes Only
        </h2>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-gray-700)' }}>
          The uric acid tracking feature allows you to log and visualize your lab results over time. This
          feature is for personal informational and record-keeping purposes only. The trends, charts, and
          data visualizations provided are not diagnostic tools. Interpreting uric acid levels requires
          medical expertise and should be done in consultation with your healthcare provider. A single uric
          acid reading, or even a trend, does not determine your gout status or treatment needs.
        </p>
      </section>

      {/* 8. Food Recommendations Are General Guidelines */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10, color: 'var(--foreground)' }}>
          8. Food Recommendations Are General Guidelines
        </h2>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-gray-700)' }}>
          The food recommendations, purine risk levels, and dietary suggestions provided by GoutGuard are
          based on generally accepted nutritional guidelines for gout management. They are general guidelines
          and may not be appropriate for every individual. Dietary needs vary based on your overall health
          status, other medical conditions, medications, allergies, and other personal factors. Always
          discuss dietary changes with your healthcare provider or a registered dietitian.
        </p>
      </section>

      {/* 9. Individual Responses Vary */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10, color: 'var(--foreground)' }}>
          9. Individual Responses to Foods Vary
        </h2>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-gray-700)' }}>
          Every person&apos;s body responds differently to foods. A food categorized as &quot;low purine&quot; in the App
          may still trigger a gout flare in some individuals due to personal metabolic differences, genetic
          factors, kidney function, medication interactions, or other variables. Conversely, some
          individuals may tolerate certain &quot;high purine&quot; foods without immediate adverse effects. The
          purine risk classifications in GoutGuard represent population-level data and may not accurately
          predict your individual response.
        </p>
      </section>

      {/* 10. No Diagnostic Capability */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10, color: 'var(--foreground)' }}>
          10. No Diagnostic Capability
        </h2>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-gray-700)' }}>
          GoutGuard cannot diagnose gout, hyperuricemia, or any other medical condition. The App cannot
          determine whether a joint pain episode is a gout flare, an infection, or another condition. The
          flare logging feature is a personal tracking tool, not a diagnostic instrument. Only a qualified
          healthcare provider can diagnose medical conditions through proper clinical evaluation, laboratory
          tests, and imaging.
        </p>
      </section>

      {/* 11. Liability Disclaimer */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10, color: 'var(--foreground)' }}>
          11. Limitation of Liability for Health Decisions
        </h2>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-gray-700)' }}>
          The creators, developers, and operators of GoutGuard shall not be held liable for any health
          outcomes, adverse effects, injuries, or damages that may result from:
        </p>
        <ul style={{ fontSize: 14, lineHeight: 1.9, color: 'var(--color-gray-700)', paddingLeft: 20, marginTop: 8 }}>
          <li>Dietary decisions made based on information provided by the App</li>
          <li>Reliance on AI food analysis results for dietary planning</li>
          <li>Inaccurate purine content estimates</li>
          <li>Failure to seek timely medical attention</li>
          <li>Changes to medication regimens influenced by App data</li>
          <li>Misinterpretation of uric acid trends or food risk levels</li>
          <li>Any other use of the App&apos;s features or information</li>
        </ul>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-gray-700)', marginTop: 12 }}>
          You use GoutGuard entirely at your own risk and assume full responsibility for all health
          decisions you make.
        </p>
      </section>

      {/* 12. Acknowledgment */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10, color: 'var(--foreground)' }}>
          12. Your Acknowledgment
        </h2>
        <div
          style={{
            background: 'var(--color-yellow-bg)',
            border: '1px solid var(--color-yellow)',
            borderRadius: 'var(--radius)',
            padding: 20,
          }}
        >
          <p style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--color-gray-700)' }}>
            By downloading, installing, and using GoutGuard, you acknowledge and agree that:
          </p>
          <ul style={{ fontSize: 14, lineHeight: 1.9, color: 'var(--color-gray-700)', paddingLeft: 20, marginTop: 8 }}>
            <li>The App is not a medical device and does not provide medical advice.</li>
            <li>You will not use the App as a replacement for professional medical care.</li>
            <li>Purine content estimates and AI analysis results are approximations, not precise measurements.</li>
            <li>You will always consult your healthcare provider before making changes to your diet or medication.</li>
            <li>You accept full responsibility for any health decisions you make while using the App.</li>
            <li>The App creators are not liable for any health outcomes resulting from use of the App.</li>
            <li>In an emergency, you will contact emergency medical services (911) and not rely on the App.</li>
            <li>Individual responses to foods vary and the App&apos;s categorizations may not apply to you specifically.</li>
          </ul>
        </div>
      </section>

      {/* Contact Information */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10, color: 'var(--foreground)' }}>
          Questions or Concerns
        </h2>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-gray-700)' }}>
          If you have any questions about this medical disclaimer or any other aspect of GoutGuard, please
          contact us at:
        </p>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-primary)', marginTop: 8 }}>
          support@goutguard.app
        </p>
      </section>

      {/* Footer */}
      <footer className="disclaimer" style={{ marginTop: 32 }}>
        <p style={{ fontWeight: 600 }}>
          GoutGuard is not a substitute for professional medical advice.
        </p>
        <p style={{ marginTop: 4 }}>
          Always consult your rheumatologist or healthcare provider for gout management.
        </p>
      </footer>
    </div>
  );
}
