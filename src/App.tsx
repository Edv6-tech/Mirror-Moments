import React, { useState, useEffect } from 'react';
import { DashboardHomeView } from './ui/DashboardHomeView.tsx';
import { ScanScreen } from './ui/ScanScreen.tsx';
import { SkinProfileView } from './ui/SkinProfileView.tsx';
import { ProductCheckerView } from './ui/ProductCheckerView.tsx';
import { VirtualTryOnView } from './ui/VirtualTryOnView.tsx';
import { MakeupStudioView, StudioTab } from './ui/MakeupStudioView.tsx';
import { RoutineView, RoutineItem } from './ui/RoutineView.tsx';
import { ProgressView } from './ui/ProgressView.tsx';
import { Footer } from './ui/Footer.tsx';
import { UserSkinProfile } from './agents/profiler.ts';
import {
  Home,
  Sparkles,
  Shirt,
  ShieldCheck,
  Layers,
  Palette,
} from 'lucide-react';

type Screen = 'home' | 'scan' | 'profile' | 'product' | 'routine' | 'tryon' | 'progress' | 'studio';

export const App: React.FC = () => {
  const [screen, setScreen] = useState<Screen>('home');
  const [studioTab, setStudioTab] = useState<StudioTab>('makeup');
  const [profile, setProfile] = useState<UserSkinProfile | null>(null);
  const [userFileId, setUserFileId] = useState<string | null>(null);
  const [userSelfieUrl, setUserSelfieUrl] = useState<string | null>(() => {
    return localStorage.getItem('mirror_moment_selfie_url') || '/sample_face_valid.jpg';
  });
  const [routine, setRoutine] = useState<RoutineItem[]>([]);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isDirectUploading, setIsDirectUploading] = useState(false);

  // Load cached profile & routine from localStorage on initial load
  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem('mirror_moment_skin_profile');
      if (savedProfile) {
        setProfile(JSON.parse(savedProfile));
      }
      const savedRoutine = localStorage.getItem('mirror_moment_routine');
      if (savedRoutine) {
        setRoutine(JSON.parse(savedRoutine));
      }
    } catch (e) {
      console.warn('Failed to parse cached state:', e);
    }
  }, []);

  const handleScanComplete = (newProfile: UserSkinProfile, fileId?: string, selfieUrl?: string) => {
    setProfile(newProfile);
    if (fileId) setUserFileId(fileId);
    if (selfieUrl) {
      setUserSelfieUrl(selfieUrl);
      try {
        localStorage.setItem('mirror_moment_selfie_url', selfieUrl);
      } catch (e) {}
    }
    try {
      localStorage.setItem('mirror_moment_skin_profile', JSON.stringify(newProfile));
      if (fileId) localStorage.setItem('mirror_moment_file_id', fileId);
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
    setScreen('profile');
  };

  const handleAddToRoutine = (prod: any) => {
    const newItem: RoutineItem = {
      id: prod.id || `routine_${Date.now()}`,
      name: prod.productName || prod.name,
      brand: prod.productBrand || prod.brand || 'Dermacell',
      category: prod.category || 'Treatment',
      ingredientsText: prod.parsed?.rawText || prod.ingredientsText,
      addedAt: new Date().toISOString(),
    };

    const updated = [...routine, newItem];
    setRoutine(updated);
    try {
      localStorage.setItem('mirror_moment_routine', JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
    setScreen('routine');
  };

  const handleRemoveFromRoutine = (id: string) => {
    const updated = routine.filter((r) => r.id !== id);
    setRoutine(updated);
    try {
      localStorage.setItem('mirror_moment_routine', JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
  };

  const handleDirectUpload = async (file: File) => {
    setIsDirectUploading(true);
    const previewUrl = URL.createObjectURL(file);
    setUserSelfieUrl(previewUrl);

    try {
      const formData = new FormData();
      formData.append('selfie', file);

      const res = await fetch('/api/scan', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.profile) {
        handleScanComplete(data.profile, data.fileId, previewUrl);
      } else {
        setScreen('scan');
      }
    } catch (err) {
      console.warn('Direct upload error:', err);
      setScreen('scan');
    } finally {
      setIsDirectUploading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#0B0F19',
      color: '#F8FAFC',
    }}>
      {/* Top Navbar */}
      <nav style={{
        padding: '12px 16px',
        borderBottom: '1px solid #1F2B42',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#0E1424',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div
          onClick={() => setScreen('home')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
        >
          <div style={{
            width: '30px',
            height: '30px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #4F46E5 0%, #EC4899 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '15px',
            color: '#FFFFFF',
          }}>
            M
          </div>
          <span style={{ fontWeight: 800, fontSize: '17px', letterSpacing: '-0.02em' }}>
            Mirror Moment
          </span>
        </div>

        <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', alignItems: 'center' }}>
          <button
            onClick={() => setScreen('home')}
            style={{
              background: screen === 'home' ? '#4F46E5' : '#161F30',
              border: '1px solid #2D3A54',
              borderRadius: '8px',
              padding: '6px 9px',
              fontSize: '11px',
              fontWeight: 600,
              color: screen === 'home' ? '#FFFFFF' : '#CBD5E1',
              cursor: 'pointer',
            }}
          >
            Home
          </button>
          <button
            onClick={() => setScreen(profile ? 'profile' : 'scan')}
            style={{
              background: screen === 'profile' || screen === 'scan' ? '#4F46E5' : '#161F30',
              border: '1px solid #2D3A54',
              borderRadius: '8px',
              padding: '6px 9px',
              fontSize: '11px',
              fontWeight: 600,
              color: screen === 'profile' || screen === 'scan' ? '#FFFFFF' : '#CBD5E1',
              cursor: 'pointer',
            }}
          >
            {profile ? 'My Skin' : 'Scan'}
          </button>
          <button
            onClick={() => setScreen('tryon')}
            style={{
              background: screen === 'tryon' ? '#4F46E5' : '#161F30',
              border: '1px solid #2D3A54',
              borderRadius: '8px',
              padding: '6px 9px',
              fontSize: '11px',
              fontWeight: 600,
              color: screen === 'tryon' ? '#FFFFFF' : '#CBD5E1',
              cursor: 'pointer',
            }}
          >
            Try-On
          </button>
          <button
            onClick={() => setScreen('product')}
            style={{
              background: screen === 'product' ? '#4F46E5' : '#161F30',
              border: '1px solid #2D3A54',
              borderRadius: '8px',
              padding: '6px 9px',
              fontSize: '11px',
              fontWeight: 600,
              color: screen === 'product' ? '#FFFFFF' : '#CBD5E1',
              cursor: 'pointer',
            }}
          >
            Verdict
          </button>
          <button
            onClick={() => setScreen('routine')}
            style={{
              background: screen === 'routine' ? '#4F46E5' : '#161F30',
              border: '1px solid #2D3A54',
              borderRadius: '8px',
              padding: '6px 9px',
              fontSize: '11px',
              fontWeight: 600,
              color: screen === 'routine' ? '#FFFFFF' : '#CBD5E1',
              cursor: 'pointer',
            }}
          >
            Routine ({routine.length})
          </button>
        </div>

        <button
          onClick={() => setIsDemoMode(!isDemoMode)}
          style={{
            background: isDemoMode ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)',
            color: isDemoMode ? '#10B981' : '#94A3B8',
            border: `1px solid ${isDemoMode ? '#10B981' : '#334155'}`,
            borderRadius: '999px',
            padding: '4px 10px',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            flexShrink: 0,
            marginLeft: '8px',
          }}
          title="Toggle between Live YouCam API and Instant Cached Demo Mode"
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isDemoMode ? '#10B981' : '#64748B' }} />
          {isDemoMode ? 'Demo Cache' : 'Live YouCam'}
        </button>
      </nav>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: screen === 'home' ? '0' : '16px 0' }}>
        {isDirectUploading && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(7, 11, 20, 0.92)',
              backdropFilter: 'blur(16px)',
              zIndex: 100,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
            }}
          >
            <div
              style={{
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 35px rgba(236, 72, 153, 0.6)',
                marginBottom: '20px',
                animation: 'pulseGlow 2s infinite',
              }}
            >
              <Sparkles size={32} color="#FFFFFF" />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF', margin: '0 0 8px 0' }}>
              Analyzing Skin with YouCam AI
            </h3>
            <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0, textAlign: 'center' }}>
              Extracting 10 diagnostic parameters & Dr. Baumann clinical matrix...
            </p>
          </div>
        )}

        {screen === 'home' && (
          <DashboardHomeView
            onOpenScan={() => setScreen('scan')}
            onUploadPhoto={handleDirectUpload}
            onNavigate={(target) => setScreen(target)}
            onNavigateToStudio={(tab) => {
              setStudioTab(tab);
              setScreen('studio');
            }}
            profile={profile}
            routineCount={routine.length}
            isDemoMode={isDemoMode}
            onToggleDemoMode={() => setIsDemoMode(!isDemoMode)}
          />
        )}

        {screen === 'studio' && (
          <MakeupStudioView
            profile={profile}
            userSelfieUrl={userSelfieUrl || '/sample_face_valid.jpg'}
            initialTab={studioTab}
            onNavigateToTryOn={() => setScreen('tryon')}
            onNavigateToSkinAI={() => setScreen(profile ? 'profile' : 'scan')}
            onNavigateToRoutine={() => setScreen('routine')}
          />
        )}

        {screen === 'scan' && (
          <ScanScreen
            onScanComplete={handleScanComplete}
            isDemoMode={isDemoMode}
          />
        )}

        {screen === 'profile' && profile && (
          <SkinProfileView
            profile={profile}
            userSelfieUrl={userSelfieUrl || '/sample_face_valid.jpg'}
            onRetake={() => setScreen('scan')}
            onContinue={() => setScreen('product')}
          />
        )}

        {screen === 'product' && profile && (
          <ProductCheckerView
            profile={profile}
            onNavigateToRoutine={handleAddToRoutine}
            onNavigateToStyle={() => setScreen('tryon')}
          />
        )}

        {screen === 'routine' && profile && (
          <RoutineView
            routine={routine}
            onRemoveItem={handleRemoveFromRoutine}
            onAddItem={(item) => {
              const updated = [...routine, item];
              setRoutine(updated);
              localStorage.setItem('mirror_moment_routine', JSON.stringify(updated));
            }}
            profile={profile}
          />
        )}

        {screen === 'tryon' && (
          <VirtualTryOnView
            profile={
              profile || {
                skinAge: 23,
                rawSkinAge: 23,
                vitalityScore: 88,
                skinType: 'Normal / Resilient',
                topConcerns: [
                  {
                    key: 'moisture',
                    label: 'Moisture Level',
                    actionTag: 'moisture',
                    score: 92,
                    severity: 8,
                    severityLevel: 'Mild',
                    description: 'High epidermal hydration and elastic barrier resilience.',
                  },
                ],
                allConcerns: [],
                scannedAt: new Date().toISOString(),
              }
            }
            userFileId={userFileId}
            userSelfieUrl={userSelfieUrl || '/sample_face_valid.jpg'}
          />
        )}

        {screen === 'progress' && profile && (
          <ProgressView
            currentProfile={profile}
          />
        )}
      </main>

      {/* Flagship App Store Mobile Bottom Navigation Bar (Matching YouCam Home Bar) */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'rgba(14, 20, 36, 0.94)',
          backdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          padding: '8px 8px 14px',
          zIndex: 80,
          boxShadow: '0 -10px 25px rgba(0, 0, 0, 0.5)',
        }}
      >
        <button
          onClick={() => setScreen('home')}
          style={{
            background: 'transparent',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            color: screen === 'home' ? '#EC4899' : '#94A3B8',
            cursor: 'pointer',
            padding: '4px 8px',
          }}
        >
          <Home size={20} />
          <span style={{ fontSize: '10px', fontWeight: screen === 'home' ? 800 : 600 }}>Home</span>
        </button>

        <button
          onClick={() => setScreen('studio')}
          style={{
            background: 'transparent',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            color: screen === 'studio' ? '#EC4899' : '#94A3B8',
            cursor: 'pointer',
            padding: '4px 8px',
          }}
        >
          <Palette size={20} />
          <span style={{ fontSize: '10px', fontWeight: screen === 'studio' ? 800 : 600 }}>Studio</span>
        </button>

        <button
          onClick={() => setScreen('tryon')}
          style={{
            background: 'transparent',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            color: screen === 'tryon' ? '#EC4899' : '#94A3B8',
            cursor: 'pointer',
            padding: '4px 8px',
          }}
        >
          <Shirt size={20} />
          <span style={{ fontSize: '10px', fontWeight: screen === 'tryon' ? 800 : 600 }}>Try-On</span>
        </button>

        <button
          onClick={() => setScreen(profile ? 'profile' : 'scan')}
          style={{
            background: 'transparent',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            color: screen === 'profile' || screen === 'scan' ? '#EC4899' : '#94A3B8',
            cursor: 'pointer',
            padding: '4px 8px',
          }}
        >
          <Sparkles size={20} />
          <span style={{ fontSize: '10px', fontWeight: screen === 'profile' || screen === 'scan' ? 800 : 600 }}>Skin AI</span>
        </button>

        <button
          onClick={() => setScreen('product')}
          style={{
            background: 'transparent',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            color: screen === 'product' ? '#EC4899' : '#94A3B8',
            cursor: 'pointer',
            padding: '4px 8px',
          }}
        >
          <ShieldCheck size={20} />
          <span style={{ fontSize: '10px', fontWeight: screen === 'product' ? 800 : 600 }}>Verdict</span>
        </button>

        <button
          onClick={() => setScreen('routine')}
          style={{
            background: 'transparent',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            color: screen === 'routine' ? '#EC4899' : '#94A3B8',
            cursor: 'pointer',
            padding: '4px 8px',
          }}
        >
          <Layers size={20} />
          <span style={{ fontSize: '10px', fontWeight: screen === 'routine' ? 800 : 600 }}>Routine</span>
        </button>
      </div>

      {/* Global Footer */}
      <Footer />
    </div>
  );
};

export default App;
