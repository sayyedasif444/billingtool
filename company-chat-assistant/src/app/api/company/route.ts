import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { generateApiToken, extractDomain, validateUrl } from '@/lib/utils';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  addDoc
} from 'firebase/firestore';
import { Company, User } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { 
      userId,
      name,
      description,
      industry,
      website,
      logo,
      faqs,
      policies,
      businessHours,
      contactInfo,
      callbackPreferences
    } = await request.json();

    if (!userId || !name || !description || !industry || !website) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate URL format
    if (!validateUrl(website)) {
      return NextResponse.json(
        { error: 'Invalid website URL' },
        { status: 400 }
      );
    }

    // Check if user exists and has permission
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = userDoc.data() as User;
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Generate unique API token
    const apiToken = generateApiToken();
    
    // Extract domain from website
    const domain = extractDomain(website);

    // Create company
    const companyData: Omit<Company, 'id'> = {
      name,
      description,
      industry,
      website,
      logo: logo || '',
      faqs: faqs || [],
      policies: policies || [],
      businessHours: businessHours || {
        monday: { open: '09:00', close: '17:00', closed: false },
        tuesday: { open: '09:00', close: '17:00', closed: false },
        wednesday: { open: '09:00', close: '17:00', closed: false },
        thursday: { open: '09:00', close: '17:00', closed: false },
        friday: { open: '09:00', close: '17:00', closed: false },
        saturday: { open: '10:00', close: '15:00', closed: false },
        sunday: { open: '00:00', close: '00:00', closed: true }
      },
      contactInfo: contactInfo || {
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      },
      callbackPreferences: callbackPreferences || {
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
      },
      apiToken,
      allowedDomains: [domain],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const companyRef = await addDoc(collection(db, 'companies'), companyData);
    const company = { id: companyRef.id, ...companyData };

    // Update user with company ID
    await setDoc(doc(db, 'users', userId), {
      ...user,
      companyId: companyRef.id,
      updatedAt: new Date()
    });

    return NextResponse.json({
      success: true,
      company,
      message: 'Company created successfully'
    });

  } catch (error) {
    console.error('Company creation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const companyId = searchParams.get('companyId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing user ID' },
        { status: 400 }
      );
    }

    // Check if user exists
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = userDoc.data() as User;

    if (companyId) {
      // Get specific company
      const companyDoc = await getDoc(doc(db, 'companies', companyId));
      if (!companyDoc.exists()) {
        return NextResponse.json(
          { error: 'Company not found' },
          { status: 404 }
        );
      }

      const company = companyDoc.data() as Company;
      
      // Verify user has access to company
      if (user.companyId !== companyId && user.role !== 'admin') {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }

      return NextResponse.json({ company });
    } else {
      // Get user's company
      if (!user.companyId) {
        return NextResponse.json(
          { error: 'User not associated with any company' },
          { status: 404 }
        );
      }

      const companyDoc = await getDoc(doc(db, 'companies', user.companyId));
      if (!companyDoc.exists()) {
        return NextResponse.json(
          { error: 'Company not found' },
          { status: 404 }
        );
      }

      const company = companyDoc.data() as Company;
      return NextResponse.json({ company });
    }

  } catch (error) {
    console.error('Company retrieval API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { 
      userId,
      companyId,
      updates
    } = await request.json();

    if (!userId || !companyId || !updates) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user exists and has permission
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = userDoc.data() as User;
    if (user.companyId !== companyId && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get company
    const companyDoc = await getDoc(doc(db, 'companies', companyId));
    if (!companyDoc.exists()) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    const company = companyDoc.data() as Company;

    // Update company
    const updatedCompany = {
      ...company,
      ...updates,
      updatedAt: new Date()
    };

    await setDoc(doc(db, 'companies', companyId), updatedCompany);

    return NextResponse.json({
      success: true,
      company: updatedCompany,
      message: 'Company updated successfully'
    });

  } catch (error) {
    console.error('Company update API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
