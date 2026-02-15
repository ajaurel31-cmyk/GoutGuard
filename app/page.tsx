'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  getDailyLog, getUricAcidReadings, getFlares, getProfile,
  getTodayDateString, DailyLog, UricAcidReading, FlareEvent, UserProfile,
  saveDailyLog,
} from '@/lib/storage';
import { formatDate, daysBetween, getUricAcidColor } from '@/lib/helpers';

// ---------------------------------------------------------------------------
// Greeting helper
// ---------------------------------------------------------------------------

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function getTodayDisplayDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Purine color helper
// ---------------------------------------------------------------------------

function getPurineBarColor(current: number, target: number): string {
  const pct = target > 0 ? current / target : 0;
  if (pct < 0.7) return 'var(--color-green)';
  if (pct < 0.9) return 'var(--color-yellow)';
  return 'var(--color-red)';
}

function getPurineLevelBadgeClass(level: string): string {
  const l = level.toLowerCase();
  if (l === 'low') return 'badge badge-green';
  if (l === 'moderate' || l === 'medium') return 'badge badge-yellow';
  if (l === 'high') return 'badge badge-orange';
  if (l === 'very high') return 'badge badge-red';
  return 'badge badge-yellow';
}

// ---------------------------------------------------------------------------
// Inline SVG Icon components
// ---------------------------------------------------------------------------

