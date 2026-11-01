import React, { useState, useEffect } from 'react';
import { UserSkinProfile } from '../agents/profiler.ts';
import {
  RotateCcw,
  ArrowRight,
  Sun,
  Flame,
  FileText,
  X,
  Activity,
  Info,
} from 'lucide-react';

interface SkinProfileViewProps {
  profile: UserSkinProfile;
  userSelfieUrl?: string;
  onRetake: () => void;
  onContinue: () => void;
}

export const SkinProfileView: React.FC<SkinProfileViewProps> = ({
  profile,
  userSelfieUrl = '/sample_face_valid.jpg',
  onRetake,
  onContinue,
}) => {
  const [selectedMetric, setSelectedMetric] = useState<'all' | 'wrinkle' | 'redness' | 'oiliness' | 'moisture'>('all');
  const [showSosModal, setShowSosModal] = useState<boolean>(false);
  const [showClinicalReport, setShowClinicalReport] = useState<boolean>(false);
  const [weatherData, setWeatherData] = useState<{ uvIndex: number; humidity: number; temperature: number } | null>(null);
  const [userActualAge, setUserActualAge] = useState<number>(() => {
    const saved = localStorage.getItem('mirror_moment_user_actual_age');
    return saved ? parseInt(saved, 10) : 23;
  });
  const [showAgeEditor, setShowAgeEditor] = useState<boolean>(false);

  // Fetch live Open-Meteo weather
  useEffect(() => {
    fetch('/api/weather')
      .then((r) => r.json())
      .then((d) => setWeatherData(d))
      .catch((e) => console.warn('Weather fetch error:', e));
  }, []);

  // Compute metric scores from rawScores or topConcerns
  const getMetricScore = (key: string, fallback: number) => {
    if (profile.rawScores && typeof profile.rawScores[key] === 'number') {
      return Math.round(profile.rawScores[key]);
    }
    const found = profile.allConcerns?.find((c) => c.key === key);
    return found ? found.score : fallback;
  };

  const wrinkleScore = getMetricScore('wrinkle', 86);
  const rednessScore = getMetricScore('redness', 86);
  const oilinessScore = getMetricScore('oiliness', 78);
  const moistureScore = getMetricScore('moisture', 92);

  const fitzpatrick = profile.skinType.toLowerCase().includes('sensitive')
    ? 'Type II (Fair / Reactive)'
    : 'Type III (Medium / Resilient)';
  const uvIndex = weatherData?.uvIndex ?? 6.8;
  const humidity = weatherData?.humidity ?? 42;

  return (
    <div style={{ maxWidth: '540px', margin: '0 auto', padding: '16px 16px 40px' }}>
      {/* Flagship Perfect Corp Professional AR Skin Diagnostic Card */}
      <div
        style={{
          position: 'relative',
          background: 'linear-gradient(180deg, #0F172A 0%, #090D16 100%)',
          borderRadius: '28px',
          padding: '20px 18px 24px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 35px rgba(56, 189, 248, 0.15)',
          marginBottom: '20px',
          overflow: 'hidden',
        }}
      >
        {/* Top Header Pill Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', zIndex: 10, position: 'relative' }}>
          <button
            onClick={onRetake}
            aria-label="Retake selfie scan"
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              borderRadius: '999px',
              color: '#F8FAFC',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <RotateCcw size={13} /> Retake
          </button>

          {/* Official Flagship "Skin Analysis" Pill Badge */}
          <div
            style={{
              background: '#FFFFFF',
              color: '#0F172A',
              padding: '6px 16px',
              borderRadius: '999px',
              fontSize: '13px',
              fontWeight: 800,
              letterSpacing: '-0.01em',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(255, 255, 255, 0.25)',
            }}
          >
            <Activity size={14} color="#0284C7" />
            <span>Skin Analysis</span>
          </div>
        </div>

        {/* Center Diagnostic Face Viewport with Visual AR Overlay and Floating Circular Gauges */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '4 / 3.8',
            maxHeight: '340px',
            background: 'radial-gradient(ellipse at 42% 50%, #1E293B 0%, #070B14 100%)',
            borderRadius: '22px',
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
          }}
        >
          {/* Stylized Photorealistic Face Canvas with Medical Annotations */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {/* Real Face Background Image (Matching Perfect Corp Reference) */}
            <img
              src={userSelfieUrl}
              alt="Analyzed Portrait"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center 25%',
                filter: 'brightness(0.92) contrast(1.05)',
              }}
            />

            {/* Dark Edge Vignette Gradient to highlight face & right-hand badges */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to right, rgba(11, 15, 25, 0.45) 0%, transparent 40%, rgba(11, 15, 25, 0.75) 100%)',
                pointerEvents: 'none',
              }}
            />

            {/* Base Biometric Face SVG Mesh */}
            <svg
              viewBox="0 0 220 260"
              style={{
                position: 'relative',
                width: '74%',
                height: '92%',
                filter: 'drop-shadow(0 4px 14px rgba(0,0,0,0.6))',
                zIndex: 5,
                marginRight: 'auto',
                marginLeft: '10px',
              }}
            >
              <defs>
                {/* Redness Erythema Radial Gradients */}
                <radialGradient id="cheekErythemaLeft" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity="0.55" />
                  <stop offset="60%" stopColor="#F97316" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="cheekErythemaRight" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity="0.55" />
                  <stop offset="60%" stopColor="#F97316" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
                </radialGradient>
                {/* T-Zone Sebum Plump Gradient */}
                <radialGradient id="foreheadSebum" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Subtle Medical Face Biometric Alignment Ring */}
              <ellipse
                cx="110"
                cy="130"
                rx="76"
                ry="98"
                fill="none"
                stroke="rgba(56, 189, 248, 0.25)"
                strokeWidth="1.2"
                strokeDasharray="4 4"
              />

              {/* === AR OVERLAYS LAYER (Like Perfect Corp reference) === */}

              {/* 1. FOREHEAD & CROW'S FEET WRINKLE CONTOURS (GREEN) */}
              {(selectedMetric === 'all' || selectedMetric === 'wrinkle') && (
                <g stroke="#22C55E" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.95">
                  {/* Forehead horizontal expression lines */}
                  <path d="M 74 62 Q 110 56 146 62" />
                  <path d="M 68 70 Q 110 64 152 70" />
                  <path d="M 76 78 Q 110 73 144 78" />
                  {/* Left Crow's feet (lateral eye) */}
                  <path d="M 64 103 L 52 98" />
                  <path d="M 62 108 L 48 108" />
                  <path d="M 64 113 L 52 118" />
                  {/* Right Crow's feet */}
                  <path d="M 156 103 L 168 98" />
                  <path d="M 158 108 L 172 108" />
                  <path d="M 156 113 L 168 118" />
                  {/* Nasolabial folds */}
                  <path d="M 96 150 Q 88 170 94 186" strokeWidth="1.5" />
                  <path d="M 124 150 Q 132 170 126 186" strokeWidth="1.5" />
                </g>
              )}

              {/* 2. CHEEK ERYTHEMA / REDNESS ZONES (CORAL / RED GRADIENT) */}
              {(selectedMetric === 'all' || selectedMetric === 'redness') && (
                <g opacity="0.9">
                  {/* Left Malar Cheek Erythema */}
                  <ellipse cx="78" cy="144" rx="22" ry="16" fill="url(#cheekErythemaLeft)" />
                  {/* Right Malar Cheek Erythema */}
                  <ellipse cx="142" cy="144" rx="22" ry="16" fill="url(#cheekErythemaRight)" />
                  {/* Central Nose Tip Erythema */}
                  <circle cx="110" cy="144" r="10" fill="url(#cheekErythemaLeft)" opacity="0.6" />
                </g>
              )}

              {/* 3. T-ZONE OILINESS (WARM AMBER HIGHLIGHT) */}
              {(selectedMetric === 'all' || selectedMetric === 'oiliness') && (
                <g opacity="0.85">
                  {/* Forehead sebum pool */}
                  <ellipse cx="110" cy="72" rx="28" ry="14" fill="url(#foreheadSebum)" />
                  {/* Glabella / Nose Bridge Sebum */}
                  <ellipse cx="110" cy="120" rx="10" ry="24" fill="url(#foreheadSebum)" />
                </g>
              )}

              {/* 4. CYAN PORES & TEXTURE MICRO-CLUSTERS */}
              {(selectedMetric === 'all' || selectedMetric === 'oiliness' || selectedMetric === 'moisture') && (
                <g fill="#06B6D4" opacity="0.9">
                  {/* Left inner cheek pore cluster */}
                  <circle cx="92" cy="132" r="1.4" />
                  <circle cx="95" cy="138" r="1.6" />
                  <circle cx="90" cy="142" r="1.3" />
                  <circle cx="86" cy="136" r="1.5" />
                  <circle cx="93" cy="146" r="1.4" />
                  {/* Right inner cheek pore cluster */}
                  <circle cx="128" cy="132" r="1.4" />
                  <circle cx="125" cy="138" r="1.6" />
                  <circle cx="130" cy="142" r="1.3" />
                  <circle cx="134" cy="136" r="1.5" />
                  <circle cx="127" cy="146" r="1.4" />
                  {/* Nose pore cluster */}
                  <circle cx="107" cy="135" r="1.3" />
                  <circle cx="113" cy="136" r="1.4" />
                  <circle cx="110" cy="140" r="1.5" />
                </g>
              )}
            </svg>

            {/* Vertical Stack of Floating Circular Score Badges (Exact Perfect Corp Flagship UI) */}
            <div
              style={{
                position: 'absolute',
                right: '16px',
                top: '0',
                bottom: '0',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: '12px',
                zIndex: 10,
              }}
            >
              {/* Badge 1: Wrinkles (Green) */}
              <div
                onClick={() => setSelectedMetric(selectedMetric === 'wrinkle' ? 'all' : 'wrinkle')}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transform: selectedMetric === 'wrinkle' ? 'scale(1.08)' : 'scale(1)',
                  transition: 'transform 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    background: '#FFFFFF',
                    border: '3.5px solid #22C55E',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(34, 197, 94, 0.4)',
                  }}
                >
                  <span style={{ fontSize: '16px', fontWeight: 900, color: '#0F172A' }}>{wrinkleScore}</span>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#CBD5E1', marginTop: '3px' }}>Wrinkles</span>
              </div>

              {/* Badge 2: Redness (Red) */}
              <div
                onClick={() => setSelectedMetric(selectedMetric === 'redness' ? 'all' : 'redness')}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transform: selectedMetric === 'redness' ? 'scale(1.08)' : 'scale(1)',
                  transition: 'transform 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    background: '#FFFFFF',
                    border: '3.5px solid #EF4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
                  }}
                >
                  <span style={{ fontSize: '16px', fontWeight: 900, color: '#0F172A' }}>{rednessScore}</span>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#CBD5E1', marginTop: '3px' }}>Redness</span>
              </div>

              {/* Badge 3: Oiliness (Amber) */}
              <div
                onClick={() => setSelectedMetric(selectedMetric === 'oiliness' ? 'all' : 'oiliness')}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transform: selectedMetric === 'oiliness' ? 'scale(1.08)' : 'scale(1)',
                  transition: 'transform 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    background: '#FFFFFF',
                    border: '3.5px solid #F59E0B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)',
                  }}
                >
                  <span style={{ fontSize: '16px', fontWeight: 900, color: '#0F172A' }}>{oilinessScore}</span>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#CBD5E1', marginTop: '3px' }}>Oiliness</span>
              </div>

              {/* Badge 4: Moisture (Blue) */}
              <div
                onClick={() => setSelectedMetric(selectedMetric === 'moisture' ? 'all' : 'moisture')}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transform: selectedMetric === 'moisture' ? 'scale(1.08)' : 'scale(1)',
                  transition: 'transform 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    background: '#FFFFFF',
                    border: '3.5px solid #0EA5E9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(14, 165, 233, 0.4)',
                  }}
                >
                  <span style={{ fontSize: '16px', fontWeight: 900, color: '#0F172A' }}>{moistureScore}</span>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#CBD5E1', marginTop: '3px' }}>Moisture</span>
              </div>
            </div>
          </div>
        </div>

        {/* Diagnostic Highlight Bar */}
        {(() => {
          const vitalityScore = profile.vitalityScore ?? 88;
          const vitalityAge = profile.skinAge;
          const youthDelta = userActualAge - vitalityAge;

          return (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <div
                  onClick={() => setShowAgeEditor(!showAgeEditor)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '14px',
                    padding: '12px 10px',
                    border: showAgeEditor ? '1px solid #818CF8' : '1px solid rgba(255, 255, 255, 0.08)',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  title="Tap to calibrate your chronological baseline age"
                >
                  <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>Vitality Age</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#FFFFFF', marginTop: '4px' }}>
                    {vitalityAge} <span style={{ fontSize: '13px', fontWeight: 500, color: '#A5B4FC' }}>yrs</span>
                  </div>
                  <div style={{ fontSize: '10px', color: youthDelta >= 0 ? '#10B981' : '#F59E0B', fontWeight: 700, marginTop: '2px' }}>
                    {youthDelta > 0 ? `-${youthDelta} yrs younger` : youthDelta === 0 ? 'Optimal match' : `+${Math.abs(youthDelta)} yrs offset`}
                  </div>
                </div>

                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '14px',
                    padding: '12px 10px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>Diagnostic Type</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#38BDF8', marginTop: '6px' }}>
                    {profile.baumannType?.code || profile.skinType}
                  </div>
                  <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px' }}>Baumann Matrix</div>
                </div>

                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '14px',
                    padding: '12px 10px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>Vitality Score</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#10B981', marginTop: '4px' }}>
                    {vitalityScore} <span style={{ fontSize: '12px', fontWeight: 500, color: '#94A3B8' }}>/100</span>
                  </div>
                  <div style={{ fontSize: '10px', color: '#34D399', fontWeight: 700, marginTop: '2px' }}>Peak Elasticity</div>
                </div>
              </div>

              {/* Age Calibrator Drawer */}
              {showAgeEditor && (
                <div
                  style={{
                    marginTop: '10px',
                    background: '#0B0F19',
                    borderRadius: '14px',
                    padding: '10px 14px',
                    border: '1px solid rgba(129, 140, 248, 0.3)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span style={{ fontSize: '11px', color: '#CBD5E1', fontWeight: 600 }}>
                    Chronological Age Baseline:
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {[18, 20, 22, 24, 26, 28, 30].map((age) => (
                      <button
                        key={age}
                        onClick={() => {
                          setUserActualAge(age);
                          localStorage.setItem('mirror_moment_user_actual_age', age.toString());
                        }}
                        style={{
                          background: userActualAge === age ? '#4F46E5' : '#1E293B',
                          color: '#FFFFFF',
                          border: userActualAge === age ? '1px solid #818CF8' : '1px solid #334155',
                          borderRadius: '6px',
                          padding: '3px 8px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {age}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sensor Correction Notice */}
              {profile.confidenceNote && (
                <div
                  style={{
                    marginTop: '12px',
                    background: 'rgba(56, 189, 248, 0.08)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    borderRadius: '14px',
                    padding: '10px 14px',
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'flex-start',
                  }}
                >
                  <Info size={16} color="#38BDF8" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#E0F2FE' }}>
                      Optical Sensor Normalization Applied
                    </div>
                    <div style={{ fontSize: '11px', color: '#94A3B8', lineHeight: '1.4', marginTop: '2px' }}>
                      {profile.confidenceNote}
                    </div>
                  </div>
                </div>
              )}
            </>
          );
        })()}
      </div>

      {/* Dr. Leslie Baumann's 16 Clinical Skin Types Matrix Card */}
      {profile.baumannType && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)',
            borderRadius: '24px',
            padding: '20px',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            marginBottom: '20px',
            boxShadow: '0 12px 28px -6px rgba(0, 0, 0, 0.5)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', color: '#38BDF8', fontWeight: 800, letterSpacing: '0.05em' }}>
              DR. BAUMANN CLINICAL SKIN MATRIX
            </span>
            <span
              style={{
                background: '#0284C7',
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: 800,
                padding: '3px 12px',
                borderRadius: '999px',
                letterSpacing: '0.04em',
              }}
            >
              {profile.baumannType.code}
            </span>
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#F8FAFC', margin: '0 0 6px 0' }}>
            {profile.baumannType.name}
          </h3>
          <p style={{ fontSize: '12px', color: '#94A3B8', lineHeight: '1.4', margin: '0 0 14px 0' }}>
            {profile.baumannType.summary}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.1)',
                padding: '12px',
                borderRadius: '14px',
                border: '1px solid rgba(16, 185, 129, 0.25)',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#34D399', marginBottom: '4px' }}>
                ✓ Gold Standard Actives
              </div>
              <div style={{ fontSize: '11px', color: '#CBD5E1', lineHeight: '1.3' }}>
                {profile.baumannType.recommendedActives.slice(0, 3).join(', ')}
              </div>
            </div>

            <div
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                padding: '12px',
                borderRadius: '14px',
                border: '1px solid rgba(239, 68, 68, 0.25)',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#F87171', marginBottom: '4px' }}>
                ✕ Avoid In Formulas
              </div>
              <div style={{ fontSize: '11px', color: '#CBD5E1', lineHeight: '1.3' }}>
                {profile.baumannType.contraindicatedActives.slice(0, 2).join(', ')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Environmental Weather & UV Sensor Bar */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)',
          backdropFilter: 'blur(8px)',
          borderRadius: '18px',
          padding: '16px 18px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FBBF24', fontSize: '13px', fontWeight: 700 }}>
            <Sun size={16} />
            <span>Open-Meteo Live Sensor Telemetry</span>
          </div>
          <span style={{ fontSize: '11px', color: '#38BDF8', fontWeight: 600 }}>Active Satellite Sync</span>
        </div>

        <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#CBD5E1', marginBottom: '6px' }}>
          <div>
            UV Index: <strong style={{ color: '#F87171' }}>{uvIndex} (Active)</strong>
          </div>
          <div>
            Humidity: <strong style={{ color: '#38BDF8' }}>{humidity}%</strong>
          </div>
          <div>
            Phototype: <strong style={{ color: '#FBBF24' }}>{fitzpatrick.split(' ')[0]}</strong>
          </div>
        </div>

        <p style={{ fontSize: '11px', color: '#94A3B8', margin: 0, lineHeight: '1.4' }}>
          High atmospheric UV stimulates melanin synthesis. Recommend broad-spectrum mineral SPF 50+ paired with breathable UPF 30+ wardrobe layers.
        </p>
      </div>

      {/* Quick Action Tools Row (SOS Mode + Clinical Report) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
        <button
          onClick={() => setShowSosModal(true)}
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '14px',
            padding: '12px',
            color: '#FCA5A5',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <Flame size={16} color="#EF4444" />
          <span>Barrier SOS Mode</span>
        </button>

        <button
          onClick={() => setShowClinicalReport(true)}
          style={{
            background: 'rgba(56, 189, 248, 0.12)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            borderRadius: '14px',
            padding: '12px',
            color: '#7DD3FC',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <FileText size={16} color="#38BDF8" />
          <span>Clinical Intake PDF</span>
        </button>
      </div>

      {/* Main Continue Action Button */}
      <button
        onClick={onContinue}
        style={{
          width: '100%',
          background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: '16px',
          padding: '16px',
          fontSize: '16px',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          boxShadow: '0 8px 24px rgba(79, 70, 229, 0.45)',
        }}
      >
        <span>Check a Skincare Product (100k+ Database)</span>
        <ArrowRight size={18} />
      </button>

      {/* Feature 6 Modal: Skin Barrier SOS Protocol */}
      {showSosModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(10px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#0F172A',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '24px',
              padding: '24px',
              maxWidth: '440px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(239, 68, 68, 0.25)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#EF4444', fontWeight: 800, fontSize: '18px' }}>
                <Flame size={22} />
                <span>Skin Barrier SOS Protocol</span>
              </div>
              <button
                onClick={() => setShowSosModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ color: '#E2E8F0', fontSize: '13px', lineHeight: '1.5', marginBottom: '16px' }}>
              If your skin is currently stinging, flaking, or burning, activate this immediate 48-hour rescue protocol:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', fontSize: '13px', color: '#CBD5E1' }}>
              <div style={{ background: '#1E293B', padding: '12px', borderRadius: '12px', borderLeft: '4px solid #EF4444' }}>
                <strong>1. Freeze All Actives:</strong> Stop AHA/BHA exfoliants, Retinoids, Vitamin C, and alcohol-based toners immediately.
              </div>
              <div style={{ background: '#1E293B', padding: '12px', borderRadius: '12px', borderLeft: '4px solid #10B981' }}>
                <strong>2. Cleanse Gently:</strong> Use lukewarm water only or a sulfate-free colloidal oat wash. Pat dry without rubbing.
              </div>
              <div style={{ background: '#1E293B', padding: '12px', borderRadius: '12px', borderLeft: '4px solid #38BDF8' }}>
                <strong>3. Lipid Barrier Replenishment:</strong> Apply pure Panthenol (B5) and a 3:1:1 Ceramide/Cholesterol cream twice daily.
              </div>
            </div>

            <button
              onClick={() => setShowSosModal(false)}
              style={{
                width: '100%',
                background: '#EF4444',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                padding: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Acknowledge & Close SOS
            </button>
          </div>
        </div>
      )}

      {/* Feature 15 Modal: Clinical Summary */}
      {showClinicalReport && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(10px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#0F172A',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              borderRadius: '24px',
              padding: '24px',
              maxWidth: '460px',
              width: '100%',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38BDF8', fontWeight: 800, fontSize: '18px' }}>
                <FileText size={22} />
                <span>Clinical Dermatology Intake</span>
              </div>
              <button
                onClick={() => setShowClinicalReport(false)}
                style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ fontSize: '13px', color: '#CBD5E1', marginBottom: '14px', lineHeight: '1.5' }}>
              Standardized biometric export generated from YouCam Skin AI SD metrics:
            </div>

            <div style={{ background: '#1E293B', borderRadius: '12px', padding: '14px', marginBottom: '18px', fontSize: '12px', color: '#E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Phototype Classification:</span>
                <strong>{fitzpatrick}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Baumann Skin Code:</span>
                <strong>{profile.baumannType?.code ?? 'OSPW'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Wrinkle Index:</span>
                <strong>{wrinkleScore} / 100</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Erythema (Redness) Score:</span>
                <strong>{rednessScore} / 100</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Sebum & Oiliness Index:</span>
                <strong>{oilinessScore} / 100</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Moisture Barrier Index:</span>
                <strong>{moistureScore} / 100</strong>
              </div>
            </div>

            <button
              onClick={() => {
                window.print();
              }}
              style={{
                width: '100%',
                background: '#0284C7',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                padding: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                marginBottom: '10px',
              }}
            >
              Print / Save Clinical PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
