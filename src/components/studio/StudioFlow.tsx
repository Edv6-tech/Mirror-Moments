'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Download,
  RotateCcw,
  Check,
  Scissors,
  Shirt,
  ShoppingBag,
  Footprints,
  Loader2,
} from 'lucide-react';
import clsx from 'clsx';
import {
  Button,
  Dropzone,
  Stepper,
  DemoPreviewNotice,
} from '@/components/ui';
import FX8BeforeAfterSlider from '@/components/effects/FX8BeforeAfterSlider';
import FX4DissolveExtraction from '@/components/effects/FX4DissolveExtraction';
import FX5WeavingLoader from '@/components/effects/FX5WeavingLoader';
import FX6CurtainReveal from '@/components/effects/FX6CurtainReveal';
import FX7TiltCard from '@/components/effects/FX7TiltCard';
import { useDressLifter } from '@/lib/dress-lifter/useDressLifter';
import { prepareFullLookPhoto, prepareLookCrops } from '@/lib/fullLookImages';

export type StudioMode = 'dress' | 'hair' | 'shoes' | 'bag';

export interface StudioFlowProps {
  isGuest?: boolean;
}

// Per-mode copy & config (grounded in YouCam docs)
const MODE_CONFIG: Record<StudioMode, {
  label: string;
  icon: React.ElementType;
  uploadLabel: string;
  uploadHint: string;
  selfieLabel: string;
  selfieHint: string;
  cropLabel: string;
  apiRoute: string;
  lifterMode: 'dress' | 'hair' | 'shoes' | 'bag';
  defaultName: string;
  collection: string;
}> = {
  dress: {
    label: 'Dress Try-On',
    icon: Shirt,
    uploadLabel: 'Upload a photo of someone wearing the dress',
    uploadHint: 'Model, friend, social feed — JPG/PNG up to 10 MB',
    selfieLabel: 'Upload your photo',
    selfieHint: 'Match the photo framing to the selected garment coverage. Face visible, facing forward — JPG/PNG',
    cropLabel: 'Dress Cropped & Saved',
    apiRoute: '/api/dress-tryon',
    lifterMode: 'dress',
    defaultName: 'Occasion Dress',
    collection: 'Wardrobe',
  },
  hair: {
    label: 'Hair Studio',
    icon: Scissors,
    uploadLabel: 'Upload a photo of someone with the hairstyle',
    uploadHint: 'Model, friend, social feed — JPG or PNG up to 10 MB',
    selfieLabel: 'Upload your front-facing photo',
    selfieHint: 'A clear, front-facing photo works, even if it is full-body. We automatically zoom to your face and shoulders — JPG or PNG.',
    cropLabel: 'Hair Cropped & Saved',
    apiRoute: '/api/hair-tryon',
    lifterMode: 'hair',
    defaultName: 'Chic Hairstyle',
    collection: 'Hair Collection',
  },
  shoes: {
    label: 'Shoes Try-On',
    icon: Footprints,
    uploadLabel: 'Upload a photo of the shoes',
    uploadHint: 'Product image or someone wearing them — JPG/PNG up to 10 MB',
    selfieLabel: 'Upload your full-body photo',
    selfieHint: 'Any clear full-body photo works. We resize it while keeping your face and feet in frame — JPG/PNG.',
    cropLabel: 'Shoes Cropped & Saved',
    apiRoute: '/api/shoes-tryon',
    lifterMode: 'shoes',
    defaultName: 'Stylish Shoes',
    collection: 'Wardrobe',
  },
  bag: {
    label: 'Bag Try-On',
    icon: ShoppingBag,
    uploadLabel: 'Upload a photo of the bag',
    uploadHint: 'Product image or worn — JPG/PNG up to 10 MB',
    selfieLabel: 'Upload your half-body photo',
    selfieHint: 'A portrait or full-body photo works. We zoom to your head and upper body for the bag preview — JPG/PNG.',
    cropLabel: 'Bag Cropped & Saved',
    apiRoute: '/api/bag-tryon',
    lifterMode: 'bag',
    defaultName: 'Luxury Bag',
    collection: 'Wardrobe',
  },
};

async function prepareHairApiPhoto(file: File): Promise<File> {
  const image = await createImageBitmap(file);
  try {
    // Hair VTO needs a face at least 128 px wide. Cropping a centered head-and-
    // shoulders region first makes full-body uploads usable without stretching
    // the whole photo until the face is large enough.
    const cropWidth = Math.max(1, Math.round(Math.min(image.width * 0.58, image.height * 0.435)));
    const cropHeight = Math.max(1, Math.min(image.height, Math.round(cropWidth * (4 / 3))));
    const cropX = Math.max(0, Math.round((image.width - cropWidth) / 2));
    const cropY = 0;
    const scale = 1024 / Math.max(cropWidth, cropHeight);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(cropWidth * scale));
    canvas.height = Math.max(1, Math.round(cropHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not prepare this photo for hair try-on.');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);
    const jpeg = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.94));
    if (!jpeg) throw new Error('Could not prepare this photo for hair try-on.');
    const baseName = file.name.replace(/\.[^.]+$/, '') || 'hair-photo';
    return new File([jpeg], `${baseName}.jpg`, { type: 'image/jpeg' });
  } finally {
    image.close();
  }
}

// For bag mode: style selector options (per docs)
const BAG_STYLES = [
  { id: 'random', label: 'Random' },
  { id: 'style_parisian_chic', label: 'Parisian Chic' },
  { id: 'style_urban_chic', label: 'Urban Chic' },
  { id: 'style_mediterranean_chic', label: 'Mediterranean' },
  { id: 'style_art_deco_style', label: 'Art Deco' },
];

// ── Sample presets per mode ───────────────────────────────────────────────────
// Clothing samples use local wardrobe images; style references use Unsplash.
// Selecting a preset auto-loads it; users can still upload their own instead.
type GarmentCategory = 'full_body' | 'upper_body' | 'lower_body' | 'shoes' | 'auto' | 'outer';
type SamplePreset = { id: string; name: string; thumb: string; url: string; garmentCategory?: GarmentCategory };

