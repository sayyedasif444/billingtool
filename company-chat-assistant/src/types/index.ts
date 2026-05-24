export interface Company {
  id: string;
  name: string;
  description: string;
  industry: string;
  website: string;
  logo?: string;
  faqs: FAQ[];
  policies: Policy[];
  businessHours: BusinessHours;
  contactInfo: ContactInfo;
  callbackPreferences: CallbackPreferences;
  apiToken: string;
  allowedDomains: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

export interface Policy {
  id: string;
  title: string;
  content: string;
  category: string;
}

export interface BusinessHours {
  monday: TimeRange;
  tuesday: TimeRange;
  wednesday: TimeRange;
  thursday: TimeRange;
  friday: TimeRange;
  saturday: TimeRange;
  sunday: TimeRange;
}

export interface TimeRange {
  open: string; // HH:MM format
  close: string; // HH:MM format
  closed: boolean;
}

export interface ContactInfo {
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface CallbackPreferences {
  availableDays: string[]; // ['monday', 'tuesday', etc.]
  availableTimeSlots: TimeSlot[];
  contactMethods: string[]; // ['phone', 'email', 'both']
  responseTime: string; // 'within_24h', 'within_48h', 'within_week'
}

export interface TimeSlot {
  day: string;
  startTime: string;
  endTime: string;
}

export interface ChatMessage {
  id: string;
  companyId: string;
  sessionId: string;
  message: string;
  response: string;
  timestamp: Date;
  requiresCallback: boolean;
  callbackScheduled?: boolean;
  callbackDetails?: CallbackRequest;
}

export interface CallbackRequest {
  id: string;
  companyId: string;
  sessionId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  preferredTime: string;
  preferredDate: string;
  message: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  scheduledAt: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export interface ChatSession {
  id: string;
  companyId: string;
  companyToken: string;
  sourceUrl: string;
  userAgent: string;
  ipAddress: string;
  startedAt: Date;
  lastActivity: Date;
  messageCount: number;
  status: 'active' | 'ended' | 'scheduled_callback';
}

export interface User {
  id: string;
  email: string;
  companyId: string;
  role: 'admin' | 'manager' | 'support';
  name: string;
  createdAt: Date;
  lastLogin: Date;
}
