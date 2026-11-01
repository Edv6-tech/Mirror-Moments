import React, { useState, useEffect, useRef } from 'react';
import { UserSkinProfile } from '../agents/profiler.ts';
import { StudioTab } from './MakeupStudioView.tsx';
import {
  Camera,
  Image as ImageIcon,
  Sparkles,
  Crown,
  Settings,
  Palette,
  ChevronRight,
  X,
  Sliders,
  Smile,
  Scissors,
  Video,
  Target,
  Minimize2,
  UserCheck,
} from 'lucide-react';

interface DashboardHomeViewProps {
  onOpenScan: () => void;
  onUploadPhoto: (file: File) => void;
  onNavigate: (screen: 'home' | 'scan' | 'profile' | 'product' | 'routine' | 'tryon' | 'progress' | 'studio') => void;
  onNavigateToStudio?: (tab: StudioTab) => void;
  profile: UserSkinProfile | null;
  routineCount: number;
  isDemoMode: boolean;
  onToggleDemoMode: () => void;
}

const HERO_SLIDES = [
  {
    tag: 'EXCLUSIVE HACKATHON EDITION',
    title: 'Skin & Style Intelligence',
    subtitle: 'Dr. Leslie Baumann 16-Type Matrix + YouCam Apparel VTO',
    cta: 'Try Now',
    target: 'scan' as const,
    image: '/sample_face_valid.jpg',
    accentColor: '#EC4899',
    badgeText: 'Live AI',
  },
  {
    tag: 'YOUCAM APPAREL VTO',
    title: 'Virtual Fitting & Draping',
    subtitle: 'Photorealistic garment drape with CIELAB undertone harmony',
    cta: 'Explore Fit',
    target: 'tryon' as const,
    image: '/garments/garment_navy_crew.jpg',
    accentColor: '#818CF8',
    badgeText: '3D Flow',
  },
  {
    tag: '100K+ OPEN BEAUTY FACTS',
    title: 'Smart Ingredient Verdict',
    subtitle: 'Instant Buy/Skip safety engine with EU CosIng 26 allergens',
    cta: 'Check Serum',
    target: 'product' as const,
    image: '/garments/garment_olive_overshirt.jpg',
    accentColor: '#10B981',
    badgeText: 'Clinical',
  },
];

