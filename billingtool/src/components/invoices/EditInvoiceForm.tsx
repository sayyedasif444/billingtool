'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { updateInvoice, getBusinessProducts } from '@/lib/firebase';
import type { Invoice, Business, Product } from '@/lib/firebase';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Receipt, User, Package, Plus, Trash2, Save, X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface EditInvoiceFormProps {
  invoice: Invoice;
  business: Business;
  onSuccess?: (invoice: Invoice) => void;
  onCancel?: () => void;
}

interface InvoiceItem {
  productId?: string | null;
  productName: string;
  description?: string; // Description for the item
  quantity: number;
  unitPrice: number;
  total: number;
  isCustom?: boolean;
}

export default function EditInvoiceForm({ invoice, business, onSuccess, onCancel }: EditInvoiceFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  
  const [formData, setFormData] = useState({
    customerName: invoice.customerName,
    customerEmail: invoice.customerEmail || '',
    customerPhone: invoice.customerPhone || '',
    customerAddress: invoice.customerAddress || {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    items: invoice.items,
    discountRate: invoice.discountRate || 0,
    taxRate: invoice.taxRate || 0,
    notes: invoice.notes || ''
  });

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const productsData = await getBusinessProducts(business.id!);
        setProducts(productsData.filter((p: Product) => p.isActive));
      } catch (error) {
        console.error('Error loading products:', error);
      }
    };
    loadProducts();
  }, [business.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.customerName.trim()) {
        throw new Error('Customer name is required');
      }

      if (formData.items.length === 0) {
        throw new Error('At least one item is required');
      }

      const subtotal = formData.items.reduce((sum, item) => sum + item.total, 0);
      const discountAmount = (subtotal * formData.discountRate) / 100;
      const amountAfterDiscount = subtotal - discountAmount;
      const taxAmount = (amountAfterDiscount * formData.taxRate) / 100;
      const total = amountAfterDiscount + taxAmount;

      const updateData = {
        customerName: formData.customerName.trim(),
        customerEmail: formData.customerEmail.trim(),
        customerPhone: formData.customerPhone.trim(),
        customerAddress: formData.customerAddress,
        items: formData.items,
        subtotal,
        discountRate: formData.discountRate,
        discountAmount,
        taxAmount,
        total,
        taxRate: formData.taxRate,
        notes: formData.notes.trim()
      };

      await updateInvoice(invoice.id!, updateData);
      
      const updatedInvoice = {
        ...invoice,
        ...updateData,
        subtotal,
        taxAmount,
        total
      };
      
      onSuccess?.(updatedInvoice);
    } catch (error: unknown) {
      console.error('Error updating invoice:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while updating the invoice');
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      productId: null,
      productName: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
      isCustom: true
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      const item = { ...newItems[index] };

      if (field === 'productId') {
        const product = products.find(p => p.id === value);
        if (product && product.id) {
          item.productId = product.id;
          item.productName = product.name;
          item.description = product.description || '';
          item.unitPrice = product.price;
          item.total = item.quantity * product.price;
          item.isCustom = false;
        }
      } else if (field === 'productName') {
        item.productName = value as string;
        item.isCustom = true;
        item.productId = null;
      } else if (field === 'description') {
        item.description = value as string;
      } else if (field === 'quantity') {
        item.quantity = parseInt(value as string) || 0;
        item.total = item.quantity * item.unitPrice;
      } else if (field === 'unitPrice') {
        item.unitPrice = parseFloat(value as string) || 0;
        item.total = item.quantity * item.unitPrice;
      }

      newItems[index] = item;
      return { ...prev, items: newItems };
    });
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
    } else if (field === 'taxRate' || field === 'discountRate') {
      // Handle taxRate and discountRate as numbers
      setFormData(prev => ({
        ...prev,
        [field]: parseFloat(value) || 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const subtotal = formData.items.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = (subtotal * formData.discountRate) / 100;
  const amountAfterDiscount = subtotal - discountAmount;
  const taxAmount = (amountAfterDiscount * formData.taxRate) / 100;
  const total = amountAfterDiscount + taxAmount;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-4xl mx-auto"
    >
      <Card className="shadow-2xl border-white/20">
        <CardHeader className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto mb-4 p-3 bg-gradient-to-r from-primary to-blue-700 rounded-full w-fit"
          >
            <Receipt className="w-8 h-8 text-white" />
          </motion.div>
          <CardTitle className="text-2xl font-bold text-white">Edit Invoice #{invoice.invoiceNumber}</CardTitle>
          <CardDescription className="text-gray-300">
            Update invoice details and items
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <User className="w-5 h-5" />
                Customer Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerName" className="text-white">Customer Name *</Label>
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => handleInputChange('customerName', e.target.value)}
                    placeholder="Enter customer name"
                    className="mt-1"
                    disabled={loading}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="customerEmail" className="text-white">Email</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                    placeholder="Enter customer email"
                    className="mt-1"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="customerPhone" className="text-white">Phone</Label>
                <Input
                  id="customerPhone"
                  value={formData.customerPhone}
                  onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                  placeholder="Enter customer phone"
                  className="mt-1"
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="customerAddress" className="text-white">Address</Label>
                <Textarea
                  id="customerAddress"
                  value={`${formData.customerAddress.street}, ${formData.customerAddress.city}, ${formData.customerAddress.state} ${formData.customerAddress.zipCode}`}
                  onChange={(e) => {
                    const address = e.target.value;
                    const parts = address.split(',').map(p => p.trim());
                    setFormData(prev => ({
                      ...prev,
                      customerAddress: {
                        street: parts[0] || '',
                        city: parts[1] || '',
                        state: parts[2] || '',
                        zipCode: parts[3] || '',
                        country: parts[4] || 'United States'
                      }
                    }));
                  }}
                  placeholder="Enter customer address"
                  className="mt-1"
                  disabled={loading}
                  rows={2}
                />
              </div>
            </div>

            {/* Invoice Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Invoice Items
                </h3>
                <Button
                  type="button"
                  onClick={addItem}
                  variant="outline"
                  size="sm"
                  disabled={loading}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </div>

              {formData.items.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-white/20 rounded-lg">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">No items added yet</p>
                  <p className="text-sm text-gray-500">Click &quot;Add Item&quot; to start building your invoice</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.items.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-4 border border-white/10 rounded-lg bg-black/20"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                        <div className="md:col-span-2">
                          <Label className="text-white">Product/Item Name</Label>
                          {item.isCustom ? (
                            <Input
                              value={item.productName}
                              onChange={(e) => updateItem(index, 'productName', e.target.value)}
                              placeholder="Enter custom item name"
                              className="mt-1"
                              disabled={loading}
                            />
                          ) : (
                            <select
                              value={item.productId || ''}
                              onChange={(e) => updateItem(index, 'productId', e.target.value)}
                              className="mt-1 w-full px-3 py-2 bg-black/50 border border-white/20 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                              disabled={loading}
                            >
                              <option value="">Select a product</option>
                              {products.map((product) => (
                                <option key={product.id} value={product.id}>
                                  {product.name} - {formatCurrency(product.price, business?.currency)}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                        
                        <div className="md:col-span-2">
                          <Label className="text-white">Description</Label>
                          <Input
                            value={item.description || ''}
                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                            placeholder="Enter item description (optional)"
                            className="mt-1"
                            disabled={loading}
                          />
                        </div>
                        
                        <div>
                          <Label className="text-white">Quantity</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                            className="mt-1"
                            disabled={loading}
                          />
                        </div>
                        
                        <div>
                          <Label className="text-white">Unit Price</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                            className="mt-1"
                            disabled={loading}
                          />
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <Label className="text-white">Total</Label>
                            <div className="mt-1 p-2 bg-gray-800 rounded text-white font-semibold">
                              {formatCurrency(item.total, business?.currency)}
                            </div>
                          </div>
                          <Button
                            type="button"
                            onClick={() => removeItem(index)}
                            variant="outline"
                            size="sm"
                            className="text-red-400 hover:text-red-300"
                            disabled={loading}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Invoice Summary */}
            {formData.items.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-white/10 rounded-lg p-6 bg-black/20"
              >
                <h3 className="text-lg font-semibold text-white mb-4">Invoice Summary</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Subtotal:</span>
                    <span className="text-white">{formatCurrency(subtotal, business?.currency)}</span>
                  </div>
                  
                  {/* Discount Rate Input */}
                  <div className="flex items-center justify-between">
                    <Label htmlFor="discountRate" className="text-gray-300">Discount Rate (%):</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="discountRate"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={formData.discountRate}
                        onChange={(e) => handleInputChange('discountRate', e.target.value)}
                        className="w-20 text-right"
                        disabled={loading}
                      />
                      <span className="text-white">%</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-300">Discount Amount:</span>
                    <span className="text-white">{formatCurrency(discountAmount, business?.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Amount After Discount:</span>
                    <span className="text-white">{formatCurrency(amountAfterDiscount, business?.currency)}</span>
                  </div>
                  
                  {/* Tax Rate Input */}
                  <div className="flex items-center justify-between">
                    <Label htmlFor="taxRate" className="text-gray-300">Tax Rate (%):</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="taxRate"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={formData.taxRate}
                        onChange={(e) => handleInputChange('taxRate', e.target.value)}
                        className="w-20 text-right"
                        disabled={loading}
                      />
                      <span className="text-white">%</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-300">Tax Amount:</span>
                    <span className="text-white">{formatCurrency(taxAmount, business?.currency)}</span>
                  </div>
                  <div className="flex justify-between border-t border-white/10 pt-2">
                    <span className="text-white font-semibold">Total:</span>
                    <span className="text-primary font-bold text-xl">{formatCurrency(total, business?.currency)}</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Notes */}
            <div>
              <Label htmlFor="notes" className="text-white">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Enter any additional notes for the invoice"
                className="mt-1"
                disabled={loading}
                rows={3}
              />
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

            <div className="flex gap-4">
              <Button
                type="submit"
                className="flex-1"
                disabled={loading || formData.items.length === 0}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <LoadingSpinner size="sm" />
                    Updating Invoice...
                  </div>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Update Invoice
                  </>
                )}
              </Button>
              
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={loading}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
} 