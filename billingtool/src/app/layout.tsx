import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Freelancer Pro",
  description: "Advanced billing and quotation tool for freelancers",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Freelancer Pro",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "application-name": "Freelancer Pro",
    "apple-mobile-web-app-title": "Freelancer Pro",
    "msapplication-starturl": "/",
    "msapplication-TileColor": "#020617",
  },
  icons: {
    icon: "/images/logo-main.png",
    shortcut: "/images/logo-main.png",
    apple: "/images/logo-main.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import { AppProviders } from "@/components/providers/AppProviders";
import { MainLayout } from "@/components/layout/MainLayout";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} h-screen overflow-hidden bg-background antialiased flex`} suppressHydrationWarning>
        <AppProviders>
          <MainLayout>
            {children}
          </MainLayout>
          <Script
            id="register-sw"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js').then(function(registration) {
                      console.log('ServiceWorker registration successful');
                    }).catch(function(err) {
                      console.log('ServiceWorker registration failed: ', err);
                    });
                  });
                }
              `,
            }}
          />
        </AppProviders>
      </body>
    </html>
  );
}
