'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';

interface DebugInfo {
  envVars?: {
    apiKey: string;
    projectId: string;
    authDomain: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId: string;
  };
  auth?: string;
  db?: string;
  config?: {
    apiKey?: string;
    projectId?: string;
    authDomain?: string;
    storageBucket?: string;
    messagingSenderId?: string;
    appId?: string;
    measurementId?: string;
  };
  error?: string;
}

export default function TestFirebase() {
  const [status, setStatus] = useState<string>('Loading...');
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({});

  useEffect(() => {
    const testFirebase = async () => {
      try {
        setStatus('Testing Firebase configuration...');
        
        // Test environment variables
        const envVars = {
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'SET' : 'NOT SET',
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? 'SET' : 'NOT SET',
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? 'SET' : 'NOT SET',
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? 'SET' : 'NOT SET',
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? 'SET' : 'NOT SET',
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? 'SET' : 'NOT SET',
          measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ? 'SET' : 'NOT SET'
        };
        
        setDebugInfo({ envVars });
        console.log('Environment Variables:', envVars);
        
        // Test if auth is available
        if (!auth) {
          setStatus('❌ Firebase Auth not initialized');
          setDebugInfo((prev: DebugInfo) => ({ ...prev, auth: 'NOT INITIALIZED' }));
          return;
        }
        
        setDebugInfo((prev: DebugInfo) => ({ ...prev, auth: 'INITIALIZED' }));
        setStatus('✅ Firebase Auth initialized');
        
        // Test if db is available
        if (!db) {
          setStatus('❌ Firebase Firestore not initialized');
          setDebugInfo((prev: DebugInfo) => ({ ...prev, db: 'NOT INITIALIZED' }));
          return;
        }
        
        setDebugInfo((prev: DebugInfo) => ({ ...prev, db: 'INITIALIZED' }));
        setStatus('✅ Firebase Firestore initialized');
        
        // Test Firebase configuration
        const config = {
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
          measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
        };
        
        setDebugInfo((prev: DebugInfo) => ({ ...prev, config }));
        console.log('Firebase Config:', config);
        
        setStatus(`✅ Firebase configured successfully! Project: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`);
        
      } catch (error) {
        console.error('Firebase test error:', error);
        setStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setDebugInfo((prev: DebugInfo) => ({ ...prev, error: error instanceof Error ? error.message : 'Unknown error' }));
      }
    };

    testFirebase();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Firebase Configuration Test</h1>
        
        <div className="bg-gray-800 p-6 rounded-lg mb-8">
          <p className="text-lg">{status}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Environment Variables:</h2>
            <div className="space-y-2 text-sm">
              <p>API Key: {debugInfo.envVars?.apiKey || 'Loading...'}</p>
              <p>Project ID: {debugInfo.envVars?.projectId || 'Loading...'}</p>
              <p>Auth Domain: {debugInfo.envVars?.authDomain || 'Loading...'}</p>
              <p>Storage Bucket: {debugInfo.envVars?.storageBucket || 'Loading...'}</p>
              <p>Messaging Sender ID: {debugInfo.envVars?.messagingSenderId || 'Loading...'}</p>
              <p>App ID: {debugInfo.envVars?.appId || 'Loading...'}</p>
              <p>Measurement ID: {debugInfo.envVars?.measurementId || 'Loading...'}</p>
            </div>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Firebase Services:</h2>
            <div className="space-y-2 text-sm">
              <p>Auth: {debugInfo.auth || 'Loading...'}</p>
              <p>Firestore: {debugInfo.db || 'Loading...'}</p>
            </div>
            
            {debugInfo.error && (
              <div className="mt-4 p-3 bg-red-900/50 border border-red-500 rounded">
                <h3 className="font-semibold text-red-300">Error:</h3>
                <p className="text-red-200 text-sm">{debugInfo.error}</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-8 bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Next Steps:</h2>
          <div className="space-y-2 text-sm">
            <p>1. Check browser console for detailed logs</p>
            <p>2. Verify Firebase project has Email/Password authentication enabled</p>
            <p>3. Ensure the Firebase project is in the correct region</p>
            <p>4. Check if the Firebase project has any usage restrictions</p>
          </div>
        </div>
      </div>
    </div>
  );
} 