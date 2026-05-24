import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { generateAIResponse } from '@/lib/openai';
import { extractDomain, validateUrl } from '@/lib/utils';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs 
} from 'firebase/firestore';
import { Company, ChatMessage, ChatSession, CallbackRequest } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { message, token, sourceUrl, sessionId } = await request.json();

    if (!message || !token || !sourceUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate URL format
    if (!validateUrl(sourceUrl)) {
      return NextResponse.json(
        { error: 'Invalid source URL' },
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

    const company = companySnapshot.docs[0].data() as Company;
    const companyId = companySnapshot.docs[0].id;

    // Validate source URL against allowed domains
    const sourceDomain = extractDomain(sourceUrl);
    if (!company.allowedDomains.includes(sourceDomain)) {
      return NextResponse.json(
        { error: 'Unauthorized source domain' },
        { status: 403 }
      );
    }

    // Get or create chat session
    let session: ChatSession;
    if (sessionId) {
      const sessionDoc = await getDoc(doc(db, 'chatSessions', sessionId));
      if (sessionDoc.exists()) {
        session = { id: sessionDoc.id, ...sessionDoc.data() } as ChatSession;
        // Update last activity
        await setDoc(doc(db, 'chatSessions', sessionId), {
          ...session,
          lastActivity: new Date(),
          messageCount: session.messageCount + 1
        });
      } else {
        return NextResponse.json(
          { error: 'Invalid session ID' },
          { status: 400 }
        );
      }
    } else {
      // Create new session
      const newSession: Omit<ChatSession, 'id'> = {
        companyId,
        companyToken: token,
        sourceUrl,
        userAgent: request.headers.get('user-agent') || '',
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
        startedAt: new Date(),
        lastActivity: new Date(),
        messageCount: 1,
        status: 'active'
      };
      
      const sessionRef = await addDoc(collection(db, 'chatSessions'), newSession);
      session = { id: sessionRef.id, ...newSession };
    }

    // Get conversation history
    const messagesQuery = query(
      collection(db, 'chatMessages'),
      where('sessionId', '==', session.id),
      orderBy('timestamp', 'desc'),
      limit(10)
    );
    
    const messagesSnapshot = await getDocs(messagesQuery);
    const conversationHistory = messagesSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage))
      .reverse();

    // Generate AI response
    const aiResponse = await generateAIResponse({
      company,
      conversationHistory,
      currentMessage: message
    });

    // Save the chat message
    const chatMessage: Omit<ChatMessage, 'id'> = {
      companyId,
      sessionId: session.id,
      message,
      response: aiResponse.response,
      timestamp: new Date(),
      requiresCallback: aiResponse.requiresCallback
    };

    const messageRef = await addDoc(collection(db, 'chatMessages'), chatMessage);

    // If callback is needed, create callback request
    let callbackRequest: CallbackRequest | null = null;
    if (aiResponse.requiresCallback) {
      const callbackData: Omit<CallbackRequest, 'id'> = {
        companyId,
        sessionId: session.id,
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        preferredTime: '',
        preferredDate: '',
        message: `Customer requested callback during chat session. Original message: ${message}`,
        status: 'pending',
        scheduledAt: new Date(),
        createdAt: new Date()
      };

      const callbackRef = await addDoc(collection(db, 'callbackRequests'), callbackData);
      callbackRequest = { id: callbackRef.id, ...callbackData };
    }

    return NextResponse.json({
      response: aiResponse.response,
      requiresCallback: aiResponse.requiresCallback,
      confidence: aiResponse.confidence,
      sessionId: session.id,
      messageId: messageRef.id,
      callbackRequest: callbackRequest ? {
        id: callbackRequest.id,
        status: callbackRequest.status
      } : null
    });

  } catch (error) {
    console.error('Chat API error:', error);
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
    const sessionId = searchParams.get('sessionId');

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

    const company = companySnapshot.docs[0].data() as Company;

    if (sessionId) {
      // Get chat history for specific session
      const messagesQuery = query(
        collection(db, 'chatMessages'),
        where('sessionId', '==', sessionId),
        orderBy('timestamp', 'asc')
      );
      
      const messagesSnapshot = await getDocs(messagesQuery);
      const messages = messagesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return NextResponse.json({ messages });
    } else {
      // Return company info for chat initialization
      return NextResponse.json({
        company: {
          name: company.name,
          description: company.description,
          logo: company.logo
        }
      });
    }

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
