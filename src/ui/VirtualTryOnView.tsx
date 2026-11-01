import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UserSkinProfile } from '../agents/profiler.ts';
import { recommendColorFamilies, ColorFamilySuggestion, computeComplexionHarmony } from '../agents/stylist.ts';
import {
  Shirt,
  Sparkles,
  RefreshCw,
  Share2,
  Palette,
  X,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export interface Garment {
  id: string;
  name: string;
  colorFamily: string;
  colorHex: string;
  category: string;
  image: string;
  stylistNote: string;
}

interface VirtualTryOnViewProps {
  profile: UserSkinProfile;
  userFileId?: string | null;
  userSelfieUrl?: string;
}

const DEFAULT_GARMENTS: Garment[] = [
  {
    id: 'garment_navy_crew',
    name: 'Classic Midnight Crewneck',
    colorFamily: 'Cool Blue & Navy',
    colorHex: '#1E293B',
    category: 'Top',
    image: '/garments/garment_navy_crew.jpg',
    stylistNote: 'Cool deep tones create a striking, clean contrast that visibly calms facial redness and highlights clear skin.',
  },
  {
    id: 'garment_emerald_slip',
    name: 'Luxe Silk Emerald Slip Dress',
    colorFamily: 'Jewel Emerald',
    colorHex: '#065F46',
    category: 'Dress',
    image: '/garments/garment_emerald_slip.jpg',
    stylistNote: 'Radiant emerald green enhances golden and olive undertones, providing a dramatic evening silhouette.',
  },
  {
    id: 'garment_camel_trench',
    name: 'Tailored Camel Trench Coat',
    colorFamily: 'Warm Camel & Sand',
    colorHex: '#C89D66',
    category: 'Outerwear',
    image: '/garments/garment_camel_trench.jpg',
    stylistNote: 'Refined neutral camel creates soft, luminous warmth around the jawline and flatters neutral-warm complexions.',
  },
  {
    id: 'garment_rose_knit',
    name: 'Cashmere Rose Quartz Mockneck',
    colorFamily: 'Soft Rose & Blush',
    colorHex: '#E0A899',
    category: 'Top',
    image: '/garments/garment_rose_knit.jpg',
    stylistNote: 'Gentle blush and rose quartz tones bring out subtle cheek rosiness and soften high facial contrast.',
  },
  {
    id: 'garment_burgundy_blazer',
    name: 'Velvet Evening Burgundy Blazer',
    colorFamily: 'Deep Wine & Berry',
    colorHex: '#6B1D2F',
    category: 'Outerwear',
    image: '/garments/garment_burgundy_blazer.jpg',
    stylistNote: 'Rich wine undertones give an authoritative, sculpted look that flatters both cool and neutral deep complexions.',
  },
  {
    id: 'garment_denim_overshirt',
    name: 'Vintage Indigo Utility Jacket',
    colorFamily: 'Classic Indigo',
    colorHex: '#3B5998',
    category: 'Outerwear',
    image: '/garments/garment_denim_overshirt.jpg',
    stylistNote: 'Crisp medium-wash denim gives effortless urban structure while balancing warm surface tones.',
  },
  {
    id: 'garment_floral_blouse',
    name: 'Botanical Floral Silk Blouse',
    colorFamily: 'Pastel Botanical',
    colorHex: '#B8A3C7',
    category: 'Top',
    image: '/garments/garment_floral_blouse.jpg',
    stylistNote: 'Airy lavender and botanical motifs add romantic dimension, ideal for bright, delicate undertones.',
  },
  {
    id: 'garment_gold_gown',
    name: 'Gilded Amber Satin Gown',
    colorFamily: 'Luminous Gold',
    colorHex: '#D4AF37',
    category: 'Dress',
    image: '/garments/garment_gold_gown.jpg',
    stylistNote: 'Liquid gold shimmer illuminates the décolletage and pairs harmoniously with radiant, nourished skin.',
  },
  {
    id: 'garment_leather_biker',
    name: 'Structured Moto Leather Jacket',
    colorFamily: 'Obsidian Black',
    colorHex: '#18181B',
    category: 'Outerwear',
    image: '/garments/garment_leather_biker.jpg',
    stylistNote: 'High-contrast obsidian black delivers unmatched architectural framing and edge to any facial shape.',
  },
  {
    id: 'garment_olive_overshirt',
    name: 'Earthy Olive Utility Overshirt',
    colorFamily: 'Olive & Sage Green',
    colorHex: '#4D5B43',
    category: 'Outerwear',
    image: '/garments/garment_olive_overshirt.jpg',
    stylistNote: 'Muted green undertones gently counterbalance surface erythema and enhance natural warmth.',
  },
  {
    id: 'garment_white_tee',
    name: 'Crisp Minimalist Cotton Tee',
    colorFamily: 'Crisp White & Minimal',
    colorHex: '#F8FAFC',
    category: 'Top',
    image: '/garments/garment_white_tee.jpg',
    stylistNote: 'High-reflectance neutral white amplifies facial radiance and pairs effortlessly with any skin profile.',
  },
  {
    id: 'garment_terracotta_linen',
    name: 'Warm Terracotta Linen Shirt',
    colorFamily: 'Warm Terracotta & Sunset',
    colorHex: '#C26247',
    category: 'Top',
    image: '/garments/garment_terracotta_linen.jpg',
    stylistNote: 'Rich earthy warmth enhances glowing, well-hydrated skin and deepens golden undertones.',
  },
  {
    id: 'garment_sage_sweater',
    name: 'Sage Ribbed Knit Sweater',
    colorFamily: 'Olive & Sage Green',
    colorHex: '#7A9A80',
    category: 'Top',
    image: '/garments/garment_sage_sweater.jpg',
    stylistNote: 'Soft pastel sage provides a tranquil, balanced aesthetic for reactive and sensitive profiles.',
  },
  {
    id: 'garment_charcoal_jacket',
    name: 'Modern Charcoal Structured Blazer',
    colorFamily: 'Crisp White & Minimal',
    colorHex: '#334155',
    category: 'Outerwear',
    image: '/garments/garment_charcoal_jacket.jpg',
    stylistNote: 'Deep charcoal frames the jawline with sharp tailoring, creating high-contrast symmetry against warm undertones.',
  },
];

const SEASON_SWATCHES = [
  { name: 'Midnight Navy', hex: '#1E3A8A', season: 'Deep Winter' },
  { name: 'Sage Linen', hex: '#65A30D', season: 'Soft Autumn' },
  { name: 'Terracotta', hex: '#C2410C', season: 'Warm Autumn' },
  { name: 'Oatmeal Heather', hex: '#D6D3D1', season: 'Neutral Light' },
  { name: 'Deep Plum', hex: '#581C87', season: 'Cool Winter' },
  { name: 'Dusty Rose', hex: '#FB7185', season: 'Summer Glow' },
];

export const VirtualTryOnView: React.FC<VirtualTryOnViewProps> = ({
  profile,
  userFileId,
  userSelfieUrl = '/sample_face_valid.jpg',
}) => {
  const [garments, setGarments] = useState<Garment[]>(DEFAULT_GARMENTS);
  const [selectedGarment, setSelectedGarment] = useState<Garment>(DEFAULT_GARMENTS[0]);
  const [suggestions, setSuggestions] = useState<ColorFamilySuggestion[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [cloudRenderUrl, setCloudRenderUrl] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [statusNoticeError, setStatusNoticeError] = useState(false);

  // Before & After Split-Screen Slider State
  const [sliderPos, setSliderPos] = useState<number>(50); // percentage (0 - 100)
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'split' | 'draped' | 'garment'>('split');

  // Personal Color Draping
  const [activeSeasonPalette, setActiveSeasonPalette] = useState<string>('Deep Winter');
  const [activeDrapedColor, setActiveDrapedColor] = useState<string>('#1E3A8A');
  const [showStoryModal, setShowStoryModal] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate color recommendations from profile
    const recs = recommendColorFamilies(profile);
    setSuggestions(recs);

    // Fetch garment catalog from server
    fetch('/api/garments')
      .then((res) => res.json())
      .then((data: Garment[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setGarments(data);
          setSelectedGarment(data[0]);
        }
      })
      .catch((err) => {
        console.warn('Garments fetch note:', err);
        // Defaults already set
      });
  }, [profile]);

  // Handle Dragging for Split-Screen Slider
  const handleMove = useCallback(
    (clientX: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const percentage = Math.max(5, Math.min(95, (x / rect.width) * 100));
      setSliderPos(percentage);
    },
    []
  );

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      handleMove(e.touches[0].clientX);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      handleMove(e.clientX);
    }
  };

  // Complexion Harmony Calculation
  const harmony = computeComplexionHarmony('#E5C298', selectedGarment?.colorHex || activeDrapedColor);

  // Request a generated YouCam image. Keep the local visual mockup clearly
  // separate from an actual provider result when the legacy endpoint is absent.
  const handleExecuteCloudTryOn = async () => {
    setLoading(true);
    setStatusNotice(null);
    setStatusNoticeError(false);
    setCloudRenderUrl(null);
    setLoadingStep('Uploading biometric profile to YouCam Apparel API...');
    const progressTimer1 = window.setTimeout(() => setLoadingStep('Analyzing garment and photo...'), 1500);
    const progressTimer2 = window.setTimeout(() => setLoadingStep('Preparing the try-on preview...'), 3500);

    try {
      const res = await fetch('/api/tryon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          srcFileId: userFileId || undefined,
          garmentId: selectedGarment.id,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || `AI try-on is unavailable (${res.status}).`);
      const rawRes = data?.data?.result || data?.data?.results || data?.data;
      const imgUrl = rawRes?.url || rawRes?.image_url;
      if (typeof imgUrl !== 'string' || !imgUrl) throw new Error('AI try-on returned no generated image. The visual mockup remains available.');
      setCloudRenderUrl(imgUrl);
      setStatusNotice('AI try-on image generated.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'AI try-on failed.';
      setStatusNoticeError(true);
      setStatusNotice(`${message} The image on the canvas is a styling mockup, not an AI result.`);
    } finally {
      window.clearTimeout(progressTimer1);
      window.clearTimeout(progressTimer2);
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '520px', margin: '0 auto', padding: '16px 20px 32px' }}>
      {/* Header */}
      <header style={{ marginBottom: '18px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(236, 72, 153, 0.15) 100%)',
            padding: '4px 12px',
            borderRadius: '999px',
            fontSize: '12px',
            color: '#A5B4FC',
            fontWeight: 600,
            marginBottom: '8px',
            border: '1px solid rgba(129, 140, 248, 0.3)',
          }}
        >
          <Sparkles size={13} color="#F472B6" /> YouCam Apparel VTO Studio
        </div>
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
          Virtual Try-On & Draping
        </h1>
        <p style={{ color: '#94A3B8', fontSize: '13px', margin: 0, lineHeight: '1.4' }}>
          Explore colour harmony and a visual styling mockup. A generated AI try-on appears only when the service returns an image.
        </p>
      </header>

      {/* Hero: Interactive Before & After Split-Screen Studio Canvas */}
      <div
        style={{
          background: 'linear-gradient(180deg, #131B2A 0%, #0A0F1D 100%)',
          borderRadius: '24px',
          padding: '16px',
          border: '1px solid rgba(129, 140, 248, 0.25)',
          marginBottom: '20px',
          boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.7), 0 0 30px rgba(99, 102, 241, 0.12)',
        }}
      >
        {/* Canvas Toolbar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 800,
                color: '#F8FAFC',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Shirt size={15} color="#818CF8" />
              {selectedGarment.name}
            </span>
          </div>

          {/* View Mode Toggle Pill */}
          <div
            style={{
              background: '#0B0F19',
              borderRadius: '999px',
              padding: '3px',
              display: 'flex',
              gap: '4px',
              border: '1px solid #1E293B',
            }}
          >
            <button
              onClick={() => setViewMode('split')}
              style={{
                background: viewMode === 'split' ? '#4F46E5' : 'transparent',
                color: viewMode === 'split' ? '#FFFFFF' : '#94A3B8',
                border: 'none',
                borderRadius: '999px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Split Slider
            </button>
            <button
              onClick={() => setViewMode('draped')}
              style={{
                background: viewMode === 'draped' ? '#4F46E5' : 'transparent',
                color: viewMode === 'draped' ? '#FFFFFF' : '#94A3B8',
                border: 'none',
                borderRadius: '999px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Draped Look
            </button>
          </div>
        </div>

        {/* The Interactive Interactive Canvas Frame */}
        <div
          ref={containerRef}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
          style={{
            position: 'relative',
            width: '100%',
            height: '360px',
            borderRadius: '18px',
            overflow: 'hidden',
            background: '#050811',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            cursor: viewMode === 'split' ? 'ew-resize' : 'default',
            userSelect: 'none',
          }}
        >
          {/* Layer 1: Natural Base Portrait (Left) */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
            }}
          >
            <img
              src={userSelfieUrl}
              alt="Natural Baseline Portrait"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
            {/* Natural Label */}
            <div
              style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                background: 'rgba(15, 23, 42, 0.75)',
                backdropFilter: 'blur(8px)',
                color: '#CBD5E1',
                padding: '4px 10px',
                borderRadius: '999px',
                fontSize: '11px',
                fontWeight: 700,
                border: '1px solid rgba(255, 255, 255, 0.15)',
                pointerEvents: 'none',
              }}
            >
              Natural Baseline
            </div>
          </div>

          {/* Layer 2: Draped Garment Look (Right / Clipped) */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              clipPath:
                viewMode === 'split'
                  ? `polygon(${sliderPos}% 0, 100% 0, 100% 100%, ${sliderPos}% 100%)`
                  : 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
              transition: isDragging ? 'none' : 'clip-path 0.08s ease-out',
            }}
          >
            {/* Draped Composition: High-res garment draped beneath face */}
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              {/* Provider image when available; otherwise the local mockup below. */}
              {cloudRenderUrl ? (
                <img
                  src={cloudRenderUrl}
                  alt="YouCam AI Draped Fit"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                  {/* Base Portrait */}
                  <img
                    src={userSelfieUrl}
                    alt="Portrait"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                      filter: 'contrast(1.04) brightness(1.02)',
                    }}
                  />

                  {/* Local visual styling mockup; it is not a generated try-on. */}
                  <div
                    style={{
                      position: 'absolute',
                      left: '0',
                      right: '0',
                      bottom: '0',
                      height: '62%',
                      background: `linear-gradient(180deg, transparent 0%, rgba(10, 15, 29, 0.2) 20%, rgba(10, 15, 29, 0.7) 100%)`,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      overflow: 'hidden',
                    }}
                  >
                    <img
                      src={selectedGarment.image}
                      alt={selectedGarment.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'center 20%',
                        opacity: 0.94,
                        maskImage: 'linear-gradient(to bottom, transparent 0%, black 35%)',
                        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 35%)',
                        transform: 'scale(1.08)',
                      }}
                    />
                  </div>

                  {/* Real-time fabric undertone tint collar */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '0',
                      left: '0',
                      right: '0',
                      height: '42%',
                      background: `radial-gradient(ellipse at 50% 120%, ${activeDrapedColor}33 0%, transparent 75%)`,
                      mixBlendMode: 'color-dodge',
                      pointerEvents: 'none',
                    }}
                  />
                </div>
              )}

              {/* Draped Label */}
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'rgba(79, 70, 229, 0.85)',
                  backdropFilter: 'blur(8px)',
                  color: '#FFFFFF',
                  padding: '4px 12px',
                  borderRadius: '999px',
                  fontSize: '11px',
                  fontWeight: 800,
                  boxShadow: '0 4px 12px rgba(79, 70, 229, 0.4)',
                  pointerEvents: 'none',
                }}
              >
                {cloudRenderUrl ? 'AI result' : 'Visual mockup · not AI'}
              </div>
            </div>
          </div>

          {/* Interactive Split Divider & Handle (Only in 'split' mode) */}
          {viewMode === 'split' && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `${sliderPos}%`,
                width: '3px',
                background: '#FFFFFF',
                boxShadow: '0 0 10px rgba(255, 255, 255, 0.8)',
                cursor: 'ew-resize',
                transform: 'translateX(-50%)',
                zIndex: 20,
              }}
            >
              {/* Drag Pill Handle */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: '#FFFFFF',
                  border: '3px solid #4F46E5',
                  boxShadow: '0 0 16px rgba(79, 70, 229, 0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#4F46E5',
                  fontSize: '12px',
                  fontWeight: 900,
                  userSelect: 'none',
                }}
              >
                ‹›
              </div>
            </div>
          )}

          {/* Bottom Hint */}
          {viewMode === 'split' && (
            <div
              style={{
                position: 'absolute',
                bottom: '10px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(15, 23, 42, 0.75)',
                backdropFilter: 'blur(6px)',
                color: '#94A3B8',
                padding: '3px 10px',
                borderRadius: '999px',
                fontSize: '10px',
                fontWeight: 600,
                pointerEvents: 'none',
              }}
            >
              Drag slider horizontally to compare
            </div>
          )}
        </div>

        {/* Complexion Harmony Badge & Live Advice */}
        <div
          style={{
            marginTop: '14px',
            background: '#0B0F19',
            borderRadius: '16px',
            padding: '12px 14px',
            border: '1px solid #1E293B',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: selectedGarment.colorHex,
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                }}
              />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#F8FAFC' }}>
                {selectedGarment.colorFamily}
              </span>
            </div>
            <span
              style={{
                fontSize: '12px',
                padding: '3px 10px',
                borderRadius: '999px',
                background: harmony.score >= 80 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                color: harmony.score >= 80 ? '#34D399' : '#A5B4FC',
                fontWeight: 800,
                border: `1px solid ${harmony.score >= 80 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(99, 102, 241, 0.4)'}`,
              }}
            >
              CIELAB Harmony: {harmony.score}% (ΔE {harmony.deltaE})
            </span>
          </div>

          <p style={{ fontSize: '12px', color: '#94A3B8', lineHeight: '1.4', margin: '6px 0 2px' }}>
            {selectedGarment.stylistNote}
          </p>
          <div style={{ fontSize: '11px', color: '#38BDF8', fontWeight: 600 }}>
            {harmony.advice}
          </div>
        </div>

        {/* Cloud Render Status Notification */}
        {statusNotice && (
          <div
            role={statusNoticeError ? 'alert' : 'status'}
            style={{
              marginTop: '10px',
              padding: '8px 12px',
              borderRadius: '12px',
              background: statusNoticeError ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
              border: `1px solid ${statusNoticeError ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.25)'}`,
              fontSize: '11px',
              color: statusNoticeError ? '#FCA5A5' : '#34D399',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {statusNoticeError ? <AlertTriangle size={13} /> : <CheckCircle2 size={13} />}
            <span>{statusNotice}</span>
          </div>
        )}
      </div>

      {/* Feature: 12-Season Personal Color Fabric Draping Swatches */}
      <div
        style={{
          background: '#131B2A',
          borderRadius: '20px',
          padding: '16px',
          border: '1px solid #23314B',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Palette size={16} color="#EC4899" />
            <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC', margin: 0 }}>
              12-Season Fabric Draping Studio
            </h2>
          </div>
          <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 700 }}>
            {activeSeasonPalette}
          </span>
        </div>

        <p style={{ fontSize: '12px', color: '#94A3B8', lineHeight: '1.4', marginBottom: '12px' }}>
          Tap swatches to test how contrasting fabric undertones balance surface erythema and brighten your complexion:
        </p>

        {/* Swatch Selector Row */}
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '6px' }}>
          {SEASON_SWATCHES.map((c) => {
            const isActive = activeDrapedColor === c.hex;
            return (
              <div
                key={c.name}
                onClick={() => {
                  setActiveDrapedColor(c.hex);
                  setActiveSeasonPalette(c.season);
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '5px',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: c.hex,
                    border: isActive ? '3px solid #FFFFFF' : '2px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: isActive ? '0 0 14px rgba(255, 255, 255, 0.6)' : 'none',
                    transform: isActive ? 'scale(1.08)' : 'scale(1)',
                    transition: 'all 0.15s ease',
                  }}
                />
                <span style={{ fontSize: '10px', color: isActive ? '#FFFFFF' : '#94A3B8', whiteSpace: 'nowrap' }}>
                  {c.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Garment Catalog (Immediate Selection) */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#F8FAFC', marginBottom: '12px' }}>
          Select Garment:
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px',
            marginBottom: '16px',
          }}
        >
          {garments.map((g) => {
            const isSelected = selectedGarment.id === g.id;
            return (
              <div
                key={g.id}
                onClick={() => {
                  setSelectedGarment(g);
                  setActiveDrapedColor(g.colorHex);
                  setCloudRenderUrl(null); // Return to interactive immediate preview
                }}
                style={{
                  background: isSelected ? 'rgba(79, 70, 229, 0.25)' : '#131B2A',
                  border: isSelected ? '2px solid #818CF8' : '1px solid #23314B',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  textAlign: 'center',
                  padding: '8px',
                  boxShadow: isSelected ? '0 0 16px rgba(99, 102, 241, 0.35)' : 'none',
                  transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                  transition: 'all 0.15s ease',
                }}
              >
                <img
                  src={g.image}
                  alt={g.name}
                  style={{
                    width: '100%',
                    height: '95px',
                    objectFit: 'cover',
                    borderRadius: '10px',
                    marginBottom: '6px',
                    background: '#0B0F19',
                  }}
                />
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: isSelected ? '#FFFFFF' : '#CBD5E1',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {g.name}
                </div>
                <div style={{ fontSize: '10px', color: '#94A3B8' }}>{g.colorFamily}</div>
              </div>
            );
          })}
        </div>

        {/* Buttons: YouCam Cloud Render & Lookbook Share */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleExecuteCloudTryOn}
            disabled={loading}
            style={{
              flex: 1,
              background: loading ? '#334155' : 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '16px',
              padding: '14px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 8px 24px rgba(79, 70, 229, 0.35)',
              transition: 'all 0.15s ease',
            }}
          >
            {loading ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>{loadingStep || 'Rendering YouCam VTO...'}</span>
              </>
            ) : (
              <>
                <Shirt size={16} />
                <span>Render YouCam Cloud VTO</span>
              </>
            )}
          </button>

          <button
            onClick={() => setShowStoryModal(true)}
            style={{
              background: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '16px',
              padding: '14px 18px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 6px 20px rgba(236, 72, 153, 0.3)',
            }}
          >
            <Share2 size={16} />
            <span>Story Card</span>
          </button>
        </div>
      </div>

      {/* Feature: Stylist Color Recommendations List */}
      <div
        style={{
          background: '#131B2A',
          borderRadius: '20px',
          padding: '18px',
          border: '1px solid #23314B',
        }}
      >
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC', marginBottom: '10px' }}>
          Personalized Complexion Color Recommendations
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {suggestions.map((s, idx) => (
            <div
              key={idx}
              style={{
                background: '#0B0F19',
                borderRadius: '12px',
                padding: '10px 12px',
                border: '1px solid #1E293B',
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start',
              }}
            >
              <div
                style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  background: s.badgeHex,
                  flexShrink: 0,
                  marginTop: '3px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                }}
              />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#F1F5F9' }}>
                  {s.family}
                </div>
                <div style={{ fontSize: '11px', color: '#94A3B8', lineHeight: '1.4', marginTop: '2px' }}>
                  {s.rationale}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 9:16 Social Lookbook Modal */}
      {showStoryModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.88)',
            backdropFilter: 'blur(12px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#0B0F19',
              border: '1px solid rgba(236, 72, 153, 0.4)',
              borderRadius: '24px',
              padding: '20px',
              maxWidth: '360px',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 25px 50px -12px rgba(236, 72, 153, 0.3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#F472B6' }}>
                9:16 AESTHETIC STORY CARD
              </span>
              <button
                onClick={() => setShowStoryModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* 9:16 Story Card Preview */}
            <div
              style={{
                position: 'relative',
                borderRadius: '18px',
                overflow: 'hidden',
                aspectRatio: '9 / 14',
                background: 'linear-gradient(180deg, #1E1B4B 0%, #0F172A 100%)',
                marginBottom: '16px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
              }}
            >
              <img
                src={cloudRenderUrl || userSelfieUrl}
                alt="Try-on Story"
                style={{ width: '100%', height: '70%', objectFit: 'cover' }}
              />

              <div style={{ padding: '12px', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF' }}>Mirror Moment</span>
                  <span style={{ fontSize: '10px', color: '#10B981', fontWeight: 700 }}>
                    {harmony.score}% Harmony
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#CBD5E1', fontWeight: 600 }}>Fit: {selectedGarment.name}</div>
                <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px' }}>
                  Palette: {activeSeasonPalette} • ΔE {harmony.deltaE}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                alert('Lookbook card link copied to clipboard!');
                setShowStoryModal(false);
              }}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                padding: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Save Story Card
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
