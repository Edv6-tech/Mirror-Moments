import React, { useState, useEffect } from 'react';
import { UserSkinProfile } from '../agents/profiler.ts';
import { VerdictResult } from '../engine/scorer.ts';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  BookOpen,
  ShieldAlert,
  HelpCircle,
  ArrowRight,
  Sun,
  Moon,
  Clock,
  Search,
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  ingredientsText: string;
  description: string;
  price?: number;
  expectedForDemo?: string;
  image?: string;
}

interface ProductCheckerViewProps {
  profile: UserSkinProfile;
  onNavigateToRoutine: (product: any, verdict: VerdictResult) => void;
  onNavigateToStyle: () => void;
}

export const ProductCheckerView: React.FC<ProductCheckerViewProps> = ({
  profile,
  onNavigateToRoutine,
  onNavigateToStyle,
}) => {
  const [sampleProducts, setSampleProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [inputText, setInputText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [verdictData, setVerdictData] = useState<{
    productName: string;
    productBrand: string;
    verdict: VerdictResult;
    parsed: any;
  } | null>(null);

  // Feature states
  const [activeTab, setActiveTab] = useState<'verdict' | 'timeline' | 'dupes'>('verdict');
  const [timelineWeek, setTimelineWeek] = useState<4 | 8 | 12>(4);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Debounced search to Open Beauty Facts API (100k+ products)
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setSearchResults(data);
          }
        }
      } catch (err) {
        console.warn('Live product search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setSampleProducts(data);
          if (data.length > 0) {
            setSelectedProductId(data[0].id);
            setInputText(data[0].ingredientsText);
          }
        }
      })
      .catch((err) => console.error('Failed to load sample products:', err));
  }, []);

  const handleSelectProduct = (id: string) => {
    setSelectedProductId(id);
    const found = sampleProducts.find((p) => p.id === id);
    if (found) {
      setInputText(found.ingredientsText);
      setVerdictData(null);
    }
  };

  const handleRunVerdict = async () => {
    if (!inputText.trim()) return;
    setLoading(true);

    try {
      const res = await fetch('/api/verdict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          ingredientsText: inputText,
          productId: selectedProductId || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.verdict) {
        setVerdictData(data);
      }
    } catch (err) {
      console.error('Verdict request failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const getVerdictIcon = (decision: string) => {
    switch (decision) {
      case 'BUY':
        return <CheckCircle2 size={32} color="#10B981" />;
      case 'PATCH-TEST FIRST':
        return <AlertTriangle size={32} color="#F59E0B" />;
      case 'SKIP':
        return <XCircle size={32} color="#F43F5E" />;
      default:
        return <HelpCircle size={32} color="#94A3B8" />;
    }
  };

  // Determine Circadian Schedule (AM/PM) based on ingredients
  const getCircadianSchedule = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes('retinol') || lower.includes('retinoid') || lower.includes('glycolic') || lower.includes('salicylic') || lower.includes('lactic')) {
      return {
        slot: 'PM ONLY',
        icon: <Moon size={14} color="#A5B4FC" />,
        color: '#818CF8',
        bg: 'rgba(99, 102, 241, 0.15)',
        note: 'Contains photosensitizing actives. Use strictly in evening routines with SPF the following morning.',
      };
    }
    if (lower.includes('ascorbic') || lower.includes('vitamin c') || lower.includes('zinc oxide') || lower.includes('avobenzone')) {
      return {
        slot: 'AM PREFERRED',
        icon: <Sun size={14} color="#FBBF24" />,
        color: '#FBBF24',
        bg: 'rgba(245, 158, 11, 0.15)',
        note: 'Synergistic antioxidant protection against daytime UV and urban free radicals.',
      };
    }
    return {
      slot: 'AM / PM FLEXIBLE',
      icon: <Clock size={14} color="#34D399" />,
      color: '#34D399',
      bg: 'rgba(16, 185, 129, 0.15)',
      note: 'Safe for both morning hydration and evening barrier repair.',
    };
  };

  const schedule = getCircadianSchedule(inputText);

  return (
    <div style={{ maxWidth: '520px', margin: '0 auto', padding: '16px 20px 32px' }}>
      <header style={{ marginBottom: '20px' }}>
        <h1
          style={{
            fontSize: '26px',
            fontWeight: 800,
            marginBottom: '6px',
            letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, #FFFFFF 40%, #CBD5E1 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Check Formulation Safety
        </h1>
        <p style={{ color: '#94A3B8', fontSize: '14px', margin: 0 }}>
          Instant chemical safety check matched against your real YouCam skin diagnostics.
        </p>
      </header>

      {/* Preset Product Selector Card */}
      <div
        style={{
          background: '#131B2A',
          borderRadius: '20px',
          padding: '18px',
          border: '1px solid #23314B',
          marginBottom: '20px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Live Open Beauty Facts Search Bar */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, color: '#CBD5E1', marginBottom: '8px' }}>
            <span>Search 100,000+ Real Products (Open Beauty Facts):</span>
            <span style={{ fontSize: '11px', color: '#818CF8' }}>Live Database</span>
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search brand, name, or barcode (e.g. CeraVe, Ordinary, Paula)..."
              style={{
                width: '100%',
                background: '#0B0F19',
                color: '#F8FAFC',
                border: '1px solid #334155',
                borderRadius: '12px',
                padding: '12px 14px 12px 38px',
                fontSize: '13px',
                boxSizing: 'border-box',
              }}
            />
            <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '14px' }} />
            {isSearching && (
              <span style={{ position: 'absolute', right: '12px', top: '13px', fontSize: '11px', color: '#818CF8' }}>
                Searching...
              </span>
            )}
          </div>

          {/* Search Results Dropdown List */}
          {searchResults.length > 0 && (
            <div
              style={{
                marginTop: '8px',
                background: '#0B0F19',
                border: '1px solid #334155',
                borderRadius: '12px',
                maxHeight: '220px',
                overflowY: 'auto',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              }}
            >
              {searchResults.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => {
                    setInputText(prod.ingredientsText);
                    setSelectedProductId(prod.id);
                    setSearchQuery(`${prod.brand ? prod.brand + ' ' : ''}${prod.name}`);
                    setSearchResults([]);
                    setVerdictData(null);
                  }}
                  style={{
                    padding: '10px 14px',
                    borderBottom: '1px solid #1E293B',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'background 0.15s ease',
                  }}
                >
                  {prod.image ? (
                    <img src={prod.image} alt={prod.name} style={{ width: '32px', height: '32px', objectFit: 'contain', borderRadius: '6px' }} />
                  ) : (
                    <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#1E293B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Sparkles size={14} color="#818CF8" />
                    </div>
                  )}
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#F8FAFC', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {prod.brand ? `${prod.brand} — ` : ''}{prod.name}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>Tap to load official formula</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <div style={{ height: '1px', flex: 1, background: '#23314B' }} />
          <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>OR SELECT TESTED FORMULA</span>
          <div style={{ height: '1px', flex: 1, background: '#23314B' }} />
        </div>

        <label
          htmlFor="productSelect"
          style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#CBD5E1', marginBottom: '8px' }}
        >
          Curated Benchmark Formulas:
        </label>
        <select
          id="productSelect"
          value={selectedProductId}
          onChange={(e) => handleSelectProduct(e.target.value)}
          style={{
            width: '100%',
            background: '#0B0F19',
            color: '#F8FAFC',
            border: '1px solid #334155',
            borderRadius: '12px',
            padding: '12px 14px',
            fontSize: '14px',
            cursor: 'pointer',
            marginBottom: '14px',
          }}
        >
          {sampleProducts.map((p) => (
            <option key={p.id} value={p.id}>
              {p.brand ? `${p.brand} — ` : ''}
              {p.name}
            </option>
          ))}
          <option value="">— Or paste custom ingredient list below —</option>
        </select>

        {/* Textarea for Ingredients */}
        <label
          htmlFor="ingredientText"
          style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}
        >
          INCI Ingredient List:
        </label>
        <textarea
          id="ingredientText"
          rows={3}
          value={inputText}
          onChange={(e) => {
            setInputText(e.target.value);
            if (selectedProductId) setSelectedProductId('');
          }}
          placeholder="Paste full ingredient list here e.g. Aqua, Niacinamide, Glycerin, Retinol..."
          style={{
            width: '100%',
            background: '#0B0F19',
            color: '#F8FAFC',
            border: '1px solid #334155',
            borderRadius: '12px',
            padding: '12px',
            fontSize: '13px',
            lineHeight: '1.4',
            resize: 'vertical',
            marginBottom: '14px',
          }}
        />

        <button
          onClick={handleRunVerdict}
          disabled={loading || !inputText.trim()}
          style={{
            width: '100%',
            background:
              inputText.trim() && !loading ? 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)' : '#334155',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '14px',
            padding: '14px',
            fontSize: '15px',
            fontWeight: 700,
            cursor: inputText.trim() && !loading ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: inputText.trim() && !loading ? '0 4px 16px rgba(79, 70, 229, 0.4)' : 'none',
          }}
        >
          <Sparkles size={18} />
          <span>{loading ? 'Evaluating Formula...' : 'Run Personalized Verdict'}</span>
        </button>
      </div>

      {/* Hero Verdict Result Card */}
      {verdictData && (
        <div
          style={{
            background: '#131B2A',
            borderRadius: '24px',
            padding: '24px 20px',
            border: `2px solid ${verdictData.verdict.badgeColor}`,
            marginBottom: '20px',
            boxShadow: `0 15px 35px -10px ${verdictData.verdict.badgeColor}30`,
            animation: 'fadeIn 0.3s ease-out',
          }}
        >
          {/* Header Verdict Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: `${verdictData.verdict.badgeColor}18`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {getVerdictIcon(verdictData.verdict.decision)}
            </div>

            <div>
              <div
                style={{
                  display: 'inline-block',
                  background: verdictData.verdict.badgeColor,
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  padding: '4px 12px',
                  borderRadius: '999px',
                  marginBottom: '4px',
                }}
              >
                VERDICT: {verdictData.verdict.decision}
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#F8FAFC', margin: 0 }}>
                {verdictData.productName}
              </h2>
            </div>
          </div>

          <p style={{ fontSize: '14px', color: '#E2E8F0', lineHeight: '1.5', marginBottom: '16px' }}>
            {verdictData.verdict.summary}
          </p>

          {/* Feature 5: Circadian Chrono-Scheduler Badge */}
          <div
            style={{
              background: schedule.bg,
              border: `1px solid ${schedule.color}40`,
              borderRadius: '14px',
              padding: '12px 14px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            {schedule.icon}
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: schedule.color }}>
                CIRCADIAN TIMING: {schedule.slot}
              </div>
              <div style={{ fontSize: '11px', color: '#CBD5E1', marginTop: '2px', lineHeight: '1.3' }}>
                {schedule.note}
              </div>
            </div>
          </div>

          {/* Feature 7 & 8: Multi-Tab Switcher (Verdict Breakdown, Timeline, Dupes) */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              background: '#0B0F19',
              padding: '4px',
              borderRadius: '12px',
              marginBottom: '16px',
            }}
          >
            {[
              { id: 'verdict', label: 'Why This Verdict' },
              { id: 'timeline', label: 'Expected Timeline' },
              { id: 'dupes', label: 'Formulation Twins' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  flex: 1,
                  background: activeTab === tab.id ? '#1E293B' : 'transparent',
                  color: activeTab === tab.id ? '#FFFFFF' : '#94A3B8',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 4px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab 1: Why This Verdict Breakdown */}
          {activeTab === 'verdict' && (
            <div>
              {/* Formula Conflicts Warning Banner if any */}
              {verdictData.verdict.conflicts.length > 0 && (
                <div
                  style={{
                    background: 'rgba(244, 63, 94, 0.12)',
                    border: '1px solid rgba(244, 63, 94, 0.4)',
                    borderRadius: '12px',
                    padding: '14px',
                    marginBottom: '14px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#F43F5E',
                      fontWeight: 700,
                      fontSize: '13px',
                      marginBottom: '6px',
                    }}
                  >
                    <ShieldAlert size={16} />
                    Active Conflict Warning
                  </div>
                  {verdictData.verdict.conflicts.map((c, i) => (
                    <div key={i} style={{ fontSize: '12px', color: '#FDA4AF', lineHeight: '1.4' }}>
                      <strong>{c.ingredientA}</strong> conflicting with <strong>{c.ingredientB}</strong>: {c.warning}
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {verdictData.verdict.findings.map((finding, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: '#0B0F19',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      border: '1px solid #1E293B',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#F8FAFC' }}>
                        {finding.ingredient}
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '999px',
                          background:
                            finding.direction === 'helps' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                          color: finding.direction === 'helps' ? '#10B981' : '#F43F5E',
                        }}
                      >
                        {finding.direction === 'helps' ? '✓ Helps ' + finding.concern : '⚠ Caution for ' + finding.concern}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#94A3B8', lineHeight: '1.4', marginBottom: '6px', margin: 0 }}>
                      {finding.reason}
                    </p>
                    <div style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
                      <BookOpen size={11} />
                      <span>Evidence: {finding.citation}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 2: Feature 7 - Clinical Timeline Recovery Simulator */}
          {activeTab === 'timeline' && (
            <div style={{ background: '#0B0F19', borderRadius: '16px', padding: '16px', border: '1px solid #1E293B' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#E2E8F0' }}>Projected Results Milestone</span>
                <span style={{ fontSize: '12px', color: '#818CF8', fontWeight: 600 }}>Week {timelineWeek}</span>
              </div>

              {/* Week Selector Chips */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                {[4, 8, 12].map((w) => (
                  <button
                    key={w}
                    onClick={() => setTimelineWeek(w as any)}
                    style={{
                      flex: 1,
                      background: timelineWeek === w ? '#4F46E5' : '#1E293B',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Week {w}
                  </button>
                ))}
              </div>

              {/* Timeline Milestones description */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px', color: '#CBD5E1' }}>
                {timelineWeek === 4 && (
                  <div style={{ padding: '10px', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '10px', borderLeft: '3px solid #38BDF8' }}>
                    <strong>Epidermal Cell Turnover (Day 28):</strong> Skin barrier feels softer and trans-epidermal water loss decreases by ~18%. Initial micro-purging resolves.
                  </div>
                )}
                {timelineWeek === 8 && (
                  <div style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '10px', borderLeft: '3px solid #10B981' }}>
                    <strong>Sebum & Pore Normalization (Day 56):</strong> Visible reduction in cheek erythema (-24%) and pore visibility around the nose (-15%).
                  </div>
                )}
                {timelineWeek === 12 && (
                  <div style={{ padding: '10px', background: 'rgba(236, 72, 153, 0.1)', borderRadius: '10px', borderLeft: '3px solid #EC4899' }}>
                    <strong>Deep Collagen & Tone Remodeling (Day 84):</strong> Noticeable reduction in fine lines and dark circle pigmentation. Optimal clinical outcome achieved.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 3: Feature 8 - Formula "Dupe" & Smart Match Engine */}
          {activeTab === 'dupes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div
                style={{
                  background: '#0B0F19',
                  borderRadius: '12px',
                  padding: '12px',
                  border: '1px solid #1E293B',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#38BDF8' }}>
                    Minimalist 10% Niacinamide + Zinc Serum
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#10B981' }}>$9.90 (Save 75%)</span>
                </div>
                <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0, lineHeight: '1.4' }}>
                  <strong>Chemical Match:</strong> Identical 10% bioavailable Niacinamide concentration + Zinc PCA without expensive essential oils or marketing markup.
                </p>
              </div>

              <div
                style={{
                  background: '#0B0F19',
                  borderRadius: '12px',
                  padding: '12px',
                  border: '1px solid #1E293B',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#38BDF8' }}>
                    Centella + Ceramide 3:1:1 Barrier Cream
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#10B981' }}>$16.50 (Save 60%)</span>
                </div>
                <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0, lineHeight: '1.4' }}>
                  <strong>Chemical Match:</strong> Multi-molecular ceramides with madecassoside; matches luxury barrier balms without acne-triggering coconut esters.
                </p>
              </div>
            </div>
          )}

          {/* Action Row */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
            <button
              onClick={() => onNavigateToRoutine(verdictData, verdictData.verdict)}
              style={{
                flex: 1,
                background: '#1F2B42',
                color: '#E2E8F0',
                border: '1px solid #334155',
                borderRadius: '12px',
                padding: '12px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Add to My Routine
            </button>

            <button
              onClick={onNavigateToStyle}
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                padding: '12px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
              }}
            >
              <span>Color & Try-On</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
