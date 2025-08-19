'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getBusiness, getBusinessProducts, getProductPriceHistory } from '@/lib/firebase';
import type { Business, Product, PriceHistory } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import BackgroundPattern from '@/components/ui/BackgroundPattern';
import { Package, ArrowLeft, History, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';

export default function ProductPriceHistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const businessId = params.id as string;
  const productId = params.productId as string;

  const [business, setBusiness] = useState<Business | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [businessData, productsData, historyData] = await Promise.all([
        getBusiness(businessId),
        getBusinessProducts(businessId),
        getProductPriceHistory(productId)
      ]);

      if (!businessData) {
        setError('Business not found');
        return;
      }

      const productData = productsData.find(p => p.id === productId);
      if (!productData) {
        setError('Product not found');
        return;
      }

      setBusiness(businessData);
      setProduct(productData);
      setPriceHistory(historyData);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [businessId, productId]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
        return;
      }
      if (businessId && productId) {
        loadData();
      }
    }
  }, [user, authLoading, businessId, productId, router, loadData]);

  // Show loading while auth is being checked or data is loading
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black relative">
        <BackgroundPattern />
        <div className="text-center relative z-10">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-300">Loading price history...</p>
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

  if (error || !business || !product) {
    return (
      <div className="min-h-screen bg-black relative p-6">
        <BackgroundPattern />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-red-900/50 rounded-full flex items-center justify-center mb-6">
              <Package className="w-12 h-12 text-red-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Product Not Found</h3>
            <p className="text-gray-400 mb-6">{error || 'The product you are looking for does not exist.'}</p>
            <Button
              onClick={() => router.push(`/businesses/${businessId}`)}
              className="bg-gradient-to-r from-primary to-blue-700"
            >
              Back to Business
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative p-6">
      <BackgroundPattern />
      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => router.push(`/businesses/${businessId}`)}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-white">Price History</h1>
                <p className="text-gray-300">{product.name}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Current Price */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="border-white/10 bg-black/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Current Price
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {formatCurrency(product.price, business.currency)}
              </div>
              <p className="text-gray-400 mt-2">
                Last updated: {formatDate(product.updatedAt)}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Price History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-white/10 bg-black/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <History className="w-5 h-5" />
                Price History
              </CardTitle>
              <CardDescription className="text-gray-300">
                All price changes for this product
              </CardDescription>
            </CardHeader>
            <CardContent>
              {priceHistory.length === 0 ? (
                <div className="text-center py-8">
                  <div className="mx-auto w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                    <History className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">No Price History</h3>
                  <p className="text-gray-400">
                    No price changes have been recorded for this product yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {priceHistory.map((history, index) => {
                    const priceChange = history.newPrice - history.oldPrice;
                    const priceChangePercent = ((priceChange / history.oldPrice) * 100);
                    const isIncrease = priceChange > 0;
                    const isDecrease = priceChange < 0;

                    return (
                      <motion.div
                        key={history.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${
                              isIncrease 
                                ? 'bg-green-900/50 text-green-300' 
                                : isDecrease 
                                ? 'bg-red-900/50 text-red-300'
                                : 'bg-gray-800 text-gray-300'
                            }`}>
                              {isIncrease ? (
                                <TrendingUp className="w-4 h-4" />
                              ) : isDecrease ? (
                                <TrendingDown className="w-4 h-4" />
                              ) : (
                                <DollarSign className="w-4 h-4" />
                              )}
                            </div>
                            <div>
                              <h3 className="font-semibold text-white">
                                {isIncrease ? 'Price Increased' : isDecrease ? 'Price Decreased' : 'Price Updated'}
                              </h3>
                              <p className="text-sm text-gray-400">
                                {formatDateTime(history.changedAt)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-white">
                              {formatCurrency(history.newPrice, business.currency)}
                            </div>
                            <div className={`text-sm ${
                              isIncrease ? 'text-green-300' : isDecrease ? 'text-red-300' : 'text-gray-400'
                            }`}>
                              {isIncrease ? '+' : ''}{formatCurrency(priceChange, business.currency)} 
                              ({isIncrease ? '+' : ''}{priceChangePercent.toFixed(1)}%)
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-gray-400">
                          <span>
                            Previous: {formatCurrency(history.oldPrice, business.currency)}
                          </span>
                          {history.reason && (
                            <span className="italic">
                              Reason: {history.reason}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
} 