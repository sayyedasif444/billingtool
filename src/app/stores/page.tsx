'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getUserBusinesses } from '@/lib/firebase';
import type { Business } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import BackgroundPattern from '@/components/ui/BackgroundPattern';
import CreateBusinessForm from '@/components/stores/CreateStoreForm';
import { Building2, Plus, MapPin, Phone, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function BusinessesPage() {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const loadBusinesses = useCallback(async () => {
    try {
      setLoading(true);
      if (!user) {
        throw new Error('User not authenticated');
      }
      const userBusinesses = await getUserBusinesses(user.email);
      setBusinesses(userBusinesses);
    } catch (error) {
      console.error('Error loading businesses:', error);
      setError('Failed to load businesses');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    loadBusinesses();
  }, [user, router, loadBusinesses]);

  const handleBusinessCreated = (newBusiness: Business) => {
    setBusinesses(prev => [newBusiness, ...prev]);
    setShowCreateForm(false);
  };

  const handleBusinessClick = (businessId: string) => {
    if (businessId) {
      router.push(`/businesses/${businessId}`);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black relative">
        <BackgroundPattern />
        <div className="text-center relative z-10">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-300">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative p-6">
      <BackgroundPattern />
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">My Businesses</h1>
            <p className="text-gray-300">Manage your business locations</p>
          </div>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-gradient-to-r from-primary to-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Business
          </Button>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200"
          >
            {error}
          </motion.div>
        )}

        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <CreateBusinessForm
              onSuccess={handleBusinessCreated}
              onCancel={() => setShowCreateForm(false)}
            />
          </motion.div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" className="mx-auto" />
          </div>
        ) : businesses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="mx-auto w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-6">
              <Building2 className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No businesses yet</h3>
            <p className="text-gray-400 mb-6">
              Create your first business to start managing products and invoices
            </p>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-primary to-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Business
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {businesses.map((business, index) => (
              <motion.div
                key={business.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className="border-white/10 bg-black/30 hover:bg-black/50 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-primary/20"
                  onClick={() => business.id && handleBusinessClick(business.id)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="p-2 bg-gradient-to-r from-primary to-blue-700 rounded-lg">
                          <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-white">{business.name}</CardTitle>
                          <CardDescription className="text-gray-300">
                            {business.description || 'No description'}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-2 text-sm text-gray-300">
                      <MapPin className="w-4 h-4" />
                      <span>
                        {business.address.street}, {business.address.city}, {business.address.state}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-300">
                      <Phone className="w-4 h-4" />
                      <span>{business.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-300">
                      <Mail className="w-4 h-4" />
                      <span>{business.email}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 