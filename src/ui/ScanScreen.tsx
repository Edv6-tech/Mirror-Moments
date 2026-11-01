import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  Upload,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  SwitchCamera,
  Timer,
  Sun,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { UserSkinProfile } from '../agents/profiler.ts';

interface ScanScreenProps {
  onScanComplete: (profile: UserSkinProfile, fileId?: string, selfieUrl?: string) => void;
  isDemoMode: boolean;
}

// Convert dataURI to File synchronously
function dataUrlToFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

// Synthesized audio shutter click using Web Audio API
function playShutterSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.09);
  } catch {
    // Ignore audio permission or restriction errors
  }
}

export const ScanScreen: React.FC<ScanScreenProps> = ({ onScanComplete, isDemoMode: _isDemoMode }) => {
  const [consentGiven] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('Initializing...');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [guidanceTip, setGuidanceTip] = useState<string | null>(null);

  // Camera states
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Callback ref to guarantee stream is attached immediately upon video mounting
  const attachVideoRef = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (node && streamRef.current) {
      node.srcObject = streamRef.current;
      node.play().catch((err) => console.warn('Video play error:', err));
    }
  }, []);

  // Stop camera tracks cleanly
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Discover camera devices
  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        const cams = devices.filter((d) => d.kind === 'videoinput');
        setVideoDevices(cams);
        if (cams.length > 0 && !selectedDeviceId) {
          const nonVirtual = cams.find((c) => !c.label.toLowerCase().includes('virtual'));
          setSelectedDeviceId((nonVirtual || cams[0]).deviceId);
        }
      }).catch((e) => console.warn('Enumerate devices error:', e));
    }
  }, []);

  // Start live camera stream
  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser or connection. Please use HTTPS or localhost.');
      }
      
      let stream: MediaStream;
      try {
        const constraints: MediaTrackConstraints = selectedDeviceId
          ? { deviceId: { exact: selectedDeviceId } }
          : { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 960 } };

        stream = await navigator.mediaDevices.getUserMedia({
          video: constraints,
          audio: false,
        });
      } catch (idealErr) {
        console.warn('Ideal constraints failed, trying basic video:', idealErr);
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCameraActive(true);
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setCameraError(err.message || 'Unable to access camera. Please allow camera permissions in your browser.');
      setCameraActive(false);
    }
  }, [facingMode, selectedDeviceId, stopCamera]);

  // When cameraActive or stream changes, ensure video plays
  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch((e) => console.warn('Video play error:', e));
    }
  }, [cameraActive]);

  // Initialize camera on mount if consent is granted and no image yet
  useEffect(() => {
    if (!capturedImage) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera, capturedImage]);

  // Flip camera between front and rear
  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  // Capture frame from video stream to Canvas & File
  const takeSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 960;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Mirror image if using front camera for natural selfie view
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    playShutterSound();
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedImage(dataUrl);

    // Synchronously create File from dataUrl so it is immediately available
    try {
      const file = dataUrlToFile(dataUrl, 'mirror_moment_selfie.jpg');
      setCapturedFile(file);
    } catch (e) {
      // Fallback to async blob conversion
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const file = new File([blob], 'mirror_moment_selfie.jpg', { type: 'image/jpeg' });
            setCapturedFile(file);
          }
        },
        'image/jpeg',
        0.92
      );
    }

    stopCamera();
  };

  // Handle shutter click with optional countdown
  const handleShutterClick = () => {
    if (timerEnabled) {
      let count = 3;
      setCountdown(count);
      const timer = setInterval(() => {
        count -= 1;
        if (count > 0) {
          setCountdown(count);
        } else {
          clearInterval(timer);
          setCountdown(null);
          takeSnapshot();
        }
      }, 1000);
    } else {
      takeSnapshot();
    }
  };

  // Retake photo
  const handleRetake = () => {
    setCapturedImage(null);
    setCapturedFile(null);
    setErrorMsg(null);
    setGuidanceTip(null);
    startCamera();
  };

  // Send photo to skin analysis
  const processImage = async (file: File) => {
    if (!consentGiven) {
      setErrorMsg('Please grant personal data consent before scanning.');
      return;
    }

    setErrorMsg(null);
    setGuidanceTip(null);
    setLoading(true);
    setLoadingStep('Uploading high-res selfie to YouCam AI...');

    try {
      const formData = new FormData();
      formData.append('selfie', file);

      setTimeout(() => setLoadingStep('Analyzing 10 skin diagnostic parameters...'), 1500);
      setTimeout(() => setLoadingStep('Generating personalized dermal intelligence report...'), 3500);

      const res = await fetch('/api/scan', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.profile) {
        if (data.code === 'error_credit_insufficiency' || (data.error && data.error.toLowerCase().includes('credit'))) {
          setErrorMsg("YouCam API Credits Depleted: Your trial account has 0 credits remaining (CreditInsufficiency). Tap 'Instant Demo Scan' below or toggle 'Demo Cache' in the top-right header to test all features freely!");
        } else if (data.code === 'error_large_face_angle' || (data.error && data.error.toLowerCase().includes('tilt')) || (data.error && data.error.toLowerCase().includes('roll angle'))) {
          setGuidanceTip('Head Tilt Warning: Your head is tilted. Please hold your head straight, level, and look directly forward into the camera.');
        } else if (data.code === 'error_face_occluded' || (data.error && data.error.toLowerCase().includes('obstruct')) || (data.error && data.error.toLowerCase().includes('hand'))) {
          setGuidanceTip('Face Obstructed: Please lower your hand away from your ear/face so your cheeks and forehead are clearly visible.');
        } else if (data.code === 'error_no_face' || (data.error && data.error.toLowerCase().includes('no face'))) {
          setGuidanceTip('No face detected in photo. Please ensure your face is clearly visible inside the oval guide and retake.');
        } else if (data.code === 'error_src_face_too_small' || (data.error && data.error.toLowerCase().includes('too far'))) {
          setGuidanceTip('Face framing error: Your face must fill at least 60% of the camera frame. Please move closer.');
        } else if (data.code === 'error_below_min_image_size' || (data.error && data.error.toLowerCase().includes('resolution'))) {
          setGuidanceTip('Resolution error: Please ensure a sharp, focused selfie (minimum 480px width).');
        } else {
          setErrorMsg(data.error || 'Skin analysis failed. Please try again.');
        }
        setLoading(false);
        return;
      }

      if (data.profile) {
        onScanComplete(data.profile, data.fileId, capturedImage || undefined);
      } else {
        setErrorMsg('Skin analysis did not return a valid profile.');
      }
    } catch (err: any) {
      console.error('Scan error:', err);
      setErrorMsg('Network or proxy error connecting to YouCam Skin AI. Please check server connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const previewUrl = URL.createObjectURL(file);
      setCapturedImage(previewUrl);
      setCapturedFile(file);
      stopCamera();
    }
  };

  const handleDemoPreset = async () => {
    setLoading(true);
    setLoadingStep('Loading instant verified YouCam Skin AI scan...');
    setErrorMsg(null);
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDemoPreset: true }),
      });
      const data = await res.json();
      if (data.profile) {
        onScanComplete(data.profile, 'demo_file_id', '/sample_face_valid.jpg');
      }
    } catch (err) {
      console.error('Preset error:', err);
      setErrorMsg('Failed to load preset scan fixture.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '520px', margin: '0 auto', padding: '16px 20px 32px' }}>
      {/* Brand Header */}
      <header style={{ marginBottom: '20px', textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(236, 72, 153, 0.15) 100%)',
            border: '1px solid rgba(129, 140, 248, 0.3)',
            borderRadius: '999px',
            color: '#A5B4FC',
            fontSize: '13px',
            fontWeight: 600,
            marginBottom: '10px',
            boxShadow: '0 2px 10px rgba(99, 102, 241, 0.2)',
          }}
        >
          <Sparkles size={14} color="#F472B6" />
          AR Smart Mirror • YouCam Skin AI
        </div>
        <h1
          style={{
            fontSize: '28px',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            marginBottom: '6px',
            background: 'linear-gradient(135deg, #FFFFFF 40%, #CBD5E1 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Capture Your Moment
        </h1>
        <p style={{ color: '#94A3B8', fontSize: '14px', margin: 0 }}>
          Real-time biometric camera skin analysis and color harmony mapping.
        </p>
      </header>

      {/* Main Viewport Container (Live Camera or Snapped Photo) */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '3 / 4',
          maxHeight: '480px',
          background: '#070B14',
          borderRadius: '24px',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.7), 0 0 25px rgba(99, 102, 241, 0.15)',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* State A: Captured Selfie Review */}
        {capturedImage ? (
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <img
              src={capturedImage}
              alt="Captured Selfie"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
            {/* Overlay Gradient */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(7, 11, 20, 0.85) 0%, transparent 40%)',
                pointerEvents: 'none',
              }}
            />

            {/* Top Status Pill */}
            <div
              style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                right: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.85)',
                  backdropFilter: 'blur(8px)',
                  color: '#FFFFFF',
                  padding: '5px 12px',
                  borderRadius: '999px',
                  fontSize: '12px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                }}
              >
                <CheckCircle2 size={14} />
                Photo Captured
              </div>

              <button
                onClick={handleRetake}
                disabled={loading}
                style={{
                  background: 'rgba(15, 23, 42, 0.75)',
                  backdropFilter: 'blur(8px)',
                  color: '#F8FAFC',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '999px',
                  padding: '6px 14px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <RotateCcw size={14} />
                Retake
              </button>
            </div>

            {/* Bottom Analysis Trigger */}
            <div
              style={{
                position: 'absolute',
                bottom: '16px',
                left: '16px',
                right: '16px',
              }}
            >
              <button
                onClick={() => {
                  const targetFile =
                    capturedFile ||
                    (capturedImage ? dataUrlToFile(capturedImage, 'mirror_moment_selfie.jpg') : null);
                  if (targetFile) {
                    processImage(targetFile);
                  }
                }}
                disabled={loading || !consentGiven}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #EC4899 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '16px',
                  padding: '16px',
                  fontSize: '16px',
                  fontWeight: 700,
                  cursor: loading || !consentGiven ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  boxShadow: '0 8px 24px rgba(99, 102, 241, 0.45)',
                  transition: 'transform 0.15s ease',
                }}
              >
                {loading ? (
                  <>
                    <RefreshCw size={20} className="animate-spin" />
                    <span>{loadingStep}</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>Analyze Skin with YouCam AI</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : cameraActive ? (
          /* State B: Live AR Camera Studio */
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <video
              ref={attachVideoRef}
              playsInline
              muted
              autoPlay
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
              }}
            />

            {/* Glowing Biometric Face Oval Reticle */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Oval Target Frame */}
              <div
                style={{
                  width: '64%',
                  height: '68%',
                  borderRadius: '50%',
                  border: '2px dashed rgba(99, 102, 241, 0.75)',
                  boxShadow: '0 0 25px rgba(99, 102, 241, 0.3), inset 0 0 25px rgba(99, 102, 241, 0.2)',
                  position: 'relative',
                  animation: 'pulseGlow 2.5s ease-in-out infinite',
                }}
              >
                {/* Scanning Radar Line */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: '10%',
                    right: '10%',
                    height: '2px',
                    background: 'linear-gradient(90deg, transparent, #38BDF8, #818CF8, transparent)',
                    boxShadow: '0 0 10px #38BDF8',
                    animation: 'scanLaser 2.2s ease-in-out infinite alternate',
                  }}
                />

                {/* Corner reticle markers */}
                <div style={{ position: 'absolute', top: '-10px', left: '-10px', width: '20px', height: '20px', borderTop: '3px solid #38BDF8', borderLeft: '3px solid #38BDF8' }} />
                <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '20px', height: '20px', borderTop: '3px solid #38BDF8', borderRight: '3px solid #38BDF8' }} />
                <div style={{ position: 'absolute', bottom: '-10px', left: '-10px', width: '20px', height: '20px', borderBottom: '3px solid #38BDF8', borderLeft: '3px solid #38BDF8' }} />
                <div style={{ position: 'absolute', bottom: '-10px', right: '-10px', width: '20px', height: '20px', borderBottom: '3px solid #38BDF8', borderRight: '3px solid #38BDF8' }} />
              </div>
            </div>

            {/* Top Bar Controls */}
            <div
              style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                right: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              {/* Guidance Badge or Camera Selector */}
              {videoDevices.length > 1 ? (
                <select
                  value={selectedDeviceId}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                  style={{
                    background: 'rgba(15, 23, 42, 0.85)',
                    backdropFilter: 'blur(8px)',
                    color: '#E2E8F0',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '999px',
                    padding: '6px 12px',
                    fontSize: '11px',
                    fontWeight: 600,
                    maxWidth: '180px',
                    cursor: 'pointer',
                  }}
                >
                  {videoDevices.map((d, i) => (
                    <option key={d.deviceId || i} value={d.deviceId}>
                      {d.label || `Camera ${i + 1}`}
                    </option>
                  ))}
                </select>
              ) : (
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.75)',
                    backdropFilter: 'blur(8px)',
                    padding: '6px 12px',
                    borderRadius: '999px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Sun size={13} color="#FBBF24" />
                  Align face in oval
                </div>
              )}

              {/* Utility Action Buttons */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {/* Timer Toggle */}
                <button
                  onClick={() => setTimerEnabled((prev) => !prev)}
                  title="Toggle 3s Timer"
                  style={{
                    background: timerEnabled ? '#4F46E5' : 'rgba(15, 23, 42, 0.75)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '50%',
                    width: '38px',
                    height: '38px',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Timer size={16} />
                </button>

                {/* Flip Camera */}
                <button
                  onClick={toggleFacingMode}
                  title="Switch Camera"
                  style={{
                    background: 'rgba(15, 23, 42, 0.75)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '50%',
                    width: '38px',
                    height: '38px',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <SwitchCamera size={16} />
                </button>
              </div>
            </div>

            {/* Countdown Overlay (3.. 2.. 1..) */}
            {countdown !== null && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0, 0, 0, 0.4)',
                  backdropFilter: 'blur(4px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 20,
                }}
              >
                <div
                  style={{
                    fontSize: '96px',
                    fontWeight: 900,
                    color: '#FFFFFF',
                    textShadow: '0 0 40px rgba(99, 102, 241, 0.9)',
                    animation: 'pulseCount 0.9s ease-out infinite',
                  }}
                >
                  {countdown}
                </div>
              </div>
            )}

            {/* Bottom Controls Bar (Shutter button + Upload fallback) */}
            <div
              style={{
                position: 'absolute',
                bottom: '16px',
                left: '0',
                right: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-around',
                padding: '0 24px',
              }}
            >
              {/* Upload Existing Photo Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                title="Upload Photo"
                style={{
                  background: 'rgba(15, 23, 42, 0.75)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '50%',
                  width: '46px',
                  height: '46px',
                  color: '#CBD5E1',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Upload size={18} />
              </button>

              {/* Shutter Button (Circular Glowing Trigger) */}
              <button
                onClick={handleShutterClick}
                disabled={countdown !== null}
                style={{
                  width: '74px',
                  height: '74px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.25)',
                  backdropFilter: 'blur(10px)',
                  border: '3px solid rgba(255, 255, 255, 0.9)',
                  padding: '5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 25px rgba(255, 255, 255, 0.4)',
                  transition: 'transform 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #FFFFFF 0%, #CBD5E1 100%)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                  }}
                />
              </button>

              {/* Quick Preset Scan Button */}
              <button
                onClick={handleDemoPreset}
                title="Instant Demo Scan"
                style={{
                  background: 'rgba(15, 23, 42, 0.75)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '50%',
                  width: '46px',
                  height: '46px',
                  color: '#FBBF24',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles size={18} />
              </button>
            </div>
          </div>
        ) : (
          /* State C: Camera Access Denied or Loading Fallback */
          <div
            style={{
              padding: '32px 24px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#818CF8',
              }}
            >
              <Camera size={32} />
            </div>

            <div>
              <div style={{ color: '#F8FAFC', fontWeight: 700, fontSize: '17px', marginBottom: '6px' }}>
                Camera Not Initialized
              </div>
              <p style={{ color: '#94A3B8', fontSize: '13px', margin: 0, maxWidth: '280px' }}>
                {cameraError || 'Grant camera access in your browser or choose a photo from your gallery.'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button
                onClick={startCamera}
                style={{
                  background: '#4F46E5',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '10px 18px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <RefreshCw size={14} />
                Try Camera Again
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#CBD5E1',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '12px',
                  padding: '10px 18px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Upload size={14} />
                Upload Photo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Hidden File Input for Device Native Camera / Photo Gallery */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="user"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        id="cameraUpload"
      />

      {/* Error / Framing Notifications */}
      {errorMsg && (
        <div
          style={{
            background: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: '14px',
            padding: '14px',
            marginBottom: '16px',
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-start',
          }}
        >
          <AlertCircle size={20} color="#F43F5E" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ color: '#F43F5E', fontWeight: 700, fontSize: '14px' }}>Scan Issue</div>
            <div style={{ color: '#FDA4AF', fontSize: '13px', marginTop: '2px' }}>{errorMsg}</div>
          </div>
        </div>
      )}

      {guidanceTip && (
        <div
          style={{
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '14px',
            padding: '14px',
            marginBottom: '16px',
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-start',
          }}
        >
          <AlertCircle size={20} color="#F59E0B" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ color: '#F59E0B', fontWeight: 700, fontSize: '14px' }}>Framing Guidance</div>
            <div style={{ color: '#FDE68A', fontSize: '13px', marginTop: '2px' }}>{guidanceTip}</div>
          </div>
        </div>
      )}

      {/* Quick Action Bar (Gallery Upload + Instant Demo Scan) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          style={{
            background: 'rgba(30, 41, 59, 0.7)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '14px',
            padding: '12px 14px',
            color: '#E2E8F0',
            fontSize: '13px',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <Camera size={16} color="#818CF8" />
          <span>Device Camera / Gallery</span>
        </button>

        <button
          onClick={handleDemoPreset}
          disabled={loading}
          style={{
            background: 'rgba(30, 41, 59, 0.7)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '14px',
            padding: '12px 14px',
            color: '#E2E8F0',
            fontSize: '13px',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <Sparkles size={16} color="#F59E0B" />
          <span>Instant Demo Scan</span>
        </button>
      </div>

      {/* Consent & Privacy Notice */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(8px)',
          borderRadius: '14px',
          padding: '12px 14px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <ShieldCheck size={18} color="#10B981" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: '12px', color: '#94A3B8', lineHeight: '1.4' }}>
          <strong>Zero Storage Guarantee:</strong> Your camera feed and photos are processed in temporary memory and are never saved or stored.
        </span>
      </div>

      {/* Keyframe Animations */}
      <style>{`
        @keyframes scanLaser {
          0% { top: 15%; opacity: 0.3; }
          50% { opacity: 1; }
          100% { top: 85%; opacity: 0.3; }
        }
        @keyframes pulseGlow {
          0%, 100% { border-color: rgba(99, 102, 241, 0.5); box-shadow: 0 0 20px rgba(99, 102, 241, 0.2); }
          50% { border-color: rgba(56, 189, 248, 0.9); box-shadow: 0 0 35px rgba(56, 189, 248, 0.4); }
        }
        @keyframes pulseCount {
          0% { transform: scale(0.6); opacity: 0; }
          50% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 0.8; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};
