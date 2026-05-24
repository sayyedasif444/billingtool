"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useCompany } from "@/contexts/CompanyContext";
import { 
  LayoutDashboard, 
  Users, 
  FileCheck2, 
  Receipt,
  FileText,
  Briefcase,
  LayoutList,
  Building2,
  Wallet,
  X
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Company Profile", href: "/company", icon: Building2 },
  { name: "Clients", href: "/clients", icon: Users },
  { name: "Projects", href: "/projects", icon: Briefcase },
  { name: "Master Ledger", href: "/ledger", icon: LayoutList },
  { name: "Expenses", href: "/expenses", icon: Wallet },
  { name: "Templates", href: "/templates", icon: FileText },
  { name: "Quotations", href: "/quotations", icon: FileCheck2 },
  { name: "Invoices", href: "/invoices", icon: Receipt },
];

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { companies, activeCompany, setActiveCompany } = useCompany();

  return (
    <div className="flex h-screen w-64 flex-col glass border-r border-white/5 bg-background/80 print:hidden relative">
      <div className="flex flex-col justify-center h-20 px-6 border-b border-white/5 space-y-2 relative">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Freelancer Pro
          </h1>
          {onClose && (
            <button onClick={onClose} className="lg:hidden p-1 text-slate-400 hover:text-white transition-colors">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        {companies.length > 0 && (
          <select 
            value={activeCompany?.id || ""}
            onChange={(e) => {
              const comp = companies.find(c => c.id === e.target.value);
              if (comp) setActiveCompany(comp);
            }}
            className="text-xs bg-black/20 border border-white/10 rounded px-2 py-1 text-slate-300 focus:outline-none focus:ring-1 focus:ring-primary w-full"
          >
            {companies.map(c => (
              <option key={c.id} value={c.id} className="bg-slate-900">{c.name || "Unnamed Company"}</option>
            ))}
          </select>
        )}
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary shadow-sm shadow-primary/5"
                  : "text-muted-foreground hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon
                className={cn(
                  "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-white"
                )}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
