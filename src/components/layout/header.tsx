
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, UserCircle } from 'lucide-react';
import LanguageSwitcher from '@/components/language-switcher';
import LocationSelector from '@/components/location-selector'; // Import the new component
import BharatNeedLogo from '@/components/bharat-need-logo'; // Import the logo component

export default function Header() {
  // Placeholder for user authentication state
  const isAuthenticated = false; // TODO: Replace with actual auth state

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 gap-2 sm:gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0 mr-1 sm:mr-0">
          <BharatNeedLogo className="h-8 w-auto text-primary" />
        </Link>

        {/* Location Selector */}
        <div className="flex-shrink-0">
           <LocationSelector />
        </div>


        {/* Search Bar - Placeholder */}
        <div className="relative hidden md:flex flex-grow max-w-lg items-center">
          <Input type="search" placeholder="Search needs & offers..." className="pl-10 h-9" />
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <LanguageSwitcher />
          {isAuthenticated ? (
            // TODO: Replace with Dropdown for profile/logout etc.
             <Button variant="ghost" size="icon" asChild>
                <Link href="/profile">
                    <UserCircle className="h-6 w-6" />
                    <span className="sr-only">Profile</span>
                </Link>
             </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                 <Link href="/login">Login</Link>
              </Button>
              <Button size="sm" asChild>
                 <Link href="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Mobile Search */}
      <div className="md:hidden flex items-center p-2 border-t gap-2">
        {/* Location moved to the component above */}
        <div className="relative flex flex-grow items-center">
          <Input type="search" placeholder="Search needs & offers..." className="pl-10 h-9" />
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>
    </header>
  );
}
