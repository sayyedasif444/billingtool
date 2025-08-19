import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

export function formatNumber(amount: number): string {
  return amount.toFixed(2);
}

export function getLogoUrl(logoPath?: string): string | null {
  if (!logoPath) return null;
  
  // If it's already a full URL (starts with http/https), return as is
  if (logoPath.startsWith('http://') || logoPath.startsWith('https://')) {
    return logoPath;
  }
  
  // If it's a relative path (starts with /), return as is
  if (logoPath.startsWith('/')) {
    return logoPath;
  }
  
  // If it's a Firebase Storage URL, return as is
  if (logoPath.includes('firebasestorage.googleapis.com')) {
    return logoPath;
  }
  
  // Default: treat as relative path
  return logoPath.startsWith('/') ? logoPath : `/${logoPath}`;
}

// Date formatting - DD/MM/YYYY format
export const formatDate = (date: Date | string) => {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

export const formatDateTime = (date: Date | string) => {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

// Helper function to format dates for HTML date input (YYYY-MM-DD)
export const formatDateForInput = (date: Date | string) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Generate invoice number
export const generateInvoiceNumber = (prefix: string, number: number) => {
  return `${prefix}-${number.toString().padStart(6, '0')}`;
};

// Calculate tax amount
export const calculateTax = (subtotal: number, taxRate: number) => {
  return (subtotal * taxRate) / 100;
};

// Calculate total with tax
export const calculateTotal = (subtotal: number, taxRate: number) => {
  const taxAmount = calculateTax(subtotal, taxRate);
  return subtotal + taxAmount;
};

// Validate email
export const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number
export const isValidPhone = (phone: string) => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

// Generate random ID
export const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};

// Debounce function
export const debounce = <T extends (...args: unknown[]) => void>(func: T, wait: number) => {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Get month name
export const getMonthName = (month: number) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1];
};

// Get current month and year
export const getCurrentMonthYear = () => {
  const now = new Date();
  return {
    month: now.getMonth() + 1,
    year: now.getFullYear()
  };
};

// Calculate percentage change
export const calculatePercentageChange = (oldValue: number, newValue: number) => {
  if (oldValue === 0) return newValue > 0 ? 100 : 0;
  return ((newValue - oldValue) / oldValue) * 100;
};

// Define types for sales data
interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  total: number;
}

interface Sale {
  createdAt: Date | string;
  total?: number;
  items?: SaleItem[];
}

interface GroupedSale {
  date: string;
  sales: Sale[];
  total: number;
}

interface ProductSale {
  productId: string;
  productName: string;
  quantity: number;
  revenue: number;
}

// Group sales by date
export const groupSalesByDate = (sales: Sale[]): GroupedSale[] => {
  const grouped = sales.reduce((acc: Record<string, Sale[]>, sale) => {
    const date = formatDate(sale.createdAt);
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(sale);
    return acc;
  }, {});
  
  return Object.entries(grouped).map(([date, sales]) => ({
    date,
    sales,
    total: sales.reduce((sum, sale) => sum + (sale.total || 0), 0)
  }));
};

// Get top selling products
export const getTopSellingProducts = (sales: Sale[], limit: number = 5): ProductSale[] => {
  const productSales = sales.reduce((acc: Record<string, ProductSale>, sale) => {
    sale.items?.forEach((item: SaleItem) => {
      if (!acc[item.productId]) {
        acc[item.productId] = {
          productId: item.productId,
          productName: item.productName,
          quantity: 0,
          revenue: 0
        };
      }
      acc[item.productId].quantity += item.quantity;
      acc[item.productId].revenue += item.total;
    });
    return acc;
  }, {});

  return Object.values(productSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}; 