"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Globe, Search, UserCircle } from 'lucide-react';
import LanguageSwitcher from '@/components/language-switcher';

export default function Header() {
  // Placeholder for user authentication state
  const isAuthenticated = false;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 text-primary">
            <path d="M12.378 1.602a.75.75 0 0 0-.756 0L3.366 6.166A.75.75 0 0 0 3 6.82v10.36a.75.75 0 0 0 .366.655l8.256 4.564a.75.75 0 0 0 .756 0l8.256-4.564a.75.75 0 0 0 .366-.655V6.82a.75.75 0 0 0-.366-.655L12.378 1.602ZM12 15.952l-6.9-3.816v-3.04l6.9 3.816 6.9-3.816v3.04L12 15.952Zm0-8.516L5.1 3.62v3.04l6.9 3.816 6.9-3.816V3.62L12 7.436Z" />
          </svg>
          <span className="text-xl font-bold text-primary">Bharat Need</span>
        </Link>

        {/* Search Bar - Placeholder */}
        <div className="relative hidden md:flex flex-grow max-w-md items-center mx-4">
          <Input type="search" placeholder="Search needs & offers..." className="pl-10" />
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          {isAuthenticated ? (
            <Button variant="ghost" size="icon">
              <UserCircle className="h-6 w-6" />
              <span className="sr-only">Profile</span>
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm">Login</Button>
              <Button size="sm">Sign Up</Button>
            </>
          )}
        </div>
      </div>
       {/* Mobile Search Bar */}
       <div className="relative md:hidden flex flex-grow items-center p-2 border-t">
          <Input type="search" placeholder="Search needs & offers..." className="pl-10" />
          <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        </div>
    </header>
  );
}