function CameraIcon() {
  return (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function DropletIcon() {
  return (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function WaterIcon() {
  return (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
      <line x1="6" y1="2" x2="6" y2="4" />
      <line x1="10" y1="2" x2="10" y2="4" />
      <line x1="14" y1="2" x2="14" y2="4" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Main Dashboard Component
// ---------------------------------------------------------------------------

export default function Home() {
  const router = useRouter();

  // State
  const [todayLog, setTodayLog] = useState<DailyLog | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [latestUricAcid, setLatestUricAcid] = useState<UricAcidReading | null>(null);
  const [daysSinceFlare, setDaysSinceFlare] = useState<number | null>(null);
  const [showCustomWater, setShowCustomWater] = useState(false);
  const [customWaterOz, setCustomWaterOz] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load all data from localStorage on mount
  useEffect(() => {
    const today = getTodayDateString();
    const log = getDailyLog(today);
    const userProfile = getProfile();
    const readings = getUricAcidReadings();
    const flares = getFlares();

    setTodayLog(log);
    setProfile(userProfile);

    // Latest uric acid reading (already sorted newest-first)
    if (readings.length > 0) {
      setLatestUricAcid(readings[0]);
    }

    // Days since last flare (already sorted newest-first)
    if (flares.length > 0) {
      const lastFlareDate = flares[0].date;
      setDaysSinceFlare(daysBetween(lastFlareDate, today));
    }

    setIsLoaded(true);
  }, []);

  // Derived values
  const purineTarget = profile?.dailyPurineTarget ?? 400;
  const waterGoal = profile?.waterIntakeGoal ?? 64;
  const currentPurines = todayLog?.totalPurines ?? 0;
  const currentWater = todayLog?.waterIntake ?? 0;
  const purinePercent = purineTarget > 0 ? Math.min((currentPurines / purineTarget) * 100, 100) : 0;
  const waterPercent = waterGoal > 0 ? Math.min((currentWater / waterGoal) * 100, 100) : 0;
  const recentFoods = todayLog?.foods?.slice(-5).reverse() ?? [];

  // ---------------------------------------------------------------------------
  // Water logging
  // ---------------------------------------------------------------------------

  function addWater(oz: number) {
    if (!todayLog) return;
    const updated: DailyLog = {
      ...todayLog,
      waterIntake: todayLog.waterIntake + oz,
    };
    saveDailyLog(updated);
    setTodayLog(updated);
    setShowCustomWater(false);
    setCustomWaterOz('');
  }

  function handleCustomWaterSubmit() {
    const oz = parseInt(customWaterOz, 10);
    if (!isNaN(oz) && oz > 0) {
      addWater(oz);
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  // Skeleton / loading state
  if (!isLoaded) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--color-gray-400)', fontSize: 14 }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="page">
      {/* ── Greeting ───────────────────────────────────────────── */}
      <section style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <img
            src="/icon-192.png"
            alt="GoutCare"
            width={44}
            height={44}
            style={{ borderRadius: 10 }}
          />
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 2 }}>
              {getGreeting()}
            </h1>
            <p style={{ fontSize: 14, color: 'var(--color-gray-500)', margin: 0 }}>
              {getTodayDisplayDate()}
            </p>
          </div>
        </div>
      </section>

      {/* ── Daily Purine Intake ─────────────────────────────────── */}
      <section style={{ marginBottom: 24 }}>
        <h2 className="section-title">Daily Purine Intake</h2>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: getPurineBarColor(currentPurines, purineTarget) }}>
              {currentPurines}
            </span>
            <span style={{ fontSize: 14, color: 'var(--color-gray-500)' }}>
              / {purineTarget} mg
            </span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${purinePercent}%`,
                background: getPurineBarColor(currentPurines, purineTarget),
              }}
            />
          </div>
          <p style={{ fontSize: 12, color: 'var(--color-gray-400)', marginTop: 8, textAlign: 'center' }}>
            {purinePercent < 70
              ? 'On track - keep it up!'
              : purinePercent < 90
                ? 'Approaching your daily limit'
                : 'Over your recommended daily limit'}
          </p>
        </div>
      </section>

      {/* ── Quick Stats ────────────────────────────────────────── */}
      <section style={{ marginBottom: 24 }}>
        <h2 className="section-title">Quick Stats</h2>
        <div className="grid-3">
          {/* Uric Acid */}
          <div className="stat-card">
            <span className="stat-label">Uric Acid</span>
            {latestUricAcid ? (
              <>
                <span
                  className="stat-value"
                  style={{ color: getUricAcidColor(latestUricAcid.value) }}
                >
                  {latestUricAcid.value}
                </span>
                <span className="stat-unit">mg/dL</span>
              </>
            ) : (
              <span style={{ fontSize: 13, color: 'var(--color-gray-400)', marginTop: 4 }}>
                No readings
              </span>
            )}
          </div>

          {/* Days Since Flare */}
          <div className="stat-card">
            <span className="stat-label">Since Flare</span>
            {daysSinceFlare !== null ? (
              <>
                <span className="stat-value" style={{ color: daysSinceFlare > 30 ? 'var(--color-green)' : daysSinceFlare > 7 ? 'var(--color-yellow)' : 'var(--color-red)' }}>
                  {daysSinceFlare}
                </span>
                <span className="stat-unit">{daysSinceFlare === 1 ? 'day' : 'days'}</span>
              </>
            ) : (
              <span style={{ fontSize: 13, color: 'var(--color-gray-400)', marginTop: 4 }}>
                No flares logged
              </span>
            )}
          </div>

          {/* Water Today */}
          <div className="stat-card">
            <span className="stat-label">Water</span>
            <span className="stat-value" style={{ color: currentWater >= waterGoal ? 'var(--color-green)' : 'var(--color-blue)' }}>
              {currentWater}
            </span>
            <span className="stat-unit">/ {waterGoal} oz</span>
          </div>
        </div>
      </section>

      {/* ── Quick Actions ──────────────────────────────────────── */}
      <section style={{ marginBottom: 24 }}>
        <h2 className="section-title">Quick Actions</h2>
        <div className="grid-2">
          <button
            className="quick-action primary"
            onClick={() => router.push('/scan')}
          >
            <CameraIcon />
            Scan Food
          </button>

          <button
            className="quick-action"
            onClick={() => router.push('/uric-acid')}
          >
            <DropletIcon />
            Log Uric Acid
          </button>

          <button
            className="quick-action"
            onClick={() => router.push('/flares')}
          >
            <WarningIcon />
            Log Flare
          </button>

          <button
            className="quick-action"
            onClick={() => {
              const el = document.getElementById('water-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <WaterIcon />
            Log Water
          </button>
        </div>
      </section>

      {/* ── Water Intake Quick Add ──────────────────────────────── */}
      <section id="water-section" style={{ marginBottom: 24 }}>
        <h2 className="section-title">Water Intake</h2>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <span style={{ fontSize: 16, fontWeight: 600, color: currentWater >= waterGoal ? 'var(--color-green)' : 'var(--color-blue)' }}>
              {currentWater} oz
            </span>
            <span style={{ fontSize: 14, color: 'var(--color-gray-500)' }}>
              / {waterGoal} oz goal
            </span>
          </div>
          <div className="progress-bar" style={{ marginBottom: 14 }}>
            <div
              className="progress-fill"
              style={{
                width: `${waterPercent}%`,
                background: currentWater >= waterGoal ? 'var(--color-green)' : 'var(--color-blue)',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
            <button className="water-btn" onClick={() => addWater(8)}>
              +8 oz
            </button>
            <button className="water-btn" onClick={() => addWater(12)}>
              +12 oz
            </button>
            <button className="water-btn" onClick={() => addWater(16)}>
              +16 oz
            </button>
            <button
              className="water-btn"
              onClick={() => setShowCustomWater(!showCustomWater)}
              style={{ fontSize: 13 }}
            >
              +Custom
            </button>
          </div>

          {showCustomWater && (
            <div className="water-input-row">
              <input
                type="number"
                placeholder="oz"
                min="1"
                value={customWaterOz}
                onChange={(e) => setCustomWaterOz(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCustomWaterSubmit();
                }}
                autoFocus
              />
              <button className="btn btn-primary btn-sm" onClick={handleCustomWaterSubmit}>
                Add
              </button>
            </div>
          )}

          {currentWater >= waterGoal && (
            <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--color-green)', marginTop: 10, fontWeight: 500 }}>
              Daily water goal reached!
            </p>
          )}
        </div>
      </section>

      {/* ── Recent Food Log ──────────────────────────────────────── */}
      <section style={{ marginBottom: 24 }}>
        <h2 className="section-title">Recent Food Log</h2>
        <div className="card">
          {recentFoods.length > 0 ? (
            <>
              {recentFoods.map((food) => (
                <div key={food.id} className="food-log-item">
                  <div>
                    <div className="food-name">{food.foodName}</div>
                    <div className="food-purines">{food.purineContent} mg purines</div>
                  </div>
                  <span className={getPurineLevelBadgeClass(food.purineLevel)}>
                    {food.purineLevel}
                  </span>
                </div>
              ))}
              <a href="/foods" className="view-all-link">
                View all foods
              </a>
            </>
          ) : (
            <div className="empty-state">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ margin: '0 auto 10px', display: 'block', opacity: 0.4 }}
              >
                <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                <line x1="6" y1="1" x2="6" y2="4" />
                <line x1="10" y1="1" x2="10" y2="4" />
                <line x1="14" y1="1" x2="14" y2="4" />
              </svg>
              <p>No foods logged today.</p>
              <p style={{ marginTop: 4 }}>Scan or search to add foods.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Medical Disclaimer ──────────────────────────────────── */}
      <footer className="disclaimer">
        GoutCare is not a substitute for professional medical advice.
        Always consult your doctor regarding your gout management plan.
      </footer>
    </div>
  );
}
