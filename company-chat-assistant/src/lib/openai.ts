import OpenAI from 'openai';
import { Company, ChatMessage } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ChatContext {
  company: Company;
  conversationHistory: ChatMessage[];
  currentMessage: string;
}

export async function generateAIResponse(context: ChatContext): Promise<{
  response: string;
  requiresCallback: boolean;
  confidence: number;
}> {
  try {
    // Build the system prompt with company context
    const systemPrompt = buildSystemPrompt(context.company);
    
    // Build conversation history
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...context.conversationHistory.map(msg => ({
        role: 'user' as const,
        content: msg.message
      })),
      ...context.conversationHistory.map(msg => ({
        role: 'assistant' as const,
        content: msg.response
      })),
      { role: 'user' as const, content: context.currentMessage }
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      max_tokens: 500,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content || 'I apologize, but I cannot provide a response at this time.';
    
    // Analyze if callback is needed
    const requiresCallback = analyzeCallbackNeed(context.currentMessage, response);
    
    // Calculate confidence based on response length and content
    const confidence = calculateConfidence(response);

    return {
      response,
      requiresCallback,
      confidence
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    return {
      response: 'I apologize, but I am experiencing technical difficulties. Please try again later or schedule a callback.',
      requiresCallback: true,
      confidence: 0
    };
  }
}

function buildSystemPrompt(company: Company): string {
  return `You are an AI assistant for ${company.name}, a company in the ${company.industry} industry.

Company Description: ${company.description}

Company Website: ${company.website}

Business Hours:
${Object.entries(company.businessHours).map(([day, hours]) => 
  `${day.charAt(0).toUpperCase() + day.slice(1)}: ${hours.closed ? 'Closed' : `${hours.open} - ${hours.close}`}`
).join('\n')}

Contact Information:
- Email: ${company.contactInfo.email}
- Phone: ${company.contactInfo.phone}
- Address: ${company.contactInfo.address}, ${company.contactInfo.city}, ${company.contactInfo.state} ${company.contactInfo.zipCode}

FAQs:
${company.faqs.map(faq => `Q: ${faq.question}\nA: ${faq.answer}`).join('\n\n')}

Policies:
${company.policies.map(policy => `${policy.title}: ${policy.content}`).join('\n\n')}

Instructions:
1. Answer questions based on the company information provided above
2. Be helpful, professional, and accurate
3. If you cannot answer a question with the provided information, suggest scheduling a callback
4. Always represent ${company.name} professionally
5. Keep responses concise but informative
6. If asked about scheduling, pricing, or complex inquiries, offer callback scheduling`;
}

function analyzeCallbackNeed(message: string, response: string): boolean {
  const callbackKeywords = [
    'schedule', 'appointment', 'meeting', 'call back', 'callback',
    'pricing', 'quote', 'estimate', 'custom', 'specific',
    'complex', 'detailed', 'technical', 'support', 'help'
  ];
  
  const messageLower = message.toLowerCase();
  const responseLower = response.toLowerCase();
  
  // Check if user is asking for something that requires callback
  const needsCallback = callbackKeywords.some(keyword => 
    messageLower.includes(keyword)
  );
  
  // Check if AI response suggests callback
  const aiSuggestsCallback = responseLower.includes('callback') || 
                           responseLower.includes('schedule') ||
                           responseLower.includes('contact us');
  
  return needsCallback || aiSuggestsCallback;
}

function calculateConfidence(response: string): number {
  // Simple confidence calculation based on response quality
  let confidence = 0.8; // Base confidence
  
  // Reduce confidence if response is too generic
  if (response.length < 50) confidence -= 0.2;
  if (response.length > 300) confidence += 0.1;
  
  // Cap confidence at 1.0
  return Math.min(confidence, 1.0);
}
