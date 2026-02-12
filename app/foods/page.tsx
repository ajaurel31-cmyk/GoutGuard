'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  purineDatabase,
  searchFoods,
  getPurineLevelColor,
  getPurineLevelLabel,
  ALL_CATEGORIES,
  type FoodItem,
  type PurineLevel,
  type FoodCategory,
} from '@/lib/purineDatabase';
import {
  addFoodToLog,
  getDailyLog,
  getTodayDateString,
  generateId,
} from '@/lib/storage';
import { formatPurines } from '@/lib/helpers';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ITEMS_PER_PAGE = 50;
const DAILY_PURINE_TARGET = 400;

const PURINE_LEVELS: { key: string; label: string; color: string }[] = [
  { key: 'all', label: 'All', color: '#94a3b8' },
  { key: 'low', label: 'Low (<100mg)', color: '#22c55e' },
  { key: 'moderate', label: 'Moderate (100-200mg)', color: '#eab308' },
  { key: 'high', label: 'High (200-300mg)', color: '#f97316' },
  { key: 'very-high', label: 'Very High (>300mg)', color: '#ef4444' },
];

const SERVING_MULTIPLIERS = [0.5, 1, 1.5, 2];

// ---------------------------------------------------------------------------
// SVG Icons
// ---------------------------------------------------------------------------

function SearchIcon() {
  return (
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
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg
      width="16"
      height="16"
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
  );
}

function ChevronDownIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function ChevronUpIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="16"
      height="16"
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
  );
}

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Helper: badge class for purine level
// ---------------------------------------------------------------------------

function getPurineBadgeClass(level: PurineLevel): string {
  switch (level) {
    case 'low':
      return 'badge badge-purine-low';
    case 'moderate':
      return 'badge badge-purine-moderate';
    case 'high':
      return 'badge badge-purine-high';
    case 'very-high':
      return 'badge badge-purine-very-high';
    default:
      return 'badge';
  }
}

// ---------------------------------------------------------------------------
// Main Foods Page Component
// ---------------------------------------------------------------------------

