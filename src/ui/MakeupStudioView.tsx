import React, { useState, useEffect, useRef, useMemo } from 'react';
import { UserSkinProfile } from '../agents/profiler.ts';
import {
  Sparkles,
  Upload,
  RotateCcw,
  Download,
  Check,
  Sliders,
  Scissors,
  Wand2,
  Filter,
  Shirt,
  Palette,
  ArrowLeftRight,
} from 'lucide-react';

export type StudioTab = 'makeup' | 'hair' | 'retouch' | 'reshape' | 'filters' | 'stylist';

interface MakeupStudioViewProps {
  profile?: UserSkinProfile | null;
  userSelfieUrl?: string;
  initialTab?: StudioTab;
  onNavigateToTryOn?: () => void;
  onNavigateToSkinAI?: () => void;
  onNavigateToRoutine?: () => void;
}

// Curated Lipstick Shades
const LIPSTICK_SHADES = [
  { id: 'ruby_velvet', name: 'Ruby Velvet', hex: '#9B111E', undertone: 'Cool Deep', family: 'Red' },
  { id: 'crimson_muse', name: 'Crimson Muse', hex: '#C41E3A', undertone: 'True Neutral', family: 'Red' },
  { id: 'naked_rose', name: 'Naked Rose', hex: '#C5827C', undertone: 'Neutral Warm', family: 'Nude' },
  { id: 'coral_sunset', name: 'Coral Sunset', hex: '#E8614E', undertone: 'Warm Peach', family: 'Coral' },
  { id: 'berry_noir', name: 'Berry Noir', hex: '#4A1525', undertone: 'Cool Winter', family: 'Berry' },
  { id: 'mauve_luxe', name: 'Mauve Luxe', hex: '#915C83', undertone: 'Cool Neutral', family: 'Mauve' },
  { id: 'spiced_mocha', name: 'Spiced Mocha', hex: '#783E2E', undertone: 'Warm Terracotta', family: 'Brown' },
  { id: 'soft_peony', name: 'Soft Peony', hex: '#D97D96', undertone: 'Light Rose', family: 'Pink' },
  { id: 'fuchsia_flash', name: 'Fuchsia Flash', hex: '#D91E5B', undertone: 'Bright Cool', family: 'Pink' },
  { id: 'golden_terracotta', name: 'Sunlit Clay', hex: '#B85338', undertone: 'True Autumn', family: 'Warm' },
];

// Foundation Shades
const FOUNDATION_SHADES = [
  { id: 'fair_ivory', name: 'Fair Ivory', hex: '#F9E7DA', undertone: 'Cool Pink', depth: 'Fair' },
  { id: 'light_vanilla', name: 'Light Vanilla', hex: '#F3E0CC', undertone: 'Neutral', depth: 'Light' },
  { id: 'golden_wheat', name: 'Golden Wheat', hex: '#E7C499', undertone: 'Warm Golden', depth: 'Medium Light' },
  { id: 'olive_almond', name: 'Olive Almond', hex: '#D0A674', undertone: 'Warm Olive', depth: 'Medium' },
  { id: 'amber_honey', name: 'Amber Honey', hex: '#BF8B56', undertone: 'Warm Amber', depth: 'Tan' },
  { id: 'toasted_caramel', name: 'Toasted Caramel', hex: '#A16E3B', undertone: 'Rich Bronze', depth: 'Deep Tan' },
  { id: 'rich_cocoa', name: 'Rich Cocoa', hex: '#6D4428', undertone: 'Neutral Deep', depth: 'Deep' },
  { id: 'espresso_luxe', name: 'Espresso Obsidian', hex: '#492B18', undertone: 'Cool Deep', depth: 'Rich' },
];

// Eyeshadow Palettes
const EYESHADOW_PALETTES = [
  { id: 'none', name: 'Bare Natural', primary: 'transparent', secondary: 'transparent' },
  { id: 'rose_quartz', name: 'Rose Quartz Shimmer', primary: '#C88B98', secondary: '#E3B5C0', mood: 'Romantic' },
  { id: 'sunset_amber', name: 'Sunset Bronze', primary: '#A65329', secondary: '#DE9B72', mood: 'Warm Golden' },
  { id: 'smokey_taupe', name: 'Parisian Taupe', primary: '#4A423D', secondary: '#8A7D75', mood: 'Sultry' },
  { id: 'golden_champagne', name: 'Gilded Champagne', primary: '#BF9B30', secondary: '#E8D497', mood: 'Luminous' },
  { id: 'cyber_violet', name: 'Cyber Lavender', primary: '#6B4C82', secondary: '#A58DBA', mood: 'Editorial' },
];

// Blush Shades
const BLUSH_SHADES = [
  { id: 'none', name: 'Natural Cheek', hex: 'transparent' },
  { id: 'peach_glow', name: 'Peach Glow', hex: '#F39C7E' },
  { id: 'petal_pink', name: 'Petal Blossom', hex: '#F08080' },
  { id: 'sunkissed_amber', name: 'Warm Terracotta', hex: '#D97757' },
  { id: 'berry_dew', name: 'Dewy Blackberry', hex: '#C05A74' },
];

// Hair Colors
const HAIR_COLORS = [
  { id: 'natural', name: 'Original Hair', hex: 'transparent' },
  { id: 'honey_blonde', name: 'Honey Blonde Balayage', hex: '#D4AF37', tone: 'Warm Golden' },
  { id: 'platinum_ice', name: 'Platinum Ice Blonde', hex: '#EBE6D6', tone: 'Cool Arctic' },
  { id: 'espresso_noir', name: 'Espresso Jet Black', hex: '#1C1917', tone: 'Neutral Deep' },
  { id: 'auburn_copper', name: 'Cherry Auburn Copper', hex: '#882D17', tone: 'Rich Warm' },
  { id: 'rose_gold', name: 'Dusty Rose Gold', hex: '#D48C9E', tone: 'Pastel Chic' },
  { id: 'midnight_blue', name: 'Midnight Violet Navy', hex: '#1E293B', tone: 'Vibrant Cool' },
  { id: 'silver_smoke', name: 'Silver Smoke Ombré', hex: '#94A3B8', tone: 'Ash Cool' },
];

