
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, UserCircle, LogOut } from 'lucide-react';
import LanguageSwitcher from '@/components/language-switcher';
import LocationSelector from '@/components/location-selector'; // Import the new component
import BharatNeedLogo from '@/components/bharat-need-logo'; // Import the logo component
import { useAuthState } from 'react-firebase-hooks/auth'; // Import hook
import { auth } from '@/lib/firebase/clientApp'; // Import auth instance
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';


export default function Header() {
  const [user, loading, error] = useAuthState(auth); // Get auth state
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
      // router.push('/'); // Optionally redirect after logout
    } catch (error: any) {
      console.error("Logout failed:", error);
      toast({ title: 'Logout Failed', description: error.message, variant: 'destructive' });
    }
  };


  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 gap-2 sm:gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0 mr-1 sm:mr-0">
          <BharatNeedLogo className="h-8 w-auto" />
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
          {loading ? (
             // Optional: Show a loading indicator while checking auth state
             <div className="h-8 w-8 animate-pulse rounded-full bg-muted"></div>
          ) : user ? (
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                        <Avatar className="h-9 w-9">
                         {/* TODO: Replace with actual user avatar */}
                        <AvatarImage src={user.photoURL || `https://avatar.vercel.sh/${user.uid}.png`} alt={user.displayName || user.email || 'User'} />
                        <AvatarFallback>{user.displayName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.displayName || 'User'}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                         {user.email || user.phoneNumber || 'No contact info'}
                        </p>
                    </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                       <Link href="/profile">
                            <UserCircle className="mr-2 h-4 w-4" />
                            Profile
                       </Link>
                    </DropdownMenuItem>
                     <DropdownMenuItem asChild>
                       <Link href="/my-ads">
                            {/* Placeholder for My Ads icon */}
                            <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                            My Ads
                       </Link>
                    </DropdownMenuItem>
                     <DropdownMenuItem asChild>
                        <Link href="/favorites">
                            {/* Placeholder for Favorites icon */}
                            <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                            Favorites
                       </Link>
                    </DropdownMenuItem>
                     <DropdownMenuItem asChild>
                         <Link href="/settings">
                             {/* Placeholder for Settings icon */}
                             <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                             Settings
                         </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
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
           {error && <span className='text-destructive text-xs'>Auth Error</span>}
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
