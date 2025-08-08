import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

// Check if we're in the browser and if Firebase config is available
const isClient = typeof window !== 'undefined';
const hasFirebaseConfig = process.env.NEXT_PUBLIC_FIREBASE_API_KEY && 
                         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

console.log('Firebase Config Check:', {
  isClient,
  hasFirebaseConfig,
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'SET' : 'NOT SET',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? 'SET' : 'NOT SET'
});

const firebaseConfig = hasFirebaseConfig ? {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
} : null;

console.log('Firebase Config:', {
  hasConfig: !!firebaseConfig,
  projectId: firebaseConfig?.projectId,
  authDomain: firebaseConfig?.authDomain
});

// Initialize Firebase only if config is available and we're on the client
let app: FirebaseApp | null = null;
let db: ReturnType<typeof getFirestore> | null = null;
let storage: ReturnType<typeof getStorage> | null = null;

if (isClient && hasFirebaseConfig && firebaseConfig) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    db = getFirestore(app);
    storage = getStorage(app);
    console.log('✅ Firebase initialized successfully');
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
  }
} else {
  console.warn('⚠️ Firebase not configured. Please set up environment variables.');
}

export { db, storage };

// Billing Tool Database Collections (with bill_ prefix)
export const BILLING_COLLECTIONS = {
  USERS: 'bill_users',
  BUSINESSES: 'bill_businesses',
  PRODUCTS: 'bill_products',
  TAXES: 'bill_taxes',
  INVOICES: 'bill_invoices',
  SALES: 'bill_sales',
  SETTINGS: 'bill_settings',
  PRICE_HISTORY: 'bill_price_history'
};

// User management interfaces
export interface UserData {
  email: string;
  password: string;
  name: string;
  createdAt: Date;
  lastLoginAt: Date;
  updatedAt: Date;
}

export interface AuthUser {
  email: string;
  name: string;
  createdAt: Date;
  lastLoginAt: Date;
  updatedAt: Date;
}

// Business management interfaces
export interface Business {
  id?: string;
  userId: string;
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  phone: string;
  email: string;
  description?: string;
  logo?: string;
  currency: string; // Currency code (e.g., 'INR', 'USD', 'EUR')
  createdAt: Date;
  updatedAt: Date;
}