// Hairstyles
const HAIRSTYLES = [
  { id: 'original', name: 'Original Cut', icon: '✨' },
  { id: 'glam_waves', name: 'Hollywood Glam Waves', icon: '🌊' },
  { id: 'french_bob', name: 'Chic French Bob', icon: '💇' },
  { id: 'curtain_bangs', name: 'Curtain Bangs & Blowout', icon: '💫' },
  { id: 'high_ponytail', name: 'Snatched High Ponytail', icon: '👱‍♀️' },
  { id: 'textured_pixie', name: 'Parisian Textured Pixie', icon: '⚡' },
];

// Editorial Filters
const EDITORIAL_FILTERS = [
  { id: 'none', name: 'Original Look', filterStyle: 'none' },
  { id: 'parisian_glow', name: 'Parisian Glow', filterStyle: 'contrast(1.08) saturate(1.15) brightness(1.04) sepia(0.08)' },
  { id: 'golden_hour', name: 'Golden Hour 4PM', filterStyle: 'sepia(0.25) saturate(1.25) contrast(1.05) brightness(1.02)' },
  { id: 'clean_girl', name: 'Clean Girl Dewy', filterStyle: 'brightness(1.08) contrast(1.02) saturate(1.06)' },
  { id: 'vintage_kodak', name: 'Kodak Portra 400', filterStyle: 'contrast(1.12) sepia(0.18) saturate(1.1) hue-rotate(-5deg)' },
  { id: 'cyber_tokyo', name: 'Cyberpunk Neon', filterStyle: 'contrast(1.2) saturate(1.35) hue-rotate(15deg)' },
  { id: 'noir_chic', name: 'Monochrome Noir', filterStyle: 'grayscale(1) contrast(1.25) brightness(0.95)' },
];

// Curated Full Look Presets
const FULL_LOOK_PRESETS = [
  {
    id: 'clean_girl',
    name: 'Clean Girl Aesthetic',
    desc: 'Luminous sheer base, naked rose gloss & dewy cheek glow',
    lipstick: 'naked_rose',
    lipFinish: 'gloss',
    lipIntensity: 65,
    eyeshadow: 'none',
    blush: 'peach_glow',
    blushIntensity: 45,
    foundation: 'light_vanilla',
    coverage: 'sheer',
    smoothing: 40,
    brightening: 35,
    filter: 'clean_girl',
  },
  {
    id: 'parisian_chic',
    name: 'Parisian Red Lip',
    desc: 'Velvet crimson lip, sheer champagne lids & porcelain radiance',
    lipstick: 'crimson_muse',
    lipFinish: 'matte',
    lipIntensity: 90,
    eyeshadow: 'golden_champagne',
    blush: 'petal_pink',
    blushIntensity: 40,
    foundation: 'fair_ivory',
    coverage: 'medium',
    smoothing: 50,
    brightening: 40,
    filter: 'parisian_glow',
  },
  {
    id: 'golden_goddess',
    name: 'Golden Hour Glow',
    desc: 'Sunlit terracotta lips, bronze ember lids & warm cheek draping',
    lipstick: 'golden_terracotta',
    lipFinish: 'satin',
    lipIntensity: 85,
    eyeshadow: 'sunset_amber',
    blush: 'sunkissed_amber',
    blushIntensity: 60,
    foundation: 'golden_wheat',
    coverage: 'medium',
    smoothing: 45,
    brightening: 50,
    filter: 'golden_hour',
  },
  {
    id: 'sultry_evening',
    name: 'Red Carpet Siren',
    desc: 'Deep berry noir, smokey taupe contour & sculpted jawline',
    lipstick: 'berry_noir',
    lipFinish: 'matte',
    lipIntensity: 95,
    eyeshadow: 'smokey_taupe',
    blush: 'berry_dew',
    blushIntensity: 55,
    foundation: 'golden_wheat',
    coverage: 'full',
    smoothing: 60,
    brightening: 45,
    filter: 'none',
  },
];

// Sample Models for Instant Testing
const SAMPLE_MODELS = [
  { id: 'user_active', name: 'My Photo', url: '' }, // populated from userSelfieUrl
  { id: 'model_fair', name: 'Model Clara (Neutral Fair)', url: '/sample_face_valid.jpg' },
  { id: 'model_golden', name: 'Model Maya (Warm Golden)', url: '/hero-model.png' },
  { id: 'model_deep', name: 'Model Nia (Rich Bronze)', url: '/sample_face_valid.jpg' },
];

