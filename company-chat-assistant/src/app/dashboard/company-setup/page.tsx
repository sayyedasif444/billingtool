'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Company, FAQ, Policy, BusinessHours, TimeRange, ContactInfo, CallbackPreferences } from '@/types';

export default function CompanySetupPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    industry: '',
    website: '',
    logo: '',
    faqs: [] as FAQ[],
    policies: [] as Policy[],
    businessHours: {
      monday: { open: '09:00', close: '17:00', closed: false },
      tuesday: { open: '09:00', close: '17:00', closed: false },
      wednesday: { open: '09:00', close: '17:00', closed: false },
      thursday: { open: '09:00', close: '17:00', closed: false },
      friday: { open: '09:00', close: '17:00', closed: false },
      saturday: { open: '10:00', close: '15:00', closed: false },
      sunday: { open: '00:00', close: '00:00', closed: true }
    } as BusinessHours,
    contactInfo: {
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    } as ContactInfo,
    callbackPreferences: {
      availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      availableTimeSlots: [
        { day: 'monday', startTime: '09:00', endTime: '17:00' },
        { day: 'tuesday', startTime: '09:00', endTime: '17:00' },
        { day: 'wednesday', startTime: '09:00', endTime: '17:00' },
        { day: 'thursday', startTime: '09:00', endTime: '17:00' },
        { day: 'friday', startTime: '09:00', endTime: '17:00' }
      ],
      contactMethods: ['phone', 'email'],
      responseTime: 'within_24h'
    } as CallbackPreferences
  });

  const fetchCompany = useCallback(async () => {
    try {
      const response = await fetch(`/api/company?userId=${user?.id}&companyId=${user?.companyId}`);
      if (response.ok) {
        const data = await response.json();
        setCompany(data.company);
        setFormData({
          name: data.company.name,
          description: data.company.description,
          industry: data.company.industry,
          website: data.company.website,
          logo: data.company.logo || '',
          faqs: data.company.faqs || [],
          policies: data.company.policies || [],
          businessHours: data.company.businessHours,
          contactInfo: data.company.contactInfo,
          callbackPreferences: data.company.callbackPreferences
        });
      }
    } catch (error) {
      console.error('Error fetching company:', error);
    }
  }, [user?.id, user?.companyId]);

  useEffect(() => {
    if (user?.companyId) {
      fetchCompany();
    }
  }, [fetchCompany]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = company ? '/api/company' : '/api/company';
      const method = company ? 'PUT' : 'POST';
      
      const payload = company 
        ? { userId: user?.id, companyId: company.id, updates: formData }
        : { userId: user?.id, ...formData };

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        if (!company) {
          setCompany(data.company);
        }
        alert(company ? 'Company updated successfully!' : 'Company created successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error saving company:', error);
      alert('Error saving company. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addFAQ = () => {
    setFormData(prev => ({
      ...prev,
      faqs: [...prev.faqs, { id: Date.now().toString(), question: '', answer: '', category: '' }]
    }));
  };

  const updateFAQ = (index: number, field: keyof FAQ, value: string) => {
    setFormData(prev => ({
      ...prev,
      faqs: prev.faqs.map((faq, i) => 
        i === index ? { ...faq, [field]: value } : faq
      )
    }));
  };

  const removeFAQ = (index: number) => {
    setFormData(prev => ({
      ...prev,
      faqs: prev.faqs.filter((_, i) => i !== index)
    }));
  };

  const addPolicy = () => {
    setFormData(prev => ({
      ...prev,
      policies: [...prev.policies, { id: Date.now().toString(), title: '', content: '', category: '' }]
    }));
  };

  const updatePolicy = (index: number, field: keyof Policy, value: string) => {
    setFormData(prev => ({
      ...prev,
      policies: prev.policies.map((policy, i) => 
        i === index ? { ...policy, [field]: value } : policy
      )
    }));
  };

  const removePolicy = (index: number) => {
    setFormData(prev => ({
      ...prev,
      policies: prev.policies.filter((_, i) => i !== index)
    }));
  };

  const updateBusinessHours = (day: keyof BusinessHours, field: keyof TimeRange, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [day]: {
          ...prev.businessHours[day],
          [field]: value
        }
      }
    }));
  };

  if (!user) {
    return <div>Please sign in to continue.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {company ? 'Edit Company' : 'Setup Company'}
          </h1>
          <p className="text-gray-600">
            {company 
              ? 'Update your company information and AI assistant configuration'
              : 'Configure your company information to get started with AI chat assistance'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Essential company details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Company Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="industry">Industry *</Label>
                  <Select 
                    value={formData.industry} 
                    onValueChange={(value) => setFormData({...formData, industry: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="website">Website *</Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://example.com"
                  value={formData.website}
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Company Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of your company and services..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={4}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>How customers can reach you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactEmail">Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactInfo.email}
                    onChange={(e) => setFormData({
                      ...formData, 
                      contactInfo: {...formData.contactInfo, email: e.target.value}
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="contactPhone">Phone</Label>
                  <Input
                    id="contactPhone"
                    type="tel"
                    value={formData.contactInfo.phone}
                    onChange={(e) => setFormData({
                      ...formData, 
                      contactInfo: {...formData.contactInfo, phone: e.target.value}
                    })}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.contactInfo.address}
                  onChange={(e) => setFormData({
                    ...formData, 
                    contactInfo: {...formData.contactInfo, address: e.target.value}
                  })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.contactInfo.city}
                    onChange={(e) => setFormData({
                      ...formData, 
                      contactInfo: {...formData.contactInfo, city: e.target.value}
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.contactInfo.state}
                    onChange={(e) => setFormData({
                      ...formData, 
                      contactInfo: {...formData.contactInfo, state: e.target.value}
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="zipCode">ZIP Code</Label>
                  <Input
                    id="zipCode"
                    value={formData.contactInfo.zipCode}
                    onChange={(e) => setFormData({
                      ...formData, 
                      contactInfo: {...formData.contactInfo, zipCode: e.target.value}
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Hours */}
          <Card>
            <CardHeader>
              <CardTitle>Business Hours</CardTitle>
              <CardDescription>When your business is open</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(formData.businessHours).map(([day, hours]) => (
                <div key={day} className="flex items-center space-x-4">
                  <div className="w-24">
                    <Label className="capitalize">{day}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={!hours.closed}
                      onChange={(e) => updateBusinessHours(day as keyof BusinessHours, 'closed', !e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-600">Open</span>
                  </div>
                  {!hours.closed && (
                    <>
                      <Input
                        type="time"
                        value={hours.open}
                        onChange={(e) => updateBusinessHours(day as keyof BusinessHours, 'open', e.target.value)}
                        className="w-24"
                      />
                      <span className="text-gray-500">to</span>
                      <Input
                        type="time"
                        value={hours.close}
                        onChange={(e) => updateBusinessHours(day as keyof BusinessHours, 'close', e.target.value)}
                        className="w-24"
                      />
                    </>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* FAQs */}
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
              <CardDescription>Common questions and answers for your AI assistant</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.faqs.map((faq, index) => (
                <div key={faq.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">FAQ #{index + 1}</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeFAQ(index)}
                    >
                      Remove
                    </Button>
                  </div>
                  <div>
                    <Label>Question</Label>
                    <Input
                      value={faq.question}
                      onChange={(e) => updateFAQ(index, 'question', e.target.value)}
                      placeholder="Enter question..."
                    />
                  </div>
                  <div>
                    <Label>Answer</Label>
                    <Textarea
                      value={faq.answer}
                      onChange={(e) => updateFAQ(index, 'answer', e.target.value)}
                      placeholder="Enter answer..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label>Category (optional)</Label>
                    <Input
                      value={faq.category || ''}
                      onChange={(e) => updateFAQ(index, 'category', e.target.value)}
                      placeholder="e.g., Pricing, Support, etc."
                    />
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addFAQ}>
                Add FAQ
              </Button>
            </CardContent>
          </Card>

          {/* Policies */}
          <Card>
            <CardHeader>
              <CardTitle>Company Policies</CardTitle>
              <CardDescription>Important policies and procedures</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.policies.map((policy, index) => (
                <div key={policy.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Policy #{index + 1}</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removePolicy(index)}
                    >
                      Remove
                    </Button>
                  </div>
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={policy.title}
                      onChange={(e) => updatePolicy(index, 'title', e.target.value)}
                      placeholder="Enter policy title..."
                    />
                  </div>
                  <div>
                    <Label>Content</Label>
                    <Textarea
                      value={policy.content}
                      onChange={(e) => updatePolicy(index, 'content', e.target.value)}
                      placeholder="Enter policy content..."
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Input
                      value={policy.category}
                      onChange={(e) => updatePolicy(index, 'category', e.target.value)}
                      placeholder="e.g., Returns, Privacy, etc."
                    />
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addPolicy}>
                Add Policy
              </Button>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline">
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : (company ? 'Update Company' : 'Create Company')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
