'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getBusiness, getBusinessProducts, deleteProduct, getBusinessIncome } from '@/lib/firebase';
import type { Business, Product, Invoice } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import BackgroundPattern from '@/components/ui/BackgroundPattern';
import CreateProductForm from '@/components/products/CreateProductForm';
import CreateInvoiceForm from '@/components/invoices/CreateInvoiceForm';
import DeleteConfirmationDialog from '@/components/ui/DeleteConfirmationDialog';
import { Package, Plus, MapPin, Phone, Mail, Building2, Edit, History, Receipt, Trash2, TrendingUp, Award } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { formatCurrency, getLogoUrl, formatDate } from '@/lib/utils';
import Image from 'next/image';

export default function BusinessDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const businessId = params.id as string;

  const [business, setBusiness] = useState<Business | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [error, setError] = useState('');
  const [incomeStats, setIncomeStats] = useState({
    totalIncome: 0,
    currentMonthIncome: 0,
    currentYearIncome: 0
  });
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; product: Product | null }>({
    isOpen: false,
    product: null
  });

  const loadBusinessData = useCallback(async () => {
    try {
      setLoading(true);
      const [businessData, productsData, incomeData] = await Promise.all([
        getBusiness(businessId),
        getBusinessProducts(businessId),
        getBusinessIncome(businessId)
      ]);

      if (!businessData) {
        setError('Business not found');
        return;
      }

      setBusiness(businessData);
      setProducts(productsData);
      setIncomeStats(incomeData);
    } catch (error) {
      console.error('Error loading business data:', error);
      setError('Failed to load business data');
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
        return;
      }
      if (businessId) {
        loadBusinessData();
      }
    }
  }, [user, authLoading, businessId, router, loadBusinessData]);

  const handleProductCreated = (newProduct: Product) => {
    setProducts(prev => [newProduct, ...prev]);
    setShowCreateForm(false);
  };

  const handleInvoiceCreated = (newInvoice: Invoice) => {
    setShowInvoiceForm(false);
    // Redirect to invoice view page
    router.push(`/invoices/${newInvoice.id}`);
  };

  const handleEditProduct = (productId: string) => {
    if (productId) {
      router.push(`/businesses/${businessId}/products/${productId}`);
    }
  };

  const handleViewPriceHistory = (productId: string) => {
    if (productId) {
      router.push(`/businesses/${businessId}/products/${productId}/history`);
    }
  };

  const handleEditBusiness = () => {
    router.push(`/businesses/${businessId}/edit`);
  };

  const handleDeleteProduct = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteDialog({ isOpen: true, product });
  };

  const confirmDeleteProduct = async () => {
    if (!deleteDialog.product?.id) return;
    
    try {
      await deleteProduct(deleteDialog.product.id);
      setProducts(prev => prev.filter(p => p.id !== deleteDialog.product?.id));
      setDeleteDialog({ isOpen: false, product: null });
    } catch (error) {
      console.error('Error deleting product:', error);
      setError('Failed to delete product');
    }
  };

  // Show loading while auth is being checked or data is loading
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black relative">
        <BackgroundPattern />
        <div className="text-center relative z-10">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-300">Loading business details...</p>
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

  if (error || !business) {
    return (
      <div className="min-h-screen bg-black relative p-6">
        <BackgroundPattern />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-red-900/50 rounded-full flex items-center justify-center mb-6">
              <Building2 className="w-12 h-12 text-red-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Business Not Found</h3>
            <p className="text-gray-400 mb-6">{error || 'The business you are looking for does not exist.'}</p>
            <Button
              onClick={() => router.push('/businesses')}
              className="bg-gradient-to-r from-primary to-blue-700"
            >
              Back to Businesses
            </Button>
          </div>
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
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                {business.logo ? (
                  <Image
                    src={getLogoUrl(business.logo) || ''}
                    alt={`${business.name} logo`}
                    width={48}
                    height={48}
                    className="w-12 h-12 object-cover rounded-lg border border-white/20"
                  />
                ) : (
                  <div className="p-2 bg-gradient-to-r from-primary to-blue-700 rounded-lg">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                )}
                <h1 className="text-3xl font-bold text-white">{business.name}</h1>
              </div>
              <p className="text-gray-300">{business.description || 'No description available'}</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-gradient-to-r from-primary to-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
              <Button
                onClick={() => setShowInvoiceForm(true)}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <Receipt className="w-4 h-4 mr-2" />
                Create Invoice
              </Button>
              <Button
                onClick={handleEditBusiness}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Business
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Business Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="border-white/10 bg-black/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Business Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {business.logo && (
                    <div className="flex items-center space-x-4">
                      <Image
                        src={getLogoUrl(business.logo) || ''}
                        alt={`${business.name} logo`}
                        width={64}
                        height={64}
                        className="w-16 h-16 object-cover rounded-lg border border-white/20"
                      />
                      <div>
                        <p className="text-sm text-gray-400">Business Logo</p>
                        <p className="text-white font-medium">{business.name}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center space-x-2 text-sm text-gray-300">
                    <MapPin className="w-4 h-4" />
                    <span>
                      {business.address.street}, {business.address.city}, {business.address.state} {business.address.zipCode}
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
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400">Created</p>
                    <p className="text-white">{formatDate(business.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Last Updated</p>
                    <p className="text-white">{formatDate(business.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Income Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Card className="border-white/10 bg-black/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Income Statistics
              </CardTitle>
              <CardDescription className="text-gray-300">
                Financial overview from approved invoices
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Disclaimer */}
              <div className="mb-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-full">
                    <Award className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-blue-300 font-medium text-sm mb-1">Income Calculation Note</p>
                    <p className="text-blue-200 text-sm">
                      Only invoices with "approved" status are counted as income. This ensures accurate financial reporting based on confirmed business transactions.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 border border-white/10 rounded-lg bg-black/20">
                  <div className="text-2xl font-bold text-white mb-2">
                    {formatCurrency(incomeStats.currentMonthIncome, business?.currency || 'INR')}
                  </div>
                  <p className="text-sm text-gray-300">Current Month Income</p>
                  <p className="text-xs text-gray-400">From approved invoices</p>
                </div>
                
                <div className="text-center p-4 border border-white/10 rounded-lg bg-black/20">
                  <div className="text-2xl font-bold text-white mb-2">
                    {formatCurrency(incomeStats.currentYearIncome, business?.currency || 'INR')}
                  </div>
                  <p className="text-sm text-gray-300">Current Year Income</p>
                  <p className="text-xs text-gray-400">From approved invoices</p>
                </div>
                
                <div className="text-center p-4 border border-white/10 rounded-lg bg-black/20">
                  <div className="text-2xl font-bold text-white mb-2">
                    {formatCurrency(incomeStats.totalIncome, business?.currency || 'INR')}
                  </div>
                  <p className="text-sm text-gray-300">Total Income</p>
                  <p className="text-xs text-gray-400">All time from approved invoices</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Create Forms */}
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <CreateProductForm
              businessId={businessId}
              currency={business?.currency || 'INR'}
              onSuccess={handleProductCreated}
              onCancel={() => setShowCreateForm(false)}
            />
          </motion.div>
        )}

        {showInvoiceForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <CreateInvoiceForm
              businessId={businessId}
              onSuccess={handleInvoiceCreated}
              onCancel={() => setShowInvoiceForm(false)}
            />
          </motion.div>
        )}

        {/* Products Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-white/10 bg-black/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Package className="w-5 h-5" />
                Products ({products.length})
              </CardTitle>
              <CardDescription className="text-gray-300">
                Manage your business products and pricing
              </CardDescription>
            </CardHeader>
            <CardContent>
              {products.length === 0 ? (
                <div className="text-center py-8">
                  <div className="mx-auto w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                    <Package className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">No products yet</h3>
                  <p className="text-gray-400 mb-4">
                    Add your first product to start creating invoices
                  </p>
                  <Button
                    onClick={() => setShowCreateForm(true)}
                    className="bg-gradient-to-r from-primary to-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Product
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="p-4 border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-white">{product.name}</h3>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => product.id && handleEditProduct(product.id)}
                            className="h-6 px-2 border-white/20 text-white hover:bg-white/10"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => product.id && handleViewPriceHistory(product.id)}
                            className="h-6 px-2 border-white/20 text-white hover:bg-white/10"
                          >
                            <History className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => handleDeleteProduct(product, e)}
                            className="h-6 px-2 border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300"
                            title="Delete product"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-400 mb-2">
                        {product.description || 'No description'}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-primary">
                          {formatCurrency(product.price, business.currency)}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          product.isActive 
                            ? 'bg-green-900/50 text-green-300' 
                            : 'bg-red-900/50 text-red-300'
                        }`}>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmationDialog
          isOpen={deleteDialog.isOpen}
          onClose={() => setDeleteDialog({ isOpen: false, product: null })}
          onConfirm={confirmDeleteProduct}
          title="Delete Product"
          description="Are you sure you want to delete this product? This action cannot be undone."
          itemName={deleteDialog.product?.name || ''}
        />
      </div>
    </div>
  );
} 