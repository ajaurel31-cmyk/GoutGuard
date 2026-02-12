'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface PremiumGateProps {
  children: React.ReactNode;
  feature: string;
}

export default function PremiumGate({ children, feature }: PremiumGateProps) {
  const router = useRouter();
  const [isPremium, setIsPremium] = useState<boolean | null>(null);

  useEffect(() => {
    const premiumStatus = localStorage.getItem('goutguard_premium');
    setIsPremium(premiumStatus === 'true');
  }, []);

  // Show nothing while checking premium status to avoid flash
  if (isPremium === null) {
    return null;
  }

  if (isPremium) {
    return <>{children}</>;
  }

  return (
    <div className="premium-gate">
      <div className="premium-gate-card">
        <div className="premium-gate-icon">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#1a56db"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h2 className="premium-gate-title">Premium Feature</h2>
        <p className="premium-gate-description">
          <strong>{feature}</strong> is available with GoutGuard Premium.
          Unlock advanced features to better manage your gout and improve your health.
        </p>
        <button
          className="premium-gate-button"
          onClick={() => router.push('/settings')}
        >
          Upgrade to Premium
        </button>
        <p className="premium-gate-trial">
          Start with a 7-day free trial
        </p>
      </div>
    </div>
  );
}
