'use client';

import { useState, useEffect } from 'react';
import { getProfile, saveProfile, exportAllData, clearAllData, UserProfile } from '@/lib/storage';
import { isNativePlatform, PRODUCT_IDS } from '@/lib/subscription';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GOUT_STAGES = [
  { value: 'acute', label: 'Acute', description: 'Active gout flare' },
  { value: 'intercritical', label: 'Intercritical', description: 'Between flares' },
  { value: 'chronic', label: 'Chronic', description: 'Chronic tophaceous gout' },
] as const;

const COMMON_MEDICATIONS = [
  'Allopurinol',
  'Febuxostat (Uloric)',
  'Colchicine',
  'Indomethacin',
  'Naproxen',
  'Prednisone',
  'Probenecid',
  'Pegloticase (Krystexxa)',
  'Lesinurad',
  'Ibuprofen',
];

const DIETARY_RESTRICTIONS = [
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'dairy-free', label: 'Dairy-Free' },
  { value: 'gluten-free', label: 'Gluten-Free' },
  { value: 'nut-free', label: 'Nut-Free' },
];

const PREMIUM_KEY = 'goutguard_premium_status';
const THEME_KEY = 'goutguard_theme';

// ---------------------------------------------------------------------------
// SVG Icons
// ---------------------------------------------------------------------------

function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function PaletteIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r="2.5" />
      <circle cx="19" cy="13.5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="10" cy="18.5" r="2.5" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c1.1 0 2-.4 2-1.2 0-.4-.2-.8-.5-1.1-.3-.3-.5-.7-.5-1.2 0-1.1.9-2 2-2h2.3c3 0 5.7-2.5 5.7-5.5C23 6.5 18 2 12 2z" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function CrownIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4l3 12h14l3-12-5 4-5-4-5 4-1-4z" />
      <path d="M3 20h18" />
    </svg>
  );
}

function DatabaseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Toggle Switch Component
// ---------------------------------------------------------------------------

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      style={{
        position: 'relative',
        width: 48,
        height: 28,
        borderRadius: 999,
        border: 'none',
        background: checked ? 'var(--color-primary)' : 'var(--color-gray-300)',
        cursor: 'pointer',
        transition: 'background 0.2s',
        flexShrink: 0,
        padding: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 3,
          left: checked ? 23 : 3,
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          transition: 'left 0.2s',
        }}
      />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Number Stepper Component
// ---------------------------------------------------------------------------

function NumberStepper({
  value,
  onChange,
  min,
  max,
  step,
  unit,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  unit: string;
}) {
  function decrement() {
    const next = value - step;
    if (next >= min) onChange(next);
  }

  function increment() {
    const next = value + step;
    if (next <= max) onChange(next);
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <button
        onClick={decrement}
        disabled={value <= min}
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          border: '1px solid var(--color-gray-200)',
          background: 'var(--color-gray-50)',
          cursor: value <= min ? 'not-allowed' : 'pointer',
          fontSize: 18,
          fontWeight: 600,
          color: value <= min ? 'var(--color-gray-300)' : 'var(--foreground)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'inherit',
        }}
        aria-label="Decrease"
      >
        -
      </button>
      <span style={{ fontSize: 16, fontWeight: 600, minWidth: 80, textAlign: 'center', color: 'var(--foreground)' }}>
        {value} {unit}
      </span>
      <button
        onClick={increment}
        disabled={value >= max}
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          border: '1px solid var(--color-gray-200)',
          background: 'var(--color-gray-50)',
          cursor: value >= max ? 'not-allowed' : 'pointer',
          fontSize: 18,
          fontWeight: 600,
          color: value >= max ? 'var(--color-gray-300)' : 'var(--foreground)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'inherit',
        }}
        aria-label="Increase"
      >
        +
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section Header Component
// ---------------------------------------------------------------------------

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      <span style={{ color: 'var(--color-primary)' }}>{icon}</span>
      <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>
        {title}
      </h2>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Settings Row Component
// ---------------------------------------------------------------------------

function SettingsRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 0',
        borderBottom: '1px solid var(--color-gray-200)',
        gap: 12,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--foreground)' }}>
          {label}
        </div>
        {description && (
          <div style={{ fontSize: 12, color: 'var(--color-gray-500)', marginTop: 2 }}>
            {description}
          </div>
        )}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Settings Page Component
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [isNative, setIsNative] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showClearFinal, setShowClearFinal] = useState(false);
  const [showUnitMl, setShowUnitMl] = useState(false);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    const loaded = getProfile();
    setProfile(loaded);
    setIsPremium(localStorage.getItem(PREMIUM_KEY) === 'true');
    setIsNative(isNativePlatform());

    // Apply theme on load
    if (loaded.theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else if (loaded.theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    }

    setIsLoaded(true);
  }, []);

  // Persist profile changes
  function updateProfile(updates: Partial<UserProfile>) {
    if (!profile) return;
    const next = { ...profile, ...updates };
    setProfile(next);
    saveProfile(next);
  }

  // Theme management
  function handleThemeChange(theme: 'light' | 'dark' | 'system') {
    updateProfile({ theme });
    localStorage.setItem(THEME_KEY, theme);

    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      // System preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }
  }

  // Medications multi-select
  function toggleMedication(med: string) {
    if (!profile) return;
    const meds = profile.medications.includes(med)
      ? profile.medications.filter((m) => m !== med)
      : [...profile.medications, med];
    updateProfile({ medications: meds });
  }

  // Dietary restrictions toggle
  function toggleDietaryRestriction(restriction: string) {
    if (!profile) return;
    const restrictions = profile.dietaryRestrictions.includes(restriction)
      ? profile.dietaryRestrictions.filter((r) => r !== restriction)
      : [...profile.dietaryRestrictions, restriction];
    updateProfile({ dietaryRestrictions: restrictions });
  }

  // Export data as JSON
  function handleExportJSON() {
    const data = exportAllData();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `goutguard-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Export PDF report (premium only)
  function handleExportPDF() {
    const data = exportAllData();
    // Build a simple HTML-based print view
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>GoutGuard Health Report</title>
        <style>
          body { font-family: system-ui, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #1a1a1a; }
          h1 { color: #4f46e5; border-bottom: 2px solid #4f46e5; padding-bottom: 8px; }
          h2 { color: #374151; margin-top: 24px; }
          table { width: 100%; border-collapse: collapse; margin: 12px 0; }
          th, td { border: 1px solid #d1d5db; padding: 8px 12px; text-align: left; }
          th { background: #f3f4f6; font-weight: 600; }
          .section { margin-bottom: 24px; }
          .meta { color: #6b7280; font-size: 14px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <h1>GoutGuard Health Report</h1>
        <p class="meta">Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        <p class="meta">This report is for informational purposes. Please share with your healthcare provider.</p>

        <div class="section">
          <h2>Profile</h2>
          <table>
            <tr><th>Gout Stage</th><td>${data.profile?.goutStage || 'Not set'}</td></tr>
            <tr><th>Medications</th><td>${data.profile?.medications?.join(', ') || 'None'}</td></tr>
            <tr><th>Dietary Restrictions</th><td>${data.profile?.dietaryRestrictions?.join(', ') || 'None'}</td></tr>
            <tr><th>Daily Purine Target</th><td>${data.profile?.dailyPurineTarget || 400} mg</td></tr>
            <tr><th>Water Intake Goal</th><td>${data.profile?.waterIntakeGoal || 64} oz</td></tr>
          </table>
        </div>

        <div class="section">
          <h2>Uric Acid Readings</h2>
          ${data.uricAcidReadings?.length > 0 ? `
            <table>
              <tr><th>Date</th><th>Value (mg/dL)</th><th>Notes</th></tr>
              ${data.uricAcidReadings.map((r: any) => `<tr><td>${r.date}</td><td>${r.value}</td><td>${r.notes || '-'}</td></tr>`).join('')}
            </table>
          ` : '<p>No uric acid readings recorded.</p>'}
        </div>

        <div class="section">
          <h2>Gout Flares</h2>
          ${data.flares?.length > 0 ? `
            <table>
              <tr><th>Date</th><th>Joints</th><th>Pain Level</th><th>Triggers</th></tr>
              ${data.flares.map((f: any) => `<tr><td>${f.date}</td><td>${f.joints?.join(', ') || '-'}</td><td>${f.painLevel}/10</td><td>${f.triggers?.join(', ') || '-'}</td></tr>`).join('')}
            </table>
          ` : '<p>No gout flares recorded.</p>'}
        </div>

        <div class="section">
          <h2>Medications</h2>
          ${data.medications?.length > 0 ? `
            <table>
              <tr><th>Name</th><th>Dosage</th><th>Frequency</th><th>Active</th></tr>
              ${data.medications.map((m: any) => `<tr><td>${m.name}</td><td>${m.dosage}</td><td>${m.frequency}</td><td>${m.active ? 'Yes' : 'No'}</td></tr>`).join('')}
            </table>
          ` : '<p>No medications recorded.</p>'}
        </div>

        <hr>
        <p class="meta" style="margin-top: 16px;">
          GoutGuard is not a substitute for professional medical advice.
          Always consult your doctor regarding your gout management plan.
        </p>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  }

  // Clear all data with double confirmation
  function handleClearFirstConfirm() {
    setShowClearConfirm(true);
    setShowClearFinal(false);
  }

  function handleClearSecondConfirm() {
    setShowClearFinal(true);
  }

  function handleClearFinal() {
    clearAllData();
    setProfile(getProfile());
    setShowClearConfirm(false);
    setShowClearFinal(false);
  }

  function handleClearCancel() {
    setShowClearConfirm(false);
    setShowClearFinal(false);
  }

  // Native purchase handler
  async function handlePurchase(productId: string) {
    setPurchasing(productId);
    try {
      const { purchaseProduct } = await import('@/lib/subscription');
      const success = await purchaseProduct(productId);
      if (success) {
        setIsPremium(true);
      }
    } catch {
      // Purchase failed or cancelled
    } finally {
      setPurchasing(null);
    }
  }

  // Restore purchases handler
  async function handleRestore() {
    setRestoring(true);
    try {
      const { restorePurchases } = await import('@/lib/subscription');
      const success = await restorePurchases();
      if (success) {
        setIsPremium(true);
      }
    } catch {
      // Restore failed
    } finally {
      setRestoring(false);
    }
  }

  // Convert oz to mL for display
  function ozToMl(oz: number): number {
    return Math.round(oz * 29.5735);
  }

  // Loading state
  if (!isLoaded || !profile) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--color-gray-400)', fontSize: 14 }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="page">
      <section style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4, color: 'var(--foreground)' }}>
          Settings
        </h1>
        <p style={{ fontSize: 14, color: 'var(--color-gray-500)' }}>
          Manage your profile, preferences, and subscription
        </p>
      </section>

      {/* ================================================================= */}
      {/* Profile Section */}
      {/* ================================================================= */}
      <section style={{ marginBottom: 28 }}>
        <SectionHeader icon={<UserIcon />} title="Profile" />
        <div className="card">
          {/* Gout Stage */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: 'var(--foreground)', marginBottom: 8 }}>
              Gout Stage
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {GOUT_STAGES.map((stage) => (
                <button
                  key={stage.value}
                  onClick={() => updateProfile({ goutStage: stage.value as UserProfile['goutStage'] })}
                  style={{
                    flex: 1,
                    minWidth: 100,
                    padding: '10px 12px',
                    background: profile.goutStage === stage.value ? 'var(--color-primary-light)' : 'var(--background)',
                    color: profile.goutStage === stage.value ? 'var(--color-primary)' : 'var(--color-gray-500)',
                    border: `1px solid ${profile.goutStage === stage.value ? 'var(--color-primary)' : 'var(--color-gray-200)'}`,
                    borderRadius: 8,
                    cursor: 'pointer',
                    textAlign: 'center',
                    fontFamily: 'inherit',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{stage.label}</div>
                  <div style={{ fontSize: 11, marginTop: 2, opacity: 0.7 }}>{stage.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Current Medications */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: 'var(--foreground)', marginBottom: 8 }}>
              Current Medications
            </label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {COMMON_MEDICATIONS.map((med) => {
                const selected = profile.medications.includes(med);
                return (
                  <button
                    key={med}
                    onClick={() => toggleMedication(med)}
                    style={{
                      padding: '6px 12px',
                      background: selected ? 'var(--color-primary-light)' : 'var(--background)',
                      color: selected ? 'var(--color-primary)' : 'var(--color-gray-500)',
                      border: `1px solid ${selected ? 'var(--color-primary)' : 'var(--color-gray-200)'}`,
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'all 0.15s',
                    }}
                  >
                    {selected && (
                      <span style={{ marginRight: 4 }}>
                        <CheckIcon />
                      </span>
                    )}
                    {med}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Allergies / Dietary Restrictions */}
          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: 'var(--foreground)', marginBottom: 8 }}>
              Allergies & Dietary Restrictions
            </label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {DIETARY_RESTRICTIONS.map((item) => {
                const checked = profile.dietaryRestrictions.includes(item.value);
                return (
                  <button
                    key={item.value}
                    onClick={() => toggleDietaryRestriction(item.value)}
                    style={{
                      padding: '8px 16px',
                      background: checked ? 'var(--color-primary-light)' : 'var(--background)',
                      color: checked ? 'var(--color-primary)' : 'var(--color-gray-500)',
                      border: `1px solid ${checked ? 'var(--color-primary)' : 'var(--color-gray-200)'}`,
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      transition: 'all 0.15s',
                    }}
                  >
                    <span
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 4,
                        border: `2px solid ${checked ? 'var(--color-primary)' : 'var(--color-gray-300)'}`,
                        background: checked ? 'var(--color-primary)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        flexShrink: 0,
                      }}
                    >
                      {checked && <CheckIcon />}
                    </span>
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* Goals Section */}
      {/* ================================================================= */}
      <section style={{ marginBottom: 28 }}>
        <SectionHeader icon={<TargetIcon />} title="Goals" />
        <div className="card">
          <SettingsRow label="Daily Purine Target" description="Recommended: 200-400 mg for gout management">
            <NumberStepper
              value={profile.dailyPurineTarget}
              onChange={(v) => updateProfile({ dailyPurineTarget: v })}
              min={100}
              max={800}
              step={50}
              unit="mg"
            />
          </SettingsRow>

          <SettingsRow
            label="Water Intake Goal"
            description={showUnitMl ? `${ozToMl(profile.waterIntakeGoal)} mL` : `${profile.waterIntakeGoal} oz`}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <NumberStepper
                value={profile.waterIntakeGoal}
                onChange={(v) => updateProfile({ waterIntakeGoal: v })}
                min={16}
                max={160}
                step={8}
                unit="oz"
              />
            </div>
          </SettingsRow>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
            <span style={{ fontSize: 13, color: 'var(--color-gray-500)' }}>
              Show in mL
            </span>
            <Toggle
              checked={showUnitMl}
              onChange={setShowUnitMl}
              label="Show water in milliliters"
            />
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* Appearance Section */}
      {/* ================================================================= */}
      <section style={{ marginBottom: 28 }}>
        <SectionHeader icon={<PaletteIcon />} title="Appearance" />
        <div className="card">
          <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: 'var(--foreground)', marginBottom: 10 }}>
            Theme
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['light', 'dark', 'system'] as const).map((theme) => (
              <button
                key={theme}
                onClick={() => handleThemeChange(theme)}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  background: profile.theme === theme ? 'var(--color-primary-light)' : 'var(--background)',
                  color: profile.theme === theme ? 'var(--color-primary)' : 'var(--color-gray-500)',
                  border: `1px solid ${profile.theme === theme ? 'var(--color-primary)' : 'var(--color-gray-200)'}`,
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  fontFamily: 'inherit',
                  transition: 'all 0.15s',
                }}
              >
                {theme === 'light' && '(sun) '}
                {theme === 'dark' && '(moon) '}
                {theme === 'system' && '(auto) '}
                {theme.charAt(0).toUpperCase() + theme.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* Notifications Section */}
      {/* ================================================================= */}
      <section style={{ marginBottom: 28 }}>
        <SectionHeader icon={<BellIcon />} title="Notifications" />
        <div className="card">
          <SettingsRow label="Enable Notifications" description="Master toggle for all notifications">
            <Toggle
              checked={profile.notificationsEnabled}
              onChange={(v) => updateProfile({ notificationsEnabled: v })}
              label="Enable notifications"
            />
          </SettingsRow>

          <SettingsRow label="Water Reminders" description="Periodic reminders to stay hydrated">
            <Toggle
              checked={profile.waterReminders && profile.notificationsEnabled}
              onChange={(v) => updateProfile({ waterReminders: v })}
              label="Water reminders"
            />
          </SettingsRow>

          <SettingsRow label="Medication Reminders" description="Reminders to take your medications">
            <Toggle
              checked={profile.medicationReminders && profile.notificationsEnabled}
              onChange={(v) => updateProfile({ medicationReminders: v })}
              label="Medication reminders"
            />
          </SettingsRow>
        </div>
      </section>

      {/* ================================================================= */}
      {/* Subscription Section */}
      {/* ================================================================= */}
      <section style={{ marginBottom: 28 }}>
        <SectionHeader icon={<CrownIcon />} title="Subscription" />
        <div className="card">
          {isPremium ? (
            <>
              {/* Premium Active */}
              <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
                <span
                  style={{
                    display: 'inline-block',
                    background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                    color: '#fff',
                    padding: '6px 20px',
                    borderRadius: 999,
                    fontSize: 14,
                    fontWeight: 700,
                    marginBottom: 8,
                  }}
                >
                  Premium Active
                </span>
                <p style={{ fontSize: 13, color: 'var(--color-gray-500)', marginTop: 8 }}>
                  You have access to all premium features.
                </p>
              </div>

              {isNative && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn"
                    style={{ flex: 1, fontSize: 13 }}
                    onClick={() => {
                      /* Native manage subscription intent */
                    }}
                  >
                    Manage Subscription
                  </button>
                  <button
                    className="btn"
                    style={{ flex: 1, fontSize: 13 }}
                    onClick={handleRestore}
                    disabled={restoring}
                  >
                    {restoring ? 'Restoring...' : 'Restore Purchases'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Free Plan */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)' }}>
                    Current Plan: <span style={{ color: 'var(--color-gray-500)' }}>Free</span>
                  </span>
                </div>

                {/* Feature Comparison */}
                <div style={{ marginBottom: 16 }}>
                  {[
                    { feature: 'Food scanning', free: '3/day', premium: 'Unlimited' },
                    { feature: 'AI meal suggestions', free: 'No', premium: 'Yes' },
                    { feature: 'PDF health reports', free: 'No', premium: 'Yes' },
                    { feature: 'Uric acid tracking', free: 'Yes', premium: 'Yes' },
                    { feature: 'Water tracking', free: 'Yes', premium: 'Yes' },
                    { feature: 'Flare logging', free: 'Yes', premium: 'Yes' },
                    { feature: 'Detailed analytics', free: 'Basic', premium: 'Advanced' },
                  ].map((row) => (
                    <div
                      key={row.feature}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 0',
                        fontSize: 13,
                        borderBottom: '1px solid var(--color-gray-100)',
                      }}
                    >
                      <span style={{ color: 'var(--foreground)', flex: 1 }}>{row.feature}</span>
                      <span style={{ color: 'var(--color-gray-400)', width: 60, textAlign: 'center' }}>
                        {row.free}
                      </span>
                      <span style={{ color: 'var(--color-primary)', fontWeight: 600, width: 70, textAlign: 'center' }}>
                        {row.premium}
                      </span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '4px 0', fontSize: 11, color: 'var(--color-gray-400)' }}>
                    <span style={{ width: 60, textAlign: 'center' }}>Free</span>
                    <span style={{ width: 70, textAlign: 'center', color: 'var(--color-primary)' }}>Premium</span>
                  </div>
                </div>

                {isNative ? (
                  /* Native purchase buttons */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <button
                      onClick={() => handlePurchase(PRODUCT_IDS.MONTHLY)}
                      disabled={purchasing !== null}
                      style={{
                        width: '100%',
                        padding: '14px 20px',
                        background: 'var(--color-primary)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 10,
                        fontSize: 15,
                        fontWeight: 600,
                        cursor: purchasing ? 'not-allowed' : 'pointer',
                        fontFamily: 'inherit',
                        opacity: purchasing && purchasing !== PRODUCT_IDS.MONTHLY ? 0.5 : 1,
                      }}
                    >
                      {purchasing === PRODUCT_IDS.MONTHLY ? 'Processing...' : 'Monthly - $4.99/mo'}
                    </button>
                    <button
                      onClick={() => handlePurchase(PRODUCT_IDS.ANNUAL)}
                      disabled={purchasing !== null}
                      style={{
                        width: '100%',
                        padding: '14px 20px',
                        background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 10,
                        fontSize: 15,
                        fontWeight: 600,
                        cursor: purchasing ? 'not-allowed' : 'pointer',
                        fontFamily: 'inherit',
                        opacity: purchasing && purchasing !== PRODUCT_IDS.ANNUAL ? 0.5 : 1,
                      }}
                    >
                      {purchasing === PRODUCT_IDS.ANNUAL
                        ? 'Processing...'
                        : 'Annual - $29.99/yr (save 50%)'}
                    </button>
                    <button
                      className="btn"
                      style={{ width: '100%', fontSize: 13 }}
                      onClick={handleRestore}
                      disabled={restoring}
                    >
                      {restoring ? 'Restoring...' : 'Restore Purchases'}
                    </button>
                  </div>
                ) : (
                  /* Web purchase display */
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                      <div
                        style={{
                          flex: 1,
                          padding: '16px 12px',
                          background: 'var(--background)',
                          border: '1px solid var(--color-gray-200)',
                          borderRadius: 10,
                          textAlign: 'center',
                        }}
                      >
                        <div style={{ fontSize: 13, color: 'var(--color-gray-500)', marginBottom: 4 }}>Monthly</div>
                        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--foreground)' }}>$4.99</div>
                        <div style={{ fontSize: 12, color: 'var(--color-gray-400)' }}>per month</div>
                      </div>
                      <div
                        style={{
                          flex: 1,
                          padding: '16px 12px',
                          background: 'var(--color-primary-light)',
                          border: '2px solid var(--color-primary)',
                          borderRadius: 10,
                          textAlign: 'center',
                          position: 'relative',
                        }}
                      >
                        <span
                          style={{
                            position: 'absolute',
                            top: -10,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: 'var(--color-primary)',
                            color: '#fff',
                            padding: '2px 10px',
                            borderRadius: 999,
                            fontSize: 10,
                            fontWeight: 700,
                          }}
                        >
                          SAVE 50%
                        </span>
                        <div style={{ fontSize: 13, color: 'var(--color-primary)', marginBottom: 4, fontWeight: 500 }}>Annual</div>
                        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--foreground)' }}>$29.99</div>
                        <div style={{ fontSize: 12, color: 'var(--color-gray-400)' }}>per year</div>
                      </div>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--color-gray-500)', marginBottom: 8 }}>
                      Download GoutGuard from the App Store to subscribe
                    </p>
                  </div>
                )}

                <p style={{ fontSize: 12, color: 'var(--color-gray-400)', textAlign: 'center', marginTop: 8 }}>
                  7-day free trial included with all plans
                </p>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ================================================================= */}
      {/* Data Management Section */}
      {/* ================================================================= */}
      <section style={{ marginBottom: 28 }}>
        <SectionHeader icon={<DatabaseIcon />} title="Data Management" />
        <div className="card">
          {/* Export JSON */}
          <button
            onClick={handleExportJSON}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '12px 0',
              background: 'none',
              border: 'none',
              borderBottom: '1px solid var(--color-gray-200)',
              cursor: 'pointer',
              fontFamily: 'inherit',
              color: 'var(--foreground)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <DownloadIcon />
              <span style={{ fontSize: 14, fontWeight: 500 }}>Export All Data (JSON)</span>
            </div>
            <ChevronRightIcon />
          </button>

          {/* Export PDF */}
          <button
            onClick={isPremium ? handleExportPDF : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '12px 0',
              background: 'none',
              border: 'none',
              borderBottom: '1px solid var(--color-gray-200)',
              cursor: isPremium ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit',
              color: isPremium ? 'var(--foreground)' : 'var(--color-gray-400)',
              opacity: isPremium ? 1 : 0.6,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <DownloadIcon />
              <span style={{ fontSize: 14, fontWeight: 500 }}>Export PDF Report</span>
              {!isPremium && (
                <span
                  style={{
                    background: 'var(--color-primary-light)',
                    color: 'var(--color-primary)',
                    padding: '1px 6px',
                    borderRadius: 999,
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                >
                  Premium
                </span>
              )}
            </div>
            <ChevronRightIcon />
          </button>

          {/* Clear All Data */}
          {!showClearConfirm ? (
            <button
              onClick={handleClearFirstConfirm}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '12px 0',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                color: 'var(--color-red)',
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 500 }}>Clear All Data</span>
              <ChevronRightIcon />
            </button>
          ) : (
            <div style={{ padding: '12px 0' }}>
              <p style={{ fontSize: 13, color: 'var(--color-red)', fontWeight: 500, marginBottom: 8 }}>
                {showClearFinal
                  ? 'This action cannot be undone. Are you absolutely sure?'
                  : 'Are you sure you want to delete all your data?'}
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleClearCancel}
                  className="btn btn-sm"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                {showClearFinal ? (
                  <button
                    onClick={handleClearFinal}
                    style={{
                      flex: 1,
                      padding: '6px 12px',
                      background: 'var(--color-red)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    Delete Everything
                  </button>
                ) : (
                  <button
                    onClick={handleClearSecondConfirm}
                    style={{
                      flex: 1,
                      padding: '6px 12px',
                      background: 'var(--color-red)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    Yes, Delete All
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ================================================================= */}
      {/* Legal Links Section */}
      {/* ================================================================= */}
      <section style={{ marginBottom: 28 }}>
        <SectionHeader icon={<LinkIcon />} title="Legal" />
        <div className="card">
          {[
            { label: 'Terms of Service', href: '/terms' },
            { label: 'Privacy Policy', href: '/privacy' },
            { label: 'Medical Disclaimer', href: '/disclaimer' },
          ].map((link, idx) => (
            <a
              key={link.href}
              href={link.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 0',
                borderBottom: idx < 2 ? '1px solid var(--color-gray-200)' : 'none',
                textDecoration: 'none',
                color: 'var(--foreground)',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              {link.label}
              <ChevronRightIcon />
            </a>
          ))}
        </div>
      </section>

      {/* ================================================================= */}
      {/* App Info Section */}
      {/* ================================================================= */}
      <section style={{ marginBottom: 28 }}>
        <SectionHeader icon={<InfoIcon />} title="About" />
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 4 }}>
            GoutGuard
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-gray-500)', marginBottom: 8 }}>
            Version 1.0.0
          </div>
          <p style={{ fontSize: 12, color: 'var(--color-gray-400)', marginBottom: 12 }}>
            &copy; {new Date().getFullYear()} GoutGuard. All rights reserved.
          </p>
          <div
            style={{
              background: 'var(--color-gray-100)',
              borderRadius: 8,
              padding: '12px 16px',
              fontSize: 12,
              color: 'var(--color-gray-500)',
              lineHeight: 1.6,
              textAlign: 'left',
            }}
          >
            <strong>Medical Disclaimer:</strong> GoutGuard is designed as a tracking and informational
            tool only. It is not intended to diagnose, treat, cure, or prevent any disease. The purine
            estimates and meal suggestions are approximations and should not replace professional medical
            advice. Always consult your healthcare provider before making changes to your diet,
            medications, or treatment plan. If you experience a severe gout flare or medical emergency,
            seek immediate medical attention.
          </div>
        </div>
      </section>

      {/* Bottom spacing for tab bar */}
      <div style={{ height: 24 }} />
    </div>
  );
}
