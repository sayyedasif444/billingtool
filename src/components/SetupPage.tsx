'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Database, Key, Globe } from 'lucide-react';
import BackgroundPattern from '@/components/ui/BackgroundPattern';

export const SetupPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative p-4">
      <BackgroundPattern />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl relative z-10"
      >
        <Card className="shadow-2xl border-white/20">
          <CardHeader className="text-center">
            <motion.div 
              className="mx-auto mb-4 p-3 bg-gradient-to-r from-primary to-blue-700 rounded-full w-fit"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Settings className="w-8 h-8 text-white" />
            </motion.div>
            <CardTitle className="text-3xl font-bold text-white">
              Setup Required
            </CardTitle>
            <CardDescription className="text-lg text-gray-300">
              Configure Firebase to start using the Billing Tool
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <motion.div 
              className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <p className="text-yellow-200 text-sm">
                <strong>Note:</strong> Firebase configuration is required to use this application.
              </p>
            </motion.div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Setup Steps:</h3>
              
              <div className="space-y-3">
                <motion.div 
                  className="flex items-start gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <div className="p-2 bg-gradient-to-r from-primary to-blue-700 rounded-lg">
                    <Database className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">1. Create Firebase Project</h4>
                    <p className="text-sm text-gray-300">
                      Go to <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Firebase Console</a> and create a new project
                    </p>
                  </div>
                </motion.div>

                <motion.div 
                  className="flex items-start gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <div className="p-2 bg-gradient-to-r from-green-600 to-green-700 rounded-lg">
                    <Key className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">2. Enable Services</h4>
                    <p className="text-sm text-gray-300">
                      Enable Authentication (Email/Password) and Firestore Database
                    </p>
                  </div>
                </motion.div>

                <motion.div 
                  className="flex items-start gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  <div className="p-2 bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg">
                    <Globe className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">3. Get Configuration</h4>
                    <p className="text-sm text-gray-300">
                      Add a web app to your project and copy the configuration
                    </p>
                  </div>
                </motion.div>

                <motion.div 
                  className="flex items-start gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                >
                  <div className="p-2 bg-gradient-to-r from-orange-600 to-orange-700 rounded-lg">
                    <Settings className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">4. Configure Environment</h4>
                    <p className="text-sm text-gray-300">
                      Update the <code className="bg-gray-800 px-1 rounded text-xs text-white">.env.local</code> file with your Firebase config
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>

            <motion.div 
              className="bg-gray-900/50 rounded-lg p-4 border border-white/10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <h4 className="font-medium text-white mb-2">Environment Variables Required:</h4>
              <div className="space-y-2 text-sm">
                <div><code className="bg-black/50 px-2 py-1 rounded text-white border border-white/10">NEXT_PUBLIC_FIREBASE_API_KEY</code></div>
                <div><code className="bg-black/50 px-2 py-1 rounded text-white border border-white/10">NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN</code></div>
                <div><code className="bg-black/50 px-2 py-1 rounded text-white border border-white/10">NEXT_PUBLIC_FIREBASE_PROJECT_ID</code></div>
                <div><code className="bg-black/50 px-2 py-1 rounded text-white border border-white/10">NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET</code></div>
                <div><code className="bg-black/50 px-2 py-1 rounded text-white border border-white/10">NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID</code></div>
                <div><code className="bg-black/50 px-2 py-1 rounded text-white border border-white/10">NEXT_PUBLIC_FIREBASE_APP_ID</code></div>
              </div>
            </motion.div>

            <motion.div 
              className="flex gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.9 }}
            >
              <Button 
                onClick={() => window.open('https://console.firebase.google.com', '_blank')}
                className="flex-1"
              >
                Open Firebase Console
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.reload()}
                className="flex-1"
              >
                Reload After Setup
              </Button>
            </motion.div>

            <motion.div 
              className="text-center text-sm text-gray-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.0 }}
            >
              <p>Need help? Check the <a href="https://firebase.google.com/docs/web/setup" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Firebase documentation</a></p>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}; 