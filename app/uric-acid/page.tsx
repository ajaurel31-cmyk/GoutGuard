'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import Header from '@/components/Header';
import Modal from '@/components/Modal';
import { useToast } from '@/components/Toast';
import {
  getUricAcidReadings,
  addUricAcidReading,
  deleteUricAcidReading,
  generateId,
  getTodayDateString,
  UricAcidReading,
} from '@/lib/storage';
import {
  formatDate,
  formatDateShort,
  getUricAcidColor,
  getUricAcidStatus,
} from '@/lib/helpers';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TimePeriod = '1M' | '3M' | '6M' | '1Y' | 'ALL';

interface ChartDataPoint {
  date: string;
  dateLabel: string;
  value: number;
  color: string;
  status: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getStatusLabel(value: number): string {
  if (value < 6.0) return 'On Target';
  if (value < 7.0) return 'Borderline';
  if (value < 9.0) return 'Elevated';
  return 'High';
}

function getCutoffDate(period: TimePeriod): Date | null {
  if (period === 'ALL') return null;
  const now = new Date();
  switch (period) {
    case '1M':
      now.setMonth(now.getMonth() - 1);
      break;
    case '3M':
      now.setMonth(now.getMonth() - 3);
      break;
    case '6M':
      now.setMonth(now.getMonth() - 6);
      break;
    case '1Y':
      now.setFullYear(now.getFullYear() - 1);
      break;
  }
  return now;
}

function computeTrend(readings: UricAcidReading[]): string {
  if (readings.length < 3) return 'stable';
  // Use the most recent readings (sorted newest-first in storage)
  const recent = readings.slice(0, Math.min(readings.length, 5));
  // recent[0] is newest. Compare average of first half vs second half.
  const mid = Math.ceil(recent.length / 2);
  const newerAvg =
    recent.slice(0, mid).reduce((s, r) => s + r.value, 0) / mid;
  const olderAvg =
    recent.slice(mid).reduce((s, r) => s + r.value, 0) /
    (recent.length - mid);
  const diff = newerAvg - olderAvg;
  if (diff < -0.3) return 'improving';
  if (diff > 0.3) return 'worsening';
  return 'stable';
}

// ---------------------------------------------------------------------------
// Custom Recharts Tooltip
// ---------------------------------------------------------------------------

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload as ChartDataPoint;
  return (
    <div style={tooltipStyles.container}>
      <p style={tooltipStyles.date}>{formatDate(data.date)}</p>
      <p style={{ ...tooltipStyles.value, color: data.color }}>
        {data.value.toFixed(1)} mg/dL
      </p>
      <p style={tooltipStyles.status}>{data.status}</p>
    </div>
  );
}

const tooltipStyles = {
  container: {
    background: 'var(--background, #fff)',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '10px 14px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
    fontSize: '13px',
  } as React.CSSProperties,
  date: {
    margin: 0,
    fontWeight: 600,
    color: 'var(--foreground, #171717)',
  } as React.CSSProperties,
  value: {
    margin: '4px 0 0',
    fontWeight: 700,
    fontSize: '15px',
  } as React.CSSProperties,
  status: {
    margin: '2px 0 0',
    color: '#64748b',
    fontSize: '12px',
  } as React.CSSProperties,
};

// ---------------------------------------------------------------------------
// Custom Dot for recharts Line (color-coded)
// ---------------------------------------------------------------------------

