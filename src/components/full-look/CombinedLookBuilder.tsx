'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Download, Loader2, Shirt, ShoppingBag, Sparkles, Upload, WandSparkles } from 'lucide-react';
import { BAG_STYLES } from '@/lib/youcam/bagStyles';
import { composeFullLook, prepareFullLookPhoto, prepareLookCrops } from '@/lib/fullLookImages';

type Feature = 'dress' | 'bag' | 'makeup';
type AsyncState = 'empty' | 'loading' | 'success' | 'error';
type ApiResult = { ok?: boolean; message?: string; resultImageData?: string; mock?: boolean };

const DRESSES = [
  { id: 'red', label: 'Red evening gown', image: '/garments/garment_emerald_slip.jpg' },
  { id: 'linen', label: 'Terracotta linen shirt', image: '/garments/garment_terracotta_linen.jpg' },
  { id: 'jacket', label: 'Charcoal jacket', image: '/garments/garment_charcoal_jacket.jpg' },
  { id: 'tee', label: 'Classic white tee', image: '/garments/garment_white_tee.jpg' },
];

const BAGS = [
  { id: 'tote', label: 'Structured tote', image: '/samples/bag-tote.jpg' },
  { id: 'crossbody', label: 'Crossbody bag', image: '/samples/bag-crossbody.jpg' },
  { id: 'clutch', label: 'Evening clutch', image: '/samples/bag-clutch.jpg' },
  { id: 'bucket', label: 'Bucket bag', image: '/samples/bag-bucket.jpg' },
];

const NATURAL_GLOW = [
  { category: 'skin_smooth', skinSmoothStrength: 20, skinSmoothColorIntensity: 50 },
  { category: 'blush', pattern: { name: '1color1' }, palettes: [{ color: '#e8b4a0', texture: 'matte', colorIntensity: 45 }] },
  { category: 'lip_color', shape: { name: 'original' }, style: { type: 'full' }, palettes: [{ color: '#c9806b', texture: 'gloss', colorIntensity: 55, gloss: 60, transparencyIntensity: 30 }] },
  { category: 'eyelashes', pattern: { name: 'Natural1' }, palettes: [{ color: '#1a1a1a', colorIntensity: 70 }] },
];

const FEATURE_COPY: Record<Feature, { label: string; hint: string; icon: typeof Shirt }> = {
  dress: { label: 'Dress', hint: 'Uses your full-body photo.', icon: Shirt },
  bag: { label: 'Bag', hint: 'Uses a head-to-waist crop, then blends it back.', icon: ShoppingBag },
  makeup: { label: 'Makeup', hint: 'Uses the face zoom you choose.', icon: WandSparkles },
};

async function fileForReference(customFile: File | null, imagePath: string, name: string): Promise<File> {
  if (customFile) return customFile;
  const response = await fetch(imagePath);
  if (!response.ok) throw new Error('A selected style sample could not be loaded.');
  const blob = await response.blob();
  return new File([blob], name, { type: blob.type || 'image/jpeg' });
}

async function runApiStage(route: string, fields: Array<[string, string | File]>): Promise<string> {
  const form = new FormData();
  for (const [key, value] of fields) form.append(key, value);
  form.append('includeResultImageData', 'true');
  const response = await fetch(route, { method: 'POST', body: form });
  const data = await response.json() as ApiResult;
  if (!response.ok || !data.ok) throw new Error(data.message || 'This try-on could not be completed.');
  if (data.mock) throw new Error('Live YouCam mode is required to combine the results. Please check the API setup and try again.');
  if (!data.resultImageData) throw new Error('The try-on finished, but its image could not be combined. Please try again.');
  return data.resultImageData;
}

