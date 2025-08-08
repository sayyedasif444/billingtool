import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import Navbar from "@/components/layout/Navbar";

const dmSans = DM_Sans({ 
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-dm-sans',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://billing.devanddebate.com'),
  title: {
    template: '%s | Dev & Debate Billing Tool',
    default: 'Dev & Debate Billing Tool - Business Management & Invoicing'
  },
  description: 'Streamline your business operations with our comprehensive billing and invoicing solution. Manage businesses, products, and sales with ease.',
  icons: {
    icon: [
      { url: '/images/logo-main.png', sizes: 'any' },
      { url: '/images/logo-main.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/images/logo-main.png',
  },
  openGraph: {
    title: 'Dev & Debate Billing Tool - Business Management & Invoicing',
    description: 'Streamline your business operations with our comprehensive billing and invoicing solution. Manage businesses, products, and sales with ease.',
    url: 'https://billing.devanddebate.com',
    siteName: 'Dev & Debate Billing Tool',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dev & Debate Billing Tool',
    description: 'Business Management & Invoicing Solution',
    creator: '@devanddebate',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/images/logo-main.png" sizes="any" />
        <link rel="icon" href="/images/logo-main.png" type="image/png" />
        <link rel="shortcut icon" href="/images/logo-main.png" />
        <link rel="apple-touch-icon" href="/images/logo-main.png" />
      </head>
      <body 
        className={`min-h-screen bg-black text-white antialiased ${dmSans.variable}`}
        suppressHydrationWarning={true}
      >
        <AuthProvider>
          <Navbar />
          <div className="pt-16">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