const SAMPLE_PRESETS: Record<StudioMode, SamplePreset[]> = {
  dress: [
    {
      id:    'linen_shirt',
      name:  'Linen Shirt',
      thumb: '/garments/garment_terracotta_linen.jpg',
      url:   '/garments/garment_terracotta_linen.jpg',
      garmentCategory: 'upper_body',
    },
    {
      id:    'slip_dress',
      name:  'Evening Dress',
      thumb: '/garments/garment_emerald_slip.jpg',
      url:   '/garments/garment_emerald_slip.jpg',
      garmentCategory: 'full_body',
    },
    {
      id:    'leather_jacket',
      name:  'Leather Jacket',
      thumb: '/garments/garment_charcoal_jacket.jpg',
      url:   '/garments/garment_charcoal_jacket.jpg',
      garmentCategory: 'upper_body',
    },
    {
      id:    'classic_tee',
      name:  'Classic Tee',
      thumb: '/garments/garment_white_tee.jpg',
      url:   '/garments/garment_white_tee.jpg',
      garmentCategory: 'upper_body',
    },
  ],
  hair: [
    {
      id:    'beach_waves',
      name:  'Beach Waves',
      thumb: '/samples/hair-beach.jpg',
      url:   '/samples/hair-beach.jpg',
    },
    {
      id:    'sleek_straight',
      name:  'Sleek Straight',
      thumb: '/samples/hair-straight.jpg',
      url:   '/samples/hair-straight.jpg',
    },
    {
      id:    'curly_lob',
      name:  'Curly Lob',
      thumb: '/samples/hair-curly.jpg',
      url:   '/samples/hair-curly.jpg',
    },
    {
      id:    'pixie_cut',
      name:  'Pixie Cut',
      thumb: '/samples/hair-pixie.jpg',
      url:   '/samples/hair-pixie.jpg',
    },
  ],
  shoes: [
    {
      id:    'strappy_heels',
      name:  'Strappy Heels',
      thumb: '/samples/shoes-heels.jpg',
      url:   '/samples/shoes-heels.jpg',
    },
    {
      id:    'white_sneakers',
      name:  'White Sneakers',
      thumb: '/samples/shoes-sneakers.jpg',
      url:   '/samples/shoes-sneakers.jpg',
    },
    {
      id:    'ankle_boots',
      name:  'Ankle Boots',
      thumb: '/samples/shoes-boots.jpg',
      url:   '/samples/shoes-boots.jpg',
    },
    {
      id:    'loafers',
      name:  'Loafers',
      thumb: '/samples/shoes-loafers.jpg',
      url:   '/samples/shoes-loafers.jpg',
    },
  ],
  bag: [
    {
      id:    'structured_tote',
      name:  'Structured Tote',
      thumb: '/samples/bag-tote.jpg',
      url:   '/samples/bag-tote.jpg',
    },
    {
      id:    'crossbody',
      name:  'Crossbody',
      thumb: '/samples/bag-crossbody.jpg',
      url:   '/samples/bag-crossbody.jpg',
    },
    {
      id:    'clutch',
      name:  'Clutch',
      thumb: '/samples/bag-clutch.jpg',
      url:   '/samples/bag-clutch.jpg',
    },
    {
      id:    'bucket_bag',
      name:  'Bucket Bag',
      thumb: '/samples/bag-bucket.jpg',
      url:   '/samples/bag-bucket.jpg',
    },
  ],
};

