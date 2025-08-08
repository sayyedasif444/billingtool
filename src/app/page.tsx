'use client';

import { SetupPage } from '@/components/SetupPage';
import Hero from '@/components/home/Hero';
import Features from '@/components/home/Features';
import CTA from '@/components/home/CTA';
import Footer from '@/components/layout/Footer';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useEffect, useState } from 'react';

export default function Home() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Check if Firebase is configured
  const isFirebaseConfigured = () => {
    return process.env.NEXT_PUBLIC_FIREBASE_API_KEY && 
           process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  };

  // Don't render anything until client-side hydration is complete
  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black relative">
        <div className="text-center relative z-10">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  // Show setup page if Firebase is not configured
  if (!isFirebaseConfigured()) {
    return <SetupPage />;
  }

  // Show landing page for all users (authenticated users can still access the home page)
  return (
    <main>
      <Hero />
      <Features />
      <CTA />
      <Footer />
    </main>
  );
}
