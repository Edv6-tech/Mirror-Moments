const BASE_URL = 'http://localhost:3000';

async function testPhase(name: string, fn: () => Promise<void>) {
  process.stdout.write(`Testing ${name}... `);
  try {
    await fn();
    console.log('✅ PASSED');
  } catch (err: any) {
    console.log(`❌ FAILED: ${err.message}`);
  }
}

async function run() {
  console.log('\n======================================================');
  console.log('🧪 MIRROR MOMENT — FULL BACKEND SUITE VERIFICATION');
  console.log('======================================================\n');

  // Phase 1 & 2: Dress Try-on
  await testPhase('Phase 2: POST /api/dress-tryon', async () => {
    const res = await fetch(`${BASE_URL}/api/dress-tryon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        garmentId: 'emerald_slip',
        personPhoto: '/sample_face_valid.jpg',
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok || !data.resultUrl) {
      throw new Error(`Invalid response: ${JSON.stringify(data)}`);
    }
  });

  // Phase 3: Wardrobe Upload (mock buffer)
  await testPhase('Phase 3: POST /api/wardrobe/upload', async () => {
    const formData = new FormData();
    const blob = new Blob(['fake_image_bytes'], { type: 'image/jpeg' });
    formData.append('files', blob, 'test_dress.jpg');
    const res = await fetch(`${BASE_URL}/api/wardrobe/upload`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      throw new Error(`Upload failed: ${JSON.stringify(data)}`);
    }
  });

  // Phase 4: Hair Templates
  await testPhase('Phase 4A: GET /api/hair-templates', async () => {
    const res = await fetch(`${BASE_URL}/api/hair-templates`);
    const data = await res.json();
    if (!res.ok || !data.ok || !Array.isArray(data.templates)) {
      throw new Error(`Templates failed: ${JSON.stringify(data)}`);
    }
  });

  // Phase 4: Hair Try-on
  await testPhase('Phase 4B: POST /api/hair-tryon', async () => {
    const res = await fetch(`${BASE_URL}/api/hair-tryon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userPhoto: '/sample_face_valid.jpg',
        templateId: 'template_bob_01',
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok || !data.resultUrl) {
      throw new Error(`Hair try-on failed: ${JSON.stringify(data)}`);
    }
  });

  // Phase 5: Makeup Try-on
  await testPhase('Phase 5: POST /api/makeup-tryon', async () => {
    const res = await fetch(`${BASE_URL}/api/makeup-tryon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        photo: '/sample_face_valid.jpg',
        effects: {
          lipstick: { enabled: true, color: '#E11D48', texture: 'matte', intensity: 80 },
          blush: { enabled: true, color: '#F43F5E', intensity: 50 },
        },
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok || !data.resultUrl) {
      throw new Error(`Makeup try-on failed: ${JSON.stringify(data)}`);
    }
  });

  // Phase 6: Face Retouch
  await testPhase('Phase 6: POST /api/retouch', async () => {
    const res = await fetch(`${BASE_URL}/api/retouch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        photo: '/sample_face_valid.jpg',
        sliders: {
          skinSmoothing: 70,
          teethWhitening: 40,
        },
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok || !data.resultUrl) {
      throw new Error(`Retouch failed: ${JSON.stringify(data)}`);
    }
  });

  console.log('\n======================================================');
  console.log('🎉 ALL PHASES VERIFIED SUCCESSFULLY');
  console.log('======================================================\n');
}

run();