export default function StudioFlow({ isGuest = false }: StudioFlowProps) {
  const searchParams = useSearchParams();
  const rawMode = (searchParams.get('mode') ?? 'dress') as StudioMode;
  const mode: StudioMode = ['dress', 'hair', 'shoes', 'bag'].includes(rawMode) ? rawMode : 'dress';
  const cfg = MODE_CONFIG[mode];
  const ModeIcon = cfg.icon;

  const isHairMode = mode === 'hair';

  const STEP_ITEMS = [
    { id: 1, label: mode === 'hair' ? 'Upload Hair Photo' : mode === 'shoes' ? 'Upload Shoes Photo' : mode === 'bag' ? 'Upload Bag Photo' : 'Upload Dress Photo' },
    { id: 2, label: cfg.cropLabel },
    { id: 3, label: 'Your Photo' },
    { id: 4, label: 'Try It On' },
  ];

  const [currentStep, setCurrentStep] = useState(0);

  // ── SegFormer dress/hair/shoes/bag lifter (runs in-browser Web Worker) ──
  const { lift, progress: liftProgress, isLifting } = useDressLifter();

  // Lifted blob URLs (transparent PNG + white-bg JPG for YouCam)
  const [liftedTransparentBlobUrl, setLiftedTransparentBlobUrl] = useState<string | null>(null);
  const [liftedWhiteBlobUrl, setLiftedWhiteBlobUrl] = useState<string | null>(null);
  const [liftError, setLiftError] = useState<string | null>(null);
  const [liftNotice, setLiftNotice] = useState<string | null>(null);

  // Source item photo (photo of someone wearing the dress or hairstyle)
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourcePreview, setSourcePreview] = useState<string | null>(null);
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const [sampleLoadError, setSampleLoadError] = useState<string | null>(null);
  const sampleSelectionRef = useRef(0);
  const [itemName, setItemName] = useState(cfg.defaultName);
  // Selected built-in sample (null = user will upload their own)
  const [selectedSample, setSelectedSample] = useState<string | null>(null);
  const [garmentCategory, setGarmentCategory] = useState<GarmentCategory>('full_body');

  // Bag-specific style selector (per docs: 4 presets + random)
  const [bagStyle, setBagStyle] = useState('random');

  // Shoes-specific gender
  const [shoesGender, setShoesGender] = useState('female');

  // Cropped & Saved state
  const [isolatedPreview, setIsolatedPreview] = useState<string | null>(null);
  const [isSavedToCollection, setIsSavedToCollection] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [savedGarmentId, setSavedGarmentId] = useState<string | null>(null);
  const [savedHairRefUrl, setSavedHairRefUrl] = useState<string | null>(null);

  // User target photo
  const [userPhotoFile, setUserPhotoFile] = useState<File | null>(null);
  const [userPhotoPreview, setUserPhotoPreview] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(true);

  // Try-on generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isMockResult, setIsMockResult] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset steps when mode switches
  useEffect(() => {
    setCurrentStep(0);
    setSourceFile(null);
    setSourcePreview(null);
    setIsolatedPreview(null);
    setLiftedTransparentBlobUrl(null);
    setLiftedWhiteBlobUrl(null);
    setLiftError(null);
    setLiftNotice(null);
    setResultUrl(null);
    setIsSavedToCollection(false);
    setSavedGarmentId(null);
    setSavedHairRefUrl(null);
    setItemName(cfg.defaultName);
    setBagStyle('random');
    setSelectedSample(null);
    sampleSelectionRef.current += 1;
    setIsLoadingSample(false);
    setSampleLoadError(null);
    setGarmentCategory('full_body');
    setUserPhotoFile(null);
    setUserPhotoPreview(null);
  }, [mode]);

  useEffect(() => {
    if (isGuest || mode !== 'dress') return;
    let cancelled = false;
    void (async () => {
      try {
        const profileResponse = await fetch('/api/profile', { cache: 'no-store' });
        const profileData = await profileResponse.json();
        const photoUrl = profileData?.profile?.defaultPhotoUrl;
        if (!profileResponse.ok || !photoUrl || cancelled || userPhotoFile) return;
        const photoResponse = await fetch(photoUrl);
        if (!photoResponse.ok) return;
        const photo = await photoResponse.blob();
        if (cancelled || userPhotoFile || !['image/jpeg', 'image/png'].includes(photo.type)) return;
        const file = new File([photo], photo.type === 'image/png' ? 'saved-photo.png' : 'saved-photo.jpg', { type: photo.type });
        setUserPhotoFile(file);
        setUserPhotoPreview(URL.createObjectURL(file));
      } catch {
        // The saved photo is optional; the upload step remains available.
      }
    })();
    return () => { cancelled = true; };
  }, [isGuest, mode, userPhotoFile]);

  // Step 1: When user drops source photo
  const handleSourceUpload = (file: File) => {
    sampleSelectionRef.current += 1;
    setIsLoadingSample(false);
    setSampleLoadError(null);
    setSourceFile(file);
    const url = URL.createObjectURL(file);
    setSourcePreview(url);
    setIsolatedPreview(url);
    setLiftedTransparentBlobUrl(null);
    setLiftedWhiteBlobUrl(null);
    setLiftError(null);
    setLiftNotice(null);
    setIsSavedToCollection(false);
    setSavedGarmentId(null);
    const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    setItemName(cleanName || cfg.defaultName);
  };

  // Step 1 alt: When user picks a built-in sample preset
  const handleSampleSelect = async (preset: SamplePreset) => {
    const selectionId = ++sampleSelectionRef.current;
    setSelectedSample(preset.id);
    setSourceFile(null);
    setSourcePreview(preset.url);
    setIsolatedPreview(preset.url);
    setLiftedTransparentBlobUrl(null);
    setLiftedWhiteBlobUrl(null);
    setLiftError(null);
    setLiftNotice(null);
    setIsSavedToCollection(false);
    setSavedGarmentId(null);
    setIsLoadingSample(true);
    setSampleLoadError(null);
    setItemName(preset.name);
    if (mode === 'dress') setGarmentCategory(preset.garmentCategory ?? 'auto');
    // Fetch the sample as a blob so the rest of the pipeline (SegFormer, wardrobe save) works.
    try {
      const res = await fetch(preset.url);
      if (!res.ok) throw new Error(`Sample request failed (${res.status})`);
      const blob = await res.blob();
      if (!blob.type.startsWith('image/')) throw new Error('Sample response was not an image');
      // Remote image CDNs may negotiate WebP/AVIF despite a .jpg URL. Normalize
      // presets to JPEG so the file type and bytes match every downstream route.
      const bitmap = await createImageBitmap(blob);
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Could not prepare sample image');
      context.drawImage(bitmap, 0, 0);
      bitmap.close();
      const jpegBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((result) => result ? resolve(result) : reject(new Error('Could not convert sample image')), 'image/jpeg', 0.92);
      });
      const file = new File([jpegBlob], `${preset.id}.jpg`, { type: 'image/jpeg' });
      if (selectionId === sampleSelectionRef.current) setSourceFile(file);
    } catch {
      if (selectionId === sampleSelectionRef.current) {
        setSourceFile(null);
        setSampleLoadError('This sample could not be loaded. Choose another sample or upload a supported photo.');
      }
    } finally {
      if (selectionId === sampleSelectionRef.current) setIsLoadingSample(false);
    }
  };

  // Step 2: Run SegFormer segmentation in-browser, then auto-save isolated item
  const handleProceedToCrop = async () => {
    setCurrentStep(1);
    setLiftError(null);
    setLiftNotice(null);

    if (!sourceFile) {
      setSampleLoadError('Wait for the selected sample to finish loading, or choose another sample/photo.');
      setCurrentStep(0);
      return;
    }

    // YouCam Shoes accepts a product photo directly. The local clothes parser
    // is trained for worn-item parsing and can fragment standalone shoe shots,
    // so keep the original reference intact instead of pretending to isolate it.
    if (mode === 'shoes') {
      setLiftedTransparentBlobUrl(null);
      setLiftedWhiteBlobUrl(sourcePreview);
      setIsolatedPreview(sourcePreview);
      setLiftNotice('Shoe product photo ready. We’ll send this original image for try-on without an unreliable cutout.');
      return;
    }

    try {
      // ── 1. Run SegFormer in the Web Worker (no server cost, private) ──
      const liftResult = await lift(sourceFile, cfg.lifterMode);

      setLiftedTransparentBlobUrl(liftResult.transparentUrl);
      setLiftedWhiteBlobUrl(liftResult.whiteUrl);
      setIsolatedPreview(liftResult.previewUrl);

      if (!isGuest && !isSavedToCollection && liftResult.maskReliable) {
        setIsAutoSaving(true);

        const [transparentBlob, whiteBlob] = await Promise.all([
          fetch(liftResult.transparentUrl).then((r) => r.blob()),
          fetch(liftResult.whiteUrl).then((r) => r.blob()),
        ]);

        if (isHairMode) {
          const formData = new FormData();
          formData.append('file', await prepareHairApiPhoto(sourceFile));
          formData.append('thumb', transparentBlob, 'hair_isolated.png');
          formData.append('name', itemName);
          formData.append('consent', 'true');
          const res = await fetch('/api/hair-library/upload', { method: 'POST', body: formData });
          const data = await res.json();
          if (data.ok) {
            setIsSavedToCollection(true);
            if (data.item?.refUrl) setSavedHairRefUrl(data.item.refUrl);
          }
        } else {
          // dress / shoes / bag — all save to wardrobe
          const formData = new FormData();
          formData.append('files', sourceFile);
          formData.append('transparentFile', transparentBlob, `${mode}_transparent.png`);
          formData.append('whiteFile', whiteBlob, `${mode}_white.jpg`);
          formData.append('name', itemName);
          const res = await fetch('/api/wardrobe/upload', { method: 'POST', body: formData });
          const data = await res.json();
          if (data.ok && Array.isArray(data.items) && data.items.length > 0) {
            setIsSavedToCollection(true);
            setSavedGarmentId(data.items[0].id);
          }
        }
      }
    } catch (err: any) {
      console.warn('Lift / save error:', err);
      setLiftError(err.message || 'Failed to isolate item. Try a different photo.');
    } finally {
      setIsAutoSaving(false);
    }
  };

  // Step 4: Execute Try-On and fit onto user
  const handleExecuteTryOn = async () => {
    if (!userPhotoFile) {
      setErrorMessage('Please upload a clear photo of yourself first, framed to match the garment coverage.');
      setCurrentStep(2);
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);
    setIsMockResult(false);

    try {
      if (!sourceFile) {
        setErrorMessage('The selected reference photo is not ready. Go back and choose or upload it again.');
        setCurrentStep(0);
        return;
      }

      const formData = new FormData();

      if (mode === 'hair') {
        const [hairUserPhoto, hairReferencePhoto] = await Promise.all([
          prepareHairApiPhoto(userPhotoFile),
          prepareHairApiPhoto(sourceFile),
        ]);
        formData.append('userPhoto', hairUserPhoto);
        // Hair: pass raw source photo as ref (YouCam needs face+hair visible)
        formData.append('refPhoto', hairReferencePhoto);
      } else {
        if (mode === 'bag') {
          const { bag: framedBagPhoto } = await prepareLookCrops(userPhotoFile, 1);
          formData.append('personPhoto', framedBagPhoto);
        } else if (mode === 'shoes') {
          const { full: fullBodyPhoto } = await prepareFullLookPhoto(userPhotoFile);
          formData.append('personPhoto', fullBodyPhoto);
        } else {
          const { full: normalizedPhoto } = await prepareFullLookPhoto(userPhotoFile);
          formData.append('personPhoto', normalizedPhoto);
        }
        // Send the untouched reference to YouCam. Segmented cutouts are useful
        // for the local preview and wardrobe thumbnail, but can remove garment
        // details (neckline, straps, slits) needed for a faithful try-on.
        formData.append('garmentPhoto', sourceFile);
        if (savedGarmentId) formData.append('garmentId', savedGarmentId);
        if (mode === 'dress') formData.append('garmentCategory', garmentCategory);
        if (mode === 'bag') formData.append('style', bagStyle);
        if (mode === 'shoes') formData.append('gender', shoesGender);
      }

      const res = await fetch(cfg.apiRoute, { method: 'POST', body: formData });
      const data = await res.json();

      if (data.ok && data.resultUrl) {
        setResultUrl(data.resultUrl);
        setIsMockResult(Boolean(data.mock));
      } else {
        setErrorMessage(data.message || `${cfg.label} failed. Please try a different photo.`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Operation failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--pearl-50)] text-[var(--ink-900)] flex flex-col items-center mirror-studio">
      {/* ── Studio Stage Header & Mode Switcher ── */}
      <div className="w-full max-w-5xl px-4 pt-8 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <Link
            href="/app"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </Link>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-full bg-white/10 border border-white/10 self-start sm:self-auto text-xs font-semibold flex-wrap">
            {([
              { m: 'dress', label: 'Dress', Icon: Shirt, href: '/app/studio' },
              { m: 'hair', label: 'Hair', Icon: Scissors, href: '/app/studio?mode=hair' },
              { m: 'shoes', label: 'Shoes', Icon: Footprints, href: '/app/studio?mode=shoes' },
              { m: 'bag', label: 'Bag', Icon: ShoppingBag, href: '/app/studio?mode=bag' },
            ] as const).map(({ m, label, Icon, href }) => (
              <Link
                key={m}
                href={href}
                className={clsx(
                  'px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5',
                  mode === m
                    ? 'bg-dashboard-gradient text-white shadow-sm'
                    : 'text-white/70 hover:text-white'
                )}
              >
                <Icon size={13} />
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Stepper */}
        <div className="glass-surface-light rounded-2xl p-4">
          <Stepper currentStep={currentStep + 1} steps={STEP_ITEMS} />
        </div>
      </div>

      {/* ── Main Two-Column Stage ── */}
      <div className="w-full max-w-5xl flex-1 px-4 py-4 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── Left Column: Canvas ── */}
        <div className="lg:col-span-7 rounded-3xl glass-surface-light border border-white/10 p-6 flex flex-col justify-center items-center min-h-[520px] relative overflow-hidden">
          {/* Spotlight Glow */}
          <div
            aria-hidden="true"
            className="absolute -top-32 inset-x-0 h-64 bg-gradient-to-b from-[var(--sky-400)]/20 via-transparent to-transparent blur-2xl pointer-events-none"
          />

          {/* STEP 1: Sample presets + Upload */}
          {currentStep === 0 && (
            <div className="w-full max-w-md flex flex-col items-center space-y-4">

              {mode === 'dress' && (
                <div className="w-full space-y-2">
                  <label htmlFor="garment-coverage" className="block text-xs font-bold uppercase tracking-wider text-white/70">
                    Garment coverage
                  </label>
                  <select
                    id="garment-coverage"
                    value={garmentCategory}
                    onChange={(event) => setGarmentCategory(event.target.value as GarmentCategory)}
                    className="h-11 w-full rounded-xl border border-[var(--line)] bg-white px-3 text-sm font-medium text-[var(--ink-900)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue-700)]"
                  >
                    <option value="full_body">Full-body dress or outfit</option>
                    <option value="upper_body">Top, shirt, or jacket</option>
                    <option value="lower_body">Skirt or trousers</option>
                    <option value="auto">Let YouCam detect the garment</option>
                  </select>
                  <p className="text-[11px] leading-relaxed text-white/60">
                    Choose the area the clothing covers. Your photo should show that same area clearly, from the front.
                  </p>
                </div>
              )}

              {/* ── Built-in sample presets ── */}
              <div className="w-full space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-white/50">
                  Start with a sample — or upload your own below
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {SAMPLE_PRESETS[mode].map((preset) => (
                    <FX7TiltCard key={preset.id} maxDeg={8} className="cursor-pointer">
                      <button
                        onClick={() => handleSampleSelect(preset)}
                        aria-label={`Use sample: ${preset.name}`}
                        aria-pressed={selectedSample === preset.id}
                        className={clsx(
                          'group relative w-full h-full flex flex-col items-center gap-1 p-1.5 rounded-xl border-2 transition-all focus-visible:ring-2 focus-visible:ring-[var(--sky-400)] text-[10px] font-semibold',
                          selectedSample === preset.id
                            ? 'border-[var(--sky-400)] bg-[var(--sky-400)]/15 text-white shadow-[0_0_12px_rgba(234,56,77,0.24)]'
                            : 'border-white/10 hover:border-white/30 text-white/50 hover:text-white/80 bg-white/5'
                        )}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={preset.thumb}
                          alt={preset.name}
                          className="w-full aspect-square object-cover rounded-lg bg-white/10"
                          onError={(e) => {
                            const image = e.currentTarget;
                            image.style.display = 'none';
                            const fallback = image.nextElementSibling;
                            if (fallback instanceof HTMLElement) fallback.style.display = 'flex';
                          }}
                        />
                        <span
                          className="app-sample-art hidden w-full aspect-square rounded-lg text-[var(--blue-600)] text-[8px] items-center justify-center flex-col gap-2"
                          aria-hidden="true"
                        >
                          <ModeIcon size={30} strokeWidth={1.4} />
                          <span className="font-bold uppercase tracking-[0.16em]">Sample item</span>
                        </span>
                        <span className="leading-tight text-center line-clamp-2">{preset.name}</span>
                        {selectedSample === preset.id && (
                          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[var(--sky-400)] flex items-center justify-center">
                            <Check size={9} className="text-[var(--navy-950)]" />
                          </span>
                        )}
                      </button>
                    </FX7TiltCard>
                  ))}
                </div>
                {sampleLoadError && <p role="alert" className="text-xs text-[var(--danger)]">{sampleLoadError}</p>}
              </div>

              {/* Divider */}
              <div className="w-full flex items-center gap-3">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">or upload your own</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <Dropzone
                variant="light"
                accept="image/jpeg,image/png"
                label={mode === 'dress'
                  ? garmentCategory === 'full_body' ? 'Upload a full-length dress reference'
                    : garmentCategory === 'upper_body' ? 'Upload a top, shirt, or jacket reference'
                    : garmentCategory === 'lower_body' ? 'Upload a skirt or trousers reference'
                    : 'Upload a clothing reference'
                  : cfg.uploadLabel}
                hint={mode === 'dress'
                  ? garmentCategory === 'lower_body'
                    ? 'Use a clear, front-facing photo of the full lower-body garment being worn — JPG/PNG up to 10 MB.'
                    : garmentCategory === 'full_body'
                    ? 'Show one full-length dress or outfit clearly from the front — JPG/PNG up to 10 MB.'
                    : garmentCategory === 'upper_body'
                    ? 'Show one top, shirt, or jacket clearly from the front — JPG/PNG up to 10 MB.'
                    : garmentCategory === 'auto'
                    ? 'Show one clear garment from the front, with the full item visible and unobstructed — JPG/PNG up to 10 MB.'
                    : 'Show one clear garment from the front, with the full item visible and unobstructed — JPG/PNG up to 10 MB.'
                  : cfg.uploadHint}
                onFileSelect={(f) => {
                  setSelectedSample(null);
                  handleSourceUpload(f);
                }}
                previewUrl={sourceFile ? sourcePreview : null}
                onClear={() => {
                  sampleSelectionRef.current += 1;
                  setIsLoadingSample(false);
                  setSampleLoadError(null);
                  setSourceFile(null);
                  setSourcePreview(null);
                  setIsolatedPreview(null);
                  setLiftedTransparentBlobUrl(null);
                  setLiftedWhiteBlobUrl(null);
                  setLiftError(null);
                  setIsSavedToCollection(false);
                  setSavedGarmentId(null);
                  setSelectedSample(null);
                }}
              />

              {!sourcePreview && (
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center text-xs text-white/60 space-y-1">
                  <p className="font-semibold text-white/90">
                    {mode === 'hair' ? 'How Hair Studio Works:' :
                     mode === 'shoes' ? 'How Shoes Try-On Works:' :
                     mode === 'bag' ? 'How Bag Try-On Works:' :
                     'How Dress Try-On Works:'}
                  </p>
                  <p>
                    {mode === 'hair'
                      ? 'Pick a hair style above or upload any picture with great hair. We crop the person out, save the hair to your collection, and try it on you.'
                      : mode === 'shoes'
                      ? 'Pick a shoe above or upload a clear product photo. We keep the original shoe image intact for try-on.'
                      : mode === 'bag'
                      ? 'Pick a bag above or upload a bag product photo. We isolate the bag and visualise it on you.'
                      : 'Pick a dress above or upload any photo with a dress. We crop the person out, save it to your wardrobe, and fit it on you.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Crop person out & preview isolated item */}
          {currentStep === 1 && (
            <div className="w-full max-w-md flex flex-col items-center space-y-4">
              {sourcePreview && (
                <FX4DissolveExtraction
                  originalSrc={sourcePreview}
                  liftedSrc={isolatedPreview || sourcePreview}
                  originalFallback={Boolean(liftNotice)}
                />
              )}
              {(isLifting || isAutoSaving) && (
                <div className="flex items-center gap-2 text-xs text-white/70">
                  <Loader2 size={14} className="animate-spin text-[var(--blue-600)]" />
                  <span>{liftProgress?.stage ?? (isAutoSaving ? 'Saving to collection…' : 'Processing…')}</span>
                  {liftProgress && liftProgress.percent > 0 && (
                    <span className="text-white/40">({liftProgress.percent}%)</span>
                  )}
                </div>
              )}
              {liftError && (
                <p className="text-xs text-[var(--danger)] text-center">{liftError}</p>
              )}
              {liftNotice && (
                <p role="status" className="text-xs text-white/80 text-center">{liftNotice}</p>
              )}
            </div>
          )}

          {/* STEP 3: User's Own Photo */}
          {currentStep === 2 && (
            <div className="w-full max-w-md flex flex-col items-center space-y-4">
              <Dropzone
                variant="light"
                accept="image/jpeg,image/png"
                label={cfg.selfieLabel}
                hint={mode === 'dress'
                  ? garmentCategory === 'full_body'
                    ? 'Full-length, front-facing standing photo with your body visible from head to feet — JPG/PNG up to 10 MB.'
                    : garmentCategory === 'upper_body'
                    ? 'Front-facing photo from head to waist with shoulders visible — JPG/PNG up to 10 MB.'
                    : garmentCategory === 'lower_body'
                    ? 'Front-facing photo showing your waist through your legs and feet — JPG/PNG up to 10 MB.'
                    : 'Show the same body area covered by the clothing reference. Face visible and facing forward — JPG/PNG up to 10 MB.'
                  : cfg.selfieHint}
                onFileSelect={(f) => {
                  setUserPhotoFile(f);
                  setUserPhotoPreview(URL.createObjectURL(f));
                  setErrorMessage(null);
                }}
                previewUrl={userPhotoPreview}
                onClear={() => {
                  setUserPhotoFile(null);
                  setUserPhotoPreview(null);
                }}
              />
            </div>
          )}

          {/* STEP 4: Try-On Simulation & Curtain Reveal */}
          {currentStep === 3 && (
            <div className="w-full h-full flex flex-col items-center justify-center">
              {isGenerating ? (
                <FX5WeavingLoader personUrl={userPhotoPreview ?? undefined} />
              ) : resultUrl ? (
                <FX6CurtainReveal>
                  <div className="w-full max-w-md space-y-3">
                    {isMockResult && <DemoPreviewNotice />}
                    {userPhotoPreview ? (
                      <FX8BeforeAfterSlider
                        beforeSrc={userPhotoPreview}
                        afterSrc={resultUrl}
                        beforeAlt="Before"
                        afterAlt={`Wearing ${itemName}`}
                        className="aspect-[3/4] max-h-[500px]"
                      />
                    ) : (
                      <div className="flex aspect-[3/4] items-center justify-center rounded-3xl border border-white/10 text-sm text-white/60">Upload a photo to preview your result.</div>
                    )}
                    <p className="text-center text-xs text-white/50 italic">
                      A vibe check, not a fit guarantee.
                    </p>
                  </div>
                </FX6CurtainReveal>
              ) : (
                /* Ready State Side-by-Side */
                <div className="grid w-full max-w-2xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 py-8 sm:gap-5">
                  <figure className="mx-auto w-full max-w-[14rem]">
                    <figcaption className="mb-2 min-h-8 text-center text-xs font-bold text-[var(--ink-900)]">
                      {mode === 'dress' ? 'Selected look' : mode === 'hair' ? 'Selected hairstyle' : mode === 'shoes' ? 'Selected shoes' : 'Selected bag'}
                    </figcaption>
                    <div className="aspect-[3/4] w-full overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--ice-100)] p-2 shadow-[var(--shadow-soft)]">
                      {isolatedPreview || sourcePreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={isolatedPreview || sourcePreview!}
                          alt={itemName}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-center text-xs text-[var(--ink-500)]">Choose a reference photo to preview it here.</div>
                      )}
                    </div>
                    <p className="mt-2 truncate text-center text-xs font-medium text-[var(--ink-500)]">{itemName}</p>
                  </figure>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--blue-600)] text-white shadow-[var(--shadow-soft)]" aria-hidden="true">
                    <ArrowRight size={17} />
                  </span>
                  <figure className="mx-auto w-full max-w-[14rem]">
                    <figcaption className="mb-2 min-h-8 text-center text-xs font-bold text-[var(--ink-900)]">Your photo</figcaption>
                    <div className="aspect-[3/4] w-full overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--ice-100)] p-2 shadow-[var(--shadow-soft)]">
                      {userPhotoPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={userPhotoPreview}
                          alt="Your photo"
                          className="h-full w-full rounded-xl object-contain"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-center text-xs text-[var(--ink-500)]">Upload your photo to preview it here.</div>
                      )}
                    </div>
                    <p className="mt-2 truncate text-center text-xs font-medium text-[var(--ink-500)]">Ready for preview</p>
                  </figure>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right Column: Control Panel ── */}
        <div className="lg:col-span-5 rounded-3xl glass-surface-light border border-white/10 p-6 flex flex-col justify-between min-h-[520px]">
          <div className="space-y-6">
            {/* STEP 1 CONTROLS */}
            {currentStep === 0 && (
              <>
                <div className="space-y-2">
                  <h2 className="font-display text-3xl font-semibold text-white">
                    {mode === 'hair' ? 'Hair Inspiration' :
                     mode === 'shoes' ? 'Choose Shoes' :
                     mode === 'bag' ? 'Choose a Bag' :
                     'Choose a Dress'}
                  </h2>
                  <p className="text-sm text-white/70 leading-relaxed">
                    {mode === 'hair'
                      ? 'Pick a sample hairstyle or upload a photo of anyone with hair you love. We crop the person out and try it on you.'
                      : mode === 'shoes'
                      ? 'Pick a sample or upload your own shoe product photo. We isolate and fit them on your photo.'
                      : mode === 'bag'
                      ? 'Pick a sample or upload your own bag photo. We isolate and visualise it on you.'
                      : 'Pick a sample dress or upload any photo with a dress. We isolate and fit it on you.'}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <div className="flex items-center gap-2">
                    <Check size={16} className={sourcePreview ? 'text-[var(--blue-600)]' : 'text-white/20'} />
                    <span className="text-xs font-semibold text-white">
                      {selectedSample
                        ? `Sample selected: ${SAMPLE_PRESETS[mode].find(p => p.id === selectedSample)?.name ?? selectedSample}`
                        : sourcePreview
                        ? 'Image uploaded: ready to crop person out'
                        : 'Pick a sample above or upload a photo'}
                    </span>
                  </div>
                  <p className="text-[11px] text-white/50">
                    {selectedSample
                      ? 'We\'ll isolate the item and fit it on your photo in the next steps.'
                      : 'Automatic person and background removal runs on the next step.'}
                  </p>
                </div>
              </>
            )}

            {/* STEP 2 CONTROLS */}
            {currentStep === 1 && (
              <>
                <div className="space-y-2">
                  <h2 className="font-display text-3xl font-semibold text-white">
                    {cfg.cropLabel}
                  </h2>
                  <p className="text-sm text-white/70 leading-relaxed">
                    The person has been cropped out. This item has been automatically saved to your{' '}
                    <span className="text-[var(--blue-600)] font-semibold">
                      {cfg.collection}
                    </span>
                    .
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-white/80 mb-1.5">
                      Name this {isHairMode ? 'hairstyle' : 'dress'}
                    </label>
                    <input
                      type="text"
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      className="w-full h-[48px] px-4 rounded-xl bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-[var(--sky-400)]"
                      placeholder={isHairMode ? 'e.g. Modern Textured Bob' : 'e.g. Silk Evening Dress'}
                    />
                  </div>

                  {(isLifting || isAutoSaving) && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white/70">
                      <Loader2 size={14} className="animate-spin text-[var(--blue-600)] flex-shrink-0" />
                      <div className="flex-1">
                        <span>{liftProgress?.stage ?? (isAutoSaving ? 'Saving to your collection…' : 'Processing…')}</span>
                        {liftProgress && liftProgress.percent > 0 && liftProgress.percent < 100 && (
                          <div className="mt-1.5 h-1 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className="h-full bg-[var(--sky-400)] rounded-full transition-all duration-300"
                              style={{ width: `${liftProgress.percent}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {liftError && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--danger)]/10 border border-[var(--danger)]/20 text-xs text-[var(--danger)]">
                      <span>{liftError}</span>
                    </div>
                  )}

                  {!isLifting && !isAutoSaving && !liftError && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--success)]/10 border border-[var(--success)]/20 text-xs text-[var(--success)]">
                      <Check size={16} />
                      <span>
                        {liftNotice
                          ? 'Original shoe photo ready for try-on.'
                          : isSavedToCollection
                          ? `Saved to your ${isHairMode ? 'Hair Collection' : 'Wardrobe'}!`
                          : 'Person cropped out. Ready to continue.'}
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* STEP 3 CONTROLS */}
            {currentStep === 2 && (
              <>
                <div className="space-y-2">
                  <h2 className="font-display text-3xl font-semibold text-white">
                    Now, you
                  </h2>
                  <p className="text-sm text-white/70 leading-relaxed">
                    {mode === 'hair'
                      ? 'Upload your front-facing photo so the AI can fit your new hairstyle onto your head shape.'
                      : mode === 'shoes'
                      ? 'Upload a full-body photo with your feet clearly visible.'
                      : mode === 'bag'
                      ? 'Upload a half-body photo (head to chest) with your face visible.'
                      : mode === 'dress'
                      ? garmentCategory === 'full_body'
                        ? 'Upload a front-facing, full-length photo from head to feet.'
                        : garmentCategory === 'upper_body'
                        ? 'Upload a front-facing photo showing your upper body and shoulders.'
                        : garmentCategory === 'lower_body'
                        ? 'Upload a front-facing photo showing your waist, legs, and feet.'
                        : 'Frame the body area covered by your selected garment.'
                      : 'Upload a photo with shoulders visible, facing forward.'}
                  </p>
                </div>

                {/* Bag style picker */}
                {mode === 'bag' && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-white/80">Scene Style</p>
                    <div className="flex flex-wrap gap-2">
                      {BAG_STYLES.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setBagStyle(s.id)}
                          className={clsx(
                            'px-3 py-1.5 rounded-full text-xs font-semibold transition-all border',
                            bagStyle === s.id
                              ? 'bg-[var(--sky-400)] text-[var(--navy-950)] border-transparent'
                              : 'bg-white/10 text-white/70 border-white/20 hover:border-white/40'
                          )}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Shoes gender picker */}
                {mode === 'shoes' && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-white/80">Gender</p>
                    <div className="flex gap-2">
                      {(['female', 'male'] as const).map((g) => (
                        <button
                          key={g}
                          onClick={() => setShoesGender(g)}
                          className={clsx(
                            'px-4 py-1.5 rounded-full text-xs font-semibold transition-all border capitalize',
                            shoesGender === g
                              ? 'bg-[var(--sky-400)] text-[var(--navy-950)] border-transparent'
                              : 'bg-white/10 text-white/70 border-white/20 hover:border-white/40'
                          )}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <label className="flex items-start gap-2.5 pt-2 text-xs text-white/70 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hasPermission}
                    onChange={(e) => setHasPermission(e.target.checked)}
                    className="mt-0.5 rounded border-white/20 text-[var(--blue-600)]"
                  />
                  <span>This photo is of me, or I have permission to use it.</span>
                </label>
              </>
            )}

            {/* STEP 4 CONTROLS */}
            {currentStep === 3 && (
              <>
                <div className="space-y-2">
                  <h2 className="font-display text-3xl font-semibold text-white">
                    {resultUrl ? `You, with ${itemName}` : 'Ready for Try-On'}
                  </h2>
                  <p className="text-sm text-white/70 leading-relaxed">
                    {resultUrl
                      ? mode === 'hair'
                        ? 'Hairstyle fitted seamlessly to your face and head contours.'
                        : mode === 'shoes'
                        ? 'Shoes fitted to your photo with realistic proportions.'
                        : mode === 'bag'
                        ? 'Bag visualised on you with AI-generated scene styling.'
                        : 'Garment fitted with realistic drape and lighting.'
                      : mode === 'shoes'
                        ? 'YouCam AI will use your photo with the original shoe product image.'
                        : `YouCam AI will synthesize your photo with the cropped ${
                            mode === 'hair' ? 'hairstyle' : mode === 'bag' ? 'bag' : 'dress'
                          }.`}
                  </p>
                </div>

                {resultUrl && (
                  <div className="space-y-3 pt-2">
                    <a
                      href={resultUrl}
                      download={`mirror-moment-${itemName.toLowerCase().replace(/\s+/g, '-')}.png`}
                      className="block w-full"
                    >
                      <Button variant="primary" size="md" className="w-full" leftIcon={<Download size={16} />}>
                        Download Result (PNG)
                      </Button>
                    </a>
                  </div>
                )}

                {errorMessage && (
                  <p className="text-xs text-[var(--danger)] pt-2">{errorMessage}</p>
                )}
              </>
            )}
          </div>

          {/* ── Bottom Action Buttons ── */}
          <div className="pt-6 border-t border-white/10 flex items-center justify-between gap-3">
            {currentStep > 0 && !isGenerating && (
              <Button
                variant="ghost"
                size="md"
                className="text-white hover:text-[var(--blue-600)]"
                onClick={() => setCurrentStep((prev) => prev - 1)}
              >
                Back
              </Button>
            )}

            <div className="ml-auto flex items-center gap-3">
              {currentStep === 0 && (
                <Button
                  variant="primary"
                  size="md"
                  disabled={!sourcePreview || !sourceFile || isLoadingSample}
                  onClick={handleProceedToCrop}
                  rightIcon={<ArrowRight size={16} />}
                >
                  {mode === 'shoes' ? 'Prepare Shoe Photo' : 'Crop Person Out'}
                </Button>
              )}

              {currentStep === 1 && (
                <Button
                  variant="primary"
                  size="md"
                  disabled={isLifting || isAutoSaving || isLoadingSample || Boolean(liftError) || (Boolean(sourceFile) && !liftedWhiteBlobUrl)}
                  onClick={() => setCurrentStep(2)}
                  rightIcon={<ArrowRight size={16} />}
                >
                  Continue to Your Photo
                </Button>
              )}

              {currentStep === 2 && (
                <Button
                  variant="primary"
                  size="md"
                  disabled={!hasPermission || !userPhotoFile}
                  onClick={() => setCurrentStep(3)}
                  rightIcon={<ArrowRight size={16} />}
                >
                  Continue
                </Button>
              )}

              {currentStep === 3 && !resultUrl && (
                <Button
                  variant="primary"
                  size="lg"
                  disabled={!userPhotoFile || !hasPermission}
                  isLoading={isGenerating}
                  loadingText={
                    mode === 'hair' ? 'Fitting hairstyle…' :
                    mode === 'shoes' ? 'Fitting shoes…' :
                    mode === 'bag' ? 'Fitting bag…' :
                    'Fitting dress…'
                  }
                  onClick={handleExecuteTryOn}
                  leftIcon={<Sparkles size={18} />}
                >
                  {mode === 'hair' ? 'Try On Hair' :
                   mode === 'shoes' ? 'Try On Shoes' :
                   mode === 'bag' ? 'Try On Bag' :
                   'Dress Me'}
                </Button>
              )}

              {currentStep === 3 && resultUrl && (
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => {
                    setResultUrl(null);
                    setErrorMessage(null);
                    setCurrentStep(0);
                    setSourceFile(null);
                    setSourcePreview(null);
                    setIsolatedPreview(null);
                    setLiftedTransparentBlobUrl(null);
                    setLiftedWhiteBlobUrl(null);
                    setLiftError(null);
                    setIsSavedToCollection(false);
                    setSavedGarmentId(null);
                    setUserPhotoFile(null);
                    setUserPhotoPreview(null);
                    setSelectedSample(null);
                    setGarmentCategory('full_body');
                  }}
                  leftIcon={<RotateCcw size={16} />}
                >
                  Try Another
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
