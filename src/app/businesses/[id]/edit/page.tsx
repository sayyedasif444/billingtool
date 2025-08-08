'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { getBusiness, updateBusiness } from '@/lib/firebase';
import type { Business } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import BackgroundPattern from '@/components/ui/BackgroundPattern';
import LogoUpload from '@/components/ui/LogoUpload';
import { Building2, MapPin, ArrowLeft, Save } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';

export default function BusinessEditPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const businessId = params.id as string;

  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    phone: '',
    email: '',
    currency: 'INR',
    logo: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States'
    }
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const businessData = await getBusiness(businessId);

      if (!businessData) {
        setError('Business not found');
        return;
      }

      setBusiness(businessData);
      setFormData({
        name: businessData.name,
        description: businessData.description || '',
        phone: businessData.phone,
        email: businessData.email,
        currency: businessData.currency || 'INR',
        logo: businessData.logo || '',
        address: {
          street: businessData.address.street,
          city: businessData.address.city,
          state: businessData.address.state,
          zipCode: businessData.address.zipCode,
          country: businessData.address.country
        }
      });
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data');
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
        loadData();
      }
    }
  }, [user, authLoading, businessId, router, loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      if (!formData.name.trim()) {
        throw new Error('Business name is required');
      }

      if (!formData.phone.trim()) {
        throw new Error('Phone number is required');
      }

      if (!formData.email.trim()) {
        throw new Error('Email is required');
      }

      if (!formData.address.street.trim() || !formData.address.city.trim() || !formData.address.state.trim()) {
        throw new Error('Complete address is required');
      }

      const updates = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        currency: formData.currency,
        logo: formData.logo,
        address: {
          street: formData.address.street.trim(),
          city: formData.address.city.trim(),
          state: formData.address.state.trim(),
          zipCode: formData.address.zipCode.trim(),
          country: formData.address.country.trim() || 'United States'
        }
      };

      await updateBusiness(businessId, updates);
      setSuccess('Business updated successfully!');
      
      // Reload data to show updated information
      setTimeout(() => {
        loadData();
      }, 1000);
    } catch (error: unknown) {
      console.error('Error updating business:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while updating the business');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as Record<string, string>),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleLogoUpload = (logoPath: string) => {
    setFormData(prev => ({
      ...prev,
      logo: logoPath
    }));
  };

  const handleLogoRemove = () => {
    setFormData(prev => ({
      ...prev,
      logo: ''
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
          <p className="text-gray-300">Loading business details...</p>
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
                <h1 className="text-3xl font-bold text-white">Edit Business</h1>
                <p className="text-gray-300">{business.name}</p>
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
                <Building2 className="w-5 h-5" />
                Business Information
              </CardTitle>
              <CardDescription className="text-gray-300">
                Update business details and settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Business Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Basic Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name" className="text-white">Business Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Enter business name"
                        className="mt-1"
                        disabled={saving}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone" className="text-white">Phone Number *</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="Enter phone number"
                        className="mt-1"
                        disabled={saving}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-white">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Enter business email"
                      className="mt-1"
                      disabled={saving}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="currency" className="text-white">Currency *</Label>
                    <select
                      id="currency"
                      value={formData.currency}
                      onChange={(e) => handleInputChange('currency', e.target.value)}
                      className="mt-1 w-full px-3 py-2 bg-black/50 border border-white/20 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={saving}
                      required
                    >
                      <option value="INR">Indian Rupee (₹)</option>
                      <option value="USD">US Dollar ($)</option>
                      <option value="EUR">Euro (€)</option>
                      <option value="GBP">British Pound (£)</option>
                      <option value="CAD">Canadian Dollar (C$)</option>
                      <option value="AUD">Australian Dollar (A$)</option>
                      <option value="JPY">Japanese Yen (¥)</option>
                      <option value="CHF">Swiss Franc (CHF)</option>
                      <option value="CNY">Chinese Yuan (¥)</option>
                      <option value="SGD">Singapore Dollar (S$)</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-white">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Enter business description"
                      className="mt-1"
                      disabled={saving}
                      rows={3}
                    />
                  </div>

                  {/* Logo Upload */}
                  <LogoUpload
                    currentLogo={formData.logo}
                    businessId={businessId}
                    onLogoUpload={handleLogoUpload}
                    onLogoRemove={handleLogoRemove}
                    disabled={saving}
                  />
                </div>

                {/* Address Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Address Information
                  </h3>

                  <div>
                    <Label htmlFor="street" className="text-white">Street Address *</Label>
                    <Input
                      id="street"
                      value={formData.address.street}
                      onChange={(e) => handleInputChange('address.street', e.target.value)}
                      placeholder="Enter street address"
                      className="mt-1"
                      disabled={saving}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city" className="text-white">City *</Label>
                      <Input
                        id="city"
                        value={formData.address.city}
                        onChange={(e) => handleInputChange('address.city', e.target.value)}
                        placeholder="Enter city"
                        className="mt-1"
                        disabled={saving}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="state" className="text-white">State *</Label>
                      <Input
                        id="state"
                        value={formData.address.state}
                        onChange={(e) => handleInputChange('address.state', e.target.value)}
                        placeholder="Enter state"
                        className="mt-1"
                        disabled={saving}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="zipCode" className="text-white">ZIP Code</Label>
                      <Input
                        id="zipCode"
                        value={formData.address.zipCode}
                        onChange={(e) => handleInputChange('address.zipCode', e.target.value)}
                        placeholder="Enter ZIP code"
                        className="mt-1"
                        disabled={saving}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="country" className="text-white">Country</Label>
                    <Input
                      id="country"
                      value={formData.address.country}
                      onChange={(e) => handleInputChange('address.country', e.target.value)}
                      placeholder="Enter country"
                      className="mt-1"
                      disabled={saving}
                    />
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
                        Updating Business...
                      </div>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Update Business
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