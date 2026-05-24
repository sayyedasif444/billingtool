"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isAuthRoute = pathname === "/login" || pathname === "/register" || pathname === "/forgot-password";
  const isPrintRoute = pathname === "/print";
  const isPublicRoute = pathname.startsWith("/public");

  // Close sidebar on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  if (isAuthRoute || isPrintRoute || isPublicRoute) {
    return <main className="flex-1 h-screen overflow-auto bg-[#020617]">{children}</main>;
  }

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Desktop: fixed, Mobile: drawer */}
      <div className={`
        fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 lg:relative lg:translate-x-0 print:hidden
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <Sidebar onClose={() => setIsMobileMenuOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Mobile Header Toggle */}
        <div className="lg:hidden flex items-center h-16 px-4 border-b border-white/5 bg-background/80 backdrop-blur-md sticky top-0 z-30 print:hidden">
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)}>
            <Menu className="h-6 w-6" />
          </Button>
          <h1 className="ml-4 text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Freelancer Pro
          </h1>
        </div>

        <Header />
        <main className="flex-1 overflow-y-auto print:overflow-visible print:block print:static">
          {children}
        </main>
      </div>
    </>
  );
}
