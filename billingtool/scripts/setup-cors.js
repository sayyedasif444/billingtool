#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Firebase Storage CORS...\n');

// Check if firebase-storage-cors.json exists
const corsConfigPath = path.join(__dirname, '..', 'firebase-storage-cors.json');
if (!fs.existsSync(corsConfigPath)) {
  console.error('❌ firebase-storage-cors.json not found!');
  console.log('Please make sure the file exists in the project root.');
  process.exit(1);
}

// Read the CORS configuration
const corsConfig = fs.readFileSync(corsConfigPath, 'utf8');
console.log('📄 CORS configuration found:');
console.log(corsConfig);
console.log('');

// Get the storage bucket from environment variables
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
if (!storageBucket) {
  console.error('❌ NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET not found in environment variables!');
  console.log('Please make sure you have set up your .env.local file correctly.');
  process.exit(1);
}

const bucketUrl = `gs://${storageBucket}`;
console.log(`🎯 Target bucket: ${bucketUrl}\n`);

try {
  // Check if gsutil is available
  execSync('gsutil --version', { stdio: 'pipe' });
  console.log('✅ gsutil is available\n');
} catch (error) {
  console.error('❌ gsutil not found!');
  console.log('Please install Google Cloud SDK:');
  console.log('1. Visit: https://cloud.google.com/sdk/docs/install');
  console.log('2. Install the SDK');
  console.log('3. Run: gcloud auth login');
  console.log('4. Run: gcloud config set project YOUR_PROJECT_ID');
  process.exit(1);
}

try {
  // Apply CORS configuration
  console.log('🔄 Applying CORS configuration...');
  execSync(`gsutil cors set ${corsConfigPath} ${bucketUrl}`, { stdio: 'inherit' });
  console.log('\n✅ CORS configuration applied successfully!');
  console.log('\n🎉 Your Firebase Storage is now configured to accept uploads from localhost.');
  console.log('You can now upload logos without CORS errors.');
} catch (error) {
  console.error('\n❌ Failed to apply CORS configuration:', error.message);
  console.log('\n🔧 Manual setup required:');
  console.log('1. Go to Google Cloud Console: https://console.cloud.google.com/');
  console.log('2. Select your Firebase project');
  console.log('3. Go to Cloud Storage > Browser');
  console.log('4. Click on your storage bucket');
  console.log('5. Go to the "CORS" tab');
  console.log('6. Click "Edit" and paste the contents of firebase-storage-cors.json');
  console.log('7. Click "Save"');
} 