// Product management interfaces
export interface Product {
  id?: string;
  businessId: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  sku?: string;
  barcode?: string;
  image?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Price history interface
export interface PriceHistory {
  id?: string;
  productId: string;
  oldPrice: number;
  newPrice: number;
  changedAt: Date;
  changedBy: string;
  reason?: string;
}

// Invoice interfaces
export interface InvoiceItem {
  productId?: string | null; // Optional for custom items
  productName: string;
  description?: string; // Description for the item
  quantity: number;
  unitPrice: number;
  total: number;
  isCustom?: boolean; // Flag to identify custom items
}

export interface Invoice {
  id?: string;
  businessId: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  items: InvoiceItem[];
  subtotal: number;
  discountRate: number; // Discount rate as percentage (e.g., 10 for 10%)
  discountAmount: number;
  taxRate: number; // Tax rate as percentage (e.g., 20 for 20%)
  taxAmount: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | 'approved';
  dueDate?: Date;
  paidAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// User Management Functions
export const findUserByEmail = async (email: string) => {
  if (!db) {
    console.warn('Firebase not configured');
    return null;
  }
  
  try {
    const usersRef = collection(db, BILLING_COLLECTIONS.USERS);
    const q = query(usersRef, where('email', '==', email.toLowerCase()));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const userDoc = querySnapshot.docs[0];
    return {
      id: userDoc.id,
      data: () => userDoc.data(),
      ref: userDoc.ref
    };
  } catch (error) {
    console.error('Error finding user:', error);
    throw error;
  }
};

export const createUser = async (email: string, password: string, name: string): Promise<AuthUser> => {
  if (!db) {
    console.warn('Firebase not configured');
    throw new Error('Firebase not configured');
  }

  try {
    // Check if user already exists
    const existingUserQuery = query(
      collection(db, BILLING_COLLECTIONS.USERS),
      where('email', '==', email.toLowerCase())
    );
    const existingUserSnapshot = await getDocs(existingUserQuery);

    if (!existingUserSnapshot.empty) {
      throw new Error('User with this email already exists');
    }

    // Create user document in Firestore
    const userData: Omit<UserData, 'createdAt' | 'lastLoginAt' | 'updatedAt'> = {
      email: email.toLowerCase(),
      password: password, // In production, this should be hashed
      name: name.trim(),
    };

    await addDoc(collection(db, BILLING_COLLECTIONS.USERS), {
      ...userData,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Return user data without password
    return {
      email: userData.email,
      name: userData.name,
      createdAt: new Date(),
      lastLoginAt: new Date(),
      updatedAt: new Date(),
    };
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

// Authentication Functions
export const signInUser = async (email: string, password: string): Promise<AuthUser> => {
  if (!db) {
    console.warn('Firebase not configured');
    throw new Error('Firebase not configured. Please set up environment variables.');
  }

  try {
    // Query for user with provided email
    const userQuery = query(
      collection(db, BILLING_COLLECTIONS.USERS),
      where('email', '==', email.toLowerCase())
    );
    const userSnapshot = await getDocs(userQuery);

    if (userSnapshot.empty) {
      throw new Error('Invalid email or password');
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data() as UserData;

    // Check password
    if (userData.password !== password) {
      throw new Error('Invalid email or password');
    }

    // Update last login time
    await updateDoc(doc(db, BILLING_COLLECTIONS.USERS, userSnapshot.docs[0].id), {
      lastLoginAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Return user data without password
    const authUser: AuthUser = {
      email: userData.email,
      name: userData.name,
      createdAt: userData.createdAt,
      lastLoginAt: new Date(),
      updatedAt: new Date(),
    };
    return authUser;
  } catch (error) {
    console.error('Error signing in user:', error);
    throw error;
  }
};

export const signUpUser = async (email: string, password: string, name: string): Promise<AuthUser> => {
  return createUser(email, password, name);
};

export const signOutUser = async (): Promise<void> => {
  // For custom auth, we just clear localStorage
  if (typeof window !== 'undefined') {
    localStorage.removeItem('billingtool_user');
  }
};

// Local storage management for session
export const storeUserSession = (user: AuthUser) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('billingtool_user', JSON.stringify({
      ...user,
      authenticated: true,
      authenticatedAt: new Date().toISOString()
    }));
  }
};

export const getStoredUser = (): AuthUser | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const stored = localStorage.getItem('billingtool_user');
    if (!stored) {
      return null;
    }

    const parsedData = JSON.parse(stored);
    if (!parsedData.authenticated) {
      return null;
    }

    return parsedData;
  } catch (error) {
    console.error('Error getting stored user:', error);
    return null;
  }
};

export const clearUserSession = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('billingtool_user');
  }
};

// Store Management Functions
export const createBusiness = async (businessData: Omit<Business, 'id' | 'createdAt' | 'updatedAt'>): Promise<Business> => {
  if (!db) {
    throw new Error('Firebase not configured');
  }

  try {
    const docRef = await addDoc(collection(db, BILLING_COLLECTIONS.BUSINESSES), {
      ...businessData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      id: docRef.id,
      ...businessData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } catch (error) {
    console.error('Error creating business:', error);
    throw error;
  }
};

export const getUserBusinesses = async (userId: string): Promise<Business[]> => {
  if (!db) {
    throw new Error('Firebase not configured');
  }

  try {
    const businessesRef = collection(db, BILLING_COLLECTIONS.BUSINESSES);
    // TODO: Re-enable orderBy once the composite index is created
    // const q = query(businessesRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const q = query(businessesRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    const businesses = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Business[];

    // Sort on client side until index is created
    return businesses.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('Error getting user businesses:', error);
    throw error;
  }
};

export const getBusiness = async (businessId: string): Promise<Business | null> => {
  if (!db) {
    throw new Error('Firebase not configured');
  }

  try {
    const businessDoc = await getDocs(query(collection(db, BILLING_COLLECTIONS.BUSINESSES), where('__name__', '==', businessId)));
    
    if (businessDoc.empty) {
      return null;
    }

    const businessData = businessDoc.docs[0].data();
    return {
      id: businessDoc.docs[0].id,
      ...businessData,
      createdAt: businessData.createdAt?.toDate() || new Date(),
      updatedAt: businessData.updatedAt?.toDate() || new Date(),
    } as Business;
  } catch (error) {
    console.error('Error getting business:', error);
    throw error;
  }
};

export const updateBusiness = async (businessId: string, updates: Partial<Business>): Promise<void> => {
  if (!db) {
    throw new Error('Firebase not configured');
  }

  try {
    const businessRef = doc(db, BILLING_COLLECTIONS.BUSINESSES, businessId);
    await updateDoc(businessRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating business:', error);
    throw error;
  }
};

// Product Management Functions
export const createProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> => {
  if (!db) {
    throw new Error('Firebase not configured');
  }

  try {
    const docRef = await addDoc(collection(db, BILLING_COLLECTIONS.PRODUCTS), {
      ...productData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      id: docRef.id,
      ...productData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

export const getBusinessProducts = async (businessId: string): Promise<Product[]> => {
  if (!db) {
    throw new Error('Firebase not configured');
  }

  try {
    const productsRef = collection(db, BILLING_COLLECTIONS.PRODUCTS);
    // TODO: Re-enable orderBy once the composite index is created
    // const q = query(productsRef, where('businessId', '==', businessId), orderBy('createdAt', 'desc'));
    const q = query(productsRef, where('businessId', '==', businessId));
    const querySnapshot = await getDocs(q);

    const products = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Product[];

    // Sort on client side until index is created
    return products.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('Error getting business products:', error);
    throw error;
  }
};

export const updateProductPrice = async (productId: string, newPrice: number, userId: string, reason?: string): Promise<void> => {
  if (!db) {
    throw new Error('Firebase not configured');
  }

  try {
    // Get current product
    const productRef = doc(db, BILLING_COLLECTIONS.PRODUCTS, productId);
    const productDoc = await getDocs(query(collection(db, BILLING_COLLECTIONS.PRODUCTS), where('__name__', '==', productId)));
    
    if (productDoc.empty) {
      throw new Error('Product not found');
    }

    const currentProduct = productDoc.docs[0].data() as Product;
    const oldPrice = currentProduct.price;

    // Update product price
    await updateDoc(productRef, {
      price: newPrice,
      updatedAt: serverTimestamp(),
    });

    // Record price history
    await addDoc(collection(db, BILLING_COLLECTIONS.PRICE_HISTORY), {
      productId,
      oldPrice,
      newPrice,
      changedAt: serverTimestamp(),
      changedBy: userId,
      reason: reason || 'Price update',
    });
  } catch (error) {
    console.error('Error updating product price:', error);
    throw error;
  }
};

export const getProductPriceHistory = async (productId: string): Promise<PriceHistory[]> => {
  if (!db) {
    throw new Error('Firebase not configured');
  }

  try {
    const historyRef = collection(db, BILLING_COLLECTIONS.PRICE_HISTORY);
    // TODO: Re-enable orderBy once the composite index is created
    // const q = query(historyRef, where('productId', '==', productId), orderBy('changedAt', 'desc'));
    const q = query(historyRef, where('productId', '==', productId));
    const querySnapshot = await getDocs(q);

    const history = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      changedAt: doc.data().changedAt?.toDate() || new Date(),
    })) as PriceHistory[];

    // Sort on client side until index is created
    return history.sort((a, b) => b.changedAt.getTime() - a.changedAt.getTime());
  } catch (error) {
    console.error('Error getting product price history:', error);
    throw error;
  }
};

// Invoice Management Functions
export const createInvoice = async (invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<Invoice> => {
  if (!db) {
    throw new Error('Firebase not configured');
  }

  try {
    const docRef = await addDoc(collection(db, BILLING_COLLECTIONS.INVOICES), {
      ...invoiceData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      id: docRef.id,
      ...invoiceData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } catch (error) {
    console.error('Error creating invoice:', error);
    throw error;
  }
};

export const getBusinessInvoices = async (businessId: string): Promise<Invoice[]> => {
  if (!db) {
    throw new Error('Firebase not configured');
  }

  try {
    const invoicesRef = collection(db, BILLING_COLLECTIONS.INVOICES);
    // TODO: Re-enable orderBy once the composite index is created
    // const q = query(invoicesRef, where('businessId', '==', businessId), orderBy('createdAt', 'desc'));
    const q = query(invoicesRef, where('businessId', '==', businessId));
    const querySnapshot = await getDocs(q);

    const invoices = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Invoice[];

    // Sort on client side until index is created
    return invoices.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('Error getting business invoices:', error);
    throw error;
  }
};

export const getInvoice = async (invoiceId: string): Promise<Invoice | null> => {
  if (!db) {
    throw new Error('Firebase not configured');
  }

  try {
    const invoiceDoc = await getDocs(query(collection(db, BILLING_COLLECTIONS.INVOICES), where('__name__', '==', invoiceId)));
    
    if (invoiceDoc.empty) {
      return null;
    }

    const invoiceData = invoiceDoc.docs[0].data();
    return {
      id: invoiceDoc.docs[0].id,
      ...invoiceData,
      createdAt: invoiceData.createdAt?.toDate() || new Date(),
      updatedAt: invoiceData.updatedAt?.toDate() || new Date(),
    } as Invoice;
  } catch (error) {
    console.error('Error getting invoice:', error);
    throw error;
  }
};

export const getUserInvoices = async (userEmail: string): Promise<Invoice[]> => {
  if (!db) {
    throw new Error('Firebase not configured');
  }

  try {
    // First get all businesses for the user
    const businessesRef = collection(db, BILLING_COLLECTIONS.BUSINESSES);
    const businessesQuery = query(businessesRef, where('userId', '==', userEmail));
    const businessesSnapshot = await getDocs(businessesQuery);
    
    const businessIds = businessesSnapshot.docs.map(doc => doc.id);
    
    if (businessIds.length === 0) {
      return [];
    }

    // Get all invoices for all businesses
    const invoicesRef = collection(db, BILLING_COLLECTIONS.INVOICES);
    const invoicesQuery = query(invoicesRef, where('businessId', 'in', businessIds));
    const invoicesSnapshot = await getDocs(invoicesQuery);

    const invoices = invoicesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Invoice[];

    // Sort on client side until index is created
    return invoices.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('Error getting user invoices:', error);
    throw error;
  }
};

export const updateInvoiceStatus = async (invoiceId: string, status: Invoice['status']): Promise<void> => {
  if (!db) {
    throw new Error('Firebase not configured');
  }

  try {
    const invoiceRef = doc(db, BILLING_COLLECTIONS.INVOICES, invoiceId);
    const updates: Partial<Invoice> = {
      status,
      updatedAt: new Date(),
    };

    if (status === 'paid') {
      updates.paidAt = new Date();
    }

    await updateDoc(invoiceRef, updates);
  } catch (error) {
    console.error('Error updating invoice status:', error);
    throw error;
  }
};

export const updateInvoice = async (invoiceId: string, updates: Partial<Invoice>): Promise<void> => {
  if (!db) {
    throw new Error('Firebase not configured');
  }

  try {
    const invoiceRef = doc(db, BILLING_COLLECTIONS.INVOICES, invoiceId);
    const updateData = {
      ...updates,
      updatedAt: new Date(),
    };

    await updateDoc(invoiceRef, updateData);
  } catch (error) {
    console.error('Error updating invoice:', error);
    throw error;
  }
};

// Legacy exports for compatibility
export const auth = null;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const onAuthStateChange = (_callback: (user: AuthUser | null) => void) => {
  // This is a placeholder for future auth state change implementation
  // For now, we're using localStorage-based auth
};

// Image upload utilities
export const uploadImage = async (file: File, path: string): Promise<string> => {
  if (!storage) {
    throw new Error('Firebase Storage not configured');
  }

  try {
    // Create a reference to the file location
    const storageRef = ref(storage, path);
    
    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

export const deleteImage = async (path: string): Promise<void> => {
  if (!storage) {
    throw new Error('Firebase Storage not configured');
  }

  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};

export const uploadBusinessLogo = async (file: File, businessId: string): Promise<string> => {
  const path = `business-logos/${businessId}/${Date.now()}-${file.name}`;
  return uploadImage(file, path);
}; 