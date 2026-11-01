import React, { useState, useEffect } from 'react';
import { UserSkinProfile } from '../agents/profiler.ts';
import { HistoricalScan, getSeededDemoScans, calculateTrend } from '../agents/tracker.ts';
import { 
  Activity, 
  RotateCcw,
  CheckCircle2
} from 'lucide-react';

interface ProgressViewProps {
  currentProfile: UserSkinProfile;
}

export const ProgressView: React.FC<ProgressViewProps> = ({ currentProfile: _currentProfile }) => {
  const [scans, setScans] = useState<HistoricalScan[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<keyof HistoricalScan['scores']>('moisture');

  useEffect(() => {
    // Check if scans exist in localStorage, otherwise load demo seeded scans
    try {
      const saved = localStorage.getItem('mirror_moment_scan_history');
      if (saved) {
        setScans(JSON.parse(saved));
      } else {
        const seeded = getSeededDemoScans();
        setScans(seeded);
        localStorage.setItem('mirror_moment_scan_history', JSON.stringify(seeded));
      }
    } catch {
      setScans(getSeededDemoScans());
    }
  }, []);

  const handleResetToDemo = () => {
    const seeded = getSeededDemoScans();
    setScans(seeded);
    try {
      localStorage.setItem('mirror_moment_scan_history', JSON.stringify(seeded));
    } catch (e) {
      console.warn(e);
    }
  };

  const trendInfo = calculateTrend(scans, selectedMetric);

  const metricLabels: Record<keyof HistoricalScan['scores'], string> = {
    moisture: 'Moisture & Hydration',
    redness: 'Redness & Sensitivity Control',
    pore: 'Pore Refinement',
    wrinkle: 'Elasticity & Fine Lines',
    dark_circle: 'Under-Eye Radiance',
    acne: 'Skin Clarity / Acne Defense',
  };

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', padding: '16px' }}>
      <header style={{ marginBottom: '20px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(79, 70, 229, 0.15)',
          padding: '4px 10px',
          borderRadius: '999px',
          fontSize: '12px',
          color: '#818CF8',
          fontWeight: 600,
          marginBottom: '8px',
        }}>
          <Activity size={14} /> Weekly Skin Health Tracking
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '6px' }}>
          Progress & Trends
        </h1>
        <p style={{ color: '#94A3B8', fontSize: '14px' }}>
          Monitor your skin health index progression across weekly scans.
        </p>
      </header>

      {/* Metric Selector Buttons */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '16px' }}>
        {(['moisture', 'redness', 'pore', 'dark_circle'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setSelectedMetric(m)}
            style={{
              background: selectedMetric === m ? '#4F46E5' : '#161F30',
              color: selectedMetric === m ? '#FFFFFF' : '#CBD5E1',
              border: selectedMetric === m ? '1px solid #6366F1' : '1px solid #2D3A54',
              borderRadius: '999px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {metricLabels[m].split('&')[0].trim()}
          </button>
        ))}
      </div>

      {/* Visual Chart Card */}
      <div style={{
        background: '#161F30',
        borderRadius: '20px',
        padding: '20px',
        border: '1px solid #2D3A54',
        marginBottom: '20px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#F8FAFC' }}>
              {metricLabels[selectedMetric]}
            </div>
            <div style={{ fontSize: '12px', color: trendInfo.delta >= 0 ? '#10B981' : '#F43F5E', fontWeight: 600, marginTop: '2px' }}>
              {trendInfo.delta >= 0 ? `+${trendInfo.delta}` : trendInfo.delta} pts across 4 weekly scans
            </div>
          </div>

          <span style={{
            fontSize: '11px',
            background: 'rgba(245, 158, 11, 0.15)',
            color: '#F59E0B',
            padding: '4px 8px',
            borderRadius: '6px',
            fontWeight: 700,
          }}>
            Demo Scan Series
          </span>
        </div>

        {/* SVG Sparkline & Bar Chart */}
        <div style={{ height: '160px', display: 'flex', alignItems: 'flex-end', gap: '16px', padding: '10px 0 20px', borderBottom: '1px solid #2D3A54' }}>
          {scans.map((s, idx) => {
            const scoreVal = s.scores[selectedMetric] || 60;
            const barHeight = Math.max(15, (scoreVal / 100) * 120);

            return (
              <div key={s.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#A5B4FC', marginBottom: '6px' }}>
                  {scoreVal}
                </span>
                <div
                  style={{
                    width: '100%',
                    maxWidth: '36px',
                    height: `${barHeight}px`,
                    background: idx === scans.length - 1 ? 'linear-gradient(180deg, #4F46E5 0%, #3730A3 100%)' : '#1E293B',
                    borderRadius: '6px 6px 0 0',
                    border: idx === scans.length - 1 ? '1px solid #818CF8' : '1px solid #334155',
                    transition: 'height 0.4s ease',
                  }}
                />
                <span style={{ fontSize: '10px', color: '#94A3B8', marginTop: '8px', textAlign: 'center' }}>
                  {s.label.split('(')[0].trim()}
                </span>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
          <span style={{ fontSize: '11px', color: '#64748B' }}>
            Baseline 4-week window
          </span>
          <button
            onClick={handleResetToDemo}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#818CF8',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 600,
            }}
          >
            <RotateCcw size={12} /> Reset Demo Scans
          </button>
        </div>
      </div>

      {/* Routine Impact Summary */}
      <div style={{
        background: '#131B2A',
        borderRadius: '16px',
        padding: '16px',
        border: '1px solid #23314B',
        marginBottom: '20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <CheckCircle2 size={16} color="#10B981" />
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC' }}>Skin Barrier Reinforcement</h3>
        </div>
        <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: '1.4' }}>
          Your moisture metric improved from <strong>58 to 78</strong> over 4 weeks following the addition of ceramide and squalane formulas while eliminating drying alcohols.
        </p>
      </div>
    </div>
  );
};
