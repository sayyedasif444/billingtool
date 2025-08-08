'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getUserInvoices, getBusiness } from '@/lib/firebase';
import type { Invoice, Business } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import BackgroundPattern from '@/components/ui/BackgroundPattern';
import { Receipt, Search, Filter, Eye, Building2, Calendar, DollarSign } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';

export default function InvoicesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [businesses, setBusinesses] = useState<Record<string, Business>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const loadInvoices = useCallback(async () => {
    try {
      setLoading(true);
      if (!user) {
        throw new Error('User not authenticated');
      }

      const userInvoices = await getUserInvoices(user.email);
      setInvoices(userInvoices);

      // Get business details for each invoice
      const businessIds = [...new Set(userInvoices.map(invoice => invoice.businessId))];
      const businessDetails: Record<string, Business> = {};
      
      for (const businessId of businessIds) {
        const business = await getBusiness(businessId);
        if (business) {
          businessDetails[businessId] = business;
        }
      }
      
      setBusinesses(businessDetails);
    } catch (error) {
      console.error('Error loading invoices:', error);
      setError('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
        return;
      }
      loadInvoices();
    }
  }, [user, authLoading, router, loadInvoices]);

  const handleInvoiceClick = (invoiceId: string) => {
    router.push(`/invoices/${invoiceId}`);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.customerEmail && invoice.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'paid':
        return 'bg-green-900/50 text-green-300';
      case 'sent':
        return 'bg-blue-900/50 text-blue-300';
      case 'overdue':
        return 'bg-red-900/50 text-red-300';
      case 'cancelled':
        return 'bg-gray-900/50 text-gray-300';
      default:
        return 'bg-gray-900/50 text-gray-300';
    }
  };

  // Show loading while auth is being checked or data is loading
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black relative">
        <BackgroundPattern />
        <div className="text-center relative z-10">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-300">Loading invoices...</p>
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
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">All Invoices</h1>
              <p className="text-gray-300">View and manage all your invoices</p>
            </div>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search invoices by number, customer name, or email..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="pl-10 bg-black/50 border-white/20 text-white placeholder-gray-400"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => handleStatusFilter('all')}
                className="border-white/20 text-white hover:bg-white/10"
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'draft' ? 'default' : 'outline'}
                onClick={() => handleStatusFilter('draft')}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Draft
              </Button>
              <Button
                variant={statusFilter === 'approved' ? 'default' : 'outline'}
                onClick={() => handleStatusFilter('approved')}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Approved
              </Button>
              <Button
                variant={statusFilter === 'sent' ? 'default' : 'outline'}
                onClick={() => handleStatusFilter('sent')}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Sent
              </Button>
              <Button
                variant={statusFilter === 'paid' ? 'default' : 'outline'}
                onClick={() => handleStatusFilter('paid')}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Paid
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Invoices List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {error && (
            <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
              {error}
            </div>
          )}

          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-gray-900/50 rounded-full flex items-center justify-center mb-6">
                <Receipt className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {invoices.length === 0 ? 'No Invoices Found' : 'No Invoices Match Your Search'}
              </h3>
              <p className="text-gray-400">
                {invoices.length === 0 
                  ? 'You haven\'t created any invoices yet. Start by creating an invoice for your business.'
                  : 'Try adjusting your search terms or filters.'
                }
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredInvoices.map((invoice, index) => (
                <motion.div
                  key={invoice.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card 
                    className="shadow-lg border-white/20 hover:border-white/40 transition-all duration-200 cursor-pointer hover:shadow-xl"
                    onClick={() => handleInvoiceClick(invoice.id!)}
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-white">
                              Invoice #{invoice.invoiceNumber}
                            </h3>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(invoice.status)}`}>
                              {invoice.status.toUpperCase()}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-gray-300 text-sm">
                            <div className="flex items-center gap-1">
                              <Building2 className="w-4 h-4" />
                              <span>{businesses[invoice.businessId]?.name || 'Unknown Business'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>{invoice.createdAt.toLocaleDateString()}</span>
                            </div>
                          </div>
                          
                          <div className="mt-2">
                            <p className="text-white font-medium">{invoice.customerName}</p>
                            {invoice.customerEmail && (
                              <p className="text-gray-400 text-sm">{invoice.customerEmail}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4 text-green-400" />
                            <span className="text-xl font-bold text-white">
                              {formatCurrency(invoice.total, businesses[invoice.businessId]?.currency || 'INR')}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400 text-sm">
                              {invoice.items.length} item{invoice.items.length !== 1 ? 's' : ''}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-white/20 text-white hover:bg-white/10"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
} 