export const MakeupStudioView: React.FC<MakeupStudioViewProps> = ({
  profile,
  userSelfieUrl = '/sample_face_valid.jpg',
  initialTab = 'makeup',
  onNavigateToTryOn,
  onNavigateToSkinAI,
  onNavigateToRoutine,
}) => {
  const [activeTab, setActiveTab] = useState<StudioTab>(initialTab);
  const [selectedModelUrl, setSelectedModelUrl] = useState<string>(userSelfieUrl || '/sample_face_valid.jpg');
  const [splitPosition, setSplitPosition] = useState<number>(50); // 0 to 100%
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // --- Makeup State ---
  const [selectedLipstick, setSelectedLipstick] = useState<string>('crimson_muse');
  const [lipFinish, setLipFinish] = useState<'matte' | 'satin' | 'gloss' | 'shimmer'>('satin');
  const [lipIntensity, setLipIntensity] = useState<number>(80);

  const [selectedFoundation, setSelectedFoundation] = useState<string>('light_vanilla');
  const [foundationCoverage, setFoundationCoverage] = useState<'sheer' | 'medium' | 'full'>('medium');

  const [selectedEyeshadow, setSelectedEyeshadow] = useState<string>('golden_champagne');
  const [eyeshadowIntensity, setEyeshadowIntensity] = useState<number>(65);

  const [selectedBlush, setSelectedBlush] = useState<string>('peach_glow');
  const [blushIntensity, setBlushIntensity] = useState<number>(50);

  // --- Hair State ---
  const [selectedHairColor, setSelectedHairColor] = useState<string>('honey_blonde');
  const [hairIntensity, setHairIntensity] = useState<number>(75);
  const [selectedHairstyle, setSelectedHairstyle] = useState<string>('original');

  // --- Retouch State ---
  const [skinSmoothing, setSkinSmoothing] = useState<number>(45);
  const [blemishEraser, setBlemishEraser] = useState<number>(50);
  const [radianceBrighten, setRadianceBrighten] = useState<number>(30);
  const [teethWhitening, setTeethWhitening] = useState<number>(35);

  // --- Reshape & Slim State ---
  const [faceSlim, setFaceSlim] = useState<number>(20);
  const [eyeEnlarge, setEyeEnlarge] = useState<number>(15);
  const [bodySlim, setBodySlim] = useState<number>(25);

  // --- Filter State ---
  const [selectedFilter, setSelectedFilter] = useState<string>('parisian_glow');
  const [filterIntensity, setFilterIntensity] = useState<number>(75);

  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep selectedModelUrl in sync if userSelfieUrl updates
  useEffect(() => {
    if (userSelfieUrl) {
      setSelectedModelUrl(userSelfieUrl);
    }
  }, [userSelfieUrl]);

  // Handle Preset Look Application
  const handleApplyPreset = (preset: typeof FULL_LOOK_PRESETS[0]) => {
    setSelectedLipstick(preset.lipstick);
    setLipFinish(preset.lipFinish as any);
    setLipIntensity(preset.lipIntensity);
    setSelectedEyeshadow(preset.eyeshadow);
    setSelectedBlush(preset.blush);
    setBlushIntensity(preset.blushIntensity);
    setSelectedFoundation(preset.foundation);
    setFoundationCoverage(preset.coverage as any);
    setSkinSmoothing(preset.smoothing);
    setRadianceBrighten(preset.brightening);
    setSelectedFilter(preset.filter);
  };

  // Reset All
  const handleReset = () => {
    setSelectedLipstick('none');
    setLipIntensity(0);
    setSelectedFoundation('none');
    setSelectedEyeshadow('none');
    setSelectedBlush('none');
    setSelectedHairColor('natural');
    setSelectedHairstyle('original');
    setSkinSmoothing(0);
    setBlemishEraser(0);
    setRadianceBrighten(0);
    setTeethWhitening(0);
    setFaceSlim(0);
    setEyeEnlarge(0);
    setBodySlim(0);
    setSelectedFilter('none');
  };

  // Handle Image Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setSelectedModelUrl(url);
    }
  };

  // Resolve current colors & items
  const activeLipstick = LIPSTICK_SHADES.find((s) => s.id === selectedLipstick);
  const activeFoundation = FOUNDATION_SHADES.find((f) => f.id === selectedFoundation);
  const activeEyeshadow = EYESHADOW_PALETTES.find((e) => e.id === selectedEyeshadow);
  const activeBlush = BLUSH_SHADES.find((b) => b.id === selectedBlush);
  const activeHair = HAIR_COLORS.find((h) => h.id === selectedHairColor);
  const activeFilterObj = EDITORIAL_FILTERS.find((f) => f.id === selectedFilter);

  // AI Stylist recommendations based on Baumann profile
  const stylistRecommendation = useMemo(() => {
    const isSensitive = profile?.skinType?.includes('Sensitive') || profile?.baumannType?.code?.includes('S');
    const isDry = profile?.skinType?.includes('Dry') || profile?.baumannType?.code?.startsWith('D');
    const isPigmented = profile?.baumannType?.code?.includes('P');

    let lipRec = { shade: 'Crimson Muse', finish: 'Satin Hydrating', reason: 'Balanced undertone contrast with rich botanical nourishment.' };
    let baseRec = { coverage: 'Medium Radiant', finish: 'Dewy Barrier-Safe', reason: 'Hydrates epidermal layer while concealing mild surface erythema.' };
    let outfitRec = { name: 'Tailored Camel Trench Coat', hex: '#C89D66', link: 'tryon' };

    if (isDry || isSensitive) {
      lipRec = { shade: 'Naked Rose', finish: 'Hydrating Peptide Gloss', reason: 'Prevents micro-chapping and provides lipid barrier barrier protection.' };
      baseRec = { coverage: 'Sheer Serum Tint', finish: 'Luminous Dewy', reason: 'Avoids settling into dehydration lines, keeping moisture lock intact.' };
      outfitRec = { name: 'Cashmere Rose Quartz Mockneck', hex: '#E0A899', link: 'tryon' };
    } else if (isPigmented) {
      lipRec = { shade: 'Ruby Velvet', finish: 'Longwear Velvet Matte', reason: 'High-contrast focal point that draws light symmetrically across the center face.' };
      baseRec = { coverage: 'Full Studio Airbrush', finish: 'Velvet Satin', reason: 'Neutralizes uneven melanin clusters with clinical color-correcting tone.' };
      outfitRec = { name: 'Luxe Silk Emerald Slip Dress', hex: '#065F46', link: 'tryon' };
    }

    return { lipRec, baseRec, outfitRec };
  }, [profile]);

  // Export Transformation Lookbook
  const handleExportLookbook = () => {
    setIsExporting(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1350; // 4:5 luxury social lookbook ratio
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Dark editorial background
      ctx.fillStyle = '#0B0F19';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Gradient accent banner
      const grad = ctx.createLinearGradient(0, 0, 1080, 0);
      grad.addColorStop(0, '#EC4899');
      grad.addColorStop(0.5, '#8B5CF6');
      grad.addColorStop(1, '#06B6D4');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1080, 8);

      // Header branding
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 36px -apple-system, sans-serif';
      ctx.fillText('MIRROR MOMENT', 60, 80);

      ctx.fillStyle = '#EC4899';
      ctx.font = 'italic bold 28px -apple-system, sans-serif';
      ctx.fillText('VIRTUAL BEAUTY & STYLE STUDIO', 60, 120);

      // Render Portrait Box
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = selectedModelUrl;
      img.onload = () => {
        // Draw image in container
        ctx.drawImage(img, 60, 160, 960, 720);

        // Metadata footer card
        ctx.fillStyle = '#131B2A';
        ctx.roundRect ? ctx.roundRect(60, 910, 960, 360, 24) : ctx.fillRect(60, 910, 960, 360);
        ctx.fill();

        ctx.strokeStyle = '#23314B';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Metadata specs
        ctx.fillStyle = '#EC4899';
        ctx.font = 'bold 22px -apple-system, sans-serif';
        ctx.fillText('TRANSFORMATION LOOK SPECIFICATIONS', 90, 960);

        ctx.fillStyle = '#CBD5E1';
        ctx.font = '18px -apple-system, sans-serif';
        ctx.fillText(`• Lipstick: ${activeLipstick?.name || 'Natural'} (${lipFinish} finish, ${lipIntensity}%)`, 90, 1010);
        ctx.fillText(`• Complexion: ${activeFoundation?.name || 'Natural'} (${foundationCoverage} coverage)`, 90, 1050);
        ctx.fillText(`• Hair Tone: ${activeHair?.name || 'Natural'} (${hairIntensity}% saturation)`, 90, 1090);
        ctx.fillText(`• Retouch Polish: Smooth ${skinSmoothing}% | Radiance ${radianceBrighten}% | Blemish Eraser ${blemishEraser}%`, 90, 1130);
        ctx.fillText(`• Editorial Filter: ${activeFilterObj?.name || 'None'} (${filterIntensity}%)`, 90, 1170);

        if (profile) {
          ctx.fillStyle = '#10B981';
          ctx.font = 'bold 18px -apple-system, sans-serif';
          ctx.fillText(`Clinical Bauman Type: ${profile.baumannType?.name || profile.skinType} | Skin Vitality: ${profile.vitalityScore}/100`, 90, 1220);
        }

        // Trigger Download
        const link = document.createElement('a');
        link.download = `mirror_moment_studio_look_${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        setIsExporting(false);
      };
    } catch (e) {
      console.warn('Export failed:', e);
      setIsExporting(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: '540px',
        margin: '0 auto',
        paddingBottom: '96px',
        color: '#F8FAFC',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />

      {/* Top Studio Header Bar */}
      <div
        style={{
          padding: '16px 20px',
          background: 'linear-gradient(180deg, #131B2A 0%, #0B0F19 100%)',
          borderBottom: '1px solid #1F2B42',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px', fontWeight: 900, color: '#FFFFFF', letterSpacing: '0.02em' }}>
              Beauty <span style={{ color: '#EC4899', fontStyle: 'italic' }}>Studio</span>
            </span>
            <span
              style={{
                background: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)',
                color: '#FFFFFF',
                fontSize: '9px',
                fontWeight: 900,
                padding: '2px 7px',
                borderRadius: '999px',
                letterSpacing: '0.06em',
              }}
            >
              YOUCAM AR
            </span>
          </div>
          <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
            Real-Time Virtual Makeup • Hair • Retouch • Reshape
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleReset}
            title="Reset All Adjustments"
            style={{
              background: '#1F2B42',
              border: 'none',
              color: '#CBD5E1',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={16} />
          </button>

          <button
            onClick={handleExportLookbook}
            disabled={isExporting}
            style={{
              background: 'linear-gradient(135deg, #EC4899 0%, #E11D48 100%)',
              border: 'none',
              color: '#FFFFFF',
              borderRadius: '999px',
              padding: '8px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(236, 72, 153, 0.4)',
            }}
          >
            <Download size={15} />
            <span>{isExporting ? 'Saving...' : 'Save Look'}</span>
          </button>
        </div>
      </div>

      {/* Main Interactive AR Viewport & Live Canvas */}
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: '100%',
          height: '420px',
          background: '#090D16',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Underneath: Original Before Image (revealed by split slider) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            width: `${splitPosition}%`,
            zIndex: 10,
            borderRight: '2px solid #FFFFFF',
            boxShadow: '2px 0 10px rgba(0,0,0,0.5)',
          }}
        >
          <img
            src={selectedModelUrl}
            alt="Original Before"
            style={{
              width: '100%',
              height: '420px',
              objectFit: 'cover',
              maxWidth: 'none',
              minWidth: containerRef.current?.clientWidth || '100%',
            }}
          />
          {/* "Before" Pill Badge */}
          <div
            style={{
              position: 'absolute',
              top: '16px',
              left: '16px',
              background: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(6px)',
              color: '#FFFFFF',
              fontSize: '10px',
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: '999px',
              letterSpacing: '0.06em',
            }}
          >
            ORIGINAL
          </div>
        </div>

        {/* Top Layer: Filtered & Retouched After Canvas Image */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            filter: activeFilterObj?.filterStyle !== 'none' ? activeFilterObj?.filterStyle : undefined,
          }}
        >
          <img
            src={selectedModelUrl}
            alt="Transformed Look"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: `
                blur(${skinSmoothing * 0.015}px)
                brightness(${1 + radianceBrighten * 0.003})
                contrast(${1 + (radianceBrighten > 0 ? 0.05 : 0)})
              `,
              transform: `scale(${1 + bodySlim * 0.001}) scaleX(${1 - faceSlim * 0.0015})`,
              transition: 'transform 0.15s ease',
            }}
          />

          {/* AR Synthetic Lip Layer */}
          {selectedLipstick !== 'none' && activeLipstick && (
            <div
              style={{
                position: 'absolute',
                top: '58%',
                left: '42%',
                width: '16%',
                height: '8%',
                borderRadius: '50% 50% 60% 60% / 40% 40% 70% 70%',
                background: activeLipstick.hex,
                opacity: (lipIntensity / 100) * 0.72,
                mixBlendMode: lipFinish === 'matte' ? 'multiply' : lipFinish === 'gloss' ? 'hard-light' : 'color',
                filter: lipFinish === 'gloss' ? 'drop-shadow(0 0 2px #FFFFFF)' : 'blur(2px)',
                pointerEvents: 'none',
              }}
            />
          )}

          {/* AR Gloss Specular Highlight */}
          {selectedLipstick !== 'none' && lipFinish === 'gloss' && (
            <div
              style={{
                position: 'absolute',
                top: '61%',
                left: '48%',
                width: '4%',
                height: '2%',
                borderRadius: '50%',
                background: '#FFFFFF',
                opacity: 0.75,
                filter: 'blur(1px)',
                pointerEvents: 'none',
              }}
            />
          )}

          {/* AR Synthetic Blush Cheeks */}
          {selectedBlush !== 'none' && activeBlush && (
            <>
              {/* Left Cheek */}
              <div
                style={{
                  position: 'absolute',
                  top: '46%',
                  left: '26%',
                  width: '16%',
                  height: '14%',
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${activeBlush.hex} 0%, transparent 70%)`,
                  opacity: (blushIntensity / 100) * 0.65,
                  mixBlendMode: 'soft-light',
                  filter: 'blur(6px)',
                  pointerEvents: 'none',
                }}
              />
              {/* Right Cheek */}
              <div
                style={{
                  position: 'absolute',
                  top: '46%',
                  right: '26%',
                  width: '16%',
                  height: '14%',
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${activeBlush.hex} 0%, transparent 70%)`,
                  opacity: (blushIntensity / 100) * 0.65,
                  mixBlendMode: 'soft-light',
                  filter: 'blur(6px)',
                  pointerEvents: 'none',
                }}
              />
            </>
          )}

          {/* AR Synthetic Eyeshadow Overlays */}
          {selectedEyeshadow !== 'none' && activeEyeshadow && activeEyeshadow.primary !== 'transparent' && (
            <>
              {/* Left Eye Shade */}
              <div
                style={{
                  position: 'absolute',
                  top: '36%',
                  left: '32%',
                  width: '13%',
                  height: '6%',
                  borderRadius: '50% 50% 20% 20%',
                  background: `radial-gradient(ellipse at center, ${activeEyeshadow.secondary} 0%, ${activeEyeshadow.primary} 70%)`,
                  opacity: (eyeshadowIntensity / 100) * 0.75,
                  mixBlendMode: 'multiply',
                  filter: 'blur(3px)',
                  pointerEvents: 'none',
                }}
              />
              {/* Right Eye Shade */}
              <div
                style={{
                  position: 'absolute',
                  top: '36%',
                  right: '32%',
                  width: '13%',
                  height: '6%',
                  borderRadius: '50% 50% 20% 20%',
                  background: `radial-gradient(ellipse at center, ${activeEyeshadow.secondary} 0%, ${activeEyeshadow.primary} 70%)`,
                  opacity: (eyeshadowIntensity / 100) * 0.75,
                  mixBlendMode: 'multiply',
                  filter: 'blur(3px)',
                  pointerEvents: 'none',
                }}
              />
            </>
          )}

          {/* AR Hair Color Tint Simulation */}
          {selectedHairColor !== 'natural' && activeHair && activeHair.hex !== 'transparent' && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '70%',
                background: `radial-gradient(ellipse at top center, transparent 40%, ${activeHair.hex} 90%)`,
                opacity: (hairIntensity / 100) * 0.55,
                mixBlendMode: 'color',
                pointerEvents: 'none',
              }}
            />
          )}

          {/* "After" Pill Badge */}
          <div
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.85) 0%, rgba(225, 29, 72, 0.85) 100%)',
              backdropFilter: 'blur(6px)',
              color: '#FFFFFF',
              fontSize: '10px',
              fontWeight: 800,
              padding: '3px 10px',
              borderRadius: '999px',
              letterSpacing: '0.06em',
            }}
          >
            YOUCAM AR LIVE
          </div>
        </div>

        {/* Draggable Split Handle Line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${splitPosition}%`,
            width: '2px',
            background: '#FFFFFF',
            zIndex: 25,
            cursor: 'ew-resize',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#FFFFFF',
              boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0B0F19',
            }}
          >
            <ArrowLeftRight size={16} />
          </div>
        </div>

        {/* Transparent Drag Input Overlay */}
        <input
          type="range"
          min="0"
          max="100"
          value={splitPosition}
          onChange={(e) => setSplitPosition(Number(e.target.value))}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            opacity: 0,
            cursor: 'ew-resize',
            zIndex: 30,
          }}
        />

        {/* Quick Photo Upload & Model Picker Bar */}
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            right: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 35,
          }}
        >
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: 'rgba(15, 23, 42, 0.8)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#FFFFFF',
              borderRadius: '999px',
              padding: '6px 14px',
              fontSize: '11px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <Upload size={13} />
            <span>Change Photo</span>
          </button>

          <div
            style={{
              display: 'flex',
              gap: '6px',
              background: 'rgba(15, 23, 42, 0.8)',
              backdropFilter: 'blur(8px)',
              padding: '4px 6px',
              borderRadius: '999px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            {SAMPLE_MODELS.map((m) => (
              <div
                key={m.id}
                onClick={() => setSelectedModelUrl(m.url || userSelfieUrl)}
                title={m.name}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: '#23314B',
                  border: selectedModelUrl === (m.url || userSelfieUrl) ? '2px solid #EC4899' : '1px solid transparent',
                  cursor: 'pointer',
                  overflow: 'hidden',
                }}
              >
                <img
                  src={m.url || userSelfieUrl}
                  alt={m.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Flagship Feature Tabs Navigation */}
      <div
        style={{
          display: 'flex',
          overflowX: 'auto',
          background: '#0E1424',
          borderBottom: '1px solid #1F2B42',
          padding: '4px 8px',
          gap: '4px',
          scrollbarWidth: 'none',
        }}
      >
        {[
          { id: 'makeup' as const, label: 'Virtual Makeup', icon: Palette, badge: 'Popular' },
          { id: 'hair' as const, label: 'Hair Color & Style', icon: Scissors, badge: 'Viral' },
          { id: 'retouch' as const, label: 'Face Retouch', icon: Sparkles },
          { id: 'reshape' as const, label: 'Body & Slim', icon: Sliders },
          { id: 'filters' as const, label: 'AI Filters', icon: Filter },
          { id: 'stylist' as const, label: 'AI Stylist Match', icon: Wand2, badge: 'Smart' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: '0 0 auto',
                background: isActive ? 'linear-gradient(135deg, rgba(236, 72, 153, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)' : 'transparent',
                border: isActive ? '1px solid #EC4899' : '1px solid transparent',
                borderRadius: '12px',
                padding: '8px 12px',
                color: isActive ? '#EC4899' : '#94A3B8',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: isActive ? 800 : 600,
                cursor: 'pointer',
                position: 'relative',
              }}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  style={{
                    fontSize: '8px',
                    fontWeight: 900,
                    background: '#EC4899',
                    color: '#FFFFFF',
                    padding: '1px 4px',
                    borderRadius: '999px',
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content Panels */}
      <div style={{ padding: '20px 16px' }}>
        {/* ================= TAB 1: VIRTUAL MAKEUP ================= */}
        {activeTab === 'makeup' && (
          <div>
            {/* Quick 1-Tap Curated Full Looks */}
            <div style={{ marginBottom: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#F8FAFC' }}>
                  1-Tap Full Look Presets
                </span>
                <span style={{ fontSize: '11px', color: '#EC4899', fontWeight: 600 }}>Instant Glam</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {FULL_LOOK_PRESETS.map((look) => (
                  <div
                    key={look.id}
                    onClick={() => handleApplyPreset(look)}
                    style={{
                      background: '#131B2A',
                      border: '1px solid #23314B',
                      borderRadius: '14px',
                      padding: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#FFFFFF', marginBottom: '4px' }}>
                      {look.name}
                    </div>
                    <div style={{ fontSize: '10px', color: '#94A3B8', lineHeight: '1.3' }}>
                      {look.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section A: Lipstick Studio */}
            <div
              style={{
                background: '#131B2A',
                border: '1px solid #23314B',
                borderRadius: '18px',
                padding: '16px',
                marginBottom: '18px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      background: activeLipstick?.hex || '#9B111E',
                    }}
                  />
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF' }}>
                    Lipstick: {activeLipstick?.name || 'Natural'}
                  </span>
                </div>
                <span style={{ fontSize: '11px', color: '#CBD5E1' }}>{lipIntensity}% Intensity</span>
              </div>

              {/* Lipstick Swatches */}
              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  overflowX: 'auto',
                  paddingBottom: '10px',
                  marginBottom: '12px',
                }}
              >
                <div
                  onClick={() => setSelectedLipstick('none')}
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    border: selectedLipstick === 'none' ? '3px solid #EC4899' : '2px solid #334155',
                    background: '#1E293B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '10px',
                    color: '#94A3B8',
                    flexShrink: 0,
                  }}
                >
                  Bare
                </div>
                {LIPSTICK_SHADES.map((shade) => {
                  const isSelected = selectedLipstick === shade.id;
                  return (
                    <div
                      key={shade.id}
                      onClick={() => {
                        setSelectedLipstick(shade.id);
                        if (lipIntensity === 0) setLipIntensity(80);
                      }}
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        background: shade.hex,
                        border: isSelected ? '3px solid #FFFFFF' : '2px solid transparent',
                        boxShadow: isSelected ? `0 0 12px ${shade.hex}` : 'none',
                        cursor: 'pointer',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {isSelected && <Check size={16} color="#FFFFFF" strokeWidth={3} />}
                    </div>
                  );
                })}
              </div>

              {/* Finish Selector */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                {(['matte', 'satin', 'gloss', 'shimmer'] as const).map((finish) => (
                  <button
                    key={finish}
                    onClick={() => setLipFinish(finish)}
                    style={{
                      flex: 1,
                      background: lipFinish === finish ? '#EC4899' : '#1E293B',
                      border: 'none',
                      color: '#FFFFFF',
                      borderRadius: '8px',
                      padding: '6px 0',
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'capitalize',
                      cursor: 'pointer',
                    }}
                  >
                    {finish}
                  </button>
                ))}
              </div>

              {/* Intensity Slider */}
              <input
                type="range"
                min="0"
                max="100"
                value={lipIntensity}
                onChange={(e) => setLipIntensity(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#EC4899' }}
              />
            </div>

            {/* Section B: Foundation & Skin Tone */}
            <div
              style={{
                background: '#131B2A',
                border: '1px solid #23314B',
                borderRadius: '18px',
                padding: '16px',
                marginBottom: '18px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF' }}>
                  Foundation: {activeFoundation?.name}
                </span>
                <span style={{ fontSize: '11px', color: '#A5B4FC' }}>
                  {activeFoundation?.undertone}
                </span>
              </div>

              {/* Foundation Swatches */}
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  overflowX: 'auto',
                  paddingBottom: '8px',
                  marginBottom: '12px',
                }}
              >
                {FOUNDATION_SHADES.map((shade) => {
                  const isSelected = selectedFoundation === shade.id;
                  return (
                    <div
                      key={shade.id}
                      onClick={() => setSelectedFoundation(shade.id)}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: shade.hex,
                        border: isSelected ? '3px solid #EC4899' : '1px solid rgba(255,255,255,0.2)',
                        boxShadow: isSelected ? '0 0 10px rgba(236, 72, 153, 0.5)' : 'none',
                        cursor: 'pointer',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {isSelected && <Check size={14} color="#000000" strokeWidth={3} />}
                    </div>
                  );
                })}
              </div>

              {/* Coverage Levels */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {(['sheer', 'medium', 'full'] as const).map((cov) => (
                  <button
                    key={cov}
                    onClick={() => setFoundationCoverage(cov)}
                    style={{
                      flex: 1,
                      background: foundationCoverage === cov ? '#3B82F6' : '#1E293B',
                      border: 'none',
                      color: '#FFFFFF',
                      borderRadius: '8px',
                      padding: '6px 0',
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'capitalize',
                      cursor: 'pointer',
                    }}
                  >
                    {cov} Coverage
                  </button>
                ))}
              </div>
            </div>

            {/* Section C: Eyeshadow & Blush */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {/* Eyeshadow */}
              <div
                style={{
                  background: '#131B2A',
                  border: '1px solid #23314B',
                  borderRadius: '16px',
                  padding: '14px',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#FFFFFF', marginBottom: '8px' }}>
                  Eyeshadow
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {EYESHADOW_PALETTES.slice(1, 4).map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedEyeshadow(p.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px',
                        background: selectedEyeshadow === p.id ? '#1E293B' : 'transparent',
                        border: selectedEyeshadow === p.id ? '1px solid #EC4899' : '1px solid transparent',
                        borderRadius: '8px',
                        cursor: 'pointer',
                      }}
                    >
                      <div
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          background: `linear-gradient(135deg, ${p.primary} 50%, ${p.secondary} 50%)`,
                        }}
                      />
                      <span style={{ fontSize: '10px', color: '#CBD5E1', fontWeight: 600 }}>{p.name}</span>
                    </div>
                  ))}
                  {selectedEyeshadow !== 'none' && (
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={eyeshadowIntensity}
                      onChange={(e) => setEyeshadowIntensity(Number(e.target.value))}
                      style={{ width: '100%', accentColor: '#EC4899', marginTop: '6px' }}
                      title="Eyeshadow Intensity"
                    />
                  )}
                </div>
              </div>

              {/* Blush */}
              <div
                style={{
                  background: '#131B2A',
                  border: '1px solid #23314B',
                  borderRadius: '16px',
                  padding: '14px',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#FFFFFF', marginBottom: '8px' }}>
                  Blush
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {BLUSH_SHADES.slice(1).map((b) => (
                    <div
                      key={b.id}
                      onClick={() => setSelectedBlush(b.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px',
                        background: selectedBlush === b.id ? '#1E293B' : 'transparent',
                        border: selectedBlush === b.id ? '1px solid #EC4899' : '1px solid transparent',
                        borderRadius: '8px',
                        cursor: 'pointer',
                      }}
                    >
                      <div
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          background: b.hex,
                        }}
                      />
                      <span style={{ fontSize: '10px', color: '#CBD5E1', fontWeight: 600 }}>{b.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: AI HAIRSTYLE & COLOR ================= */}
        {activeTab === 'hair' && (
          <div>
            {/* Hair Color Studio */}
            <div
              style={{
                background: '#131B2A',
                border: '1px solid #23314B',
                borderRadius: '18px',
                padding: '16px',
                marginBottom: '18px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF' }}>
                  Hair Color: {activeHair?.name}
                </span>
                <span style={{ fontSize: '11px', color: '#F59E0B' }}>{activeHair?.tone}</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  overflowX: 'auto',
                  paddingBottom: '10px',
                  marginBottom: '14px',
                }}
              >
                {HAIR_COLORS.map((hair) => {
                  const isSelected = selectedHairColor === hair.id;
                  return (
                    <div
                      key={hair.id}
                      onClick={() => setSelectedHairColor(hair.id)}
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        background: hair.hex === 'transparent' ? '#1E293B' : hair.hex,
                        border: isSelected ? '3px solid #EC4899' : '2px solid transparent',
                        boxShadow: isSelected ? '0 0 12px rgba(236, 72, 153, 0.6)' : 'none',
                        cursor: 'pointer',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {hair.id === 'natural' ? (
                        <span style={{ fontSize: '9px', color: '#CBD5E1' }}>Orig</span>
                      ) : (
                        isSelected && <Check size={16} color="#FFFFFF" strokeWidth={3} />
                      )}
                    </div>
                  );
                })}
              </div>

              <div style={{ marginBottom: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94A3B8' }}>
                <span>Saturation & Tint Intensity</span>
                <span>{hairIntensity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={hairIntensity}
                onChange={(e) => setHairIntensity(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#EC4899' }}
              />
            </div>

            {/* Hairstyle Simulator Overlays */}
            <div
              style={{
                background: '#131B2A',
                border: '1px solid #23314B',
                borderRadius: '18px',
                padding: '16px',
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF', marginBottom: '12px' }}>
                AI Hairstyle Cuts & Silhouette
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {HAIRSTYLES.map((cut) => {
                  const isSelected = selectedHairstyle === cut.id;
                  return (
                    <div
                      key={cut.id}
                      onClick={() => setSelectedHairstyle(cut.id)}
                      style={{
                        background: isSelected ? 'linear-gradient(135deg, rgba(236, 72, 153, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)' : '#1E293B',
                        border: isSelected ? '1.5px solid #EC4899' : '1px solid #334155',
                        borderRadius: '12px',
                        padding: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <span style={{ fontSize: '20px' }}>{cut.icon}</span>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#FFFFFF' }}>{cut.name}</div>
                        <div style={{ fontSize: '9px', color: '#94A3B8' }}>Salon Preview</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: FACE RETOUCH ================= */}
        {activeTab === 'retouch' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Skin Smoothing */}
            <div style={{ background: '#131B2A', border: '1px solid #23314B', borderRadius: '16px', padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF' }}>Bilateral Skin Smoothing</span>
                <span style={{ fontSize: '11px', color: '#EC4899', fontWeight: 700 }}>{skinSmoothing}%</span>
              </div>
              <p style={{ fontSize: '10px', color: '#94A3B8', margin: '0 0 10px 0' }}>
                Softens pore visibility while keeping eye details and lip contours crystal clear.
              </p>
              <input
                type="range"
                min="0"
                max="100"
                value={skinSmoothing}
                onChange={(e) => setSkinSmoothing(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#EC4899' }}
              />
            </div>

            {/* Blemish Eraser */}
            <div style={{ background: '#131B2A', border: '1px solid #23314B', borderRadius: '16px', padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF' }}>Blemish & Spot Eraser</span>
                <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 700 }}>{blemishEraser}%</span>
              </div>
              <p style={{ fontSize: '10px', color: '#94A3B8', margin: '0 0 10px 0' }}>
                Diffuses localized redness, post-blemish erythema, and sunspots.
              </p>
              <input
                type="range"
                min="0"
                max="100"
                value={blemishEraser}
                onChange={(e) => setBlemishEraser(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#10B981' }}
              />
            </div>

            {/* Radiance & Brightening */}
            <div style={{ background: '#131B2A', border: '1px solid #23314B', borderRadius: '16px', padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF' }}>Dermal Radiance & Glow</span>
                <span style={{ fontSize: '11px', color: '#F59E0B', fontWeight: 700 }}>{radianceBrighten}%</span>
              </div>
              <p style={{ fontSize: '10px', color: '#94A3B8', margin: '0 0 10px 0' }}>
                Illuminates facial shadows and enhances under-eye brightness.
              </p>
              <input
                type="range"
                min="0"
                max="100"
                value={radianceBrighten}
                onChange={(e) => setRadianceBrighten(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#F59E0B' }}
              />
            </div>

            {/* Teeth Whitener */}
            <div style={{ background: '#131B2A', border: '1px solid #23314B', borderRadius: '16px', padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF' }}>Teeth Whitener</span>
                <span style={{ fontSize: '11px', color: '#06B6D4', fontWeight: 700 }}>{teethWhitening}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={teethWhitening}
                onChange={(e) => setTeethWhitening(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#06B6D4' }}
              />
            </div>
          </div>
        )}

        {/* ================= TAB 4: BODY & SLIM RESHAPE ================= */}
        {activeTab === 'reshape' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Face V-Line Slim */}
            <div style={{ background: '#131B2A', border: '1px solid #23314B', borderRadius: '16px', padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF' }}>Face Reshape & V-Line Slim</span>
                <span style={{ fontSize: '11px', color: '#EC4899', fontWeight: 700 }}>{faceSlim}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={faceSlim}
                onChange={(e) => setFaceSlim(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#EC4899' }}
              />
            </div>

            {/* Eye Aperture Enlargement */}
            <div style={{ background: '#131B2A', border: '1px solid #23314B', borderRadius: '16px', padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF' }}>Eye Wakeup & Enlarger</span>
                <span style={{ fontSize: '11px', color: '#8B5CF6', fontWeight: 700 }}>{eyeEnlarge}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                value={eyeEnlarge}
                onChange={(e) => setEyeEnlarge(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#8B5CF6' }}
              />
            </div>

            {/* Body Contour Silhouette */}
            <div style={{ background: '#131B2A', border: '1px solid #23314B', borderRadius: '16px', padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF' }}>Body Reshape & Silhouette Slim</span>
                <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 700 }}>{bodySlim}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                value={bodySlim}
                onChange={(e) => setBodySlim(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#10B981' }}
              />
            </div>
          </div>
        )}

        {/* ================= TAB 5: AI FILTERS ================= */}
        {activeTab === 'filters' && (
          <div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF', marginBottom: '12px' }}>
              Editorial Camera & Social Media Filters
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '16px' }}>
              {EDITORIAL_FILTERS.map((f) => {
                const isSelected = selectedFilter === f.id;
                return (
                  <div
                    key={f.id}
                    onClick={() => setSelectedFilter(f.id)}
                    style={{
                      background: isSelected ? 'linear-gradient(135deg, rgba(236, 72, 153, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)' : '#131B2A',
                      border: isSelected ? '2px solid #EC4899' : '1px solid #23314B',
                      borderRadius: '14px',
                      padding: '12px',
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF' }}>{f.name}</div>
                    <div style={{ fontSize: '10px', color: isSelected ? '#EC4899' : '#94A3B8', marginTop: '2px' }}>
                      {isSelected ? 'Active Grade' : 'Preview'}
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedFilter !== 'none' && (
              <div style={{ background: '#131B2A', border: '1px solid #23314B', borderRadius: '16px', padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF' }}>Filter Intensity</span>
                  <span style={{ fontSize: '11px', color: '#EC4899', fontWeight: 700 }}>{filterIntensity}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filterIntensity}
                  onChange={(e) => setFilterIntensity(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#EC4899' }}
                />
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 6: AI STYLIST & CROSS-RECOMMENDATION ================= */}
        {activeTab === 'stylist' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
                border: '1.5px solid #EC4899',
                borderRadius: '18px',
                padding: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Wand2 size={18} color="#EC4899" />
                <span style={{ fontSize: '14px', fontWeight: 900, color: '#FFFFFF' }}>
                  AI Stylist Harmonization
                </span>
              </div>
              <p style={{ fontSize: '11px', color: '#CBD5E1', lineHeight: '1.4', margin: 0 }}>
                Synthesizing your clinical Dr. Baumann skin matrix (
                <strong style={{ color: '#F472B6' }}>{profile?.baumannType?.name || 'Balanced Resilient'}</strong>)
                with chromatic undertone science.
              </p>
            </div>

            {/* Stylist Card 1: Makeup Prescription */}
            <div style={{ background: '#131B2A', border: '1px solid #23314B', borderRadius: '16px', padding: '14px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#EC4899', marginBottom: '4px' }}>
                RECOMMENDED LIP & BASE HARMONY
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', marginBottom: '4px' }}>
                {stylistRecommendation.lipRec.shade} ({stylistRecommendation.lipRec.finish})
              </div>
              <p style={{ fontSize: '11px', color: '#94A3B8', margin: '0 0 10px 0', lineHeight: '1.3' }}>
                {stylistRecommendation.lipRec.reason}
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => {
                    setSelectedLipstick('crimson_muse');
                    setLipFinish('satin');
                    setLipIntensity(85);
                    setActiveTab('makeup');
                  }}
                  style={{
                    background: '#1E293B',
                    border: '1px solid #EC4899',
                    color: '#FFFFFF',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Apply This Palette Now
                </button>
                {onNavigateToSkinAI && (
                  <button
                    onClick={onNavigateToSkinAI}
                    style={{
                      background: 'transparent',
                      border: '1px solid #64748B',
                      color: '#CBD5E1',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Review Skin AI Profile
                  </button>
                )}
              </div>
            </div>

            {/* Stylist Card 2: Paired Apparel Draping */}
            <div style={{ background: '#131B2A', border: '1px solid #23314B', borderRadius: '16px', padding: '14px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#818CF8', marginBottom: '4px' }}>
                HARMONIC APPAREL VTO PAIRING
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <div
                  style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    background: stylistRecommendation.outfitRec.hex,
                  }}
                />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
                  {stylistRecommendation.outfitRec.name}
                </span>
              </div>
              <p style={{ fontSize: '11px', color: '#94A3B8', margin: '0 0 10px 0', lineHeight: '1.3' }}>
                Pairing your recommended lip shade with this garment creates optical CIELAB delta-E balance, neutralizing redness.
              </p>
              {onNavigateToTryOn && (
                <button
                  onClick={onNavigateToTryOn}
                  style={{
                    background: 'linear-gradient(135deg, #6366F1 0%, #3B82F6 100%)',
                    border: 'none',
                    color: '#FFFFFF',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Shirt size={14} />
                  <span>Drape In Virtual Try-On</span>
                </button>
              )}
            </div>

            {/* Stylist Card 3: Skincare Prep */}
            <div style={{ background: '#131B2A', border: '1px solid #23314B', borderRadius: '16px', padding: '14px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#10B981', marginBottom: '4px' }}>
                CLINICAL SKINCARE PREP
              </div>
              <p style={{ fontSize: '11px', color: '#CBD5E1', margin: '0 0 10px 0', lineHeight: '1.3' }}>
                Before applying makeup, prep the skin barrier with hydrating peptides to prevent flaking and lock in moisture.
              </p>
              {onNavigateToRoutine && (
                <button
                  onClick={onNavigateToRoutine}
                  style={{
                    background: '#1E293B',
                    border: '1px solid #10B981',
                    color: '#10B981',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  View Personalized Routine
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MakeupStudioView;