export const DashboardHomeView: React.FC<DashboardHomeViewProps> = ({
  onOpenScan,
  onUploadPhoto,
  onNavigate,
  onNavigateToStudio,
  profile,
  routineCount,
  isDemoMode,
  onToggleDemoMode,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showVipModal, setShowVipModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-advance hero carousel every 5.5s
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUploadPhoto(e.target.files[0]);
    }
  };

  return (
    <div
      style={{
        maxWidth: '520px',
        margin: '0 auto',
        paddingBottom: '88px', // Space for bottom navigation bar
        color: '#F8FAFC',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      }}
    >
      {/* Hidden File Input for Photo Edit Launcher */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* Hero Visual Banner (Matching YouCam Makeup Flagship) */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '380px',
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #1A102F 0%, #0B0F19 100%)',
        }}
      >
        {/* Full-Bleed Carousel Background Image */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transition: 'opacity 0.6s ease-in-out',
          }}
        >
          <img
            src={HERO_SLIDES[currentSlide].image}
            alt={HERO_SLIDES[currentSlide].title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center 20%',
              filter: 'brightness(0.85) contrast(1.08)',
            }}
          />

          {/* Dreamy Cloud & Glow Gradient Overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(180deg, rgba(11, 15, 25, 0.4) 0%, rgba(236, 72, 153, 0.15) 45%, rgba(11, 15, 25, 0.95) 95%)',
            }}
          />
        </div>

        {/* Top Header Row (Logo + Golden Crown + Settings) */}
        <header
          style={{
            position: 'absolute',
            top: '12px',
            left: '16px',
            right: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 10,
          }}
        >
          {/* Logo with Pink Script Accent */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span
              style={{
                fontSize: '26px',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                color: '#FFFFFF',
                textShadow: '0 2px 10px rgba(0,0,0,0.6)',
              }}
            >
              Mirror
            </span>
            <span
              style={{
                fontSize: '26px',
                fontWeight: 700,
                color: '#F472B6',
                fontFamily: 'serif',
                fontStyle: 'italic',
                textShadow: '0 0 12px rgba(244, 114, 182, 0.7)',
              }}
            >
              Moment
            </span>
          </div>

          {/* Actions: Profile pill, Settings & Golden Crown VIP */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {profile && (
              <div
                onClick={() => onNavigate('profile')}
                style={{
                  background: 'rgba(236, 72, 153, 0.2)',
                  border: '1px solid #EC4899',
                  borderRadius: '999px',
                  padding: '3px 8px',
                  fontSize: '10px',
                  fontWeight: 800,
                  color: '#F472B6',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                title={`Baumann Type: ${profile.baumannType?.name || profile.skinType} • Routine: ${routineCount} items`}
              >
                <span>{profile.baumannType?.code || 'OSPW'}</span>
                <span style={{ color: '#FBCFE8' }}>★ {profile.vitalityScore}</span>
              </div>
            )}

            <button
              onClick={() => setShowSettingsModal(true)}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: 'rgba(15, 23, 42, 0.65)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#CBD5E1',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              }}
              title="Settings & System Diagnostics"
            >
              <Settings size={18} />
            </button>

            <button
              onClick={() => setShowVipModal(true)}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 50%, #D97706 100%)',
                border: '2px solid rgba(255, 255, 255, 0.8)',
                color: '#FFFFFF',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px rgba(245, 158, 11, 0.6)',
              }}
              title="VIP Pro Membership Active"
            >
              <Crown size={18} fill="#FFFFFF" />
            </button>
          </div>
        </header>

        {/* Hero Editorial Card Floating Content */}
        <div
          style={{
            position: 'absolute',
            bottom: '36px',
            left: '20px',
            right: '20px',
            zIndex: 5,
          }}
        >
          <div
            style={{
              display: 'inline-block',
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(8px)',
              padding: '4px 10px',
              borderRadius: '999px',
              fontSize: '10px',
              fontWeight: 800,
              color: HERO_SLIDES[currentSlide].accentColor,
              letterSpacing: '0.08em',
              marginBottom: '6px',
              border: `1px solid ${HERO_SLIDES[currentSlide].accentColor}55`,
            }}
          >
            {HERO_SLIDES[currentSlide].tag}
          </div>

          <h2
            style={{
              fontSize: '28px',
              fontWeight: 900,
              lineHeight: '1.1',
              margin: '0 0 6px 0',
              textShadow: '0 3px 12px rgba(0,0,0,0.8)',
              background: 'linear-gradient(135deg, #FFFFFF 50%, #E2E8F0 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {HERO_SLIDES[currentSlide].title}
          </h2>

          <p
            style={{
              fontSize: '13px',
              color: '#CBD5E1',
              margin: '0 0 14px 0',
              textShadow: '0 2px 6px rgba(0,0,0,0.8)',
              lineHeight: '1.4',
            }}
          >
            {HERO_SLIDES[currentSlide].subtitle}
          </p>

          {/* "Try Now" Pill Button */}
          <button
            onClick={() => onNavigate(HERO_SLIDES[currentSlide].target)}
            style={{
              background: 'linear-gradient(135deg, #EC4899 0%, #E11D48 100%)',
              color: '#FFFFFF',
              border: '2px solid rgba(255, 255, 255, 0.4)',
              borderRadius: '999px',
              padding: '9px 24px',
              fontSize: '14px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 16px rgba(236, 72, 153, 0.6)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              transition: 'transform 0.15s ease',
            }}
          >
            <span>{HERO_SLIDES[currentSlide].cta}</span>
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Carousel Pagination Dots */}
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            gap: '6px',
            zIndex: 10,
          }}
        >
          {HERO_SLIDES.map((_, idx) => (
            <div
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              style={{
                width: currentSlide === idx ? '22px' : '6px',
                height: '6px',
                borderRadius: '999px',
                background: currentSlide === idx ? '#FFFFFF' : 'rgba(255, 255, 255, 0.35)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>
      </div>

      {/* Dual Signature Action Launchers (Photo Edit vs Camera) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          padding: '16px 16px 20px',
        }}
      >
        {/* Button A: Photo Edit / Upload */}
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            background: 'linear-gradient(180deg, rgba(236, 72, 153, 0.08) 0%, rgba(15, 23, 42, 0.8) 100%)',
            border: '2px solid #EC4899',
            borderRadius: '999px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(236, 72, 153, 0.25), inset 0 0 12px rgba(236, 72, 153, 0.15)',
            transition: 'all 0.15s ease',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #EC4899 0%, #A855F7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 2px 8px rgba(236, 72, 153, 0.5)',
            }}
          >
            <ImageIcon size={18} />
          </div>
          <span style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF' }}>Photo Edit</span>
        </button>

        {/* Button B: Live Camera */}
        <button
          onClick={onOpenScan}
          style={{
            background: 'linear-gradient(180deg, rgba(6, 182, 212, 0.08) 0%, rgba(15, 23, 42, 0.8) 100%)',
            border: '2px solid #06B6D4',
            borderRadius: '999px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(6, 182, 212, 0.25), inset 0 0 12px rgba(6, 182, 212, 0.15)',
            transition: 'all 0.15s ease',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 2px 8px rgba(6, 182, 212, 0.5)',
            }}
          >
            <Camera size={18} />
          </div>
          <span style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF' }}>Camera</span>
        </button>
      </div>

      {/* Mesmerizing App Tools Grid (10 Interactive Features matching YouCam Flagship Grid) */}
      <div style={{ padding: '0 16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#F8FAFC', margin: 0 }}>
            AI Beauty & Complexion Intelligence Tools
          </h3>
          <span style={{ fontSize: '11px', color: '#EC4899', fontWeight: 700 }}>10 Interactive Modules</span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '8px',
          }}
        >
          {/* Row 1 */}
          {/* Tool 1: Video Retouch */}
          <div
            onClick={() => onNavigateToStudio ? onNavigateToStudio('filters') : onNavigate('studio')}
            style={{
              background: '#131B2A',
              border: '1px solid #23314B',
              borderRadius: '16px',
              padding: '12px 6px',
              textAlign: 'center',
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.15s ease',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '-6px',
                right: '4px',
                background: '#EF4444',
                color: '#FFFFFF',
                fontSize: '8px',
                fontWeight: 900,
                padding: '1px 5px',
                borderRadius: '999px',
              }}
            >
              New
            </div>
            <div
              style={{
                width: '36px',
                height: '36px',
                margin: '0 auto 6px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
              }}
            >
              <Video size={18} />
            </div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#FFFFFF', lineHeight: '1.2' }}>
              Video Retouch
            </div>
          </div>

          {/* Tool 2: AI Hairstyle (Signature Glowing Gradient Border) */}
          <div
            onClick={() => onNavigateToStudio ? onNavigateToStudio('hair') : onNavigate('studio')}
            style={{
              background: '#131B2A',
              border: '2px solid #8B5CF6',
              borderRadius: '16px',
              padding: '12px 6px',
              textAlign: 'center',
              cursor: 'pointer',
              position: 'relative',
              boxShadow: '0 0 14px rgba(139, 92, 246, 0.35)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '-6px',
                right: '4px',
                background: '#8B5CF6',
                color: '#FFFFFF',
                fontSize: '8px',
                fontWeight: 900,
                padding: '1px 5px',
                borderRadius: '999px',
              }}
            >
              Hot
            </div>
            <div
              style={{
                width: '36px',
                height: '36px',
                margin: '0 auto 6px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
              }}
            >
              <Scissors size={18} />
            </div>
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#FFFFFF', lineHeight: '1.2' }}>
              AI Hairstyle
            </div>
          </div>

          {/* Tool 3: Makeup */}
          <div
            onClick={() => onNavigateToStudio ? onNavigateToStudio('makeup') : onNavigate('studio')}
            style={{
              background: '#131B2A',
              border: '1px solid #23314B',
              borderRadius: '16px',
              padding: '12px 6px',
              textAlign: 'center',
              cursor: 'pointer',
              position: 'relative',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                margin: '0 auto 6px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #EC4899 0%, #D946EF 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
              }}
            >
              <Palette size={18} />
            </div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#FFFFFF', lineHeight: '1.2' }}>
              Makeup
            </div>
          </div>

          {/* Tool 4: Face Reshape */}
          <div
            onClick={() => onNavigateToStudio ? onNavigateToStudio('reshape') : onNavigate('studio')}
            style={{
              background: '#131B2A',
              border: '1px solid #23314B',
              borderRadius: '16px',
              padding: '12px 6px',
              textAlign: 'center',
              cursor: 'pointer',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '-6px',
                right: '4px',
                background: '#EC4899',
                color: '#FFFFFF',
                fontSize: '8px',
                fontWeight: 900,
                padding: '1px 5px',
                borderRadius: '999px',
              }}
            >
              New
            </div>
            <div
              style={{
                width: '36px',
                height: '36px',
                margin: '0 auto 6px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
              }}
            >
              <Sliders size={18} />
            </div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#CBD5E1', lineHeight: '1.2' }}>
              Face Reshape
            </div>
          </div>

          {/* Tool 5: Smile & Lip Tone */}
          <div
            onClick={() => onNavigateToStudio ? onNavigateToStudio('makeup') : onNavigate('studio')}
            style={{
              background: '#131B2A',
              border: '1px solid #23314B',
              borderRadius: '16px',
              padding: '12px 6px',
              textAlign: 'center',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                margin: '0 auto 6px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
              }}
            >
              <Smile size={18} />
            </div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#CBD5E1', lineHeight: '1.2' }}>
              Smile
            </div>
          </div>

          {/* Row 2 */}
          {/* Tool 6: Body Reshape */}
          <div
            onClick={() => onNavigateToStudio ? onNavigateToStudio('reshape') : onNavigate('studio')}
            style={{
              background: '#131B2A',
              border: '1px solid #23314B',
              borderRadius: '16px',
              padding: '12px 6px',
              textAlign: 'center',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                margin: '0 auto 6px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366F1 0%, #A855F7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
              }}
            >
              <UserCheck size={18} />
            </div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#CBD5E1', lineHeight: '1.2' }}>
              Body
            </div>
          </div>

          {/* Tool 7: Skin Diagnostic */}
          <div
            onClick={() => onNavigate('profile')}
            style={{
              background: '#131B2A',
              border: '1.5px solid #EC4899',
              borderRadius: '16px',
              padding: '12px 6px',
              textAlign: 'center',
              cursor: 'pointer',
              position: 'relative',
              boxShadow: '0 0 10px rgba(236, 72, 153, 0.2)',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                margin: '0 auto 6px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
              }}
            >
              <Sparkles size={18} />
            </div>
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#FFFFFF', lineHeight: '1.2' }}>
              Skin Diagnostic
            </div>
          </div>

          {/* Tool 8: Teeth Whitener */}
          <div
            onClick={() => onNavigateToStudio ? onNavigateToStudio('retouch') : onNavigate('studio')}
            style={{
              background: '#131B2A',
              border: '1px solid #23314B',
              borderRadius: '16px',
              padding: '12px 6px',
              textAlign: 'center',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                margin: '0 auto 6px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
              }}
            >
              <Smile size={18} />
            </div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#CBD5E1', lineHeight: '1.2' }}>
              Teeth Whitener
            </div>
          </div>

          {/* Tool 9: Slim */}
          <div
            onClick={() => onNavigateToStudio ? onNavigateToStudio('reshape') : onNavigate('studio')}
            style={{
              background: '#131B2A',
              border: '1px solid #23314B',
              borderRadius: '16px',
              padding: '12px 6px',
              textAlign: 'center',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                margin: '0 auto 6px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
              }}
            >
              <Minimize2 size={18} />
            </div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#CBD5E1', lineHeight: '1.2' }}>
              Slim
            </div>
          </div>

          {/* Tool 10: Spot Eraser */}
          <div
            onClick={() => onNavigateToStudio ? onNavigateToStudio('retouch') : onNavigate('studio')}
            style={{
              background: '#131B2A',
              border: '1px solid #23314B',
              borderRadius: '16px',
              padding: '12px 6px',
              textAlign: 'center',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                margin: '0 auto 6px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
              }}
            >
              <Target size={18} />
            </div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#CBD5E1', lineHeight: '1.2' }}>
              Spot Eraser
            </div>
          </div>
        </div>
      </div>

      {/* "Hot Features" Trending Showcase Section (Matching bottom horizontal cards) */}
      <div style={{ padding: '0 16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#F8FAFC', margin: 0 }}>
            Trending Beauty & Complexion Looks
          </h3>
          <span style={{ fontSize: '12px', color: '#EC4899', fontWeight: 700, cursor: 'pointer' }} onClick={() => onNavigate('tryon')}>
            View All
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '12px',
            overflowX: 'auto',
            paddingBottom: '8px',
          }}
        >
          {/* Card 1: Emerald Silk Slip Dress */}
          <div
            onClick={() => onNavigate('tryon')}
            style={{
              minWidth: '150px',
              background: '#131B2A',
              borderRadius: '16px',
              overflow: 'hidden',
              border: '1px solid #23314B',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <div style={{ position: 'relative', height: '140px' }}>
              <img
                src="/garments/garment_emerald_slip.jpg"
                alt="Emerald Slip Dress"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <span
                style={{
                  position: 'absolute',
                  top: '8px',
                  left: '8px',
                  background: 'rgba(16, 185, 129, 0.9)',
                  color: '#FFFFFF',
                  fontSize: '9px',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: '999px',
                }}
              >
                98% Harmony
              </span>
            </div>
            <div style={{ padding: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF' }}>Emerald Silk Slip</div>
              <div style={{ fontSize: '10px', color: '#94A3B8' }}>Deep Autumn Palette</div>
            </div>
          </div>

          {/* Card 2: Camel Trench Coat */}
          <div
            onClick={() => onNavigate('tryon')}
            style={{
              minWidth: '150px',
              background: '#131B2A',
              borderRadius: '16px',
              overflow: 'hidden',
              border: '1px solid #23314B',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <div style={{ position: 'relative', height: '140px' }}>
              <img
                src="/garments/garment_camel_trench.jpg"
                alt="Camel Trench Coat"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <span
                style={{
                  position: 'absolute',
                  top: '8px',
                  left: '8px',
                  background: 'rgba(217, 119, 6, 0.9)',
                  color: '#FFFFFF',
                  fontSize: '9px',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: '999px',
                }}
              >
                Warm Glow
              </span>
            </div>
            <div style={{ padding: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF' }}>Camel Trench</div>
              <div style={{ fontSize: '10px', color: '#94A3B8' }}>Warm Autumn Palette</div>
            </div>
          </div>

          {/* Card 3: Velvet Burgundy Blazer */}
          <div
            onClick={() => onNavigate('tryon')}
            style={{
              minWidth: '150px',
              background: '#131B2A',
              borderRadius: '16px',
              overflow: 'hidden',
              border: '1px solid #23314B',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <div style={{ position: 'relative', height: '140px' }}>
              <img
                src="/garments/garment_burgundy_blazer.jpg"
                alt="Burgundy Blazer"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <span
                style={{
                  position: 'absolute',
                  top: '8px',
                  left: '8px',
                  background: 'rgba(225, 29, 72, 0.9)',
                  color: '#FFFFFF',
                  fontSize: '9px',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: '999px',
                }}
              >
                High Contrast
              </span>
            </div>
            <div style={{ padding: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF' }}>Burgundy Blazer</div>
              <div style={{ fontSize: '10px', color: '#94A3B8' }}>Deep Winter Palette</div>
            </div>
          </div>

          {/* Card 4: Rose Quartz Mockneck */}
          <div
            onClick={() => onNavigate('tryon')}
            style={{
              minWidth: '150px',
              background: '#131B2A',
              borderRadius: '16px',
              overflow: 'hidden',
              border: '1px solid #23314B',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <div style={{ position: 'relative', height: '140px' }}>
              <img
                src="/garments/garment_rose_knit.jpg"
                alt="Rose Quartz Mockneck"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <span
                style={{
                  position: 'absolute',
                  top: '8px',
                  left: '8px',
                  background: 'rgba(236, 72, 153, 0.9)',
                  color: '#FFFFFF',
                  fontSize: '9px',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: '999px',
                }}
              >
                Soft Harmony
              </span>
            </div>
            <div style={{ padding: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF' }}>Rose Knit</div>
              <div style={{ fontSize: '10px', color: '#94A3B8' }}>Light Spring Palette</div>
            </div>
          </div>

          {/* Card 5: Midnight Navy Drape */}
          <div
            onClick={() => onNavigate('tryon')}
            style={{
              minWidth: '150px',
              background: '#131B2A',
              borderRadius: '16px',
              overflow: 'hidden',
              border: '1px solid #23314B',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <div style={{ position: 'relative', height: '140px' }}>
              <img
                src="/garments/garment_navy_crew.jpg"
                alt="Midnight Crew"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <span
                style={{
                  position: 'absolute',
                  top: '8px',
                  left: '8px',
                  background: 'rgba(99, 102, 241, 0.9)',
                  color: '#FFFFFF',
                  fontSize: '9px',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: '999px',
                }}
              >
                Cool Contrast
              </span>
            </div>
            <div style={{ padding: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF' }}>Midnight Crew</div>
              <div style={{ fontSize: '10px', color: '#94A3B8' }}>Deep Winter Palette</div>
            </div>
          </div>
        </div>
      </div>

      {/* VIP Crown Modal */}
      {showVipModal && (
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
              border: '2px solid #F59E0B',
              borderRadius: '24px',
              padding: '24px',
              maxWidth: '380px',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 25px 50px -12px rgba(245, 158, 11, 0.35)',
            }}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
                margin: '0 auto 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 25px rgba(245, 158, 11, 0.6)',
              }}
            >
              <Crown size={30} color="#FFFFFF" fill="#FFFFFF" />
            </div>

            <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#FFFFFF', margin: '0 0 6px 0' }}>
              VIP Pro Tier Unlocked
            </h3>
            <p style={{ fontSize: '13px', color: '#CBD5E1', lineHeight: '1.4', marginBottom: '18px' }}>
              Complimentary VIP Pro status activated for the <strong>YouCam API Hackathon</strong> judges. Enjoy unlimited 16-type skin AI scans, apparel VTO draping, and ingredient lookups.
            </p>

            <button
              onClick={() => setShowVipModal(false)}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '14px',
                padding: '12px',
                fontSize: '14px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              Enjoy VIP Access
            </button>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
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
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '24px',
              padding: '22px',
              maxWidth: '380px',
              width: '100%',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                System Settings
              </h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              <div
                style={{
                  background: '#1E293B',
                  padding: '12px 14px',
                  borderRadius: '14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#F8FAFC' }}>
                    Engine Mode
                  </div>
                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                    {isDemoMode ? 'Verified Instant Cache' : 'Live YouCam Cloud API'}
                  </div>
                </div>
                <button
                  onClick={onToggleDemoMode}
                  style={{
                    background: isDemoMode ? '#10B981' : '#4F46E5',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '999px',
                    padding: '6px 14px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {isDemoMode ? 'Demo Active' : 'Live API'}
                </button>
              </div>

              <div
                style={{
                  background: '#1E293B',
                  padding: '12px 14px',
                  borderRadius: '14px',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#F8FAFC' }}>
                  Clinical Framework
                </div>
                <div style={{ fontSize: '11px', color: '#38BDF8', marginTop: '2px' }}>
                  Dr. Leslie Baumann 16 Skin Types + EU CosIng Allergens
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowSettingsModal(false)}
              style={{
                width: '100%',
                background: '#334155',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                padding: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Close Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
