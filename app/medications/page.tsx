'use client';

import { useState, useEffect } from 'react';
import {
  getMedications,
  addMedication,
  updateMedication,
  deleteMedication,
  logMedicationDose,
  getDailyLog,
  getTodayDateString,
  generateId,
  Medication,
  MedicationDose,
} from '@/lib/storage';
import { formatDate, formatTime } from '@/lib/helpers';

// ---------------------------------------------------------------------------
// Common gout medications data
// ---------------------------------------------------------------------------

interface CommonMedInfo {
  name: string;
  category: string;
  defaultDosage: string;
  info: string;
}

const COMMON_MEDICATIONS: CommonMedInfo[] = [
  {
    name: 'Allopurinol',
    category: 'Urate-lowering',
    defaultDosage: '100mg',
    info: 'Urate-lowering therapy. Reduces uric acid production. Take consistently even when feeling well.',
  },
  {
    name: 'Febuxostat',
    category: 'Urate-lowering',
    defaultDosage: '40mg',
    info: 'Urate-lowering therapy. Alternative to allopurinol for reducing uric acid levels.',
  },
  {
    name: 'Colchicine',
    category: 'Flare prevention',
    defaultDosage: '0.6mg',
    info: 'Prevents and treats gout flares. Take at the first sign of a flare. Avoid grapefruit juice.',
  },
  {
    name: 'Naproxen (NSAID)',
    category: 'Pain relief',
    defaultDosage: '500mg',
    info: 'NSAID for pain and inflammation during gout flares. Take with food to protect your stomach.',
  },
  {
    name: 'Indomethacin (NSAID)',
    category: 'Pain relief',
    defaultDosage: '50mg',
    info: 'NSAID commonly used for acute gout flares. Take with food. Avoid if you have kidney issues.',
  },
  {
    name: 'Prednisone',
    category: 'Inflammation',
    defaultDosage: '30mg',
    info: 'Corticosteroid for inflammation. Usually prescribed as a short taper. Do not stop abruptly.',
  },
];

const FREQUENCY_OPTIONS = [
  'Once daily',
  'Twice daily',
  'Three times daily',
  'As needed',
  'Custom',
];

// ---------------------------------------------------------------------------
// Drug interaction warnings
// ---------------------------------------------------------------------------

interface DrugWarning {
  id: string;
  triggerMeds: string[];
  message: string;
}

const DRUG_WARNINGS: DrugWarning[] = [
  {
    id: 'colchicine-alcohol',
    triggerMeds: ['Colchicine'],
    message:
      'Avoid alcohol while taking colchicine. Alcohol can increase side effects and trigger flares.',
  },
  {
    id: 'allopurinol-info',
    triggerMeds: ['Allopurinol'],
    message:
      'Continue taking even during flares. Do not stop suddenly.',
  },
  {
    id: 'nsaid-aspirin',
    triggerMeds: ['Naproxen (NSAID)', 'Indomethacin (NSAID)'],
    message:
      'Avoid combining NSAIDs. Talk to your doctor.',
  },
  {
    id: 'prednisone-alcohol',
    triggerMeds: ['Prednisone'],
    message:
      'Limit alcohol while on prednisone.',
  },
  {
    id: 'nsaid-dual',
    triggerMeds: ['Naproxen (NSAID)', 'Indomethacin (NSAID)'],
    message:
      'You have multiple NSAIDs active. Using more than one NSAID increases risk of stomach and kidney problems.',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDefaultReminderTimes(frequency: string): string[] {
  switch (frequency) {
    case 'Once daily':
      return ['08:00'];
    case 'Twice daily':
      return ['08:00', '20:00'];
    case 'Three times daily':
      return ['08:00', '14:00', '20:00'];
    case 'As needed':
      return [];
    default:
      return ['08:00'];
  }
}

function getNextReminderTime(reminderTimes: string[]): string | null {
  if (reminderTimes.length === 0) return null;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  for (const time of reminderTimes) {
    const [h, m] = time.split(':').map(Number);
    const timeMinutes = (h ?? 0) * 60 + (m ?? 0);
    if (timeMinutes > currentMinutes) {
      return time;
    }
  }

  // All times have passed today; next is tomorrow's first time
  return reminderTimes[0] ?? null;
}

function getCommonMedInfo(name: string): CommonMedInfo | undefined {
  return COMMON_MEDICATIONS.find(
    (m) => m.name.toLowerCase() === name.toLowerCase()
  );
}

/** Return the past 7 date strings ending with today, oldest first. */
function getWeekDates(): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
  }
  return dates;
}