function CustomDot(props: any) {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null) return null;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill={payload.color}
      stroke="#fff"
      strokeWidth={2}
    />
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function UricAcidPage() {
  const { showToast } = useToast();

  // State
  const [readings, setReadings] = useState<UricAcidReading[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('6M');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form state
  const [formDate, setFormDate] = useState(getTodayDateString());
  const [formValue, setFormValue] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Load readings on mount
  useEffect(() => {
    setReadings(getUricAcidReadings());
  }, []);

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------

  const latestReading = readings.length > 0 ? readings[0] : null;

  const filteredReadings = useMemo(() => {
    const cutoff = getCutoffDate(timePeriod);
    if (!cutoff) return readings;
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    return readings.filter((r) => r.date >= cutoffStr);
  }, [readings, timePeriod]);

  const chartData: ChartDataPoint[] = useMemo(() => {
    // Readings are sorted newest-first; reverse for chronological chart
    return [...filteredReadings].reverse().map((r) => ({
      date: r.date,
      dateLabel: formatDateShort(r.date),
      value: r.value,
      color: getUricAcidColor(r.value),
      status: getStatusLabel(r.value),
    }));
  }, [filteredReadings]);

  const stats = useMemo(() => {
    if (readings.length === 0) return null;
    const values = readings.map((r) => r.value);
    const avg = values.reduce((s, v) => s + v, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const onTarget = values.filter((v) => v < 6.0).length;
    const pct = Math.round((onTarget / values.length) * 100);
    const trend = computeTrend(readings);
    return { avg, min, max, count: readings.length, onTargetPct: pct, trend };
  }, [readings]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const resetForm = useCallback(() => {
    setFormDate(getTodayDateString());
    setFormValue('');
    setFormNotes('');
    setFormError('');
  }, []);

  const handleOpenAdd = useCallback(() => {
    resetForm();
    setShowAddModal(true);
  }, [resetForm]);

  const handleSave = useCallback(() => {
    const numericValue = parseFloat(formValue);
    if (isNaN(numericValue) || numericValue < 0 || numericValue > 20) {
      setFormError('Value must be a number between 0 and 20.');
      return;
    }
    if (!formDate) {
      setFormError('Please select a date.');
      return;
    }
    const reading: UricAcidReading = {
      id: generateId(),
      date: formDate,
      value: numericValue,
      notes: formNotes.trim(),
    };
    addUricAcidReading(reading);
    setReadings(getUricAcidReadings());
    setShowAddModal(false);
    resetForm();
    showToast('Reading saved successfully', 'success');
  }, [formDate, formValue, formNotes, resetForm, showToast]);

  const handleDelete = useCallback(
    (id: string) => {
      deleteUricAcidReading(id);
      setReadings(getUricAcidReadings());
      setDeleteConfirmId(null);
      showToast('Reading deleted', 'info');
    },
    [showToast],
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const timePeriods: { key: TimePeriod; label: string }[] = [
    { key: '1M', label: '1 Month' },
    { key: '3M', label: '3 Months' },
    { key: '6M', label: '6 Months' },
    { key: '1Y', label: '1 Year' },
    { key: 'ALL', label: 'All' },
  ];

  return (
    <div style={styles.page}>
      <Header
        title="Uric Acid Tracker"
        rightAction={
          <button
            onClick={handleOpenAdd}
            style={styles.addButton}
            aria-label="Add reading"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        }
      />

      <div style={styles.content}>
        {/* ----------------------------------------------------------------- */}
        {/* Hero: Current Level Display                                        */}
        {/* ----------------------------------------------------------------- */}
        <section style={styles.heroSection}>
          {latestReading ? (
            <>
              <div
                style={{
                  ...styles.heroCircle,
                  borderColor: getUricAcidColor(latestReading.value),
                  boxShadow: `0 0 20px ${getUricAcidColor(latestReading.value)}33`,
                }}
              >
                <span style={styles.heroValue}>
                  {latestReading.value.toFixed(1)}
                </span>
                <span style={styles.heroUnit}>mg/dL</span>
              </div>
              <p
                style={{
                  ...styles.heroStatus,
                  color: getUricAcidColor(latestReading.value),
                }}
              >
                {getStatusLabel(latestReading.value)}
              </p>
              <p style={styles.heroDate}>
                Last reading: {formatDate(latestReading.date)}
              </p>
              <p style={styles.heroTarget}>Goal: Below 6.0 mg/dL</p>
            </>
          ) : (
            <div style={styles.emptyHero}>
              <div style={styles.emptyCircle}>
                <span style={styles.emptyDash}>--</span>
                <span style={styles.heroUnit}>mg/dL</span>
              </div>
              <p style={styles.emptyText}>No readings yet</p>
              <button onClick={handleOpenAdd} style={styles.emptyAddButton}>
                Add your first reading
              </button>
            </div>
          )}
        </section>

        {/* ----------------------------------------------------------------- */}
        {/* Trend Chart                                                        */}
        {/* ----------------------------------------------------------------- */}
        {readings.length > 0 && (
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Trend</h2>

            {/* Time period selector */}
            <div style={styles.periodSelector}>
              {timePeriods.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setTimePeriod(p.key)}
                  style={{
                    ...styles.periodButton,
                    ...(timePeriod === p.key
                      ? styles.periodButtonActive
                      : {}),
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {chartData.length > 0 ? (
              <div style={styles.chartWrapper}>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f040" />
                    <XAxis
                      dataKey="dateLabel"
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      tickLine={false}
                      axisLine={{ stroke: '#e2e8f0' }}
                    />
                    <YAxis
                      domain={['auto', 'auto']}
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      tickLine={false}
                      axisLine={{ stroke: '#e2e8f0' }}
                      unit=" "
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine
                      y={6.0}
                      stroke="#22c55e"
                      strokeDasharray="6 3"
                      label={{
                        value: 'Target 6.0',
                        position: 'insideTopRight',
                        fill: '#22c55e',
                        fontSize: 11,
                      }}
                    />
                    <ReferenceLine
                      y={7.0}
                      stroke="#f97316"
                      strokeDasharray="6 3"
                      label={{
                        value: 'Upper 7.0',
                        position: 'insideTopRight',
                        fill: '#f97316',
                        fontSize: 11,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#6366f1"
                      strokeWidth={2}
                      dot={<CustomDot />}
                      activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p style={styles.noDataText}>
                No readings in this time period.
              </p>
            )}
          </section>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* Statistics                                                          */}
        {/* ----------------------------------------------------------------- */}
        {stats && (
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Statistics</h2>
            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <span style={styles.statLabel}>Average</span>
                <span style={styles.statValue}>
                  {stats.avg.toFixed(1)}
                  <span style={styles.statUnit}> mg/dL</span>
                </span>
              </div>
              <div style={styles.statCard}>
                <span style={styles.statLabel}>Lowest</span>
                <span style={styles.statValue}>
                  {stats.min.toFixed(1)}
                  <span style={styles.statUnit}> mg/dL</span>
                </span>
              </div>
              <div style={styles.statCard}>
                <span style={styles.statLabel}>Highest</span>
                <span style={styles.statValue}>
                  {stats.max.toFixed(1)}
                  <span style={styles.statUnit}> mg/dL</span>
                </span>
              </div>
              <div style={styles.statCard}>
                <span style={styles.statLabel}>Readings</span>
                <span style={styles.statValue}>{stats.count}</span>
              </div>
              <div style={styles.statCard}>
                <span style={styles.statLabel}>On Target</span>
                <span style={styles.statValue}>{stats.onTargetPct}%</span>
              </div>
              <div style={styles.statCard}>
                <span style={styles.statLabel}>Trend</span>
                <span
                  style={{
                    ...styles.statValue,
                    color:
                      stats.trend === 'improving'
                        ? '#22c55e'
                        : stats.trend === 'worsening'
                          ? '#ef4444'
                          : '#94a3b8',
                  }}
                >
                  {stats.trend === 'improving'
                    ? 'Improving'
                    : stats.trend === 'worsening'
                      ? 'Worsening'
                      : 'Stable'}
                </span>
              </div>
            </div>
          </section>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* Reading History                                                     */}
        {/* ----------------------------------------------------------------- */}
        {readings.length > 0 && (
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>History</h2>
            <div style={styles.historyList}>
              {readings.map((r) => (
                <div key={r.id} style={styles.historyItem}>
                  <div style={styles.historyLeft}>
                    <span
                      style={{
                        ...styles.historyDot,
                        backgroundColor: getUricAcidColor(r.value),
                      }}
                    />
                    <div>
                      <p style={styles.historyValue}>
                        {r.value.toFixed(1)} mg/dL
                      </p>
                      <p style={styles.historyDate}>{formatDate(r.date)}</p>
                      {r.notes && (
                        <p style={styles.historyNotes}>{r.notes}</p>
                      )}
                    </div>
                  </div>
                  <div style={styles.historyRight}>
                    {deleteConfirmId === r.id ? (
                      <div style={styles.deleteConfirm}>
                        <span style={styles.deleteConfirmText}>Delete?</span>
                        <button
                          onClick={() => handleDelete(r.id)}
                          style={styles.deleteYes}
                          aria-label="Confirm delete"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          style={styles.deleteNo}
                          aria-label="Cancel delete"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(r.id)}
                        style={styles.deleteButton}
                        aria-label="Delete reading"
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
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* Add Reading Modal                                                    */}
      {/* ------------------------------------------------------------------- */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Reading"
      >
        <div style={styles.form}>
          <label style={styles.fieldLabel}>
            Date
            <input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              max={getTodayDateString()}
              style={styles.input}
            />
          </label>

          <label style={styles.fieldLabel}>
            Uric Acid Level (mg/dL)
            <input
              type="number"
              step="0.1"
              min="0"
              max="20"
              placeholder="e.g. 5.8"
              value={formValue}
              onChange={(e) => {
                setFormValue(e.target.value);
                setFormError('');
              }}
              style={styles.input}
            />
          </label>

          <label style={styles.fieldLabel}>
            Notes (optional)
            <textarea
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Any notes about this reading..."
              rows={3}
              style={styles.textarea}
            />
          </label>

          {formError && <p style={styles.formError}>{formError}</p>}

          <button onClick={handleSave} style={styles.saveButton}>
            Save Reading
          </button>
        </div>
      </Modal>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline styles
// ---------------------------------------------------------------------------

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    paddingBottom: '100px',
  },
  content: {
    padding: '0 16px 24px',
    maxWidth: '600px',
    margin: '0 auto',
  },

  // Add button
  addButton: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: 'none',
    background: '#1a56db',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  },

  // Hero
  heroSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '28px 0 20px',
  },
  heroCircle: {
    width: '140px',
    height: '140px',
    borderRadius: '50%',
    border: '4px solid',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '12px',
  },
  heroValue: {
    fontSize: '36px',
    fontWeight: 700,
    color: 'var(--foreground, #171717)',
    lineHeight: 1.1,
  },
  heroUnit: {
    fontSize: '13px',
    color: '#94a3b8',
    marginTop: '2px',
  },
  heroStatus: {
    fontSize: '18px',
    fontWeight: 600,
    margin: '4px 0 2px',
  },
  heroDate: {
    fontSize: '13px',
    color: '#64748b',
    margin: '2px 0',
  },
  heroTarget: {
    fontSize: '12px',
    color: '#94a3b8',
    marginTop: '4px',
  },

  // Empty state
  emptyHero: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  emptyCircle: {
    width: '140px',
    height: '140px',
    borderRadius: '50%',
    border: '4px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '8px',
  },
  emptyDash: {
    fontSize: '36px',
    fontWeight: 700,
    color: '#cbd5e1',
    lineHeight: 1.1,
  },
  emptyText: {
    fontSize: '16px',
    color: '#94a3b8',
    fontWeight: 500,
  },
  emptyAddButton: {
    marginTop: '8px',
    padding: '10px 24px',
    borderRadius: '10px',
    border: 'none',
    background: '#1a56db',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },

  // Section
  section: {
    marginTop: '24px',
  },
  sectionTitle: {
    fontSize: '17px',
    fontWeight: 700,
    color: 'var(--foreground, #171717)',
    marginBottom: '12px',
  },

  // Time period selector
  periodSelector: {
    display: 'flex',
    gap: '6px',
    marginBottom: '14px',
    overflowX: 'auto',
  },
  periodButton: {
    padding: '6px 12px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    background: 'transparent',
    color: '#64748b',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  periodButtonActive: {
    background: '#1a56db',
    color: '#fff',
    borderColor: '#1a56db',
  },

  // Chart
  chartWrapper: {
    width: '100%',
    height: '260px',
  },
  noDataText: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: '14px',
    padding: '40px 0',
  },

  // Stats
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
  },
  statCard: {
    background: 'var(--background, #fff)',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '14px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  statLabel: {
    fontSize: '11px',
    color: '#94a3b8',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  statValue: {
    fontSize: '18px',
    fontWeight: 700,
    color: 'var(--foreground, #171717)',
  },
  statUnit: {
    fontSize: '12px',
    fontWeight: 400,
    color: '#94a3b8',
  },

  // History
  historyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  historyItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 12px',
    borderRadius: '10px',
    background: 'var(--background, #fff)',
    border: '1px solid #e2e8f0',
    marginBottom: '8px',
  },
  historyLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1,
    minWidth: 0,
  },
  historyDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  historyValue: {
    fontSize: '15px',
    fontWeight: 600,
    color: 'var(--foreground, #171717)',
    margin: 0,
  },
  historyDate: {
    fontSize: '12px',
    color: '#64748b',
    margin: '2px 0 0',
  },
  historyNotes: {
    fontSize: '12px',
    color: '#94a3b8',
    margin: '2px 0 0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '220px',
  },
  historyRight: {
    flexShrink: 0,
    marginLeft: '8px',
  },
  deleteButton: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteConfirm: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  deleteConfirmText: {
    fontSize: '12px',
    color: '#ef4444',
    fontWeight: 500,
  },
  deleteYes: {
    padding: '4px 10px',
    borderRadius: '6px',
    border: 'none',
    background: '#ef4444',
    color: '#fff',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  deleteNo: {
    padding: '4px 10px',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
    background: 'transparent',
    color: '#64748b',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
  },

  // Form
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  fieldLabel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--foreground, #171717)',
  },
  input: {
    padding: '10px 12px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    fontSize: '15px',
    fontWeight: 400,
    color: 'var(--foreground, #171717)',
    background: 'var(--background, #fff)',
    outline: 'none',
    width: '100%',
  },
  textarea: {
    padding: '10px 12px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    fontSize: '15px',
    fontWeight: 400,
    color: 'var(--foreground, #171717)',
    background: 'var(--background, #fff)',
    outline: 'none',
    resize: 'vertical' as const,
    fontFamily: 'inherit',
    width: '100%',
  },
  formError: {
    fontSize: '13px',
    color: '#ef4444',
    fontWeight: 500,
    margin: 0,
  },
  saveButton: {
    padding: '12px',
    borderRadius: '10px',
    border: 'none',
    background: '#1a56db',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '4px',
  },
};
