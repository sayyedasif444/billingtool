import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  limit, 
  getDocs 
} from 'firebase/firestore';
import { CallbackRequest } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { 
      token, 
      sessionId, 
      customerName, 
      customerEmail, 
      customerPhone, 
      preferredTime, 
      preferredDate, 
      message 
    } = await request.json();

    if (!token || !sessionId || !customerName || !customerEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get company by token
    const companyQuery = query(
      collection(db, 'companies'),
      where('apiToken', '==', token),
      limit(1)
    );
    
    const companySnapshot = await getDocs(companyQuery);
    if (companySnapshot.empty) {
      return NextResponse.json(
        { error: 'Invalid API token' },
        { status: 401 }
      );
    }

    const companyId = companySnapshot.docs[0].id;

    // Validate session exists
    const sessionDoc = await getDoc(doc(db, 'chatSessions', sessionId));
    if (!sessionDoc.exists()) {
      return NextResponse.json(
        { error: 'Invalid session ID' },
        { status: 400 }
      );
    }

    // Create callback request
    const callbackData: Omit<CallbackRequest, 'id'> = {
      companyId,
      sessionId,
      customerName,
      customerEmail,
      customerPhone: customerPhone || '',
      preferredTime: preferredTime || '',
      preferredDate: preferredDate || '',
      message: message || 'Customer requested callback',
      status: 'pending',
      scheduledAt: new Date(),
      createdAt: new Date()
    };

    const callbackRef = await addDoc(collection(db, 'callbackRequests'), callbackData);

    // Update session status
    await setDoc(doc(db, 'chatSessions', sessionId), {
      status: 'scheduled_callback'
    });

    return NextResponse.json({
      success: true,
      callbackId: callbackRef.id,
      status: 'pending',
      message: 'Callback request submitted successfully'
    });

  } catch (error) {
    console.error('Callback API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const callbackId = searchParams.get('callbackId');

    if (!token) {
      return NextResponse.json(
        { error: 'Missing API token' },
        { status: 400 }
      );
    }

    // Get company by token
    const companyQuery = query(
      collection(db, 'companies'),
      where('apiToken', '==', token),
      limit(1)
    );
    
    const companySnapshot = await getDocs(companyQuery);
    if (companySnapshot.empty) {
      return NextResponse.json(
        { error: 'Invalid API token' },
        { status: 401 }
      );
    }

    const companyId = companySnapshot.docs[0].id;

    if (callbackId) {
      // Get specific callback request
      const callbackDoc = await getDoc(doc(db, 'callbackRequests', callbackId));
      if (!callbackDoc.exists()) {
        return NextResponse.json(
          { error: 'Callback request not found' },
          { status: 404 }
        );
      }

      const callback = callbackDoc.data() as CallbackRequest;
      
      // Verify callback belongs to company
      if (callback.companyId !== companyId) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }

      return NextResponse.json({ callback });
    } else {
      // Get all callback requests for company
      const callbacksQuery = query(
        collection(db, 'callbackRequests'),
        where('companyId', '==', companyId),
        where('status', '==', 'pending')
      );
      
      const callbacksSnapshot = await getDocs(callbacksQuery);
      const callbacks = callbacksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return NextResponse.json({ callbacks });
    }

  } catch (error) {
    console.error('Callback API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { token, callbackId, status, notes } = await request.json();

    if (!token || !callbackId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get company by token
    const companyQuery = query(
      collection(db, 'companies'),
      where('apiToken', '==', token),
      limit(1)
    );
    
    const companySnapshot = await getDocs(companyQuery);
    if (companySnapshot.empty) {
      return NextResponse.json(
        { error: 'Invalid API token' },
        { status: 401 }
      );
    }

    const companyId = companySnapshot.docs[0].id;

    // Get callback request
    const callbackDoc = await getDoc(doc(db, 'callbackRequests', callbackId));
    if (!callbackDoc.exists()) {
      return NextResponse.json(
        { error: 'Callback request not found' },
        { status: 404 }
      );
    }

    const callback = callbackDoc.data() as CallbackRequest;
    
    // Verify callback belongs to company
    if (callback.companyId !== companyId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Update callback status
    await setDoc(doc(db, 'callbackRequests', callbackId), {
      ...callback,
      status,
      notes: notes || callback.notes,
      updatedAt: new Date()
    });

    return NextResponse.json({
      success: true,
      message: 'Callback status updated successfully'
    });

  } catch (error) {
    console.error('Callback update API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
