'use client';
import { useState, useEffect, useMemo } from 'react';
import { getFlares, addFlare, updateFlare, deleteFlare, generateId, FlareEvent } from '@/lib/storage';
import { formatDate, formatTime, getRelativeTime, getPainLevelColor } from '@/lib/helpers';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const JOINT_OPTIONS = [
  'Big toe (left)',
  'Big toe (right)',
  'Ankle (left)',
  'Ankle (right)',
  'Knee (left)',
  'Knee (right)',
  'Wrist (left)',
  'Wrist (right)',
  'Finger',
  'Elbow (left)',
  'Elbow (right)',
  'Other',
];

const TRIGGER_OPTIONS = [
  'Red meat',
  'Seafood',
  'Alcohol (beer)',
  'Alcohol (wine/spirits)',
  'High-fructose drinks',
  'Dehydration',
  'Stress',
  'Injury/trauma',
  'Surgery',
  'Illness',
  'Weather change',
  'New medication',
  'Missed medication',
  'Intense exercise',
  'Other',
];

const TREATMENT_OPTIONS = [
  'Colchicine',
  'NSAIDs (ibuprofen/naproxen)',
  'Prednisone',
  'Ice/cold pack',
  'Rest/elevation',
  'Cherry juice',
  'Prescription (other)',
  'OTC pain relief',
  'Other',
];

