'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  getTodayScanCount,
  incrementScanCount,
  addScanRecord,
  getScanRecords,
  addFoodToLog,
  getTodayDateString,
  generateId,
  ScanRecord,
  FoodLogEntry,
} from '@/lib/storage';
import { getApiUrl } from '@/lib/api';

interface AnalysisItem {
  name: string;
  purineLevel: string;
  purineEstimate: number;
  notes: string;
}

interface AnalysisResult {
  foodIdentified: string;
  overallRiskLevel: string;
  purineEstimate: number;
  items: AnalysisItem[];
  goutImpact: string;
  saferAlternatives: string[];
  flareAdvice: string;
  recommendation: string;
}

const FREE_SCAN_LIMIT = 3;

const riskColors: Record<string, { bg: string; text: string; border: string }> = {
  low: { bg: '#dcfce7', text: '#166534', border: '#86efac' },
  moderate: { bg: '#fef9c3', text: '#854d0e', border: '#fde047' },
  high: { bg: '#ffedd5', text: '#9a3412', border: '#fdba74' },
  'very-high': { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
};

const riskLabels: Record<string, string> = {
  low: 'Low Risk',
  moderate: 'Moderate Risk',
  high: 'High Risk',
  'very-high': 'Very High Risk',
};

export default function ScanPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanCount, setScanCount] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [scanHistory, setScanHistory] = useState<ScanRecord[]>([]);
  const [addedToLog, setAddedToLog] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setScanCount(getTodayScanCount());
    setIsPremium(localStorage.getItem('goutguard_premium') === 'true');
    setScanHistory(getScanRecords().slice(0, 5));
  }, []);

  const remainingScans = FREE_SCAN_LIMIT - scanCount;

  function handleFileSelect(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImagePreview(dataUrl);
      setImageBase64(dataUrl);
      setResult(null);
      setError(null);
      setAddedToLog(false);
    };
    reader.readAsDataURL(file);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  }

  function handleTapUpload() {
    fileInputRef.current?.click();
  }

  async function handleAnalyze() {
    if (!imageBase64) return;

    if (!isPremium && remainingScans <= 0) {
      setError('You have used all 3 free scans for today. Upgrade to Premium for unlimited scans.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    setAddedToLog(false);

    try {
      const response = await fetch(getApiUrl('/api/analyze'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageBase64 }),
      });

      const data = await response.json();

      if (data.success && data.result) {
        setResult(data.result);
        incrementScanCount();
        setScanCount(getTodayScanCount());

        const scanRecord: ScanRecord = {
          id: generateId(),
          date: getTodayDateString(),
          imageData: imagePreview || undefined,
          result: data.result,
          timestamp: new Date().toISOString(),
        };
        addScanRecord(scanRecord);
        setScanHistory(getScanRecords().slice(0, 5));
      } else {
        setError(data.error || 'Analysis failed. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsAnalyzing(false);
    }
  }

  function handleAddToFoodLog() {
    if (!result) return;

    const entry: FoodLogEntry = {
      id: generateId(),
      foodName: result.foodIdentified,
      purineContent: result.purineEstimate,
      purineLevel: result.overallRiskLevel,
      servingSize: '1 serving',
      timestamp: new Date().toISOString(),
      source: 'scan',
    };

    addFoodToLog(getTodayDateString(), entry);
    setAddedToLog(true);
  }

  function handleNewScan() {
    setImagePreview(null);
    setImageBase64(null);
    setResult(null);
    setError(null);
    setAddedToLog(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function getRiskStyle(level: string) {
    return riskColors[level] || riskColors['moderate'];
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '2rem' }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e40af 0%, #7c3aed 100%)',
          padding: '1rem 1.25rem',
          color: 'white',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={() => router.back()}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '50%',
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'white',
              fontSize: '1.1rem',
            }}
            aria-label="Go back"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h1 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>AI Food Scanner</h1>
          <div style={{ width: 36 }} />
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '1rem 1rem 2rem' }}>
        {/* Scan Limit Badge */}
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          {isPremium ? (
            <span
              style={{
                display: 'inline-block',
                background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                color: 'white',
                padding: '0.35rem 1rem',
                borderRadius: '999px',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              Unlimited scans
            </span>
          ) : (
            <span
              style={{
                display: 'inline-block',
                background: remainingScans > 0 ? '#dbeafe' : '#fee2e2',
                color: remainingScans > 0 ? '#1e40af' : '#991b1b',
                padding: '0.35rem 1rem',
                borderRadius: '999px',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              {remainingScans > 0
                ? `${remainingScans}/${FREE_SCAN_LIMIT} free scans remaining today`
                : `0/${FREE_SCAN_LIMIT} free scans remaining today`}
            </span>
          )}
        </div>

        {/* Upgrade Prompt */}
        {!isPremium && remainingScans <= 0 && !result && (
          <div
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
              borderRadius: 12,
              padding: '1.25rem',
              color: 'white',
              textAlign: 'center',
              marginBottom: '1rem',
            }}
          >
            <p style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.5rem' }}>
              Daily scan limit reached
            </p>
            <p style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '0.75rem' }}>
              Upgrade to Premium for unlimited AI food scans, detailed analytics, and more.
            </p>
            <button
              onClick={() => router.push('/premium')}
              style={{
                background: 'white',
                color: '#7c3aed',
                border: 'none',
                borderRadius: 8,
                padding: '0.6rem 1.5rem',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              Upgrade to Premium
            </button>
          </div>
        )}

        {/* Camera / Upload Area */}
        {!result && !isAnalyzing && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleInputChange}
              style={{ display: 'none' }}
            />

            {!imagePreview ? (
              <div
                onClick={handleTapUpload}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{
                  background: isDragging ? '#dbeafe' : 'white',
                  border: `2px dashed ${isDragging ? '#3b82f6' : '#cbd5e1'}`,
                  borderRadius: 16,
                  padding: '3rem 1.5rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  marginBottom: '1rem',
                }}
              >
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #dbeafe, #e0e7ff)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem',
                  }}
                >
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </div>
                <p style={{ fontWeight: 700, fontSize: '1.05rem', color: '#1e293b', marginBottom: '0.4rem' }}>
                  Tap to scan food, nutrition label, or menu
                </p>
                <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
                  Take a photo or drag and drop an image
                </p>
              </div>
            ) : (
              <div style={{ marginBottom: '1rem' }}>
                <div
                  style={{
                    borderRadius: 16,
                    overflow: 'hidden',
                    marginBottom: '0.75rem',
                    border: '2px solid #e2e8f0',
                  }}
                >
                  <img
                    src={imagePreview}
                    alt="Food to analyze"
                    style={{ width: '100%', display: 'block', maxHeight: 350, objectFit: 'cover' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={handleNewScan}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: 'white',
                      border: '2px solid #e2e8f0',
                      borderRadius: 12,
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      color: '#475569',
                    }}
                  >
                    Retake
                  </button>
                  <button
                    onClick={handleAnalyze}
                    disabled={!isPremium && remainingScans <= 0}
                    style={{
                      flex: 2,
                      padding: '0.75rem',
                      background:
                        !isPremium && remainingScans <= 0
                          ? '#94a3b8'
                          : 'linear-gradient(135deg, #1e40af, #7c3aed)',
                      border: 'none',
                      borderRadius: 12,
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      cursor: !isPremium && remainingScans <= 0 ? 'not-allowed' : 'pointer',
                      color: 'white',
                    }}
                  >
                    Analyze for Purines
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Analyzing State */}
        {isAnalyzing && (
          <div
            style={{
              background: 'white',
              borderRadius: 16,
              padding: '3rem 1.5rem',
              textAlign: 'center',
              marginBottom: '1rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #dbeafe, #e0e7ff)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            >
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </div>
            <p style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1e293b', marginBottom: '0.4rem' }}>
              Analyzing food for purine content...
            </p>
            <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
              Our AI is identifying ingredients and estimating purine levels
            </p>
            <style>{`
              @keyframes pulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.08); opacity: 0.7; }
              }
            `}</style>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fca5a5',
              borderRadius: 12,
              padding: '1rem',
              marginBottom: '1rem',
              color: '#991b1b',
              fontSize: '0.9rem',
            }}
          >
            {error}
          </div>
        )}

        {/* Results Display */}
        {result && (
          <div style={{ marginBottom: '1.5rem' }}>
            {/* Overall Risk Level */}
            <div
              style={{
                background: 'white',
                borderRadius: 16,
                padding: '1.5rem',
                marginBottom: '0.75rem',
                textAlign: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              }}
            >
              <div
                style={{
                  display: 'inline-block',
                  background: getRiskStyle(result.overallRiskLevel).bg,
                  color: getRiskStyle(result.overallRiskLevel).text,
                  border: `2px solid ${getRiskStyle(result.overallRiskLevel).border}`,
                  borderRadius: 12,
                  padding: '0.75rem 1.5rem',
                  marginBottom: '1rem',
                }}
              >
                <p style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>
                  {riskLabels[result.overallRiskLevel] || result.overallRiskLevel}
                </p>
              </div>
              <p style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1e293b', marginBottom: '0.25rem' }}>
                {result.foodIdentified}
              </p>
              <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                Approximately {result.purineEstimate} mg purines per serving
              </p>
            </div>

            {/* Detailed Breakdown */}
            <div
              style={{
                background: 'white',
                borderRadius: 16,
                padding: '1.25rem',
                marginBottom: '0.75rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              }}
            >
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.75rem' }}>
                Detailed Breakdown
              </h3>
              {result.items.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    padding: '0.75rem 0',
                    borderBottom: idx < result.items.length - 1 ? '1px solid #f1f5f9' : 'none',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, color: '#1e293b', marginBottom: '0.2rem' }}>{item.name}</p>
                    <p style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.notes}</p>
                  </div>
                  <div style={{ textAlign: 'right', marginLeft: '0.75rem', flexShrink: 0 }}>
                    <span
                      style={{
                        display: 'inline-block',
                        background: getRiskStyle(item.purineLevel).bg,
                        color: getRiskStyle(item.purineLevel).text,
                        padding: '0.2rem 0.6rem',
                        borderRadius: 6,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        marginBottom: '0.2rem',
                      }}
                    >
                      {riskLabels[item.purineLevel] || item.purineLevel}
                    </span>
                    <p style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.purineEstimate} mg/100g</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Gout Impact */}
            <div
              style={{
                background: 'white',
                borderRadius: 16,
                padding: '1.25rem',
                marginBottom: '0.75rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              }}
            >
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>
                Gout Impact
              </h3>
              <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.6 }}>{result.goutImpact}</p>
            </div>

            {/* Safer Alternatives */}
            {result.saferAlternatives && result.saferAlternatives.length > 0 && (
              <div
                style={{
                  background: 'white',
                  borderRadius: 16,
                  padding: '1.25rem',
                  marginBottom: '0.75rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                }}
              >
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>
                  Safer Alternatives
                </h3>
                <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
                  {result.saferAlternatives.map((alt, idx) => (
                    <li key={idx} style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.8 }}>
                      {alt}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Flare Warning */}
            <div
              style={{
                background: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: 16,
                padding: '1.25rem',
                marginBottom: '0.75rem',
              }}
            >
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#92400e', marginBottom: '0.5rem' }}>
                Flare Advice
              </h3>
              <p style={{ color: '#92400e', fontSize: '0.9rem', lineHeight: 1.6 }}>{result.flareAdvice}</p>
            </div>

            {/* Recommendation */}
            <div
              style={{
                background: '#f0fdf4',
                border: '1px solid #86efac',
                borderRadius: 16,
                padding: '1.25rem',
                marginBottom: '1rem',
              }}
            >
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#166534', marginBottom: '0.5rem' }}>
                Recommendation
              </h3>
              <p style={{ color: '#166534', fontSize: '0.9rem', lineHeight: 1.6 }}>{result.recommendation}</p>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
              <button
                onClick={handleAddToFoodLog}
                disabled={addedToLog}
                style={{
                  flex: 1,
                  padding: '0.85rem',
                  background: addedToLog
                    ? '#86efac'
                    : 'linear-gradient(135deg, #1e40af, #7c3aed)',
                  border: 'none',
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: addedToLog ? 'default' : 'pointer',
                  color: addedToLog ? '#166534' : 'white',
                }}
              >
                {addedToLog ? 'Added to Food Log' : 'Add to Food Log'}
              </button>
              <button
                onClick={handleNewScan}
                style={{
                  padding: '0.85rem 1.25rem',
                  background: 'white',
                  border: '2px solid #e2e8f0',
                  borderRadius: 12,
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  color: '#475569',
                }}
              >
                New Scan
              </button>
            </div>
          </div>
        )}

        {/* Scan History */}
        {scanHistory.length > 0 && !isAnalyzing && (
          <div
            style={{
              background: 'white',
              borderRadius: 16,
              padding: '1.25rem',
              marginBottom: '1rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            }}
          >
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.75rem' }}>
              Recent Scans
            </h3>
            {scanHistory.map((scan) => {
              const scanResult = scan.result as AnalysisResult | undefined;
              const riskLevel = scanResult?.overallRiskLevel || 'moderate';
              return (
                <div
                  key={scan.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.6rem 0',
                    borderBottom: '1px solid #f1f5f9',
                    gap: '0.75rem',
                  }}
                >
                  {scan.imageData && (
                    <img
                      src={scan.imageData}
                      alt="Scan thumbnail"
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 8,
                        objectFit: 'cover',
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        color: '#1e293b',
                        marginBottom: '0.15rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {scanResult?.foodIdentified || 'Unknown'}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {new Date(scan.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    style={{
                      display: 'inline-block',
                      background: getRiskStyle(riskLevel).bg,
                      color: getRiskStyle(riskLevel).text,
                      padding: '0.15rem 0.5rem',
                      borderRadius: 6,
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    {riskLabels[riskLevel] || riskLevel}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Tips Section */}
        <div
          style={{
            background: 'white',
            borderRadius: 16,
            padding: '1.25rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }}
        >
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.75rem' }}>
            Pro Tips for Scanning
          </h3>
          {[
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4" />
                  <path d="M12 8h.01" />
                </svg>
              ),
              text: 'Point camera directly at food for best results',
            },
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6" />
                  <path d="M16 13H8" />
                  <path d="M16 17H8" />
                  <path d="M10 9H8" />
                </svg>
              ),
              text: 'Nutrition labels provide the most accurate analysis',
            },
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                  <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                  <path d="M6 1v3" />
                  <path d="M10 1v3" />
                  <path d="M14 1v3" />
                </svg>
              ),
              text: 'Include the full plate for restaurant meals',
            },
          ].map((tip, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.5rem 0',
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {tip.icon}
              </div>
              <p style={{ fontSize: '0.85rem', color: '#475569' }}>{tip.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
