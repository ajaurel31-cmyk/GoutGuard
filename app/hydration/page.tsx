'use client';

import { useState, useEffect, useCallback } from 'react';
import { getDailyLog, saveDailyLog, getProfile, saveProfile, getTodayDateString, generateId } from '@/lib/storage';
import { formatTime, getLastNDays, formatDateShort } from '@/lib/helpers';
import Header from '@/components/Header';
import { useToast } from '@/components/Toast';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WaterEntry {
  id: string;
  amount: number; // stored in oz internally
  timestamp: string; // ISO string
}

type UnitPreference = 'oz' | 'mL';

// ---------------------------------------------------------------------------
// Conversion helpers
// ---------------------------------------------------------------------------

const OZ_TO_ML = 29.5735;
const ML_TO_OZ = 1 / OZ_TO_ML;

function ozToMl(oz: number): number {
  return Math.round(oz * OZ_TO_ML);
}

function mlToOz(ml: number): number {
  return Math.round(ml * ML_TO_OZ * 10) / 10;
}

function displayAmount(oz: number, unit: UnitPreference): string {
  if (unit === 'mL') return `${ozToMl(oz)}`;
  return `${oz}`;
}

function displayUnit(unit: UnitPreference): string {
  return unit === 'mL' ? 'mL' : 'oz';
}

// ---------------------------------------------------------------------------
// LocalStorage helpers for water entries
// ---------------------------------------------------------------------------

function getWaterEntriesKey(date: string): string {
  return `goutguard_water_entries_${date}`;
}

function loadWaterEntries(date: string): WaterEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(getWaterEntriesKey(date));
    if (!raw) return [];
    return JSON.parse(raw) as WaterEntry[];
  } catch {
    return [];
  }
}

function saveWaterEntries(date: string, entries: WaterEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getWaterEntriesKey(date), JSON.stringify(entries));
  } catch {
    // storage full or unavailable
  }
}

function loadUnitPreference(): UnitPreference {
  if (typeof window === 'undefined') return 'oz';
  try {
    const raw = localStorage.getItem('goutguard_water_unit');
    if (raw === 'mL' || raw === 'oz') return raw;
  } catch {
    // ignore
  }
  return 'oz';
}

function saveUnitPreference(unit: UnitPreference): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('goutguard_water_unit', unit);
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Motivational message
// ---------------------------------------------------------------------------

function getMotivationalMessage(percent: number): string {
  if (percent >= 100) return 'Goal reached! Excellent hydration today.';
  if (percent >= 75) return 'Almost there! Great job staying hydrated.';
  if (percent >= 50) return 'Over halfway! Your kidneys thank you.';
  if (percent >= 25) return 'Good start! Keep going.';
  return 'Keep drinking! Hydration helps flush uric acid.';
}

// ---------------------------------------------------------------------------
// Day label helper
// ---------------------------------------------------------------------------

function getDayLabel(dateString: string): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const [year, month, day] = dateString.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return days[d.getDay()];
}

// ---------------------------------------------------------------------------
// Hydration Tips
// ---------------------------------------------------------------------------