const PAIN_LABELS: Record<number, string> = {
  1: 'Minimal',
  2: '',
  3: 'Mild',
  4: '',
  5: 'Moderate',
  6: '',
  7: 'Severe',
  8: '',
  9: 'Extreme',
  10: 'Worst',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getNowTimeString(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function daysSinceDate(dateStr: string): number {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function parseDuration(duration: string): { value: number; unit: 'hours' | 'days' } {
  if (!duration) return { value: 0, unit: 'hours' };
  const match = duration.match(/^(\d+(?:\.\d+)?)\s*(hours?|days?)$/i);
  if (match) {
    return {
      value: parseFloat(match[1]),
      unit: match[2].toLowerCase().startsWith('day') ? 'days' : 'hours',
    };
  }
  const num = parseFloat(duration);
  return { value: isNaN(num) ? 0 : num, unit: 'hours' };
}

function formatDuration(value: number, unit: 'hours' | 'days'): string {
  if (value <= 0) return '';
  if (unit === 'days') return `${value} ${value === 1 ? 'day' : 'days'}`;
  return `${value} ${value === 1 ? 'hour' : 'hours'}`;
}

function durationToHours(duration: string): number {
  const { value, unit } = parseDuration(duration);
  return unit === 'days' ? value * 24 : value;
}

// ---------------------------------------------------------------------------
// Empty form state
// ---------------------------------------------------------------------------

interface FlareFormData {
  date: string;
  time: string;
  joints: string[];
  otherJoint: string;
  painLevel: number;
  triggers: string[];
  otherTrigger: string;
  treatments: string[];
  otherTreatment: string;
  durationValue: number;
  durationUnit: 'hours' | 'days';
  notes: string;
  resolved: boolean;
}

function createEmptyForm(): FlareFormData {
  return {
    date: getTodayString(),
    time: getNowTimeString(),
    joints: [],
    otherJoint: '',
    painLevel: 5,
    triggers: [],
    otherTrigger: '',
    treatments: [],
    otherTreatment: '',
    durationValue: 0,
    durationUnit: 'hours',
    notes: '',
    resolved: false,
  };
}

function formToFlare(form: FlareFormData, id?: string): FlareEvent {
  const joints = [...form.joints];
  if (joints.includes('Other') && form.otherJoint.trim()) {
    joints[joints.indexOf('Other')] = `Other: ${form.otherJoint.trim()}`;
  }

  const triggers = [...form.triggers];
  if (triggers.includes('Other') && form.otherTrigger.trim()) {
    triggers[triggers.indexOf('Other')] = `Other: ${form.otherTrigger.trim()}`;
  }

  const treatments = [...form.treatments];
  if (treatments.includes('Other') && form.otherTreatment.trim()) {
    treatments[treatments.indexOf('Other')] = `Other: ${form.otherTreatment.trim()}`;
  }

  return {
    id: id || generateId(),
    date: form.date,
    time: form.time,
    joints,
    painLevel: form.painLevel,
    duration: form.durationValue > 0 ? formatDuration(form.durationValue, form.durationUnit) : '',
    triggers,
    treatments,
    notes: form.notes.trim(),
    resolved: form.resolved,
    resolvedDate: form.resolved ? getTodayString() : undefined,
  };
}

function flareToForm(flare: FlareEvent): FlareFormData {
  const joints = flare.joints.map((j) => (j.startsWith('Other:') ? 'Other' : j));
  const otherJoint = flare.joints.find((j) => j.startsWith('Other:'))?.replace('Other: ', '') || '';

  const triggers = flare.triggers.map((t) => (t.startsWith('Other:') ? 'Other' : t));
  const otherTrigger = flare.triggers.find((t) => t.startsWith('Other:'))?.replace('Other: ', '') || '';

  const treatments = flare.treatments.map((t) => (t.startsWith('Other:') ? 'Other' : t));
  const otherTreatment = flare.treatments.find((t) => t.startsWith('Other:'))?.replace('Other: ', '') || '';

  const { value, unit } = parseDuration(flare.duration);

  return {
    date: flare.date,
    time: flare.time,
    joints,
    otherJoint,
    painLevel: flare.painLevel,
    triggers,
    otherTrigger,
    treatments,
    otherTreatment,
    durationValue: value,
    durationUnit: unit,
    notes: flare.notes,
    resolved: flare.resolved,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function FlaresPage() {
  const [flares, setFlares] = useState<FlareEvent[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FlareFormData>(createEmptyForm);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'history' | 'analytics'>('history');

  // Load data
  useEffect(() => {
    setFlares(getFlares());
    setLoaded(true);
  }, []);

  // Re-sort flares newest first
  const sortedFlares = useMemo(
    () => [...flares].sort((a, b) => {
      const dateComp = b.date.localeCompare(a.date);
      if (dateComp !== 0) return dateComp;
      return (b.time || '').localeCompare(a.time || '');
    }),
    [flares],
  );

  // ---------------------------------------------------------------------------
  // Summary stats
  // ---------------------------------------------------------------------------

  const stats = useMemo(() => {
    if (flares.length === 0) {
      return { total: 0, avgPain: 0, commonJoint: '-', daysSinceLast: null as number | null };
    }

    const avgPain = flares.reduce((sum, f) => sum + f.painLevel, 0) / flares.length;

    const jointCounts: Record<string, number> = {};
    flares.forEach((f) => {
      f.joints.forEach((j) => {
        const normalized = j.startsWith('Other:') ? 'Other' : j;
        jointCounts[normalized] = (jointCounts[normalized] || 0) + 1;
      });
    });
    const commonJoint = Object.entries(jointCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

    const latestDate = sortedFlares[0]?.date || '';
    const daysSinceLast = latestDate ? daysSinceDate(latestDate) : null;

    return { total: flares.length, avgPain, commonJoint, daysSinceLast };
  }, [flares, sortedFlares]);

  // ---------------------------------------------------------------------------
  // Analytics
  // ---------------------------------------------------------------------------

  const analytics = useMemo(() => {
    if (flares.length < 3) return null;

    // Flares per month
    const monthCounts: Record<string, number> = {};
    flares.forEach((f) => {
      const month = f.date.substring(0, 7); // YYYY-MM
      monthCounts[month] = (monthCounts[month] || 0) + 1;
    });
    const flaresPerMonth = Object.entries(monthCounts)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 12)
      .reverse();

    // Joint frequency
    const jointCounts: Record<string, number> = {};
    flares.forEach((f) => {
      f.joints.forEach((j) => {
        const normalized = j.startsWith('Other:') ? 'Other' : j;
        jointCounts[normalized] = (jointCounts[normalized] || 0) + 1;
      });
    });
    const totalJointMentions = Object.values(jointCounts).reduce((a, b) => a + b, 0);
    const jointRanking = Object.entries(jointCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([joint, count]) => ({
        joint,
        count,
        pct: Math.round((count / totalJointMentions) * 100),
      }));

    // Trigger frequency
    const triggerCounts: Record<string, number> = {};
    flares.forEach((f) => {
      f.triggers.forEach((t) => {
        const normalized = t.startsWith('Other:') ? 'Other' : t;
        triggerCounts[normalized] = (triggerCounts[normalized] || 0) + 1;
      });
    });
    const totalTriggerMentions = Object.values(triggerCounts).reduce((a, b) => a + b, 0) || 1;
    const triggerRanking = Object.entries(triggerCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([trigger, count]) => ({
        trigger,
        count,
        pct: Math.round((count / totalTriggerMentions) * 100),
      }));

    // Average pain
    const avgPain = flares.reduce((s, f) => s + f.painLevel, 0) / flares.length;

    // Pain trend (compare first half to second half)
    const sorted = [...flares].sort((a, b) => a.date.localeCompare(b.date));
    const mid = Math.floor(sorted.length / 2);
    const firstHalfPain = sorted.slice(0, mid).reduce((s, f) => s + f.painLevel, 0) / mid;
    const secondHalfPain = sorted.slice(mid).reduce((s, f) => s + f.painLevel, 0) / (sorted.length - mid);
    const painTrend = secondHalfPain - firstHalfPain;

    // Average duration
    const flaresWithDuration = flares.filter((f) => f.duration);
    let avgDurationHours = 0;
    if (flaresWithDuration.length > 0) {
      avgDurationHours =
        flaresWithDuration.reduce((s, f) => s + durationToHours(f.duration), 0) /
        flaresWithDuration.length;
    }

    // Duration trend
    const sortedWithDuration = flaresWithDuration.sort((a, b) => a.date.localeCompare(b.date));
    let durationTrend = 0;
    if (sortedWithDuration.length >= 2) {
      const dMid = Math.floor(sortedWithDuration.length / 2);
      const firstHalfDur = sortedWithDuration.slice(0, dMid).reduce((s, f) => s + durationToHours(f.duration), 0) / dMid;
      const secondHalfDur = sortedWithDuration.slice(dMid).reduce((s, f) => s + durationToHours(f.duration), 0) / (sortedWithDuration.length - dMid);
      durationTrend = secondHalfDur - firstHalfDur;
    }

    return {
      flaresPerMonth,
      jointRanking,
      triggerRanking,
      avgPain,
      painTrend,
      avgDurationHours,
      durationTrend,
    };
  }, [flares]);

  // ---------------------------------------------------------------------------
  // Form handlers
  // ---------------------------------------------------------------------------

  function openNewForm() {
    setForm(createEmptyForm());
    setEditingId(null);
    setShowForm(true);
  }

  function openEditForm(flare: FlareEvent) {
    setForm(flareToForm(flare));
    setEditingId(flare.id);
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(createEmptyForm());
  }

  function handleSave() {
    if (form.joints.length === 0) return;

    if (editingId) {
      const updated = formToFlare(form, editingId);
      updateFlare(updated);
    } else {
      const newFlare = formToFlare(form);
      addFlare(newFlare);
    }
    setFlares(getFlares());
    cancelForm();
  }

  function handleDelete(id: string) {
    deleteFlare(id);
    setFlares(getFlares());
    setDeleteConfirmId(null);
    setExpandedId(null);
  }

  function toggleMultiSelect(
    field: 'joints' | 'triggers' | 'treatments',
    value: string,
  ) {
    setForm((prev) => {
      const arr = prev[field];
      const next = arr.includes(value)
        ? arr.filter((v) => v !== value)
        : [...arr, value];
      return { ...prev, [field]: next };
    });
  }

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  function getPainColor(level: number): string {
    if (level <= 3) return '#22c55e';
    if (level <= 6) return '#eab308';
    if (level <= 8) return '#f97316';
    return '#ef4444';
  }

  function getPainBgColor(level: number): string {
    if (level <= 3) return '#f0fdf4';
    if (level <= 6) return '#fefce8';
    if (level <= 8) return '#fff7ed';
    return '#fef2f2';
  }

  function getTrendArrow(trend: number): string {
    if (trend > 0.5) return 'Increasing';
    if (trend < -0.5) return 'Decreasing';
    return 'Stable';
  }

  function getTrendColor(trend: number, lowerIsBetter: boolean): string {
    const improving = lowerIsBetter ? trend < -0.5 : trend > 0.5;
    const worsening = lowerIsBetter ? trend > 0.5 : trend < -0.5;
    if (improving) return '#22c55e';
    if (worsening) return '#ef4444';
    return 'var(--color-gray-500)';
  }

  function formatAvgDuration(hours: number): string {
    if (hours < 24) return `${hours.toFixed(1)} hrs`;
    const days = hours / 24;
    return `${days.toFixed(1)} days`;
  }

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  if (!loaded) {
    return (
      <div className="page" style={{ paddingTop: 24 }}>
        <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--color-gray-400)' }}>
          Loading...
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Empty state
  // ---------------------------------------------------------------------------

  if (flares.length === 0 && !showForm) {
    return (
      <div className="page" style={{ paddingTop: 24 }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--foreground)', marginBottom: 4 }}>
            Flare Logger
          </h1>
          <p style={{ fontSize: 14, color: 'var(--color-gray-500)' }}>
            Track and analyze your gout flares
          </p>
        </div>

        <div style={{
          textAlign: 'center',
          padding: '64px 24px',
          background: 'var(--color-gray-50)',
          border: '1px solid var(--color-gray-200)',
          borderRadius: 'var(--radius)',
        }}>
          {/* Flame icon */}
          <div style={{ marginBottom: 16 }}>
            <svg
              width="56"
              height="56"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-gray-300)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22c-4.97 0-9-2.69-9-6 0-4 5-10.5 9-13.5 4 3 9 9.5 9 13.5 0 3.31-4.03 6-9 6z" />
              <path d="M12 22c-1.66 0-3-1.34-3-3 0-2 2-5 3-6.5 1 1.5 3 4.5 3 6.5 0 1.66-1.34 3-3 3z" />
            </svg>
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--foreground)', marginBottom: 8 }}>
            No flares logged yet
          </h2>
          <p style={{ fontSize: 14, color: 'var(--color-gray-500)', marginBottom: 24, lineHeight: 1.6 }}>
            Track your gout flares to identify patterns and triggers.
            <br />
            Consistent logging helps you and your doctor manage your condition more effectively.
          </p>
          <button
            className="btn btn-primary"
            style={{ padding: '12px 28px', fontSize: 15, fontWeight: 600 }}
            onClick={openNewForm}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Log Your First Flare
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Main view
  // ---------------------------------------------------------------------------

  return (
    <div className="page" style={{ paddingTop: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--foreground)', marginBottom: 4 }}>
          Flare Logger
        </h1>
        <p style={{ fontSize: 14, color: 'var(--color-gray-500)' }}>
          Track and analyze your gout flares
        </p>
      </div>

      {/* Summary Header (only when we have flares and form is not shown) */}
      {!showForm && flares.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          {/* Days since last flare - prominent */}
          {stats.daysSinceLast !== null && (
            <div style={{
              background: stats.daysSinceLast === 0
                ? 'var(--color-red-bg)'
                : stats.daysSinceLast <= 7
                  ? 'var(--color-yellow-bg)'
                  : 'var(--color-green-bg)',
              border: '1px solid var(--color-gray-200)',
              borderRadius: 'var(--radius)',
              padding: '20px 16px',
              textAlign: 'center',
              marginBottom: 12,
            }}>
              <div style={{
                fontSize: 36,
                fontWeight: 800,
                color: stats.daysSinceLast === 0
                  ? '#ef4444'
                  : stats.daysSinceLast <= 7
                    ? '#a16207'
                    : '#15803d',
                lineHeight: 1.1,
              }}>
                {stats.daysSinceLast}
              </div>
              <div style={{
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--color-gray-600)',
                marginTop: 4,
              }}>
                {stats.daysSinceLast === 1 ? 'day' : 'days'} since last flare
              </div>
            </div>
          )}

          {/* Stats row */}
          <div className="grid-3">
            <div className="stat-card">
              <span className="stat-label">Total Flares</span>
              <span className="stat-value">{stats.total}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Avg Pain</span>
              <span className="stat-value" style={{ color: getPainColor(Math.round(stats.avgPain)) }}>
                {stats.avgPain.toFixed(1)}
              </span>
              <span className="stat-unit">/ 10</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Top Joint</span>
              <span className="stat-value" style={{ fontSize: 14, lineHeight: 1.4 }}>
                {stats.commonJoint}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Log New Flare Button */}
      {!showForm && (
        <button
          className="btn btn-primary"
          onClick={openNewForm}
          style={{
            width: '100%',
            padding: '14px',
            fontSize: 15,
            fontWeight: 600,
            marginBottom: 24,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Log New Flare
        </button>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* Flare Form                                                          */}
      {/* ------------------------------------------------------------------- */}

      {showForm && (
        <div style={{
          background: 'var(--color-gray-50)',
          border: '1px solid var(--color-gray-200)',
          borderRadius: 'var(--radius)',
          padding: 20,
          marginBottom: 24,
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, color: 'var(--foreground)' }}>
            {editingId ? 'Edit Flare' : 'Log New Flare'}
          </h2>

          {/* Date & Time */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Date &amp; Time</label>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                style={{ ...inputStyle, flex: 1 }}
              />
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))}
                style={{ ...inputStyle, flex: 1 }}
              />
            </div>
          </div>

          {/* Affected Joints */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>
              Affected Joint(s) <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {JOINT_OPTIONS.map((joint) => (
                <button
                  key={joint}
                  type="button"
                  onClick={() => toggleMultiSelect('joints', joint)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 20,
                    border: '1px solid',
                    borderColor: form.joints.includes(joint)
                      ? 'var(--color-primary)'
                      : 'var(--color-gray-200)',
                    background: form.joints.includes(joint)
                      ? 'var(--color-primary-light)'
                      : 'var(--background)',
                    color: form.joints.includes(joint)
                      ? 'var(--color-primary)'
                      : 'var(--foreground)',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.15s',
                  }}
                >
                  {joint}
                </button>
              ))}
            </div>
            {form.joints.includes('Other') && (
              <input
                type="text"
                placeholder="Specify other joint..."
                value={form.otherJoint}
                onChange={(e) => setForm((p) => ({ ...p, otherJoint: e.target.value }))}
                style={{ ...inputStyle, marginTop: 10, width: '100%' }}
              />
            )}
            {form.joints.length === 0 && (
              <p style={{ fontSize: 12, color: '#ef4444', marginTop: 6 }}>
                Please select at least one joint
              </p>
            )}
          </div>

          {/* Pain Level */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>
              Pain Level: <span style={{ fontWeight: 700, color: getPainColor(form.painLevel) }}>{form.painLevel}</span>
              {PAIN_LABELS[form.painLevel] && (
                <span style={{ fontWeight: 400, color: 'var(--color-gray-500)', marginLeft: 6 }}>
                  ({PAIN_LABELS[form.painLevel]})
                </span>
              )}
            </label>
            {/* Button row */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, painLevel: n }))}
                  style={{
                    flex: 1,
                    padding: '10px 0',
                    borderRadius: 6,
                    border: form.painLevel === n ? '2px solid' : '1px solid',
                    borderColor: form.painLevel === n
                      ? getPainColor(n)
                      : 'var(--color-gray-200)',
                    background: form.painLevel === n
                      ? getPainBgColor(n)
                      : 'var(--background)',
                    color: form.painLevel === n
                      ? getPainColor(n)
                      : 'var(--foreground)',
                    fontSize: 14,
                    fontWeight: form.painLevel === n ? 700 : 500,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.15s',
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
            {/* Color gradient bar */}
            <div style={{
              height: 6,
              borderRadius: 3,
              background: `linear-gradient(to right, #22c55e 0%, #84cc16 25%, #eab308 50%, #f97316 75%, #ef4444 100%)`,
              marginBottom: 4,
            }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--color-gray-400)' }}>
              <span>Minimal</span>
              <span>Mild</span>
              <span>Moderate</span>
              <span>Severe</span>
              <span>Worst</span>
            </div>
          </div>

          {/* Possible Triggers */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Possible Triggers</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {TRIGGER_OPTIONS.map((trigger) => (
                <button
                  key={trigger}
                  type="button"
                  onClick={() => toggleMultiSelect('triggers', trigger)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 20,
                    border: '1px solid',
                    borderColor: form.triggers.includes(trigger)
                      ? '#f97316'
                      : 'var(--color-gray-200)',
                    background: form.triggers.includes(trigger)
                      ? '#fff7ed'
                      : 'var(--background)',
                    color: form.triggers.includes(trigger)
                      ? '#c2410c'
                      : 'var(--foreground)',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.15s',
                  }}
                >
                  {trigger}
                </button>
              ))}
            </div>
            {form.triggers.includes('Other') && (
              <input
                type="text"
                placeholder="Specify other trigger..."
                value={form.otherTrigger}
                onChange={(e) => setForm((p) => ({ ...p, otherTrigger: e.target.value }))}
                style={{ ...inputStyle, marginTop: 10, width: '100%' }}
              />
            )}
          </div>

          {/* Treatment Used */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Treatment Used</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {TREATMENT_OPTIONS.map((treatment) => (
                <button
                  key={treatment}
                  type="button"
                  onClick={() => toggleMultiSelect('treatments', treatment)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 20,
                    border: '1px solid',
                    borderColor: form.treatments.includes(treatment)
                      ? '#3b82f6'
                      : 'var(--color-gray-200)',
                    background: form.treatments.includes(treatment)
                      ? 'var(--color-blue-light)'
                      : 'var(--background)',
                    color: form.treatments.includes(treatment)
                      ? '#1d4ed8'
                      : 'var(--foreground)',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.15s',
                  }}
                >
                  {treatment}
                </button>
              ))}
            </div>
            {form.treatments.includes('Other') && (
              <input
                type="text"
                placeholder="Specify other treatment..."
                value={form.otherTreatment}
                onChange={(e) => setForm((p) => ({ ...p, otherTreatment: e.target.value }))}
                style={{ ...inputStyle, marginTop: 10, width: '100%' }}
              />
            )}
          </div>

          {/* Duration */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Duration</label>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                type="number"
                min="0"
                step="0.5"
                value={form.durationValue || ''}
                placeholder="0"
                onChange={(e) =>
                  setForm((p) => ({ ...p, durationValue: parseFloat(e.target.value) || 0 }))
                }
                style={{ ...inputStyle, flex: 1 }}
              />
              <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--color-gray-200)' }}>
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, durationUnit: 'hours' }))}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    background: form.durationUnit === 'hours' ? 'var(--color-primary)' : 'var(--background)',
                    color: form.durationUnit === 'hours' ? '#fff' : 'var(--foreground)',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  Hours
                </button>
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, durationUnit: 'days' }))}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderLeft: '1px solid var(--color-gray-200)',
                    background: form.durationUnit === 'days' ? 'var(--color-primary)' : 'var(--background)',
                    color: form.durationUnit === 'days' ? '#fff' : 'var(--foreground)',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  Days
                </button>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Additional details about this flare..."
              rows={3}
              style={{
                ...inputStyle,
                width: '100%',
                resize: 'vertical',
                minHeight: 72,
                lineHeight: 1.5,
              }}
            />
          </div>

          {/* Resolved toggle */}
          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: form.resolved ? 'var(--color-green-bg)' : 'var(--background)',
                border: '1px solid',
                borderColor: form.resolved ? '#22c55e' : 'var(--color-gray-200)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <div>
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--foreground)' }}>
                  Flare Resolved
                </span>
                <p style={{ fontSize: 12, color: 'var(--color-gray-500)', marginTop: 2 }}>
                  Mark this flare as no longer active
                </p>
              </div>
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, resolved: !p.resolved }))}
                role="switch"
                aria-checked={form.resolved}
                style={{
                  width: 48,
                  height: 28,
                  borderRadius: 14,
                  border: 'none',
                  padding: 2,
                  cursor: 'pointer',
                  background: form.resolved ? '#22c55e' : 'var(--color-gray-300)',
                  transition: 'background 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: form.resolved ? 'flex-end' : 'flex-start',
                  flexShrink: 0,
                }}
              >
                <div style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  background: '#fff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  transition: 'all 0.2s',
                }} />
              </button>
            </div>
          </div>

          {/* Save / Cancel */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              className="btn"
              onClick={cancelForm}
              style={{ flex: 1, padding: '12px', fontWeight: 500 }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              disabled={form.joints.length === 0}
              style={{
                flex: 1,
                padding: '12px',
                fontWeight: 600,
                opacity: form.joints.length === 0 ? 0.5 : 1,
                cursor: form.joints.length === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              {editingId ? 'Update Flare' : 'Save Flare'}
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* Tabs: History / Analytics                                            */}
      {/* ------------------------------------------------------------------- */}

      {!showForm && flares.length > 0 && (
        <>
          <div style={{
            display: 'flex',
            borderBottom: '2px solid var(--color-gray-200)',
            marginBottom: 16,
          }}>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              style={{
                flex: 1,
                padding: '10px 0',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 14,
                fontWeight: 600,
                color: activeTab === 'history' ? 'var(--color-primary)' : 'var(--color-gray-400)',
                borderBottom: activeTab === 'history' ? '2px solid var(--color-primary)' : '2px solid transparent',
                marginBottom: -2,
                transition: 'color 0.15s',
              }}
            >
              History ({flares.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('analytics')}
              style={{
                flex: 1,
                padding: '10px 0',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 14,
                fontWeight: 600,
                color: activeTab === 'analytics' ? 'var(--color-primary)' : 'var(--color-gray-400)',
                borderBottom: activeTab === 'analytics' ? '2px solid var(--color-primary)' : '2px solid transparent',
                marginBottom: -2,
                transition: 'color 0.15s',
              }}
            >
              Analytics
            </button>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* History Tab                                                     */}
          {/* ------------------------------------------------------------- */}

          {activeTab === 'history' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              {sortedFlares.map((flare) => {
                const isExpanded = expandedId === flare.id;
                const isDeleting = deleteConfirmId === flare.id;
                const painColor = getPainLevelColor(flare.painLevel);

                return (
                  <div
                    key={flare.id}
                    style={{
                      background: 'var(--color-gray-50)',
                      border: '1px solid var(--color-gray-200)',
                      borderRadius: 'var(--radius)',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Clickable summary row */}
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : flare.id)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                        padding: 16,
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontFamily: 'inherit',
                      }}
                    >
                      {/* Pain level indicator */}
                      <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        background: getPainBgColor(flare.painLevel),
                        border: `2px solid ${painColor}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <span style={{ fontSize: 18, fontWeight: 700, color: painColor }}>
                          {flare.painLevel}
                        </span>
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Date and status */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)' }}>
                            {formatDate(flare.date)}
                          </span>
                          {flare.time && (
                            <span style={{ fontSize: 12, color: 'var(--color-gray-400)' }}>
                              {formatTime(flare.time)}
                            </span>
                          )}
                          <span
                            style={{
                              marginLeft: 'auto',
                              padding: '2px 8px',
                              borderRadius: 999,
                              fontSize: 11,
                              fontWeight: 600,
                              background: flare.resolved ? 'var(--color-green-bg)' : 'var(--color-red-bg)',
                              color: flare.resolved ? '#15803d' : '#b91c1c',
                            }}
                          >
                            {flare.resolved ? 'Resolved' : 'Active'}
                          </span>
                        </div>

                        {/* Joints */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="var(--color-gray-400)"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M18 20a6 6 0 0 0-12 0" />
                            <circle cx="12" cy="10" r="4" />
                          </svg>
                          <span style={{ fontSize: 13, color: 'var(--color-gray-600)' }}>
                            {flare.joints.join(', ')}
                          </span>
                        </div>

                        {/* Pain bar */}
                        <div style={{
                          height: 4,
                          borderRadius: 2,
                          background: 'var(--color-gray-200)',
                          marginBottom: 8,
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${flare.painLevel * 10}%`,
                            borderRadius: 2,
                            background: painColor,
                            transition: 'width 0.3s',
                          }} />
                        </div>

                        {/* Duration */}
                        {flare.duration && (
                          <div style={{ fontSize: 12, color: 'var(--color-gray-500)', marginBottom: 6 }}>
                            Duration: {flare.duration}
                          </div>
                        )}

                        {/* Trigger badges */}
                        {flare.triggers.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4 }}>
                            {flare.triggers.map((t, i) => (
                              <span key={i} className="badge badge-orange">{t}</span>
                            ))}
                          </div>
                        )}

                        {/* Treatment badges */}
                        {flare.treatments.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {flare.treatments.map((t, i) => (
                              <span key={i} className="badge badge-green">{t}</span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Expand chevron */}
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--color-gray-400)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                          flexShrink: 0,
                          marginTop: 4,
                          transition: 'transform 0.2s',
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
                        }}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div style={{
                        borderTop: '1px solid var(--color-gray-200)',
                        padding: 16,
                      }}>
                        {/* Full details grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                          <div>
                            <div style={detailLabelStyle}>Date</div>
                            <div style={detailValueStyle}>{formatDate(flare.date)}</div>
                          </div>
                          <div>
                            <div style={detailLabelStyle}>Time</div>
                            <div style={detailValueStyle}>{flare.time ? formatTime(flare.time) : '-'}</div>
                          </div>
                          <div>
                            <div style={detailLabelStyle}>Pain Level</div>
                            <div style={{ ...detailValueStyle, color: painColor }}>
                              {flare.painLevel}/10
                              {PAIN_LABELS[flare.painLevel] && ` (${PAIN_LABELS[flare.painLevel]})`}
                            </div>
                          </div>
                          <div>
                            <div style={detailLabelStyle}>Duration</div>
                            <div style={detailValueStyle}>{flare.duration || '-'}</div>
                          </div>
                          <div style={{ gridColumn: '1 / -1' }}>
                            <div style={detailLabelStyle}>Affected Joints</div>
                            <div style={detailValueStyle}>{flare.joints.join(', ')}</div>
                          </div>
                          {flare.triggers.length > 0 && (
                            <div style={{ gridColumn: '1 / -1' }}>
                              <div style={detailLabelStyle}>Triggers</div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>
                                {flare.triggers.map((t, i) => (
                                  <span key={i} className="badge badge-orange">{t}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {flare.treatments.length > 0 && (
                            <div style={{ gridColumn: '1 / -1' }}>
                              <div style={detailLabelStyle}>Treatments</div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>
                                {flare.treatments.map((t, i) => (
                                  <span key={i} className="badge badge-green">{t}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {flare.notes && (
                            <div style={{ gridColumn: '1 / -1' }}>
                              <div style={detailLabelStyle}>Notes</div>
                              <div style={{
                                ...detailValueStyle,
                                whiteSpace: 'pre-wrap',
                                background: 'var(--background)',
                                padding: '8px 12px',
                                borderRadius: 6,
                                border: '1px solid var(--color-gray-200)',
                                marginTop: 4,
                              }}>
                                {flare.notes}
                              </div>
                            </div>
                          )}
                          <div>
                            <div style={detailLabelStyle}>Status</div>
                            <div style={{
                              ...detailValueStyle,
                              color: flare.resolved ? '#15803d' : '#b91c1c',
                              fontWeight: 600,
                            }}>
                              {flare.resolved ? 'Resolved' : 'Active'}
                            </div>
                          </div>
                          {flare.resolved && flare.resolvedDate && (
                            <div>
                              <div style={detailLabelStyle}>Resolved On</div>
                              <div style={detailValueStyle}>{formatDate(flare.resolvedDate)}</div>
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        {!isDeleting ? (
                          <div style={{ display: 'flex', gap: 10 }}>
                            <button
                              type="button"
                              className="btn btn-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditForm(flare);
                              }}
                              style={{ flex: 1 }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmId(flare.id);
                              }}
                              style={{
                                flex: 1,
                                color: '#ef4444',
                                borderColor: '#fecaca',
                              }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                              Delete
                            </button>
                          </div>
                        ) : (
                          <div style={{
                            padding: 12,
                            background: 'var(--color-red-bg)',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid #fecaca',
                          }}>
                            <p style={{ fontSize: 13, fontWeight: 500, color: '#b91c1c', marginBottom: 10 }}>
                              Are you sure you want to delete this flare entry? This cannot be undone.
                            </p>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button
                                type="button"
                                className="btn btn-sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirmId(null);
                                }}
                                style={{ flex: 1 }}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(flare.id);
                                }}
                                style={{
                                  flex: 1,
                                  background: '#ef4444',
                                  color: '#fff',
                                  borderColor: '#ef4444',
                                }}
                              >
                                Confirm Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* Analytics Tab                                                   */}
          {/* ------------------------------------------------------------- */}

          {activeTab === 'analytics' && (
            <div style={{ marginBottom: 24 }}>
              {!analytics ? (
                <div style={{
                  textAlign: 'center',
                  padding: '48px 24px',
                  background: 'var(--color-gray-50)',
                  border: '1px solid var(--color-gray-200)',
                  borderRadius: 'var(--radius)',
                }}>
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--color-gray-300)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ marginBottom: 12 }}
                  >
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--foreground)', marginBottom: 8 }}>
                    Not enough data yet
                  </h3>
                  <p style={{ fontSize: 14, color: 'var(--color-gray-500)', lineHeight: 1.5 }}>
                    Log at least 3 flares to see meaningful analytics and patterns.
                    <br />
                    You currently have {flares.length} flare{flares.length === 1 ? '' : 's'} logged.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                  {/* Flares Per Month */}
                  <div className="card">
                    <h3 style={analyticsTitleStyle}>Flares Per Month</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {analytics.flaresPerMonth.map(([month, count]) => {
                        const maxCount = Math.max(...analytics.flaresPerMonth.map(([, c]) => c));
                        const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
                        const [y, m] = month.split('-');
                        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                        const label = `${monthNames[parseInt(m, 10) - 1]} ${y}`;

                        return (
                          <div key={month} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 12, color: 'var(--color-gray-500)', width: 60, textAlign: 'right', flexShrink: 0 }}>
                              {label}
                            </span>
                            <div style={{ flex: 1, height: 20, background: 'var(--color-gray-200)', borderRadius: 4, overflow: 'hidden' }}>
                              <div style={{
                                height: '100%',
                                width: `${pct}%`,
                                background: count >= 3 ? '#ef4444' : count >= 2 ? '#f97316' : 'var(--color-primary)',
                                borderRadius: 4,
                                minWidth: count > 0 ? 20 : 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-end',
                                paddingRight: 6,
                                transition: 'width 0.3s',
                              }}>
                                <span style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>
                                  {count}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Average Pain & Duration */}
                  <div className="grid-2">
                    <div className="card" style={{ textAlign: 'center' }}>
                      <h3 style={analyticsTitleStyle}>Avg Pain Level</h3>
                      <div style={{
                        fontSize: 32,
                        fontWeight: 700,
                        color: getPainColor(Math.round(analytics.avgPain)),
                        lineHeight: 1.2,
                        marginBottom: 4,
                      }}>
                        {analytics.avgPain.toFixed(1)}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--color-gray-400)', marginBottom: 6 }}>
                        out of 10
                      </div>
                      <div style={{
                        fontSize: 12,
                        fontWeight: 500,
                        color: getTrendColor(analytics.painTrend, true),
                      }}>
                        {analytics.painTrend > 0.5 ? 'Trending up' : analytics.painTrend < -0.5 ? 'Trending down' : 'Stable'}
                        {analytics.painTrend > 0.5 && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 4, verticalAlign: 'middle' }}>
                            <line x1="12" y1="19" x2="12" y2="5" />
                            <polyline points="5 12 12 5 19 12" />
                          </svg>
                        )}
                        {analytics.painTrend < -0.5 && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 4, verticalAlign: 'middle' }}>
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <polyline points="19 12 12 19 5 12" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div className="card" style={{ textAlign: 'center' }}>
                      <h3 style={analyticsTitleStyle}>Avg Duration</h3>
                      <div style={{
                        fontSize: 32,
                        fontWeight: 700,
                        color: 'var(--foreground)',
                        lineHeight: 1.2,
                        marginBottom: 4,
                      }}>
                        {analytics.avgDurationHours > 0 ? formatAvgDuration(analytics.avgDurationHours) : '-'}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--color-gray-400)', marginBottom: 6 }}>
                        {analytics.avgDurationHours > 0 ? 'per flare' : 'no data'}
                      </div>
                      {analytics.avgDurationHours > 0 && (
                        <div style={{
                          fontSize: 12,
                          fontWeight: 500,
                          color: getTrendColor(analytics.durationTrend, true),
                        }}>
                          {getTrendArrow(analytics.durationTrend)}
                          {analytics.durationTrend > 0.5 && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 4, verticalAlign: 'middle' }}>
                              <line x1="12" y1="19" x2="12" y2="5" />
                              <polyline points="5 12 12 5 19 12" />
                            </svg>
                          )}
                          {analytics.durationTrend < -0.5 && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 4, verticalAlign: 'middle' }}>
                              <line x1="12" y1="5" x2="12" y2="19" />
                              <polyline points="19 12 12 19 5 12" />
                            </svg>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Most Common Joints */}
                  <div className="card">
                    <h3 style={analyticsTitleStyle}>Most Affected Joints</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {analytics.jointRanking.map(({ joint, count, pct }, idx) => (
                        <div key={joint}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--foreground)' }}>
                              <span style={{
                                display: 'inline-block',
                                width: 20,
                                fontSize: 12,
                                color: 'var(--color-gray-400)',
                              }}>
                                {idx + 1}.
                              </span>
                              {joint}
                            </span>
                            <span style={{ fontSize: 12, color: 'var(--color-gray-500)' }}>
                              {count}x ({pct}%)
                            </span>
                          </div>
                          <div className="progress-bar" style={{ height: 8 }}>
                            <div
                              className="progress-fill"
                              style={{
                                width: `${pct}%`,
                                background: idx === 0 ? '#ef4444' : idx === 1 ? '#f97316' : 'var(--color-primary)',
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Common Triggers */}
                  {analytics.triggerRanking.length > 0 && (
                    <div className="card">
                      <h3 style={analyticsTitleStyle}>Common Triggers</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {analytics.triggerRanking.map(({ trigger, count, pct }, idx) => (
                          <div key={trigger}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--foreground)' }}>
                                <span style={{
                                  display: 'inline-block',
                                  width: 20,
                                  fontSize: 12,
                                  color: 'var(--color-gray-400)',
                                }}>
                                  {idx + 1}.
                                </span>
                                {trigger}
                              </span>
                              <span style={{ fontSize: 12, color: 'var(--color-gray-500)' }}>
                                {count}x ({pct}%)
                              </span>
                            </div>
                            <div className="progress-bar" style={{ height: 8 }}>
                              <div
                                className="progress-fill"
                                style={{
                                  width: `${pct}%`,
                                  background: idx === 0 ? '#f97316' : idx === 1 ? '#eab308' : 'var(--color-gray-400)',
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared inline styles
// ---------------------------------------------------------------------------

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--color-gray-600)',
  marginBottom: 8,
  textTransform: 'uppercase',
  letterSpacing: '0.03em',
};

const inputStyle: React.CSSProperties = {
  padding: '10px 12px',
  border: '1px solid var(--color-gray-200)',
  borderRadius: 8,
  fontSize: 14,
  fontFamily: 'inherit',
  background: 'var(--background)',
  color: 'var(--foreground)',
  outline: 'none',
};

const detailLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--color-gray-400)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  marginBottom: 2,
};

const detailValueStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 500,
  color: 'var(--foreground)',
};

const analyticsTitleStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--color-gray-600)',
  marginBottom: 12,
  textTransform: 'uppercase',
  letterSpacing: '0.03em',
};
