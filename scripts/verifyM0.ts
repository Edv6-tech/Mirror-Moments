import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { YouCamClient } from '../server/youcamClient.ts';

dotenv.config();

async function runM0Verification() {
  console.log('=== Milestone M0 Verification Started ===');
  console.log('Timestamp:', new Date().toISOString());

  // 1. Verify .env is not tracked by git
  const gitignoreContent = fs.readFileSync(path.resolve(process.cwd(), '.gitignore'), 'utf-8');
  const ignoresEnv = gitignoreContent.includes('.env');
  console.log('Checking .gitignore ignores .env:', ignoresEnv ? 'PASS' : 'FAIL');

  const client = new YouCamClient();

  // 2. Real Skin AI Call
  console.log('\n--- Testing YouCam Skin AI Call ---');
  const faceBuffer = fs.readFileSync(path.resolve(process.cwd(), 'data/sample_face_valid.jpg'));
  console.log('Uploading sample face image (size:', faceBuffer.length, 'bytes)...');
  
  const faceFileId = await client.uploadFile(faceBuffer, 'sample_face_valid.jpg', 'image/jpeg');
  console.log('File uploaded successfully. File ID:', faceFileId);

  console.log('Submitting Skin AI analysis task...');
  const skinResult = await client.analyzeSkin(faceFileId);
  console.log('Skin AI Task Status:', skinResult.task_status);
  console.log('Skin AI Result Keys:', Object.keys(skinResult));
  if (skinResult.result || skinResult.results) {
    const resData = skinResult.result || skinResult.results;
    console.log('Skin AI Metric Keys:', Object.keys(resData));
  }

  // 3. Real Apparel Try-On Call
  console.log('\n--- Testing YouCam Apparel VTO Call ---');
  const garmentBuffer = fs.readFileSync(path.resolve(process.cwd(), 'data/sample_garment_valid.jpg'));
  console.log('Uploading sample garment image (size:', garmentBuffer.length, 'bytes)...');

  const garmentFileId = await client.uploadFile(garmentBuffer, 'sample_garment_valid.jpg', 'image/jpeg');
  console.log('Garment uploaded successfully. File ID:', garmentFileId);

  console.log('Submitting Apparel Try-On task...');
  const tryOnResult = await client.tryOnCloth(faceFileId, garmentFileId);
  console.log('Try-On Task Status:', tryOnResult.task_status);
  console.log('Try-On Result Keys:', Object.keys(tryOnResult));
  if (tryOnResult.result || tryOnResult.results) {
    const resData = tryOnResult.result || tryOnResult.results;
    console.log('Try-On Output Result Keys:', Object.keys(resData));
  }

  // 4. Verify Fixtures Saved
  const skinFixtureExists = fs.existsSync(path.resolve(process.cwd(), 'data/fixtures/skin-analysis-sample.json'));
  const tryOnFixtureExists = fs.existsSync(path.resolve(process.cwd(), 'data/fixtures/cloth-tryon-sample.json'));
  console.log('\n--- Fixture Verification ---');
  console.log('data/fixtures/skin-analysis-sample.json saved:', skinFixtureExists ? 'PASS' : 'FAIL');
  console.log('data/fixtures/cloth-tryon-sample.json saved:', tryOnFixtureExists ? 'PASS' : 'FAIL');

  console.log('\n=== Milestone M0 Verification COMPLETE ===');
}

runM0Verification().catch((err) => {
  console.error('\nM0 Verification Error:', err.message || err);
  process.exit(1);
});