function getDayLabel(dateString: string): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const [year, month, day] = dateString.split('-').map(Number);
  const d = new Date(year!, month! - 1, day);
  return days[d.getDay()] ?? '';
}

// ---------------------------------------------------------------------------
// Dose status for today's view
// ---------------------------------------------------------------------------

interface ScheduledDose {
  medicationId: string;
  medicationName: string;
  scheduledTime: string; // HH:mm
  status: 'taken' | 'missed' | 'upcoming';
  takenTimestamp?: string;
}

function buildTodaySchedule(
  medications: Medication[],
  todayDoses: MedicationDose[]
): ScheduledDose[] {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const schedule: ScheduledDose[] = [];

  for (const med of medications) {
    if (!med.active) continue;
    if (med.frequency === 'As needed') continue;

    for (const time of med.reminderTimes) {
      const [h, m] = time.split(':').map(Number);
      const timeMinutes = (h ?? 0) * 60 + (m ?? 0);

      // Check if a dose was logged for this medication around this time
      const matchingDose = todayDoses.find((d) => {
        if (d.medicationId !== med.id || !d.taken) return false;
        const doseDate = new Date(d.timestamp);
        const doseMinutes = doseDate.getHours() * 60 + doseDate.getMinutes();
        // Match within a 2-hour window centered on the scheduled time
        return Math.abs(doseMinutes - timeMinutes) < 120;
      });

      let status: 'taken' | 'missed' | 'upcoming';
      if (matchingDose) {
        status = 'taken';
      } else if (timeMinutes + 60 < currentMinutes) {
        // More than 1 hour past the scheduled time
        status = 'missed';
      } else {
        status = 'upcoming';
      }

      schedule.push({
        medicationId: med.id,
        medicationName: med.name,
        scheduledTime: time,
        status,
        takenTimestamp: matchingDose?.timestamp,
      });
    }
  }

  // Sort by scheduled time
  schedule.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
  return schedule;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MedicationsPage() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [todayDoses, setTodayDoses] = useState<MedicationDose[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'today' | 'medications' | 'history'>('today');
  const [loaded, setLoaded] = useState(false);

  // Add-form state
  const [formMedSelect, setFormMedSelect] = useState('');
  const [formCustomName, setFormCustomName] = useState('');
  const [formDosage, setFormDosage] = useState('');
  const [formFrequency, setFormFrequency] = useState('Once daily');
  const [formReminderTimes, setFormReminderTimes] = useState<string[]>(['08:00']);
  const [formDrugInfo, setFormDrugInfo] = useState('');

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  function loadData() {
    const meds = getMedications();
    setMedications(meds);
    const today = getTodayDateString();
    const log = getDailyLog(today);
    setTodayDoses(log.medications);
    setLoaded(true);
  }

  // When user selects a common medication, auto-fill fields
  useEffect(() => {
    if (formMedSelect && formMedSelect !== 'custom') {
      const info = getCommonMedInfo(formMedSelect);
      if (info) {
        setFormDosage(info.defaultDosage);
        setFormDrugInfo(info.info);
      }
    } else {
      setFormDosage('');
      setFormDrugInfo('');
    }
  }, [formMedSelect]);

  // Update reminder times when frequency changes
  useEffect(() => {
    setFormReminderTimes(getDefaultReminderTimes(formFrequency));
  }, [formFrequency]);

  // ----- Actions -----

  function handleSaveMedication() {
    const name =
      formMedSelect === 'custom' ? formCustomName.trim() : formMedSelect;
    if (!name) return;
    if (!formDosage.trim()) return;

    const newMed: Medication = {
      id: generateId(),
      name,
      dosage: formDosage.trim(),
      frequency: formFrequency,
      reminderTimes: formReminderTimes,
      active: true,
    };

    addMedication(newMed);
    resetForm();
    setShowAddForm(false);
    loadData();
  }

  function resetForm() {
    setFormMedSelect('');
    setFormCustomName('');
    setFormDosage('');
    setFormFrequency('Once daily');
    setFormReminderTimes(['08:00']);
    setFormDrugInfo('');
  }

  function handleToggleActive(med: Medication) {
    const updated = { ...med, active: !med.active };
    updateMedication(updated);
    loadData();
  }

  function handleTakeNow(med: Medication) {
    const dose: MedicationDose = {
      medicationId: med.id,
      medicationName: med.name,
      timestamp: new Date().toISOString(),
      taken: true,
    };
    logMedicationDose(dose);
    loadData();
  }

  function handleMarkAsTaken(scheduledDose: ScheduledDose) {
    const dose: MedicationDose = {
      medicationId: scheduledDose.medicationId,
      medicationName: scheduledDose.medicationName,
      timestamp: new Date().toISOString(),
      taken: true,
    };
    logMedicationDose(dose);
    loadData();
  }

  function handleDeleteMedication(id: string) {
    deleteMedication(id);
    loadData();
  }

  function handleReminderTimeChange(index: number, value: string) {
    const updated = [...formReminderTimes];
    updated[index] = value;
    setFormReminderTimes(updated);
  }

  function handleAddReminderTime() {
    setFormReminderTimes([...formReminderTimes, '12:00']);
  }

  function handleRemoveReminderTime(index: number) {
    setFormReminderTimes(formReminderTimes.filter((_, i) => i !== index));
  }

  // ----- Derived data -----

  const todaySchedule = buildTodaySchedule(medications, todayDoses);
  const activeWarnings = getActiveWarnings(medications);

  function getActiveWarnings(meds: Medication[]): DrugWarning[] {
    const activeNames = meds
      .filter((m) => m.active)
      .map((m) => m.name);

    return DRUG_WARNINGS.filter((w) => {
      if (w.id === 'nsaid-dual') {
        // Only show if BOTH NSAIDs are active
        const matchCount = w.triggerMeds.filter((t) =>
          activeNames.includes(t)
        ).length;
        return matchCount >= 2;
      }
      return w.triggerMeds.some((t) => activeNames.includes(t));
    });
  }

  // ----- History data -----

  const weekDates = getWeekDates();

  function getWeeklyHistory(): {
    dates: string[];
    medData: {
      medName: string;
      days: { date: string; taken: number; expected: number }[];
    }[];
    totalTaken: number;
    totalExpected: number;
  } {
    const activeMeds = medications.filter((m) => m.active && m.frequency !== 'As needed');
    let totalTaken = 0;
    let totalExpected = 0;

    const medData = activeMeds.map((med) => {
      const expectedPerDay = med.reminderTimes.length;
      const days = weekDates.map((date) => {
        const log = getDailyLog(date);
        const takenCount = log.medications.filter(
          (d) => d.medicationId === med.id && d.taken
        ).length;
        const expected = expectedPerDay;
        totalTaken += takenCount;
        totalExpected += expected;
        return { date, taken: Math.min(takenCount, expected), expected };
      });
      return { medName: med.name, days };
    });

    return { dates: weekDates, medData, totalTaken, totalExpected };
  }

  // ----- Render -----

  if (!loaded) {
    return (
      <div className="page" style={{ paddingTop: 60 }}>
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-gray-400)' }}>
          Loading...
        </div>
      </div>
    );
  }

  // Empty state
  if (medications.length === 0 && !showAddForm) {
    return (
      <div className="page" style={{ paddingTop: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>
          Medication Reminders
        </h1>
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-gray-300)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" />
            <path d="M12 8v8" />
            <path d="M8 12h8" />
          </svg>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: 'var(--foreground)',
            }}
          >
            No medications added
          </h2>
          <p
            style={{
              fontSize: 14,
              color: 'var(--color-gray-500)',
              maxWidth: 280,
              lineHeight: 1.5,
            }}
          >
            Track your gout medications and never miss a dose
          </p>
          <button
            className="btn btn-primary"
            onClick={() => setShowAddForm(true)}
            style={{ marginTop: 8 }}
          >
            Add Medication
          </button>
        </div>
      </div>
    );
  }

  const history = getWeeklyHistory();
  const compliancePercent =
    history.totalExpected > 0
      ? Math.round((history.totalTaken / history.totalExpected) * 100)
      : 100;

  return (
    <div className="page" style={{ paddingTop: 16, paddingBottom: 100 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Medication Reminders</h1>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => {
            resetForm();
            setShowAddForm(true);
          }}
        >
          + Add
        </button>
      </div>

      {/* Tab navigation */}
      <div
        style={{
          display: 'flex',
          gap: 0,
          marginBottom: 20,
          borderBottom: '2px solid var(--color-gray-200)',
        }}
      >
        {(['today', 'medications', 'history'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '10px 0',
              fontSize: 14,
              fontWeight: activeTab === tab ? 600 : 400,
              color:
                activeTab === tab
                  ? 'var(--color-primary)'
                  : 'var(--color-gray-500)',
              background: 'none',
              border: 'none',
              borderBottom:
                activeTab === tab
                  ? '2px solid var(--color-primary)'
                  : '2px solid transparent',
              cursor: 'pointer',
              marginBottom: -2,
              fontFamily: 'inherit',
              textTransform: 'capitalize',
            }}
          >
            {tab === 'today'
              ? "Today's Doses"
              : tab === 'medications'
              ? 'Medications'
              : 'History'}
          </button>
        ))}
      </div>

      {/* Drug Interaction Warnings */}
      {activeWarnings.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {activeWarnings.map((warning) => (
            <div
              key={warning.id}
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
                padding: '12px 14px',
                background: 'var(--color-yellow-bg)',
                border: '1px solid var(--color-yellow)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <span style={{ fontSize: 18, lineHeight: 1.4, flexShrink: 0 }}>
                {'\u26A0\uFE0F'}
              </span>
              <span
                style={{
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: 'var(--foreground)',
                }}
              >
                {warning.message}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ===== TODAY'S DOSES TAB ===== */}
      {activeTab === 'today' && (
        <div>
          {todaySchedule.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 12px' }}>
              <p style={{ marginBottom: 4 }}>No doses scheduled for today.</p>
              <p>Add medications or set reminder times to see your schedule.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {todaySchedule.map((dose, idx) => {
                const statusColor =
                  dose.status === 'taken'
                    ? 'var(--color-green)'
                    : dose.status === 'missed'
                    ? 'var(--color-red)'
                    : 'var(--color-gray-400)';

                const statusBg =
                  dose.status === 'taken'
                    ? 'var(--color-green-bg)'
                    : dose.status === 'missed'
                    ? 'var(--color-red-bg)'
                    : 'var(--color-gray-50)';

                return (
                  <div
                    key={`${dose.medicationId}-${dose.scheduledTime}-${idx}`}
                    className="card"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      borderLeft: `4px solid ${statusColor}`,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 600,
                          color: 'var(--foreground)',
                          marginBottom: 2,
                        }}
                      >
                        {dose.medicationName}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          color: 'var(--color-gray-500)',
                        }}
                      >
                        Scheduled: {formatTime(dose.scheduledTime)}
                        {dose.takenTimestamp && (
                          <span>
                            {' '}
                            &middot; Taken at {formatTime(dose.takenTimestamp)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <span
                        className="badge"
                        style={{
                          background: statusBg,
                          color: statusColor,
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        {dose.status === 'taken'
                          ? 'Taken'
                          : dose.status === 'missed'
                          ? 'Missed'
                          : 'Upcoming'}
                      </span>
                      {dose.status !== 'taken' && (
                        <button
                          className="btn btn-sm"
                          style={{
                            background: 'var(--color-green)',
                            color: '#fff',
                            borderColor: 'var(--color-green)',
                            fontSize: 12,
                            padding: '5px 10px',
                          }}
                          onClick={() => handleMarkAsTaken(dose)}
                        >
                          Mark as Taken
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* As-needed medications */}
          {medications.filter((m) => m.active && m.frequency === 'As needed').length > 0 && (
            <div style={{ marginTop: 24 }}>
              <h3
                className="section-title"
                style={{ fontSize: 13, marginBottom: 10 }}
              >
                As Needed
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {medications
                  .filter((m) => m.active && m.frequency === 'As needed')
                  .map((med) => (
                    <div
                      key={med.id}
                      className="card"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>
                          {med.name}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--color-gray-500)' }}>
                          {med.dosage}
                        </div>
                      </div>
                      <button
                        className="btn btn-sm btn-primary"
                        style={{ fontSize: 12, padding: '5px 12px' }}
                        onClick={() => handleTakeNow(med)}
                      >
                        Take Now
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== MEDICATIONS TAB ===== */}
      {activeTab === 'medications' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {medications.map((med) => {
            const commonInfo = getCommonMedInfo(med.name);
            const nextReminder = getNextReminderTime(med.reminderTimes);

            return (
              <div
                key={med.id}
                className="card"
                style={{
                  opacity: med.active ? 1 : 0.6,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: 'var(--foreground)',
                        marginBottom: 2,
                      }}
                    >
                      {med.name}
                    </div>
                    {commonInfo && (
                      <span
                        className="badge"
                        style={{
                          background: 'var(--color-primary-light)',
                          color: 'var(--color-primary)',
                          fontSize: 10,
                          marginBottom: 4,
                        }}
                      >
                        {commonInfo.category}
                      </span>
                    )}
                  </div>

                  {/* Active toggle */}
                  <button
                    onClick={() => handleToggleActive(med)}
                    aria-label={med.active ? 'Deactivate medication' : 'Activate medication'}
                    style={{
                      width: 44,
                      height: 24,
                      borderRadius: 12,
                      border: 'none',
                      background: med.active
                        ? 'var(--color-green)'
                        : 'var(--color-gray-300)',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        top: 2,
                        left: med.active ? 22 : 2,
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: '#fff',
                        transition: 'left 0.2s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      }}
                    />
                  </button>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    fontSize: 13,
                    color: 'var(--color-gray-600)',
                    marginBottom: 12,
                  }}
                >
                  <div>
                    <strong>Dosage:</strong> {med.dosage}
                  </div>
                  <div>
                    <strong>Frequency:</strong> {med.frequency}
                  </div>
                  {nextReminder && med.active && (
                    <div>
                      <strong>Next reminder:</strong> {formatTime(nextReminder)}
                    </div>
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                  }}
                >
                  {med.active && (
                    <button
                      className="btn btn-sm btn-primary"
                      style={{ fontSize: 12, padding: '5px 14px' }}
                      onClick={() => handleTakeNow(med)}
                    >
                      Take Now
                    </button>
                  )}
                  <button
                    className="btn btn-sm"
                    style={{
                      fontSize: 12,
                      padding: '5px 14px',
                      color: 'var(--color-red)',
                      borderColor: 'var(--color-red)',
                    }}
                    onClick={() => handleDeleteMedication(med.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===== HISTORY TAB ===== */}
      {activeTab === 'history' && (
        <div>
          {/* Compliance percentage */}
          <div
            className="card"
            style={{ textAlign: 'center', marginBottom: 20 }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--color-gray-500)',
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
                marginBottom: 6,
              }}
            >
              Weekly Compliance
            </div>
            <div
              style={{
                fontSize: 36,
                fontWeight: 700,
                color:
                  compliancePercent >= 80
                    ? 'var(--color-green)'
                    : compliancePercent >= 50
                    ? 'var(--color-yellow)'
                    : 'var(--color-red)',
                lineHeight: 1.2,
              }}
            >
              {compliancePercent}%
            </div>
            <div
              style={{
                fontSize: 12,
                color: 'var(--color-gray-400)',
                marginTop: 4,
              }}
            >
              {history.totalTaken} of {history.totalExpected} doses taken
            </div>
            <div
              className="progress-bar"
              style={{ marginTop: 12, height: 8 }}
            >
              <div
                className="progress-fill"
                style={{
                  width: `${compliancePercent}%`,
                  background:
                    compliancePercent >= 80
                      ? 'var(--color-green)'
                      : compliancePercent >= 50
                      ? 'var(--color-yellow)'
                      : 'var(--color-red)',
                }}
              />
            </div>
          </div>

          {/* Weekly grid */}
          {history.medData.length === 0 ? (
            <div className="empty-state">
              <p>No scheduled medications to track.</p>
              <p style={{ fontSize: 13, marginTop: 4 }}>
                Add medications with reminder times to see your history.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {history.medData.map((medRow) => (
                <div key={medRow.medName}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: 'var(--foreground)',
                      marginBottom: 8,
                    }}
                  >
                    {medRow.medName}
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(7, 1fr)',
                      gap: 6,
                    }}
                  >
                    {medRow.days.map((day) => {
                      const isToday = day.date === getTodayDateString();
                      let cellColor: string;
                      let cellBg: string;

                      if (day.taken >= day.expected && day.expected > 0) {
                        cellColor = 'var(--color-green)';
                        cellBg = 'var(--color-green-bg)';
                      } else if (day.taken > 0) {
                        cellColor = 'var(--color-yellow)';
                        cellBg = 'var(--color-yellow-bg)';
                      } else if (day.date < getTodayDateString()) {
                        cellColor = 'var(--color-red)';
                        cellBg = 'var(--color-red-bg)';
                      } else {
                        cellColor = 'var(--color-gray-400)';
                        cellBg = 'var(--color-gray-50)';
                      }

                      return (
                        <div
                          key={day.date}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: isToday ? 700 : 400,
                              color: isToday
                                ? 'var(--color-primary)'
                                : 'var(--color-gray-500)',
                            }}
                          >
                            {getDayLabel(day.date)}
                          </span>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: cellBg,
                              border: isToday
                                ? '2px solid var(--color-primary)'
                                : `1px solid ${cellColor}`,
                              fontSize: 11,
                              fontWeight: 600,
                              color: cellColor,
                            }}
                          >
                            {day.taken}/{day.expected}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== ADD MEDICATION MODAL ===== */}
      {showAddForm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddForm(false);
            }
          }}
        >
          <div
            style={{
              background: 'var(--background)',
              borderRadius: '16px 16px 0 0',
              width: '100%',
              maxWidth: 480,
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: '20px 20px 32px',
            }}
          >
            {/* Modal header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 20,
              }}
            >
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>Add Medication</h2>
              <button
                onClick={() => setShowAddForm(false)}
                aria-label="Close"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 4,
                  color: 'var(--color-gray-500)',
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Form fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Medication name */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--color-gray-600)',
                    marginBottom: 6,
                  }}
                >
                  Medication
                </label>
                <select
                  value={formMedSelect}
                  onChange={(e) => {
                    setFormMedSelect(e.target.value);
                    if (e.target.value !== 'custom') {
                      setFormCustomName('');
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-gray-200)',
                    fontSize: 14,
                    fontFamily: 'inherit',
                    background: 'var(--background)',
                    color: 'var(--foreground)',
                    appearance: 'auto',
                  }}
                >
                  <option value="">Select a medication...</option>
                  {COMMON_MEDICATIONS.map((m) => (
                    <option key={m.name} value={m.name}>
                      {m.name} ({m.category})
                    </option>
                  ))}
                  <option value="custom">Custom medication</option>
                </select>
              </div>

              {/* Custom name input */}
              {formMedSelect === 'custom' && (
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--color-gray-600)',
                      marginBottom: 6,
                    }}
                  >
                    Medication Name
                  </label>
                  <input
                    type="text"
                    value={formCustomName}
                    onChange={(e) => setFormCustomName(e.target.value)}
                    placeholder="Enter medication name"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-gray-200)',
                      fontSize: 14,
                      fontFamily: 'inherit',
                      background: 'var(--background)',
                      color: 'var(--foreground)',
                    }}
                  />
                </div>
              )}

              {/* Dosage */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--color-gray-600)',
                    marginBottom: 6,
                  }}
                >
                  Dosage
                </label>
                <input
                  type="text"
                  value={formDosage}
                  onChange={(e) => setFormDosage(e.target.value)}
                  placeholder='e.g., "100mg", "0.6mg"'
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-gray-200)',
                    fontSize: 14,
                    fontFamily: 'inherit',
                    background: 'var(--background)',
                    color: 'var(--foreground)',
                  }}
                />
              </div>

              {/* Frequency */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--color-gray-600)',
                    marginBottom: 6,
                  }}
                >
                  Frequency
                </label>
                <select
                  value={formFrequency}
                  onChange={(e) => setFormFrequency(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-gray-200)',
                    fontSize: 14,
                    fontFamily: 'inherit',
                    background: 'var(--background)',
                    color: 'var(--foreground)',
                    appearance: 'auto',
                  }}
                >
                  {FREQUENCY_OPTIONS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reminder times */}
              {formFrequency !== 'As needed' && (
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--color-gray-600)',
                      marginBottom: 6,
                    }}
                  >
                    Reminder Times
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    {formReminderTimes.map((time, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          gap: 8,
                          alignItems: 'center',
                        }}
                      >
                        <input
                          type="time"
                          value={time}
                          onChange={(e) =>
                            handleReminderTimeChange(i, e.target.value)
                          }
                          style={{
                            flex: 1,
                            padding: '10px 12px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--color-gray-200)',
                            fontSize: 14,
                            fontFamily: 'inherit',
                            background: 'var(--background)',
                            color: 'var(--foreground)',
                          }}
                        />
                        {formReminderTimes.length > 1 && (
                          <button
                            onClick={() => handleRemoveReminderTime(i)}
                            aria-label="Remove time"
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              border: '1px solid var(--color-gray-200)',
                              background: 'var(--color-gray-50)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--color-gray-500)',
                              flexShrink: 0,
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
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                    {formFrequency === 'Custom' && (
                      <button
                        className="btn btn-sm"
                        onClick={handleAddReminderTime}
                        style={{ alignSelf: 'flex-start', fontSize: 12 }}
                      >
                        + Add Time
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Drug info */}
              {formDrugInfo && (
                <div
                  style={{
                    padding: '10px 14px',
                    background: 'var(--color-blue-light)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 13,
                    color: 'var(--foreground)',
                    lineHeight: 1.5,
                    display: 'flex',
                    gap: 8,
                    alignItems: 'flex-start',
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--color-blue)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ flexShrink: 0, marginTop: 2 }}
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  <span>{formDrugInfo}</span>
                </div>
              )}

              {/* Save button */}
              <button
                className="btn btn-primary"
                onClick={handleSaveMedication}
                disabled={
                  (!formMedSelect || (formMedSelect === 'custom' && !formCustomName.trim())) ||
                  !formDosage.trim()
                }
                style={{
                  width: '100%',
                  marginTop: 4,
                  padding: '12px 18px',
                  fontSize: 15,
                  fontWeight: 600,
                  opacity:
                    (!formMedSelect || (formMedSelect === 'custom' && !formCustomName.trim())) ||
                    !formDosage.trim()
                      ? 0.5
                      : 1,
                }}
              >
                Save Medication
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