export default function CombinedLookBuilder() {
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selected, setSelected] = useState<Feature[]>(['dress', 'bag', 'makeup']);
  const [dressChoice, setDressChoice] = useState(DRESSES[0].id);
  const [bagChoice, setBagChoice] = useState(BAGS[0].id);
  const [dressUpload, setDressUpload] = useState<File | null>(null);
  const [bagUpload, setBagUpload] = useState<File | null>(null);
  const [bagFramePreview, setBagFramePreview] = useState<string | null>(null);
  const bagFrameObjectUrl = useRef<string | null>(null);
  const [bagStyle, setBagStyle] = useState<(typeof BAG_STYLES)[number]['id']>('style_parisian_chic');
  const [makeupZoom, setMakeupZoom] = useState(1.6);
  const [state, setState] = useState<AsyncState>('empty');
  const [progress, setProgress] = useState('');
  const [completed, setCompleted] = useState<Feature[]>([]);
  const [error, setError] = useState('');
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!photo) { setPhotoPreview(null); return; }
    const url = URL.createObjectURL(photo);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  useEffect(() => {
    return () => { if (resultUrl) URL.revokeObjectURL(resultUrl); };
  }, [resultUrl]);

  const showBagFrame = useCallback((file: File | null) => {
    if (bagFrameObjectUrl.current) URL.revokeObjectURL(bagFrameObjectUrl.current);
    bagFrameObjectUrl.current = file ? URL.createObjectURL(file) : null;
    setBagFramePreview(bagFrameObjectUrl.current);
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!photo || !selected.includes('bag')) {
      showBagFrame(null);
      return () => { cancelled = true; };
    }
    setBagFramePreview(null);
    void prepareLookCrops(photo, 1).then(({ bag }) => {
      if (!cancelled) showBagFrame(bag);
    }).catch(() => {
      if (!cancelled) showBagFrame(null);
    });
    return () => { cancelled = true; };
  }, [photo, selected, showBagFrame]);

  useEffect(() => () => {
    if (bagFrameObjectUrl.current) URL.revokeObjectURL(bagFrameObjectUrl.current);
  }, []);

  const orderedFeatures = useMemo(() => (['dress', 'bag', 'makeup'] as Feature[]).filter((feature) => selected.includes(feature)), [selected]);

  function toggleFeature(feature: Feature) {
    setSelected((current) => current.includes(feature) ? current.filter((item) => item !== feature) : [...current, feature]);
    setState('empty');
    setResultUrl(null);
    setError('');
  }

  async function handleCreateLook() {
    if (!photo || orderedFeatures.length === 0) return;
    setState('loading');
    setError('');
    setCompleted([]);
    setResultUrl(null);

    try {
      setProgress("Checking today's available try-on quota…");
      const usageResponse = await fetch('/api/usage', { cache: 'no-store' });
      const usage = await usageResponse.json() as { ok?: boolean; remaining?: number; message?: string };
      if (!usageResponse.ok || !usage.ok || typeof usage.remaining !== 'number') {
        throw new Error(usage.message || 'Usage controls could not be checked. Please try again later.');
      }
      if (usage.remaining < orderedFeatures.length) {
        throw new Error(`This look needs ${orderedFeatures.length} try-on uses, but only ${usage.remaining} remain today. Remove a selected effect or try again after your quota resets.`);
      }

      const prepared = await prepareFullLookPhoto(photo);
      let baseImage: string | File = prepared.full;

      if (selected.includes('dress')) {
        setProgress('Trying the dress on your full-body photo…');
        const dress = DRESSES.find((item) => item.id === dressChoice)!;
        const dressReference = await fileForReference(dressUpload, dress.image, 'dress-reference.jpg');
        baseImage = await runApiStage('/api/dress-tryon', [
          ['personPhoto', prepared.full], ['garmentPhoto', dressReference], ['garmentCategory', 'full_body'],
        ]);
        setCompleted((current) => [...current, 'dress']);
      }

      if (selected.includes('bag')) {
        setProgress('Framing your head-to-waist photo for the bag…');
        const currentCrops = await prepareLookCrops(baseImage, makeupZoom);
        showBagFrame(currentCrops.bag);
        setProgress('Trying the bag on your head-to-waist crop…');
        const bag = BAGS.find((item) => item.id === bagChoice)!;
        const bagReference = await fileForReference(bagUpload, bag.image, 'bag-reference.jpg');
        const bagImage = await runApiStage('/api/bag-tryon', [
          ['personPhoto', currentCrops.bag], ['garmentPhoto', bagReference], ['gender', 'female'], ['style', bagStyle],
        ]);
        const withBag = await composeFullLook(baseImage, [{ image: bagImage, crop: currentCrops.bagCrop }]);
        baseImage = new File([withBag], 'full-look-with-bag.jpg', { type: 'image/jpeg' });
        setCompleted((current) => [...current, 'bag']);
      }

      if (selected.includes('makeup')) {
        setProgress('Applying makeup to your zoomed face crop…');
        const currentCrops = await prepareLookCrops(baseImage, makeupZoom);
        const makeupImage = await runApiStage('/api/makeup-vto', [
          ['personPhoto', currentCrops.makeup], ['effects', JSON.stringify(NATURAL_GLOW)],
        ]);
        const withMakeup = await composeFullLook(baseImage, [{ image: makeupImage, crop: currentCrops.makeupCrop }]);
        baseImage = new File([withMakeup], 'full-look-with-makeup.jpg', { type: 'image/jpeg' });
        setCompleted((current) => [...current, 'makeup']);
      }

      setProgress('Blending the selected results into one look…');
      const composite = await composeFullLook(baseImage, []);
      setResultUrl(URL.createObjectURL(composite));
      setProgress('Your combined look is ready.');
      setState('success');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The combined look could not be created.');
      setState('error');
    }
  }

  return (
    <div className="space-y-8">
      <header className="relative overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--grad-silk-light)] p-6 shadow-[var(--shadow-soft)] sm:p-10">
        <div className="relative z-10 max-w-3xl">
          <p className="app-page-kicker mb-4"><Sparkles size={14} aria-hidden="true" /> ONE PHOTO · ONE COMPLETE LOOK</p>
          <h1 className="app-page-title font-display text-4xl leading-tight text-[var(--ink-900)] sm:text-5xl">Style the whole story.</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--ink-500)] sm:text-lg">Upload one full-body photo, choose a dress, bag, and makeup, then blend the selected try-ons into one preview.</p>
          <p className="mt-3 text-sm leading-relaxed text-[var(--ink-500)]">Each selected feature runs a separate YouCam task and uses one app try-on quota. YouCam API units may also be charged.</p>
        </div>
        <div className="pointer-events-none absolute -right-16 -top-20 hidden h-80 w-80 rounded-full bg-[var(--ice-100)] opacity-80 blur-3xl sm:block" aria-hidden="true" />
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]">
        <section className="space-y-6 rounded-3xl border border-[var(--line)] bg-[var(--glass-light-bg)] p-5 shadow-[var(--shadow-soft)] sm:p-7" aria-labelledby="full-look-setup">
          <div>
            <p className="app-page-kicker mb-2">Step 1</p>
            <h2 id="full-look-setup" className="font-display text-3xl text-[var(--ink-900)]">Your full-body photo</h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--ink-500)]">Stand facing the camera with your face and outfit visible. A JPG or PNG under 10 MB works best.</p>
          </div>

          <label htmlFor="full-look-person-photo" className="flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--blue-500)] bg-white/60 px-4 py-3 text-sm font-bold text-[var(--blue-700)] hover:bg-[var(--ice-100)] focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--blue-700)]">
            <Upload size={17} aria-hidden="true" /> {photo ? 'Choose a different photo' : 'Upload one photo'}
            <input id="full-look-person-photo" type="file" accept="image/jpeg,image/png" className="sr-only" onChange={(event) => { const file = event.target.files?.[0] ?? null; setPhoto(file); setState('empty'); setResultUrl(null); setError(''); event.currentTarget.value = ''; }} />
          </label>

          {photoPreview && (
            <div className="relative mx-auto max-h-72 max-w-xs overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoPreview} alt="Uploaded full-body photo" className="max-h-72 w-full object-contain" />
              <button type="button" aria-label="Remove uploaded photo" onClick={() => { setPhoto(null); setResultUrl(null); setState('empty'); }} className="absolute right-2 top-2 rounded-full bg-black/65 px-3 py-1 text-sm font-bold text-white hover:bg-black/80">Remove</button>
            </div>
          )}

          <fieldset className="space-y-3">
            <legend className="font-display text-2xl text-[var(--ink-900)]">Step 2 · Choose what to try</legend>
            <div className="grid gap-3 sm:grid-cols-3">
              {(['dress', 'bag', 'makeup'] as Feature[]).map((feature) => {
                const details = FEATURE_COPY[feature];
                const Icon = details.icon;
                const active = selected.includes(feature);
                return (
                  <button key={feature} type="button" aria-pressed={active} onClick={() => toggleFeature(feature)} className={`rounded-2xl border p-4 text-left motion-safe:transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue-700)] ${active ? 'border-[var(--blue-600)] bg-[var(--ice-100)] shadow-[var(--shadow-lifted)]' : 'border-[var(--line)] bg-white/70 hover:border-[var(--blue-500)]'}`}>
                    <Icon size={20} className={active ? 'text-[var(--blue-700)]' : 'text-[var(--ink-500)]'} aria-hidden="true" />
                    <span className="mt-2 block font-bold text-[var(--ink-900)]">{details.label}</span>
                    <span className="mt-1 block text-xs leading-relaxed text-[var(--ink-500)]">{details.hint}</span>
                    <span className="mt-2 block text-[10px] font-bold uppercase tracking-wider text-[var(--blue-700)]">{active ? 'Selected' : 'Add'}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {selected.includes('dress') && (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-bold text-[var(--ink-700)]" htmlFor="full-look-dress">Dress sample
                <select id="full-look-dress" value={dressChoice} onChange={(event) => setDressChoice(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-[var(--line)] bg-white px-3 text-sm font-medium text-[var(--ink-900)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--blue-700)]">
                  {DRESSES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                </select>
              </label>
              <label className="block text-xs font-bold text-[var(--ink-700)]" htmlFor="full-look-dress-upload">Or upload a dress reference
                <input id="full-look-dress-upload" type="file" accept="image/jpeg,image/png" onChange={(event) => setDressUpload(event.target.files?.[0] ?? null)} className="mt-2 block min-h-11 w-full rounded-xl border border-[var(--line)] bg-white p-2 text-xs text-[var(--ink-700)] file:mr-2 file:rounded-full file:border-0 file:bg-[var(--ice-100)] file:px-3 file:py-2 file:text-xs file:font-bold file:text-[var(--blue-700)]" />
              </label>
            </div>
          )}

          {selected.includes('bag') && (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-bold text-[var(--ink-700)]" htmlFor="full-look-bag">Bag sample
                <select id="full-look-bag" value={bagChoice} onChange={(event) => setBagChoice(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-[var(--line)] bg-white px-3 text-sm font-medium text-[var(--ink-900)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--blue-700)]">
                  {BAGS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                </select>
              </label>
              <label className="block text-xs font-bold text-[var(--ink-700)]" htmlFor="full-look-bag-upload">Or upload a bag reference
                <input id="full-look-bag-upload" type="file" accept="image/jpeg,image/png" onChange={(event) => setBagUpload(event.target.files?.[0] ?? null)} className="mt-2 block min-h-11 w-full rounded-xl border border-[var(--line)] bg-white p-2 text-xs text-[var(--ink-700)] file:mr-2 file:rounded-full file:border-0 file:bg-[var(--ice-100)] file:px-3 file:py-2 file:text-xs file:font-bold file:text-[var(--blue-700)]" />
                <span className="mt-2 block font-normal leading-relaxed text-[var(--ink-500)]">Use one unobstructed bag that fills at least a quarter of the image height. YouCam detects and separates the product from its background.</span>
              </label>
              <div className="sm:col-span-2 rounded-2xl border border-[var(--line)] bg-white/75 p-3">
                <p className="text-xs font-bold text-[var(--ink-900)]">Person crop sent to Bag Try-On</p>
                <p className="mt-1 text-xs leading-relaxed text-[var(--ink-500)]">This centered head-to-waist frame is what YouCam receives. After the dress step, the preview refreshes to match that updated photo.</p>
                {bagFramePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={bagFramePreview} alt="Exact head-to-waist photo crop prepared for bag try-on" className="mt-3 max-h-64 w-auto max-w-full rounded-xl border border-[var(--line)] object-contain" />
                ) : (
                  <p className="mt-3 text-xs text-[var(--ink-500)]">Upload your photo to preview this crop.</p>
                )}
              </div>
              <label className="block text-xs font-bold text-[var(--ink-700)] sm:col-span-2" htmlFor="full-look-bag-style">Bag styling mood
                <select id="full-look-bag-style" value={bagStyle} onChange={(event) => setBagStyle(event.target.value as typeof bagStyle)} className="mt-2 min-h-11 w-full rounded-xl border border-[var(--line)] bg-white px-3 text-sm font-medium text-[var(--ink-900)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--blue-700)]">
                  {BAG_STYLES.filter((item) => item.id !== 'random').map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                </select>
              </label>
            </div>
          )}

          {selected.includes('makeup') && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="full-look-makeup-zoom" className="text-xs font-bold text-[var(--ink-700)]">Makeup face zoom</label>
                <span className="text-xs tabular-nums text-[var(--ink-500)]">{makeupZoom.toFixed(1)}×</span>
              </div>
              <input id="full-look-makeup-zoom" type="range" min="1.2" max="3" step="0.1" value={makeupZoom} onChange={(event) => setMakeupZoom(Number(event.target.value))} aria-valuetext={`${makeupZoom.toFixed(1)} times face zoom`} className="w-full accent-[var(--blue-700)]" />
              <p className="text-xs leading-relaxed text-[var(--ink-500)]">The face crop is blended back into the full-body result.</p>
            </div>
          )}

          <button type="button" disabled={!photo || orderedFeatures.length === 0 || state === 'loading'} onClick={handleCreateLook} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-dashboard-gradient px-6 py-3 text-sm font-bold text-white shadow-[var(--shadow-glow)] motion-safe:transition-transform motion-safe:hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--blue-700)] disabled:cursor-not-allowed disabled:opacity-45">
            {state === 'loading' ? <><Loader2 size={17} className="motion-safe:animate-spin" aria-hidden="true" /> Creating your look…</> : <><Sparkles size={17} aria-hidden="true" /> Create combined look</>}
          </button>
          {!photo && <p className="text-center text-xs text-[var(--ink-500)]">Upload a photo to start your combined look.</p>}
          {orderedFeatures.length === 0 && <p className="text-center text-xs text-[var(--ink-500)]">Choose at least one effect.</p>}
        </section>

        <section className="space-y-4 rounded-3xl border border-[var(--line)] bg-[var(--glass-light-bg)] p-5 shadow-[var(--shadow-soft)] sm:p-7" aria-labelledby="combined-look-result" aria-live="polite">
          <div>
            <p className="app-page-kicker mb-2">Step 3</p>
            <h2 id="combined-look-result" className="font-display text-3xl text-[var(--ink-900)]">Your complete look</h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--ink-500)]">Dress, bag, and face-focused makeup meet in one preview.</p>
          </div>

          {state === 'loading' && (
            <div className="space-y-4 rounded-2xl border border-[var(--line)] bg-white/70 p-5">
              <div className="flex items-center gap-3 text-sm font-semibold text-[var(--ink-900)]"><Loader2 size={18} className="motion-safe:animate-spin text-[var(--blue-700)]" aria-hidden="true" />{progress}</div>
              <ol className="space-y-2 text-xs text-[var(--ink-500)]">
                {orderedFeatures.map((feature) => <li key={feature} className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${completed.includes(feature) ? 'bg-emerald-500' : progress.toLowerCase().includes(feature) ? 'bg-[var(--blue-600)] motion-safe:animate-pulse' : 'bg-[var(--line)]'}`} />{FEATURE_COPY[feature].label}{completed.includes(feature) ? ' complete' : ''}</li>)}
              </ol>
              <p className="text-[11px] leading-relaxed text-[var(--ink-500)]">Keep this page open while YouCam processes each selected item.</p>
            </div>
          )}

          {state === 'error' && (
            <div role="alert" className="rounded-2xl border border-[var(--danger)]/30 bg-[var(--danger)]/5 p-4 text-sm text-[var(--danger)]">
              <p className="font-bold">We couldn&apos;t finish this look</p>
              <p className="mt-1 text-xs leading-relaxed">{error}</p>
              {completed.length > 0 && <p className="mt-2 text-xs">Completed: {completed.map((item) => FEATURE_COPY[item].label).join(', ')}. A retry runs the selected stages again and uses quota again.</p>}
            </div>
          )}

          {state === 'success' && resultUrl && (
            <div className="space-y-3">
              <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={resultUrl} alt="Combined full look with the selected dress, bag, and makeup" className="max-h-[680px] w-full object-contain" />
              </div>
              <div className="flex flex-wrap gap-2">
                {orderedFeatures.map((feature) => <span key={feature} className="rounded-full bg-[var(--ice-100)] px-3 py-1 text-xs font-bold text-[var(--blue-700)]">{FEATURE_COPY[feature].label}</span>)}
              </div>
              <a href={resultUrl} download="mirror-moments-full-look.jpg" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-[var(--line)] bg-white px-5 py-2 text-sm font-bold text-[var(--ink-900)] hover:bg-[var(--ice-100)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue-700)]"><Download size={16} aria-hidden="true" /> Save combined look</a>
            </div>
          )}

          {(state === 'empty' || !photo) && state !== 'loading' && state !== 'error' && state !== 'success' && (
            <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--line)] bg-white/45 p-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--ice-100)] text-[var(--blue-700)]"><Sparkles size={24} aria-hidden="true" /></div>
              <p className="mt-4 font-display text-2xl text-[var(--ink-900)]">Your look will appear here</p>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-[var(--ink-500)]">Choose a full-body photo and the styles you want to try. We&apos;ll use a face crop for makeup and blend it into the full image.</p>
            </div>
          )}

          <p className="text-[11px] leading-relaxed text-[var(--ink-500)]">Each selected try-on is processed separately by YouCam. The combined image blends their returned results; small differences at the blend edges can occur.</p>
        </section>
      </div>
    </div>
  );
}
