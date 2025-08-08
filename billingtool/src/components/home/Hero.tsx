'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Zap, Settings, Shield } from 'lucide-react';
import Image from 'next/image';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center bg-black overflow-hidden pt-16">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-blue-600/10" />
      </div>
      
      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            {/* Logo/Brand */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <div className="inline-flex items-center justify-center p-4 bg-gradient-to-r from-primary to-blue-700 rounded-full mb-6">
                <Image
                  src="/images/logo-main.png"
                  alt="Dev & Debate Logo"
                  width={48}
                  height={48}
                  className="w-12 h-12"
                />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                Dev & Debate
              </h1>
            </motion.div>

            {/* Main Heading */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-3xl md:text-5xl font-bold text-white mb-6"
            >
              Billing Tool
            </motion.h2>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto"
            >
              Streamline your business operations with our comprehensive billing and invoicing solution. 
              Manage businesses, products, and sales with ease.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
            >
              <Button 
                size="lg"
                className="px-8 py-4 text-lg"
                onClick={() => window.location.href = '/signup'}
              >
                Get Started
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="px-8 py-4 text-lg"
                onClick={() => window.location.href = '/login'}
              >
                Sign In
              </Button>
            </motion.div>

            {/* Features Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
            >
              <div className="text-center">
                <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-primary to-blue-700 rounded-lg mb-4">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Lightning Fast</h3>
                <p className="text-gray-400">Generate invoices and manage billing in seconds, not hours.</p>
              </div>
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-primary to-blue-700 rounded-lg mb-4">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Smart & Customizable</h3>
                <p className="text-gray-400">Configure your businesses, products, and settings to match your business.</p>
              </div>
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-primary to-blue-700 rounded-lg mb-4">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Secure & Private</h3>
                <p className="text-gray-400">Your data is yours. Full control over your business information.</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
} 