export default function FoodsPage() {
  // ── State ──────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [todayTotal, setTodayTotal] = useState(0);
  const [servingMultiplier, setServingMultiplier] = useState(1);
  const [showAddConfirm, setShowAddConfirm] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load today's total on mount ────────────────────────────────────────
  useEffect(() => {
    const today = getTodayDateString();
    const log = getDailyLog(today);
    setTodayTotal(log.totalPurines);
  }, []);

  // ── Debounced search (300ms) ───────────────────────────────────────────
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      setDebouncedQuery(value);
      setPage(1);
    }, 300);
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      if (successTimer.current) clearTimeout(successTimer.current);
    };
  }, []);

  // ── Filtered & paginated results via useMemo ───────────────────────────
  const filteredFoods = useMemo(() => {
    // Step 1: Apply text search
    let results = debouncedQuery.trim()
      ? searchFoods(debouncedQuery)
      : [...purineDatabase];

    // Step 2: Apply purine level filter
    if (selectedLevel !== 'all') {
      results = results.filter((food) => food.purineLevel === selectedLevel);
    }

    // Step 3: Apply category filter
    if (selectedCategory !== 'all') {
      results = results.filter((food) => food.category === selectedCategory);
    }

    return results;
  }, [debouncedQuery, selectedLevel, selectedCategory]);

  const totalFilteredCount = filteredFoods.length;
  const totalDatabaseCount = purineDatabase.length;

  const paginatedFoods = useMemo(() => {
    return filteredFoods.slice(0, page * ITEMS_PER_PAGE);
  }, [filteredFoods, page]);

  const hasMore = paginatedFoods.length < filteredFoods.length;

  // ── Level counts (independent of level filter, so user sees counts) ────
  const levelCounts = useMemo(() => {
    let base = debouncedQuery.trim()
      ? searchFoods(debouncedQuery)
      : [...purineDatabase];

    if (selectedCategory !== 'all') {
      base = base.filter((food) => food.category === selectedCategory);
    }

    const counts: Record<string, number> = { all: base.length };
    for (const food of base) {
      counts[food.purineLevel] = (counts[food.purineLevel] || 0) + 1;
    }
    return counts;
  }, [debouncedQuery, selectedCategory]);

  // ── Handlers ───────────────────────────────────────────────────────────
  function handleLevelSelect(level: string) {
    setSelectedLevel(level);
    setPage(1);
    setExpandedId(null);
    setShowAddConfirm(null);
  }

  function handleCategorySelect(category: string) {
    setSelectedCategory(category);
    setPage(1);
    setExpandedId(null);
    setShowAddConfirm(null);
  }

  function handleToggleExpand(foodId: number) {
    if (expandedId === foodId) {
      setExpandedId(null);
    } else {
      setExpandedId(foodId);
    }
    setShowAddConfirm(null);
    setServingMultiplier(1);
  }

  function handleStartAdd(foodId: number) {
    setShowAddConfirm(foodId);
    setServingMultiplier(1);
  }

  function handleCancelAdd() {
    setShowAddConfirm(null);
    setServingMultiplier(1);
  }

  function handleConfirmAdd(food: FoodItem) {
    const calculatedPurines = Math.round(food.purineContent * servingMultiplier);
    const today = getTodayDateString();

    addFoodToLog(today, {
      id: generateId(),
      foodName: food.name,
      purineContent: calculatedPurines,
      purineLevel: food.purineLevel,
      servingSize: `${servingMultiplier}x ${food.servingSize}`,
      timestamp: new Date().toISOString(),
      source: 'database',
    });

    // Refresh today's total from storage
    const updatedLog = getDailyLog(today);
    setTodayTotal(updatedLog.totalPurines);

    setShowAddConfirm(null);
    setServingMultiplier(1);

    // Show success message
    setSuccessMessage(
      `Added ${food.name} (${formatPurines(calculatedPurines)}) to today's log`,
    );
    if (successTimer.current) clearTimeout(successTimer.current);
    successTimer.current = setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
  }

  function clearSearch() {
    setSearchQuery('');
    setDebouncedQuery('');
    setPage(1);
  }

  // ── Progress bar helpers ───────────────────────────────────────────────
  const progressPercent = Math.min(
    (todayTotal / DAILY_PURINE_TARGET) * 100,
    100,
  );
  const progressColor =
    todayTotal <= 200
      ? 'var(--success)'
      : todayTotal <= 350
        ? 'var(--warning)'
        : 'var(--danger)';

  // =====================================================================
  // Render
  // =====================================================================
  return (
    <div className="page">
      {/* ── Success Toast ──────────────────────────────────────────── */}
      {successMessage && (
        <div
          style={{
            position: 'fixed',
            top: 'calc(var(--safe-top, 0px) + 16px)',
            left: 16,
            right: 16,
            zIndex: 300,
            maxWidth: 420,
            margin: '0 auto',
          }}
        >
          <div
            className="toast toast--success"
            style={{
              animation: 'toastIn 300ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <span
              className="toast__icon"
              style={{ color: 'var(--success)', display: 'flex' }}
            >
              <CheckIcon />
            </span>
            <div className="toast__content">
              <div className="toast__title">{successMessage}</div>
            </div>
            <button
              className="toast__dismiss"
              onClick={() => setSuccessMessage(null)}
              aria-label="Dismiss"
            >
              <ClearIcon />
            </button>
          </div>
        </div>
      )}

      {/* ── Page Title ─────────────────────────────────────────────── */}
      <section style={{ marginBottom: 16, paddingTop: 8 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
          Food Database
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          Search and track purine content in {totalDatabaseCount}+ foods
        </p>
      </section>

      {/* ── Sticky Search Bar ──────────────────────────────────────── */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backgroundColor: 'var(--bg-primary)',
          paddingTop: 8,
          paddingBottom: 8,
          marginLeft: -16,
          marginRight: -16,
          paddingLeft: 16,
          paddingRight: 16,
        }}
      >
        <div className="search-bar">
          <span className="search-bar__icon">
            <SearchIcon />
          </span>
          <input
            className="input"
            type="text"
            placeholder={`Search ${totalDatabaseCount}+ foods...`}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            style={{
              paddingLeft: 42,
              paddingRight: searchQuery ? 42 : 14,
            }}
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'var(--bg-elevated)',
                border: 'none',
                borderRadius: '50%',
                width: 24,
                height: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: 0,
              }}
              aria-label="Clear search"
            >
              <ClearIcon />
            </button>
          )}
        </div>
      </div>

      {/* ── Today's Purine Summary ─────────────────────────────────── */}
      <div
        className="card"
        style={{
          marginBottom: 12,
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: 6,
            }}
          >
            Today:{' '}
            <span style={{ color: progressColor }}>
              {formatPurines(todayTotal)}
            </span>{' '}
            / {formatPurines(DAILY_PURINE_TARGET)}
          </div>
          <div className="progress-bar" style={{ height: 6 }}>
            <div
              className="progress-fill"
              style={{
                width: `${progressPercent}%`,
                backgroundColor: progressColor,
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Purine Level Filter Tabs (horizontal scroll) ───────────── */}
      <div className="chips-row" style={{ marginBottom: 8, paddingBottom: 8 }}>
        {PURINE_LEVELS.map((level) => {
          const isActive = selectedLevel === level.key;
          const count = levelCounts[level.key] ?? 0;
          return (
            <button
              key={level.key}
              onClick={() => handleLevelSelect(level.key)}
              className={`chip ${isActive ? 'chip--active' : ''}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: level.color,
                  flexShrink: 0,
                  display: 'inline-block',
                }}
              />
              {level.label} ({count})
            </button>
          );
        })}
      </div>

      {/* ── Category Filter (horizontal scroll row below) ──────────── */}
      <div
        className="chips-row"
        style={{ marginBottom: 16, paddingBottom: 8 }}
      >
        <button
          onClick={() => handleCategorySelect('all')}
          className={`chip ${selectedCategory === 'all' ? 'chip--active' : ''}`}
        >
          All Categories
        </button>
        {ALL_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategorySelect(cat)}
            className={`chip ${selectedCategory === cat ? 'chip--active' : ''}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── Results Count ──────────────────────────────────────────── */}
      <div
        style={{
          fontSize: 13,
          color: 'var(--text-muted)',
          marginBottom: 12,
          fontWeight: 500,
        }}
      >
        Showing {paginatedFoods.length} of {totalFilteredCount} foods
      </div>

      {/* ── Food List or Empty State ───────────────────────────────── */}
      {totalFilteredCount === 0 ? (
        <div className="empty-state">
          <div
            className="empty-state__icon"
            style={{ color: 'var(--text-muted)' }}
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </div>
          <div className="empty-state__title">No foods found</div>
          <div className="empty-state__description">
            No foods found matching &ldquo;
            {debouncedQuery || searchQuery}
            &rdquo;. Try a different search.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {paginatedFoods.map((food) => {
            const isExpanded = expandedId === food.id;
            const isAddingThis = showAddConfirm === food.id;
            const levelColor = getPurineLevelColor(food.purineLevel);
            const levelLabel = getPurineLevelLabel(food.purineLevel);

            return (
              <div
                key={food.id}
                className="card"
                style={{
                  padding: 0,
                  overflow: 'hidden',
                  borderLeft: `3px solid ${levelColor}`,
                }}
              >
                {/* ── Collapsed Row (clickable) ──────────────── */}
                <button
                  onClick={() => handleToggleExpand(food.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    width: '100%',
                    padding: '14px 14px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'inherit',
                    color: 'inherit',
                  }}
                  aria-expanded={isExpanded}
                >
                  {/* Colored dot */}
                  <span
                    className="color-dot"
                    style={{
                      backgroundColor: levelColor,
                      flexShrink: 0,
                    }}
                  />

                  {/* Food name + category */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        lineHeight: 1.3,
                      }}
                    >
                      {food.name}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--text-muted)',
                        marginTop: 2,
                      }}
                    >
                      {food.category}
                    </div>
                  </div>

                  {/* Purine content + badge */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: 4,
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {food.purineContent} mg/100g
                    </span>
                    <span className={getPurineBadgeClass(food.purineLevel)}>
                      {levelLabel}
                    </span>
                  </div>

                  {/* Expand chevron */}
                  <span
                    style={{
                      color: 'var(--text-muted)',
                      flexShrink: 0,
                      display: 'flex',
                    }}
                  >
                    {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                  </span>
                </button>

                {/* ── Expanded Details ────────────────────────── */}
                {isExpanded && (
                  <div
                    style={{
                      padding: '0 14px 14px',
                      borderTop: '1px solid var(--border-light)',
                    }}
                  >
                    {/* Description */}
                    {food.description && (
                      <div style={{ marginTop: 12, marginBottom: 10 }}>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: 'var(--text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            marginBottom: 4,
                          }}
                        >
                          Description
                        </div>
                        <p
                          style={{
                            fontSize: 14,
                            color: 'var(--text-secondary)',
                            lineHeight: 1.5,
                            margin: 0,
                          }}
                        >
                          {food.description}
                        </p>
                      </div>
                    )}

                    {/* Serving size */}
                    <div style={{ marginBottom: 10 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: 'var(--text-muted)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          marginBottom: 4,
                        }}
                      >
                        Serving Size
                      </div>
                      <p
                        style={{
                          fontSize: 14,
                          color: 'var(--text-secondary)',
                          lineHeight: 1.5,
                          margin: 0,
                        }}
                      >
                        {food.servingSize}
                      </p>
                    </div>

                    {/* Gout-specific notes */}
                    {food.goutNotes && (
                      <div
                        style={{
                          marginBottom: 10,
                          background:
                            food.purineLevel === 'high' ||
                            food.purineLevel === 'very-high'
                              ? 'var(--danger-bg)'
                              : food.purineLevel === 'moderate'
                                ? 'var(--warning-bg)'
                                : 'var(--success-bg)',
                          borderRadius: 8,
                          padding: '10px 12px',
                        }}
                      >
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color:
                              food.purineLevel === 'high' ||
                              food.purineLevel === 'very-high'
                                ? 'var(--danger)'
                                : food.purineLevel === 'moderate'
                                  ? 'var(--warning)'
                                  : 'var(--success)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            marginBottom: 4,
                          }}
                        >
                          Gout Notes
                        </div>
                        <p
                          style={{
                            fontSize: 13,
                            color: 'var(--text-secondary)',
                            lineHeight: 1.5,
                            margin: 0,
                          }}
                        >
                          {food.goutNotes}
                        </p>
                      </div>
                    )}

                    {/* Alternatives (for high/very-high purine foods) */}
                    {(food.purineLevel === 'high' ||
                      food.purineLevel === 'very-high') &&
                      food.alternatives && food.alternatives.length > 0 && (
                        <div style={{ marginBottom: 12 }}>
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: 'var(--text-muted)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              marginBottom: 6,
                            }}
                          >
                            Lower-Purine Alternatives
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: 6,
                            }}
                          >
                            {food.alternatives.map((alt, i) => (
                              <span
                                key={i}
                                className="badge badge-purine-low"
                                style={{ fontSize: 12 }}
                              >
                                {alt}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* ── Add to Log Flow ────────────────────── */}
                    {!isAddingThis ? (
                      <button
                        className="btn btn-primary btn-block"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartAdd(food.id);
                        }}
                        style={{ marginTop: 8, gap: 8 }}
                      >
                        <PlusIcon />
                        Add to Today&apos;s Log
                      </button>
                    ) : (
                      <div
                        style={{
                          marginTop: 8,
                          background: 'var(--bg-secondary)',
                          borderRadius: 10,
                          padding: 14,
                        }}
                      >
                        {/* Serving size selector */}
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: 'var(--text-secondary)',
                            marginBottom: 8,
                          }}
                        >
                          Select serving size:
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            gap: 8,
                            marginBottom: 12,
                          }}
                        >
                          {SERVING_MULTIPLIERS.map((mult) => {
                            const isActive = servingMultiplier === mult;
                            return (
                              <button
                                key={mult}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setServingMultiplier(mult);
                                }}
                                style={{
                                  flex: 1,
                                  padding: '8px 4px',
                                  background: isActive
                                    ? 'var(--primary)'
                                    : 'var(--bg-card)',
                                  color: isActive
                                    ? '#ffffff'
                                    : 'var(--text-primary)',
                                  border: `1.5px solid ${
                                    isActive
                                      ? 'var(--primary)'
                                      : 'var(--border)'
                                  }`,
                                  borderRadius: 8,
                                  fontSize: 14,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  fontFamily: 'inherit',
                                  transition: 'all 150ms ease',
                                }}
                              >
                                {mult}x
                              </button>
                            );
                          })}
                        </div>

                        {/* Calculated purine amount */}
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 12,
                            padding: '8px 12px',
                            background: 'var(--bg-card)',
                            borderRadius: 8,
                            border: '1px solid var(--border-light)',
                          }}
                        >
                          <span
                            style={{
                              fontSize: 13,
                              color: 'var(--text-secondary)',
                            }}
                          >
                            Estimated purines:
                          </span>
                          <span
                            style={{
                              fontSize: 16,
                              fontWeight: 700,
                              color: levelColor,
                            }}
                          >
                            {formatPurines(
                              Math.round(
                                food.purineContent * servingMultiplier,
                              ),
                            )}
                          </span>
                        </div>

                        {/* Confirm / Cancel */}
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            className="btn btn-secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelAdd();
                            }}
                            style={{ flex: 1 }}
                          >
                            Cancel
                          </button>
                          <button
                            className="btn btn-success"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConfirmAdd(food);
                            }}
                            style={{ flex: 1, gap: 6 }}
                          >
                            <CheckIcon />
                            Confirm
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* ── Load More Button ──────────────────────────────── */}
          {hasMore && (
            <div style={{ paddingTop: 8, paddingBottom: 16 }}>
              <button
                className="btn btn-outline btn-block"
                onClick={() => setPage((p) => p + 1)}
              >
                Load More ({filteredFoods.length - paginatedFoods.length}{' '}
                remaining)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Bottom spacer for tab bar */}
      <div style={{ height: 16 }} />
    </div>
  );
}
