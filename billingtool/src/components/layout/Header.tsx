"use client";

import { useCompany } from "@/contexts/CompanyContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { 
  Search, 
  Settings, 
  LogOut, 
  UserCircle 
} from "lucide-react";
import Link from "next/link";

export function Header() {
  const { activeCompany } = useCompany();
  const { user, signOut } = useAuth();

  return (
    <header className="h-16 border-b border-white/5 bg-background/50 backdrop-blur-xl flex items-center justify-between px-4 md:px-8 sticky top-0 z-30 print:hidden">
      <div className="flex items-center gap-4">
        {/* Global Search Placeholder */}
        <div className="hidden md:flex items-center relative group">
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input 
            type="text"
            placeholder="Quick search..."
            className="pl-10 pr-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs text-white focus:outline-none focus:ring-2 focus:ring-primary/30 w-64 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Active Company Badge */}
        {activeCompany && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{activeCompany.name}</span>
          </div>
        )}

        <div className="h-4 w-px bg-white/10 mx-2" />

        <div className="flex items-center gap-2">
          <Link href="/settings">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white h-9 w-9">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>

          <div className="group relative">
            <Button variant="ghost" className="gap-2 px-2 hover:bg-white/5 rounded-full">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-white/10">
                <UserCircle className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xs font-medium text-slate-300 hidden lg:block">{user?.email?.split('@')[0]}</span>
            </Button>
            
            {/* Dropdown would go here if needed */}
          </div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={signOut}
            className="text-muted-foreground hover:text-red-400 h-9 w-9 ml-2"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
