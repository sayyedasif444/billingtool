'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Company } from '@/types';

export default function IntegrationPage() {
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchCompany = useCallback(async () => {
    try {
      const response = await fetch(`/api/company?userId=${user?.id}&companyId=${user?.companyId}`);
      if (response.ok) {
        const data = await response.json();
        setCompany(data.company);
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

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const generateEmbedCode = () => {
    if (!company) return '';
    
    return `<!-- Company Chat Assistant -->
<div id="company-chat-widget"></div>
<script>
(function() {
  const script = document.createElement('script');
  script.src = '${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/widget.js';
  script.setAttribute('data-token', '${company.apiToken}');
  script.setAttribute('data-source-url', window.location.href);
  document.head.appendChild(script);
})();
</script>`;
  };

  if (!user) {
    return <div>Please sign in to continue.</div>;
  }

  if (!company) {
    return <div>Loading company information...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Integration
          </h1>
          <p className="text-gray-600">
            Get your API token and integration code to add the chat widget to your website
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* API Token */}
          <Card>
            <CardHeader>
              <CardTitle>API Token</CardTitle>
              <CardDescription>
                Your unique token for authenticating API requests
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-100 p-3 rounded-md">
                <code className="text-sm break-all">{company.apiToken}</code>
              </div>
              <Button 
                onClick={() => copyToClipboard(company.apiToken)}
                variant="outline"
                className="w-full"
              >
                {copied ? 'Copied!' : 'Copy Token'}
              </Button>
                              <p className="text-xs text-gray-500">
                  Keep this token secure. It&apos;s used to authenticate all API requests from your website.
                </p>
            </CardContent>
          </Card>

          {/* Allowed Domains */}
          <Card>
            <CardHeader>
              <CardTitle>Allowed Domains</CardTitle>
              <CardDescription>
                Websites where your chat widget can be used
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {company.allowedDomains.map((domain, index) => (
                  <div key={index} className="bg-gray-100 p-2 rounded-md">
                    <code className="text-sm">{domain}</code>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                Only requests from these domains will be accepted. Contact support to add more domains.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Integration Code */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Integration Code</CardTitle>
            <CardDescription>
              Copy and paste this code into your website&apos;s HTML
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
              <pre className="text-sm">
                <code>{generateEmbedCode()}</code>
              </pre>
            </div>
            <Button 
              onClick={() => copyToClipboard(generateEmbedCode())}
              variant="outline"
              className="w-full"
            >
              {copied ? 'Copied!' : 'Copy Integration Code'}
            </Button>
          </CardContent>
        </Card>

        {/* API Endpoints */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>API Endpoints</CardTitle>
            <CardDescription>
              Available API endpoints for custom integrations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-medium mb-2">Chat API</h4>
              <div className="bg-gray-100 p-3 rounded-md">
                <code className="text-sm">
                  POST {process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/chat
                </code>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Send messages and get AI responses
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">Callback API</h4>
              <div className="bg-gray-100 p-3 rounded-md">
                <code className="text-sm">
                  POST {process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/callback
                </code>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Schedule callback requests
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">Company Info API</h4>
              <div className="bg-gray-100 p-3 rounded-md">
                <code className="text-sm">
                  GET {process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/company
                </code>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Get company information and settings
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Usage Examples */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Usage Examples</CardTitle>
            <CardDescription>
              Examples of how to use the API endpoints
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-medium mb-2">Send a Chat Message</h4>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
                <pre className="text-sm">
                  <code>{`fetch('/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: 'Hello, I have a question',
    token: '${company.apiToken}',
    sourceUrl: window.location.href
  })
})
.then(response => response.json())
.then(data => console.log(data.response));`}</code>
                </pre>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Schedule a Callback</h4>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
                <pre className="text-sm">
                  <code>{`fetch('/api/callback', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    token: '${company.apiToken}',
    sessionId: 'session_id_here',
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    customerPhone: '+1234567890',
    preferredTime: '14:00',
    preferredDate: '2024-01-15',
    message: 'I need help with pricing'
  })
})
.then(response => response.json())
.then(data => console.log(data));`}</code>
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Support */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
            <CardDescription>
              Get support with your integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              If you need help integrating the chat widget or have questions about the API, 
              please contact our support team.
            </p>
            <div className="flex space-x-4">
              <Button variant="outline">
                View Documentation
              </Button>
              <Button variant="outline">
                Contact Support
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
