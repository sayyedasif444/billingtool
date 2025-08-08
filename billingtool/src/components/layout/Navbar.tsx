'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import { Building2, Receipt, User } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const handleSignOut = () => {
    signOut();
    router.push('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => router.push('/')}
          >
            <Image
              src="/images/logo-main.png"
              alt="Dev & Debate Logo"
              width={40}
              height={40}
              className="w-10 h-10"
            />
            <span className="text-xl font-bold text-white">Dev & Debate</span>
          </motion.div>

          {/* Navigation Links */}
          {user && (
            <div className="hidden md:flex items-center space-x-8">
              <motion.button
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => router.push('/dashboard')}
                className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                Dashboard
              </motion.button>
              <motion.button
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                onClick={() => router.push('/businesses')}
                className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-2"
              >
                <Building2 className="w-4 h-4" />
                Businesses
              </motion.button>
              <motion.button
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                onClick={() => router.push('/invoices')}
                className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-2"
              >
                <Receipt className="w-4 h-4" />
                Invoices
              </motion.button>
            </div>
          )}

          {/* Auth Buttons */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-4"
          >
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-gray-300 text-sm hidden md:block">
                  Welcome, {user.name}
                </span>
                <Button
                  variant="outline"
                  onClick={handleSignOut}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => router.push('/login')}
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => router.push('/signup')}
                  className="bg-gradient-to-r from-primary to-blue-700"
                >
                  Get Started
                </Button>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </nav>
  );
} 