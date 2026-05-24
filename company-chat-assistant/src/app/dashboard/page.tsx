'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Company, ChatMessage, CallbackRequest } from '@/types';

export default function DashboardPage() {
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [recentMessages, setRecentMessages] = useState<ChatMessage[]>([]);
  const [pendingCallbacks, setPendingCallbacks] = useState<CallbackRequest[]>([]);
  const [stats, setStats] = useState({
    totalMessages: 0,
    totalSessions: 0,
    pendingCallbacks: 0,
    avgResponseTime: 0
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      // Fetch company info
      const companyResponse = await fetch(`/api/company?userId=${user?.id}&companyId=${user?.companyId}`);
      if (companyResponse.ok) {
        const companyData = await companyResponse.json();
        setCompany(companyData.company);
      }

      // Fetch recent messages
      const messagesResponse = await fetch(`/api/chat?token=${company?.apiToken}&sessionId=recent`);
      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json();
        setRecentMessages(messagesData.messages || []);
      }

      // Fetch pending callbacks
      const callbacksResponse = await fetch(`/api/callback?token=${company?.apiToken}`);
      if (callbacksResponse.ok) {
        const callbacksData = await callbacksResponse.json();
        setPendingCallbacks(callbacksData.callbacks || []);
      }

      // TODO: Fetch actual stats from analytics API
      setStats({
        totalMessages: 150,
        totalSessions: 45,
        pendingCallbacks: pendingCallbacks.length,
        avgResponseTime: 2.3
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  }, [user?.id, user?.companyId, company?.apiToken, pendingCallbacks.length]);

  useEffect(() => {
    if (user?.companyId) {
      fetchDashboardData();
    }
  }, [fetchDashboardData]);

  if (!user) {
    return <div>Please sign in to continue.</div>;
  }

  if (!company) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard
          </h1>
          <p className="text-gray-600">
            Welcome back! Here&apos;s what&apos;s happening with your AI chat assistant.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMessages}</div>
              <p className="text-xs text-muted-foreground">
                All time customer interactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chat Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSessions}</div>
              <p className="text-xs text-muted-foreground">
                Active conversations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Callbacks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingCallbacks}</div>
              <p className="text-xs text-muted-foreground">
                Require your attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgResponseTime}s</div>
              <p className="text-xs text-muted-foreground">
                AI response speed
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Chat Activity</CardTitle>
              <CardDescription>
                Latest customer interactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentMessages.length > 0 ? (
                <div className="space-y-4">
                  {recentMessages.slice(0, 5).map((message) => (
                    <div key={message.id} className="border-l-4 border-blue-500 pl-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            Customer Message
                          </p>
                                    <p className="text-sm text-gray-600 mt-1">
            {message.message.substring(0, 100)}
            {message.message.length > 100 ? '...' : ''}
          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(message.timestamp).toLocaleString()}
                          </p>
                        </div>
                        {message.requiresCallback && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Callback Needed
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No recent chat activity
                </p>
              )}
              <div className="mt-4">
                <Link href="/dashboard/conversations">
                  <Button variant="outline" className="w-full">
                    View All Conversations
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Pending Callbacks */}
          <Card>
            <CardHeader>
              <CardTitle>Pending Callbacks</CardTitle>
              <CardDescription>
                Customer requests requiring follow-up
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingCallbacks.length > 0 ? (
                <div className="space-y-4">
                  {pendingCallbacks.slice(0, 5).map((callback) => (
                    <div key={callback.id} className="border-l-4 border-yellow-500 pl-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {callback.customerName || 'Anonymous'}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {callback.message.substring(0, 100)}
                            {callback.message.length > 100 ? '...' : ''}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            Preferred: {callback.preferredDate} at {callback.preferredTime}
                          </p>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No pending callbacks
                </p>
              )}
              <div className="mt-4">
                <Link href="/dashboard/callbacks">
                  <Button variant="outline" className="w-full">
                    View All Callbacks
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/dashboard/company-setup">
                <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
                  <span className="text-lg font-medium">Company Settings</span>
                  <span className="text-sm text-gray-500">Update company info</span>
                </Button>
              </Link>
              
              <Link href="/dashboard/integration">
                <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
                  <span className="text-lg font-medium">Integration</span>
                  <span className="text-sm text-gray-500">Get API token & code</span>
                </Button>
              </Link>
              
              <Link href="/dashboard/analytics">
                <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
                  <span className="text-lg font-medium">Analytics</span>
                  <span className="text-sm text-gray-500">View detailed reports</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Company Status */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Company Status</CardTitle>
            <CardDescription>
              Current configuration and health
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Configuration</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Company Name:</span>
                    <span className="text-sm font-medium">{company.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Industry:</span>
                    <span className="text-sm font-medium capitalize">{company.industry}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Website:</span>
                    <span className="text-sm font-medium">{company.website}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">FAQs:</span>
                    <span className="text-sm font-medium">{company.faqs.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Policies:</span>
                    <span className="text-sm font-medium">{company.policies.length}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">System Health</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">API Status:</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">AI Service:</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Online
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Last Updated:</span>
                    <span className="text-sm font-medium">
                      {new Date(company.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Allowed Domains:</span>
                    <span className="text-sm font-medium">{company.allowedDomains.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
