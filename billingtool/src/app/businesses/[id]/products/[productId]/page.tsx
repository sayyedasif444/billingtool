'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { getBusiness, getBusinessProducts, updateProductPrice } from '@/lib/firebase';
import type { Business, Product } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import BackgroundPattern from '@/components/ui/BackgroundPattern';
import { Package, DollarSign, Hash, Image as ImageIcon, ArrowLeft, Save } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';

export default function ProductEditPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const businessId = params.id as string;
  const productId = params.productId as string;

  const [business, setBusiness] = useState<Business | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    sku: '',
    barcode: '',
    image: '',
    isActive: true
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [businessData, productsData] = await Promise.all([
        getBusiness(businessId),
        getBusinessProducts(businessId)
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
      setFormData({
        name: productData.name,
        description: productData.description || '',
        price: productData.price.toString(),
        category: productData.category || '',
        sku: productData.sku || '',
        barcode: productData.barcode || '',
        image: productData.image || '',
        isActive: productData.isActive
      });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      if (!formData.name.trim()) {
        throw new Error('Product name is required');
      }

      if (!formData.price || parseFloat(formData.price) <= 0) {
        throw new Error('Valid price is required');
      }

      const newPrice = parseFloat(formData.price);
      const oldPrice = product?.price || 0;

      // Update product price if it changed
      if (newPrice !== oldPrice) {
        if (!user) {
          throw new Error('User not authenticated');
        }
        await updateProductPrice(productId, newPrice, user.email, 'Price updated via edit form');
      }

      // TODO: Add updateProduct function to update other fields
      // For now, we'll just update the price
      setSuccess('Product updated successfully!');
      
      // Reload data to show updated information
      setTimeout(() => {
        loadData();
      }, 1000);
    } catch (error: unknown) {
      console.error('Error updating product:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while updating the product');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black relative">
        <BackgroundPattern />
        <div className="text-center relative z-10">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-300">Loading product details...</p>
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
                <h1 className="text-3xl font-bold text-white">Edit Product</h1>
                <p className="text-gray-300">{product.name}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Edit Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-white/10 bg-black/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Package className="w-5 h-5" />
                Product Information
              </CardTitle>
              <CardDescription className="text-gray-300">
                Update product details and pricing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Product Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Basic Information
                  </h3>
                  
                  <div>
                    <Label htmlFor="name" className="text-white">Product Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter product name"
                      className="mt-1"
                      disabled={saving}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-white">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Enter product description"
                      className="mt-1"
                      disabled={saving}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price" className="text-white">Price ({business.currency}) *</Label>
                      <div className="relative mt-1">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.price}
                          onChange={(e) => handleInputChange('price', e.target.value)}
                          placeholder={`0.00 ${business.currency}`}
                          className="pl-10"
                          disabled={saving}
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="category" className="text-white">Category</Label>
                      <Input
                        id="category"
                        value={formData.category}
                        onChange={(e) => handleInputChange('category', e.target.value)}
                        placeholder="Enter category"
                        className="mt-1"
                        disabled={saving}
                      />
                    </div>
                  </div>
                </div>

                {/* Product Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Hash className="w-5 h-5" />
                    Product Details
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="sku" className="text-white">SKU</Label>
                      <Input
                        id="sku"
                        value={formData.sku}
                        onChange={(e) => handleInputChange('sku', e.target.value)}
                        placeholder="Enter SKU"
                        className="mt-1"
                        disabled={saving}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="barcode" className="text-white">Barcode</Label>
                      <Input
                        id="barcode"
                        value={formData.barcode}
                        onChange={(e) => handleInputChange('barcode', e.target.value)}
                        placeholder="Enter barcode"
                        className="mt-1"
                        disabled={saving}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="image" className="text-white">Image URL</Label>
                    <div className="relative mt-1">
                      <ImageIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="image"
                        type="url"
                        value={formData.image}
                        onChange={(e) => handleInputChange('image', e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="pl-10"
                        disabled={saving}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      id="isActive"
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => handleInputChange('isActive', e.target.checked)}
                      className="rounded border-white/20 bg-black/50 text-primary focus:ring-primary focus:ring-offset-2"
                      disabled={saving}
                    />
                    <Label htmlFor="isActive" className="text-white">Active Product</Label>
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-red-900/50 border border-red-500 rounded text-red-200 text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-green-900/50 border border-green-500 rounded text-green-200 text-sm"
                  >
                    {success}
                  </motion.div>
                )}

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={saving}
                  >
                    {saving ? (
                      <div className="flex items-center gap-2">
                        <LoadingSpinner size="sm" />
                        Updating Product...
                      </div>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Update Product
                      </>
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/businesses/${businessId}`)}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
} 