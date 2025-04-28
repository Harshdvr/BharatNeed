"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Globe, Search, UserCircle, MapPin } from 'lucide-react';
import LanguageSwitcher from '@/components/language-switcher';

export default function Header() {
  // Placeholder for user authentication state
  const isAuthenticated = false;

  // TODO: Implement location selection logic (e.g., dropdown, modal, state management)
  const handleLocationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("Location changed:", event.target.value);
    // Update location state...
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          {/* Bharat Need SVG Logo */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 50" fill="currentColor" className="h-8 w-auto text-primary">
            <style>{`.bn-text { font-family: Arial, sans-serif; font-weight: bold; font-size: 40px; }`}</style>
            <text x="0" y="35" className="bn-text">Bharat</text>
            <text x="115" y="35" className="bn-text text-foreground">Need</text>
            {/* Simple dot accent */}
            <circle cx="190" cy="30" r="7" className="text-primary"/>
          </svg>
          {/* <span className="text-xl font-bold text-primary hidden sm:inline">Bharat Need</span> */}
        </Link>

        {/* Location Input - Placeholder */}
        <div className="relative hidden md:flex items-center flex-shrink min-w-[150px] max-w-[250px]">
           <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
           <Input
             type="text"
             placeholder="Select Location..."
             className="pl-9 h-9 text-sm"
             onChange={handleLocationChange}
             // defaultValue="India" // Optional default
           />
        </div>

        {/* Search Bar - Placeholder */}
        <div className="relative hidden md:flex flex-grow max-w-lg items-center">
          <Input type="search" placeholder="Search needs & offers..." className="pl-10 h-9" />
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <LanguageSwitcher />
          {isAuthenticated ? (
            <Button variant="ghost" size="icon">
              <UserCircle className="h-6 w-6" />
              <span className="sr-only">Profile</span>
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex">Login</Button>
              <Button size="sm">Sign Up</Button>
            </>
          )}
        </div>
      </div>

      {/* Mobile Search & Location */}
      <div className="md:hidden flex items-center p-2 border-t gap-2">
        <div className="relative flex items-center flex-shrink-0">
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Location..."
            className="pl-9 h-9 text-sm w-28" // Smaller width for mobile
            onChange={handleLocationChange}
            // defaultValue="India"
          />
        </div>
        <div className="relative flex flex-grow items-center">
          <Input type="search" placeholder="Search needs & offers..." className="pl-10 h-9" />
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>
    </header>
  );
}