const HYDRATION_TIPS = [
  {
    title: 'Why water matters for gout',
    body: 'Adequate hydration is one of the simplest and most effective ways to help manage gout. Water dilutes uric acid in the blood and supports kidney function, the primary pathway for uric acid excretion.',
  },
  {
    title: 'Drinking 8+ glasses per day can reduce uric acid levels',
    body: 'Studies show that people who drink 8 or more glasses of water daily have significantly lower uric acid levels compared to those who drink less. Consistent hydration keeps uric acid from concentrating in the blood.',
  },
  {
    title: 'Water helps kidneys excrete uric acid more efficiently',
    body: 'Your kidneys filter about 70% of uric acid from your blood. When you are well-hydrated, urine flow increases and your kidneys can flush out uric acid more effectively, reducing the risk of crystal formation in joints.',
  },
  {
    title: 'Dehydration is a common gout flare trigger',
    body: 'When you are dehydrated, uric acid becomes more concentrated in the blood, making it easier for crystals to form. Many gout flares are preceded by periods of inadequate fluid intake, hot weather, or excessive sweating.',
  },
  {
    title: 'Avoid sugary drinks — fructose increases uric acid production',
    body: 'Sodas and sweetened beverages containing fructose can actually raise uric acid levels. Fructose metabolism in the liver directly produces uric acid as a byproduct. Stick with water, unsweetened tea, or sparkling water.',
  },
  {
    title: 'Cherry juice and coffee may help reduce uric acid levels',
    body: 'Tart cherry juice contains anthocyanins that may help lower uric acid and reduce inflammation. Moderate coffee consumption has also been associated with lower uric acid levels in multiple studies.',
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function HydrationPage() {
  const { showToast } = useToast();
  const today = getTodayDateString();

  // Core state
  const [entries, setEntries] = useState<WaterEntry[]>([]);
  const [goal, setGoal] = useState(64); // oz
  const [unit, setUnit] = useState<UnitPreference>('oz');
  const [mounted, setMounted] = useState(false);

  // UI state
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const [expandedTip, setExpandedTip] = useState<number | null>(null);
  const [animatingButton, setAnimatingButton] = useState<string | null>(null);
  const [weeklyData, setWeeklyData] = useState<{ date: string; intake: number }[]>([]);

  // ---------------------------------------------------------------------------
  // Load data on mount
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const profile = getProfile();
    setGoal(profile.waterIntakeGoal || 64);
    setUnit(loadUnitPreference());
    setEntries(loadWaterEntries(today));
    setMounted(true);
  }, [today]);

  // Load weekly data
  useEffect(() => {
    if (!mounted) return;
    const last7 = getLastNDays(7);
    const data = last7.map((date) => {
      const log = getDailyLog(date);
      return { date, intake: log.waterIntake };
    });
    setWeeklyData(data);
  }, [mounted, entries]);

  // ---------------------------------------------------------------------------
  // Computed values
  // ---------------------------------------------------------------------------

  const currentIntake = entries.reduce((sum, e) => sum + e.amount, 0);
  const progressPercent = goal > 0 ? Math.min(Math.round((currentIntake / goal) * 100), 100) : 0;
  const progressFraction = goal > 0 ? Math.min(currentIntake / goal, 1) : 0;

  // SVG circle values
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - progressFraction * circumference;

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const addWater = useCallback(
    (amountOz: number) => {
      const entry: WaterEntry = {
        id: generateId(),
        amount: amountOz,
        timestamp: new Date().toISOString(),
      };

      const newEntries = [...entries, entry];
      setEntries(newEntries);
      saveWaterEntries(today, newEntries);

      // Update daily log total
      const log = getDailyLog(today);
      log.waterIntake = newEntries.reduce((sum, e) => sum + e.amount, 0);
      saveDailyLog(log);

      const label = unit === 'mL' ? `${ozToMl(amountOz)} mL` : `${amountOz} oz`;
      showToast(`Added ${label} of water`, 'success');
    },
    [entries, today, unit, showToast],
  );

  const deleteEntry = useCallback(
    (id: string) => {
      const newEntries = entries.filter((e) => e.id !== id);
      setEntries(newEntries);
      saveWaterEntries(today, newEntries);

      const log = getDailyLog(today);
      log.waterIntake = newEntries.reduce((sum, e) => sum + e.amount, 0);
      saveDailyLog(log);

      showToast('Entry removed', 'info');
    },
    [entries, today, showToast],
  );

  const handleQuickAdd = (amountOz: number, buttonId: string) => {
    setAnimatingButton(buttonId);
    addWater(amountOz);
    setTimeout(() => setAnimatingButton(null), 400);
  };

  const handleCustomAdd = () => {
    const parsed = parseFloat(customAmount);
    if (isNaN(parsed) || parsed <= 0) {
      showToast('Please enter a valid amount', 'warning');
      return;
    }
    const amountOz = unit === 'mL' ? mlToOz(parsed) : parsed;
    addWater(amountOz);
    setCustomAmount('');
    setShowCustomInput(false);
  };

  const handleSaveGoal = () => {
    const parsed = parseFloat(goalInput);
    if (isNaN(parsed) || parsed <= 0) {
      showToast('Please enter a valid goal', 'warning');
      return;
    }
    const goalOz = unit === 'mL' ? mlToOz(parsed) : parsed;
    setGoal(goalOz);
    const profile = getProfile();
    profile.waterIntakeGoal = goalOz;
    saveProfile(profile);
    setEditingGoal(false);
    showToast('Daily goal updated', 'success');
  };

  const toggleUnit = () => {
    const newUnit = unit === 'oz' ? 'mL' : 'oz';
    setUnit(newUnit);
    saveUnitPreference(newUnit);
  };

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const weeklyMax = Math.max(goal, ...weeklyData.map((d) => d.intake), 1);

  if (!mounted) {
    return (
      <div className="page" style={{ paddingBottom: 100 }}>
        <Header title="Hydration" showBack />
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-gray-400)' }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ paddingBottom: 100 }}>
      <Header title="Hydration Tracker" showBack />

      {/* ------------------------------------------------------------------ */}
      {/* Hero: Circular Progress                                             */}
      {/* ------------------------------------------------------------------ */}
      <section
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginTop: 8,
          marginBottom: 24,
        }}
      >
        <div style={{ position: 'relative', width: 200, height: 200 }}>
          <svg width="200" height="200" style={{ transform: 'rotate(-90deg)' }}>
            {/* Background circle */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke="var(--color-gray-200)"
              strokeWidth="12"
            />
            {/* Progress circle */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke={progressPercent >= 100 ? '#22c55e' : '#3b82f6'}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.3s ease' }}
            />
          </svg>
          {/* Center text */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontSize: 14,
                color: 'var(--color-gray-500)',
                marginBottom: 2,
              }}
            >
              {/* Water drop icon */}
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="#3b82f6"
                style={{ verticalAlign: 'middle', marginRight: 4 }}
              >
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0L12 2.69z" />
              </svg>
              Today
            </span>
            <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--foreground)', lineHeight: 1.2 }}>
              {displayAmount(currentIntake, unit)}
            </span>
            <span style={{ fontSize: 14, color: 'var(--color-gray-500)' }}>
              / {displayAmount(goal, unit)} {displayUnit(unit)}
            </span>
            <span
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: progressPercent >= 100 ? '#22c55e' : '#3b82f6',
                marginTop: 4,
              }}
            >
              {progressPercent}%
            </span>
          </div>
        </div>

        {/* Motivational message */}
        <p
          style={{
            marginTop: 12,
            fontSize: 14,
            color: 'var(--color-gray-600)',
            textAlign: 'center',
            fontStyle: 'italic',
            maxWidth: 280,
          }}
        >
          {getMotivationalMessage(progressPercent)}
        </p>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Quick Add Buttons                                                   */}
      {/* ------------------------------------------------------------------ */}
      <section style={{ marginBottom: 24 }}>
        <h2 className="section-title">Quick Add</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 10,
          }}
        >
          {/* 8 oz */}
          <button
            className="water-btn"
            onClick={() => handleQuickAdd(8, 'btn-8')}
            style={{
              flexDirection: 'column',
              gap: 4,
              padding: '14px 8px',
              transform: animatingButton === 'btn-8' ? 'scale(0.92)' : 'scale(1)',
              transition: 'transform 0.15s ease, background 0.15s',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 8h1a4 4 0 0 1 0 8h-1" />
              <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z" />
            </svg>
            <span style={{ fontSize: 15, fontWeight: 700 }}>{displayAmount(8, unit)}</span>
            <span style={{ fontSize: 11, opacity: 0.7 }}>Small glass</span>
          </button>

          {/* 12 oz */}
          <button
            className="water-btn"
            onClick={() => handleQuickAdd(12, 'btn-12')}
            style={{
              flexDirection: 'column',
              gap: 4,
              padding: '14px 8px',
              transform: animatingButton === 'btn-12' ? 'scale(0.92)' : 'scale(1)',
              transition: 'transform 0.15s ease, background 0.15s',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 8h1a4 4 0 0 1 0 8h-1" />
              <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z" />
              <line x1="6" y1="2" x2="6" y2="4" />
              <line x1="10" y1="2" x2="10" y2="4" />
              <line x1="14" y1="2" x2="14" y2="4" />
            </svg>
            <span style={{ fontSize: 15, fontWeight: 700 }}>{displayAmount(12, unit)}</span>
            <span style={{ fontSize: 11, opacity: 0.7 }}>Medium glass</span>
          </button>

          {/* 16 oz */}
          <button
            className="water-btn"
            onClick={() => handleQuickAdd(16, 'btn-16')}
            style={{
              flexDirection: 'column',
              gap: 4,
              padding: '14px 8px',
              transform: animatingButton === 'btn-16' ? 'scale(0.92)' : 'scale(1)',
              transition: 'transform 0.15s ease, background 0.15s',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 3h12l-1.5 15a2 2 0 0 1-2 1.8H9.5a2 2 0 0 1-2-1.8L6 3z" />
              <path d="M5 3h14" />
              <path d="M12 3v18" />
            </svg>
            <span style={{ fontSize: 15, fontWeight: 700 }}>{displayAmount(16, unit)}</span>
            <span style={{ fontSize: 11, opacity: 0.7 }}>Water bottle</span>
          </button>

          {/* 20 oz */}
          <button
            className="water-btn"
            onClick={() => handleQuickAdd(20, 'btn-20')}
            style={{
              flexDirection: 'column',
              gap: 4,
              padding: '14px 8px',
              transform: animatingButton === 'btn-20' ? 'scale(0.92)' : 'scale(1)',
              transition: 'transform 0.15s ease, background 0.15s',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 3h12l-1.5 15a2 2 0 0 1-2 1.8H9.5a2 2 0 0 1-2-1.8L6 3z" />
              <path d="M5 3h14" />
              <path d="M9 10h6" />
              <path d="M9 14h6" />
            </svg>
            <span style={{ fontSize: 15, fontWeight: 700 }}>{displayAmount(20, unit)}</span>
            <span style={{ fontSize: 11, opacity: 0.7 }}>Large bottle</span>
          </button>

          {/* Custom */}
          <button
            className="water-btn"
            onClick={() => setShowCustomInput(!showCustomInput)}
            style={{
              flexDirection: 'column',
              gap: 4,
              padding: '14px 8px',
              gridColumn: 'span 2',
              background: showCustomInput ? 'var(--color-primary-light)' : undefined,
              borderColor: showCustomInput ? 'var(--color-blue)' : undefined,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span style={{ fontSize: 15, fontWeight: 700 }}>Custom</span>
            <span style={{ fontSize: 11, opacity: 0.7 }}>Enter amount</span>
          </button>
        </div>

        {/* Custom amount input */}
        {showCustomInput && (
          <div className="water-input-row" style={{ marginTop: 10 }}>
            <input
              type="number"
              inputMode="decimal"
              placeholder={`Amount in ${displayUnit(unit)}`}
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCustomAdd();
              }}
              autoFocus
            />
            <button className="btn btn-primary btn-sm" onClick={handleCustomAdd}>
              Add
            </button>
            <button
              className="btn btn-sm"
              onClick={() => {
                setShowCustomInput(false);
                setCustomAmount('');
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Today's Water Log (Timeline)                                        */}
      {/* ------------------------------------------------------------------ */}
      <section style={{ marginBottom: 24 }}>
        <h2 className="section-title">
          Today&apos;s Log
          {entries.length > 0 && (
            <span
              style={{
                float: 'right',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--color-blue)',
                textTransform: 'none',
                letterSpacing: 0,
              }}
            >
              Total: {displayAmount(currentIntake, unit)} {displayUnit(unit)}
            </span>
          )}
        </h2>

        <div className="card">
          {entries.length === 0 ? (
            <div className="empty-state">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--color-gray-300)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ marginBottom: 8 }}
              >
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0L12 2.69z" />
              </svg>
              <p>No water logged yet today.</p>
              <p style={{ fontSize: 12, marginTop: 4 }}>Use the buttons above to start tracking!</p>
            </div>
          ) : (
            <div>
              {[...entries].reverse().map((entry) => (
                <div
                  key={entry.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 0',
                    borderBottom: '1px solid var(--color-gray-200)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {/* Timeline dot */}
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: '#3b82f6',
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)' }}>
                        {displayAmount(entry.amount, unit)} {displayUnit(unit)}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--color-gray-500)' }}>
                        {formatTime(entry.timestamp)}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteEntry(entry.id)}
                    aria-label="Delete entry"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 6,
                      borderRadius: 6,
                      color: 'var(--color-gray-400)',
                      transition: 'color 0.15s, background 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--color-red)';
                      e.currentTarget.style.background = 'var(--color-red-bg)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--color-gray-400)';
                      e.currentTarget.style.background = 'none';
                    }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                  </button>
                </div>
              ))}
              {/* Remove bottom border from last item */}
              <style>{`
                section .card > div > div:last-child {
                  border-bottom: none !important;
                }
              `}</style>
            </div>
          )}
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Weekly Overview                                                      */}
      {/* ------------------------------------------------------------------ */}
      <section style={{ marginBottom: 24 }}>
        <h2 className="section-title">Weekly Overview</h2>
        <div className="card" style={{ padding: '16px 12px' }}>
          {/* Bar chart */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              height: 140,
              gap: 6,
              position: 'relative',
            }}
          >
            {/* Goal line */}
            <div
              style={{
                position: 'absolute',
                bottom: `${(goal / weeklyMax) * 100}%`,
                left: 0,
                right: 0,
                height: 1,
                borderTop: '2px dashed var(--color-gray-300)',
                zIndex: 1,
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  right: 0,
                  top: -16,
                  fontSize: 10,
                  color: 'var(--color-gray-400)',
                  background: 'var(--color-gray-50)',
                  padding: '0 4px',
                }}
              >
                Goal
              </span>
            </div>

            {weeklyData.map((day) => {
              const barHeight = weeklyMax > 0 ? (day.intake / weeklyMax) * 100 : 0;
              const pct = goal > 0 ? day.intake / goal : 0;
              let barColor = '#ef4444'; // red < 50%
              if (pct >= 1) barColor = '#22c55e'; // green: met goal
              else if (pct >= 0.5) barColor = '#eab308'; // yellow: >50%

              const isToday = day.date === today;

              return (
                <div
                  key={day.date}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    height: '100%',
                    justifyContent: 'flex-end',
                  }}
                >
                  {/* Amount label on top of bar */}
                  {day.intake > 0 && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: 'var(--color-gray-500)',
                        marginBottom: 3,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {displayAmount(day.intake, unit)}
                    </span>
                  )}
                  {/* Bar */}
                  <div
                    style={{
                      width: '100%',
                      maxWidth: 36,
                      height: `${Math.max(barHeight, day.intake > 0 ? 4 : 0)}%`,
                      minHeight: day.intake > 0 ? 4 : 0,
                      background: barColor,
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.4s ease',
                      opacity: isToday ? 1 : 0.75,
                      border: isToday ? '2px solid var(--color-blue)' : 'none',
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Day labels */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 6,
              paddingTop: 6,
              borderTop: '1px solid var(--color-gray-200)',
            }}
          >
            {weeklyData.map((day) => {
              const isToday = day.date === today;
              return (
                <div
                  key={day.date}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    fontSize: 11,
                    fontWeight: isToday ? 700 : 500,
                    color: isToday ? 'var(--color-blue)' : 'var(--color-gray-500)',
                  }}
                >
                  {getDayLabel(day.date)}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 16,
              marginTop: 10,
              fontSize: 11,
              color: 'var(--color-gray-500)',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: '#22c55e', display: 'inline-block' }} />
              Met goal
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: '#eab308', display: 'inline-block' }} />
              {'>'}50%
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: '#ef4444', display: 'inline-block' }} />
              {'<'}50%
            </span>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Hydration Tips for Gout                                             */}
      {/* ------------------------------------------------------------------ */}
      <section style={{ marginBottom: 24 }}>
        <h2 className="section-title">Hydration Tips for Gout</h2>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {HYDRATION_TIPS.map((tip, index) => {
            const isExpanded = expandedTip === index;
            return (
              <div key={index}>
                <button
                  onClick={() => setExpandedTip(isExpanded ? null : index)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    background: 'none',
                    border: 'none',
                    borderBottom: index < HYDRATION_TIPS.length - 1 ? '1px solid var(--color-gray-200)' : 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: 'var(--foreground)',
                    fontFamily: 'inherit',
                    fontSize: 14,
                    fontWeight: 500,
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ flexShrink: 0 }}
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    <span>{tip.title}</span>
                  </div>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      flexShrink: 0,
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                      color: 'var(--color-gray-400)',
                    }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {isExpanded && (
                  <div
                    style={{
                      padding: '0 16px 14px 44px',
                      fontSize: 13,
                      lineHeight: 1.6,
                      color: 'var(--color-gray-600)',
                      borderBottom: index < HYDRATION_TIPS.length - 1 ? '1px solid var(--color-gray-200)' : 'none',
                    }}
                  >
                    {tip.body}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Settings Quick Access                                               */}
      {/* ------------------------------------------------------------------ */}
      <section style={{ marginBottom: 24 }}>
        <h2 className="section-title">Settings</h2>
        <div className="card">
          {/* Daily Goal */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 14,
              paddingBottom: 14,
              borderBottom: '1px solid var(--color-gray-200)',
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)' }}>
                Daily Goal
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-gray-500)', marginTop: 2 }}>
                {displayAmount(goal, unit)} {displayUnit(unit)} per day
              </div>
            </div>
            {editingGoal ? (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input
                  type="number"
                  inputMode="decimal"
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveGoal();
                    if (e.key === 'Escape') setEditingGoal(false);
                  }}
                  style={{
                    width: 70,
                    padding: '6px 8px',
                    border: '1px solid var(--color-gray-200)',
                    borderRadius: 6,
                    fontSize: 14,
                    fontFamily: 'inherit',
                    background: 'var(--background)',
                    color: 'var(--foreground)',
                  }}
                  autoFocus
                />
                <span style={{ fontSize: 12, color: 'var(--color-gray-500)' }}>
                  {displayUnit(unit)}
                </span>
                <button className="btn btn-primary btn-sm" onClick={handleSaveGoal}>
                  Save
                </button>
                <button className="btn btn-sm" onClick={() => setEditingGoal(false)}>
                  Cancel
                </button>
              </div>
            ) : (
              <button
                className="btn btn-sm"
                onClick={() => {
                  setGoalInput(displayAmount(goal, unit));
                  setEditingGoal(true);
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                </svg>
                Edit
              </button>
            )}
          </div>

          {/* Unit Preference */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)' }}>
                Unit Preference
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-gray-500)', marginTop: 2 }}>
                Display amounts in {unit === 'oz' ? 'fluid ounces' : 'milliliters'}
              </div>
            </div>
            <button
              className="btn btn-sm"
              onClick={toggleUnit}
              style={{
                minWidth: 60,
                fontWeight: 600,
                color: 'var(--color-blue)',
              }}
            >
              {unit === 'oz' ? 'oz' : 'mL'}
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ marginLeft: 4 }}
              >
                <polyline points="17 1 21 5 17 9" />
                <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                <polyline points="7 23 3 19 7 15" />
                <path d="M21 13v2a4 4 0 0 1-4 4H3" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <p className="disclaimer">
        Stay hydrated! Water is one of the best natural ways to support uric acid management.
      </p>
    </div>
  );
}
