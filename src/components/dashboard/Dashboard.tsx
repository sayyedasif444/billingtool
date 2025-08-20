'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import BackgroundPattern from '@/components/ui/BackgroundPattern';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useRouter } from 'next/navigation';
import { getUserBusinesses, getBusinessProducts, getUserTotalIncome } from '@/lib/firebase';
import type { Business } from '@/lib/firebase';
import { Building2, Package, Receipt, TrendingUp, Calendar } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

export const Dashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [incomeStats, setIncomeStats] = useState({
    totalIncome: 0,
    currentMonthIncome: 0,
    currentYearIncome: 0
  });
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      if (!user) {
        throw new Error('User not authenticated');
      }
      const userBusinesses = await getUserBusinesses(user.email);
      setBusinesses(userBusinesses);

      // Calculate total products across all businesses
      let totalProductsCount = 0;
      for (const business of userBusinesses) {
        if (business.id) {
          const products = await getBusinessProducts(business.id);
          totalProductsCount += products.length;
        }
      }
      setTotalProducts(totalProductsCount);

      // Get income statistics
      const incomeData = await getUserTotalIncome(user.email);
      setIncomeStats(incomeData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isClient && !authLoading) {
      if (!user) {
        router.push('/login');
      } else {
        loadDashboardData();
      }
    }
  }, [isClient, user, authLoading, router, loadDashboardData]);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  // Show loading while auth is being checked or data is loading
  if (!isClient || authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black relative">
        <BackgroundPattern />
        <div className="text-center relative z-10">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // If no user after auth loading is complete, show redirect message
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
            <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
            <p className="text-gray-300">Welcome back, {user.name}</p>
          </div>
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            Sign Out
          </Button>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-white/10 bg-black/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Total Businesses</CardTitle>
                <Building2 className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{businesses.length}</div>
                <p className="text-xs text-gray-400">Active business locations</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-white/10 bg-black/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Total Products</CardTitle>
                <Package className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{totalProducts}</div>
                <p className="text-xs text-gray-400">Products across all businesses</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-white/10 bg-black/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Current Month Income</CardTitle>
                <Calendar className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{formatCurrency(incomeStats.currentMonthIncome, 'INR')}</div>
                <p className="text-xs text-gray-400">From approved invoices</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-white/10 bg-black/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Total Income</CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{formatCurrency(incomeStats.totalIncome, 'INR')}</div>
                <p className="text-xs text-gray-400">All time from approved invoices</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <Card className="border-white/10 bg-black/30">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
              <CardDescription className="text-gray-300">
                Manage your businesses and products
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button
                  onClick={() => router.push('/businesses')}
                  className="bg-gradient-to-r from-primary to-blue-700"
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  View Businesses
                </Button>
                <Button
                  onClick={() => router.push('/businesses')}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  Create Business
                </Button>
                <Button
                  onClick={() => router.push('/invoices')}
                  className="bg-gradient-to-r from-primary to-blue-700"
                >
                  <Receipt className="w-4 h-4 mr-2" />
                  View Invoices
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Businesses */}
        {businesses.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="border-white/10 bg-black/30">
              <CardHeader>
                <CardTitle className="text-white">Recent Businesses</CardTitle>
                <CardDescription className="text-gray-300">
                  Your most recently created businesses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {businesses.slice(0, 3).map((business) => (
                    <div
                      key={business.id}
                      className="flex items-center justify-between p-4 border border-white/10 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                      onClick={() => business.id && router.push(`/businesses/${business.id}`)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gradient-to-r from-primary to-blue-700 rounded-lg">
                          <Building2 className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{business.name}</h3>
                          <p className="text-sm text-gray-400">
                            {business.address.city}, {business.address.state}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-400">
                        {formatDate(business.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}; 