import type { Metadata } from 'next';
// Removed Inter font import
import './globals.css';
import { cn } from '@/lib/utils';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Toaster } from "@/components/ui/toaster" // Import Toaster

// Removed Inter font initialization

export const metadata: Metadata = {
  title: 'Bharat Need - Connect & Fulfill Needs Across India',
  description: 'Post your needs or offers for products, services, jobs, help, and more. Connecting communities across India.',
  keywords: 'India needs, community platform, local services, jobs India, farming help, buy sell India, local offers',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased flex flex-col'
          // Removed inter.variable
        )}
      >
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">{children}</main>
        <Footer />
        <Toaster /> {/* Add Toaster here */}
      </body>
    </html>
  );
}
