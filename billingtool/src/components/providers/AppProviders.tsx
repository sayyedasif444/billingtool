"use client";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { CompanyProvider } from "@/contexts/CompanyContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isAuthRoute = pathname === "/login" || pathname === "/register" || pathname === "/forgot-password";
  const isPrintRoute = pathname === "/print";
  const isPublicRoute = pathname.startsWith("/public");

  useEffect(() => {
    if (!loading) {
      if (!user && !isAuthRoute && !isPrintRoute && !isPublicRoute) {
        router.push("/login");
      } else if (user && isAuthRoute) {
        router.push("/");
      }
    }
  }, [user, loading, router, isAuthRoute, isPrintRoute, isPublicRoute]);

  if (loading && !isPrintRoute && !isPublicRoute) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background z-[9999] w-full h-full">
        <div className="relative flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500">
          {/* Brand Logo / Text */}
          <div className="relative">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] bg-clip-text text-transparent animate-pulse-slow">
              FreelancerPro
            </h1>
            <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent rounded-full blur-[2px] opacity-50" />
          </div>

          {/* Refined Loader */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
              <div className="w-2 h-2 rounded-full bg-accent animate-bounce [animation-delay:-0.15s]" />
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
            </div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-medium animate-pulse">
              Initializing
            </p>
          </div>
        </div>
        
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/10 rounded-full blur-[100px] -z-10" />
      </div>
    );
  }

  if (!user && !isAuthRoute && !isPublicRoute) return null; // Wait for redirect
  if (user && isAuthRoute) return null;

  return <>{children}</>;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPrintRoute = pathname === "/print";
  const isPublicRoute = pathname.startsWith("/public");

  if (isPrintRoute || isPublicRoute) {
    return <>{children}</>;
  }

  return (
    <AuthProvider>
      <CompanyProvider>
        <AuthGuard>
          {children}
        </AuthGuard>
      </CompanyProvider>
    </AuthProvider>
  );
}
