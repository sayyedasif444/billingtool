"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { dbApi, Quotation, Invoice, Client, Project, Expense } from "@/lib/firebase/db";
import { useCompany } from "@/contexts/CompanyContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { 
  LayoutDashboard, 
  FileCheck2, 
  Receipt, 
  TrendingUp, 
  Users, 
  Plus, 
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  ChevronRight,
  Wallet,
  TrendingDown
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
  const { activeCompany } = useCompany();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    quotations: [] as Quotation[],
    invoices: [] as Invoice[],
    clients: [] as Client[],
    projects: [] as Project[],
    expenses: [] as Expense[]
  });

  const [stats, setStats] = useState({
    totalEarnings: 0,
    outstandingValue: 0,
    activeProjects: 0,
    totalClients: 0,
    totalExpenses: 0,
    netProfit: 0
  });

  useEffect(() => {
    async function loadStats() {
      if (!activeCompany) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [qData, iData, cData, pData, eData] = await Promise.all([
          dbApi.getQuotations(activeCompany.id!),
          dbApi.getInvoices(activeCompany.id!),
          dbApi.getClients(activeCompany.id!),
          dbApi.getProjects(activeCompany.id!),
          dbApi.getExpenses(activeCompany.id!)
        ]);

        const quotations = qData as Quotation[];
        const invoices = iData as Invoice[];
        const clients = cData as Client[];
        const projects = pData as Project[];
        const expenses = eData as Expense[];

        setData({ quotations, invoices, clients, projects, expenses });

        const totalEarnings = invoices
          .filter(i => i.status === 'paid')
          .reduce((sum, i) => sum + i.amount, 0);

        const outstandingValue = invoices
          .filter(i => i.status !== 'paid')
          .reduce((sum, i) => sum + i.amount, 0);

        const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

        setStats({
          totalEarnings,
          outstandingValue,
          activeProjects: projects.length,
          totalClients: clients.length,
          totalExpenses,
          netProfit: totalEarnings - totalExpenses
        });
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [activeCompany]);

  const getCurrencySymbol = (code: string = 'INR') => {
    const symbols: Record<string, string> = { 'USD': '$', 'INR': '₹', 'EUR': '€', 'GBP': '£' };
    return symbols[code] || code;
  };

  if (!activeCompany) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-8 text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-6 border border-primary/20 shadow-2xl shadow-primary/10">
          <LayoutDashboard className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Welcome to Your Billing Tool</h2>
        <p className="text-muted-foreground max-w-md mx-auto mb-8">
          To get started with tracking your business finances, please set up your company profile first.
        </p>
        <Link href="/company">
          <Button size="lg" className="px-8 py-6 text-lg rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
            Set Up Your Company
          </Button>
        </Link>
      </div>
    );
  }

  const recentActivity = [...data.quotations, ...data.invoices]
    .sort((a: any, b: any) => {
      const dateA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const dateB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return dateB - dateA;
    })
    .slice(0, 5);

  return (
    <div className="p-8 w-full space-y-10 animate-in fade-in duration-700 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
              <LayoutDashboard className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Business Overview</h1>
          </div>
          <p className="text-muted-foreground flex items-center gap-2">
            <Briefcase className="h-4 w-4" /> Real-time tracking for <span className="text-white font-medium">{activeCompany.name}</span>
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link href="/quotations/new">
            <Button variant="outline" className="rounded-xl border-white/10 hover:bg-white/5 transition-all">
              <Plus className="h-4 w-4 mr-2" /> Quotation
            </Button>
          </Link>
          <Link href="/invoices/new">
            <Button className="rounded-xl shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4 mr-2" /> New Invoice
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Net Profit" 
          value={stats.netProfit} 
          icon={<TrendingUp className="h-5 w-5" />} 
          color="emerald" 
          currency={getCurrencySymbol()}
          trend="Realized Profit"
        />
        <StatCard 
          title="Expenses" 
          value={stats.totalExpenses} 
          icon={<TrendingDown className="h-5 w-5" />} 
          color="red" 
          currency={getCurrencySymbol()}
          trend="Business Costs"
        />
        <StatCard 
          title="Outstanding" 
          value={stats.outstandingValue} 
          icon={<Clock className="h-5 w-5" />} 
          color="amber" 
          currency={getCurrencySymbol()}
          trend="Unpaid Invoices"
        />
        <StatCard 
          title="Active Projects" 
          value={stats.activeProjects} 
          icon={<Briefcase className="h-5 w-5" />} 
          color="indigo" 
          trend="Running Jobs"
        />
      </div>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-white/5 bg-white/5 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Recent Activity
              </CardTitle>
              <Link href="/ledger">
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-white">
                  View Ledger <ArrowUpRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-sm italic">
                  No recent activity found. Start by creating a quotation!
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {recentActivity.map((item: any, idx) => (
                    <div key={idx} className="flex items-center justify-between py-4 group hover:bg-white/5 transition-colors rounded-lg px-2 -mx-2">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "p-2 rounded-xl border",
                          item.quotationNumber ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                        )}>
                          {item.quotationNumber ? <FileCheck2 className="h-5 w-5" /> : <Receipt className="h-5 w-5" />}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white group-hover:text-primary transition-colors">
                            {item.title || item.invoiceNumber}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            {item.quotationNumber ? 'Quotation' : 'Invoice'} • {new Date(item.date || item.createdAt?.seconds * 1000).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-white">
                          {getCurrencySymbol(item.currency)} {(item.totalAmount || item.amount).toLocaleString()}
                        </div>
                        <div className={cn(
                          "text-[10px] font-bold uppercase tracking-wider",
                          item.status === 'paid' || item.status === 'completed' ? "text-emerald-500" : "text-amber-500"
                        )}>
                          {item.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Project Progress Tracker */}
          <Card className="border-white/5 bg-white/5 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                Project Pulse
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {data.projects.slice(0, 3).map(p => {
                const pQuotes = data.quotations.filter(q => q.projectId === p.id);
                const total = pQuotes.reduce((sum, q) => sum + q.totalAmount, 0);
                const billed = data.invoices
                  .filter(i => i.projectId === p.id && i.status === 'paid')
                  .reduce((sum, i) => sum + i.amount, 0);
                const progress = total > 0 ? Math.min(Math.round((billed / total) * 100), 100) : 0;

                return (
                  <div key={p.id} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <div>
                        <div className="text-sm font-bold text-white">{p.name}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Progress: {progress}%</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-400">Billed: {getCurrencySymbol()} {billed.toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-1000"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {data.projects.length === 0 && (
                <div className="py-6 text-center text-xs text-muted-foreground italic">No projects added yet.</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Quick Actions & Status */}
        <div className="space-y-6">
          <Card className="border-white/5 bg-primary/5 border-primary/10">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <QuickActionButton 
                href="/clients/new" 
                label="Add New Client" 
                icon={<Users className="h-4 w-4" />} 
                color="primary"
              />
              <QuickActionButton 
                href="/quotations/new" 
                label="Create Quotation" 
                icon={<FileCheck2 className="h-4 w-4" />} 
                color="indigo"
              />
              <QuickActionButton 
                href="/invoices/new" 
                label="Generate Invoice" 
                icon={<Receipt className="h-4 w-4" />} 
                color="emerald"
              />
              <QuickActionButton 
                href="/ledger" 
                label="Audit Ledger" 
                icon={<LayoutDashboard className="h-4 w-4" />} 
                color="slate"
              />
            </CardContent>
          </Card>

          <Card className="border-white/5 bg-white/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Health Check</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <HealthItem 
                label="Company Profile" 
                status={activeCompany.bankDetails ? 'complete' : 'pending'} 
                desc={activeCompany.bankDetails ? 'Ready for billing' : 'Missing bank details'}
              />
              <HealthItem 
                label="Invoicing Pipeline" 
                status={data.invoices.some(i => i.status === 'sent') ? 'active' : 'idle'} 
                desc={data.invoices.some(i => i.status === 'sent') ? 'Transactions pending' : 'No active invoices'}
              />
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, currency, trend }: any) {
  const colors: any = {
    primary: "from-primary/10 to-transparent border-primary/20 text-primary",
    emerald: "from-emerald-500/10 to-transparent border-emerald-500/20 text-emerald-500",
    amber: "from-amber-500/10 to-transparent border-amber-500/20 text-amber-500",
    indigo: "from-indigo-500/10 to-transparent border-indigo-500/20 text-indigo-400"
  };

  return (
    <Card className={cn("bg-gradient-to-br transition-all duration-300 hover:scale-[1.02]", colors[color])}>
      <CardHeader className="pb-2">
        <CardTitle className="text-[10px] uppercase tracking-widest font-bold flex items-center justify-between">
          {title}
          <div className="p-1.5 bg-black/10 rounded-lg border border-white/5">{icon}</div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-black text-white">
          {currency}{value.toLocaleString()}
        </div>
        <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
          {trend}
        </p>
      </CardContent>
    </Card>
  );
}

function QuickActionButton({ href, label, icon, color }: any) {
  return (
    <Link href={href} className="block">
      <div className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5 hover:bg-primary/10 hover:border-primary/30 transition-all group">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/5 rounded-lg group-hover:bg-primary/20 transition-colors">
            {icon}
          </div>
          <span className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">{label}</span>
        </div>
        <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-primary transition-all group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

function HealthItem({ label, status, desc }: any) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-black/20 border border-white/5">
      {status === 'complete' || status === 'active' ? (
        <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
      ) : status === 'pending' ? (
        <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
      ) : (
        <Clock className="h-4 w-4 text-slate-500 mt-0.5" />
      )}
      <div>
        <div className="text-xs font-bold text-white">{label}</div>
        <div className="text-[10px] text-slate-400">{desc}</div>
      </div>
    </div>
  );
}
