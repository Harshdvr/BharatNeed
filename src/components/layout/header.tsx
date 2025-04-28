
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, UserCircle, LogOut, Settings, Heart, ListOrdered } from 'lucide-react'; // Added missing icons
import LanguageSwitcher from '@/components/language-switcher';
import LocationSelector from '@/components/location-selector';
import BharatNeedLogo from '@/components/bharat-need-logo';
import { useAuthState } from 'react-firebase-hooks/auth'; // Import hook
import { auth } from '@/lib/firebase/clientApp'; // Import auth instance (can be null)
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
import { Skeleton } from '../ui/skeleton'; // Import Skeleton for loading state


export default function Header() {
  // IMPORTANT: Check if auth is initialized before using the hook
  const [user, loading, error] = auth ? useAuthState(auth) : [null, true, null]; // Default to loading if auth is null
  const { toast } = useToast();

  const handleLogout = async () => {
     if (!auth) {
        toast({ title: 'Error', description: 'Authentication service not available.', variant: 'destructive' });
        return;
     }
    try {
      await signOut(auth);
      toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
      // router.push('/'); // Optionally redirect after logout
    } catch (error: any) {
      console.error("Logout failed:", error);
      toast({ title: 'Logout Failed', description: error.message, variant: 'destructive' });
    }
  };

  // Handle case where auth failed to initialize
   if (error) {
     console.error("Firebase Auth Hook Error:", error);
     // Optionally render an error indicator in the header
   }


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
             // Show skeleton loaders while auth state is loading
             <Skeleton className="h-9 w-9 rounded-full" />
          ) : user ? (
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                        <Avatar className="h-9 w-9">
                         {/* Use user's photoURL or fallback */}
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
                            <ListOrdered className="mr-2 h-4 w-4" /> {/* Corrected Icon */}
                            My Ads
                       </Link>
                    </DropdownMenuItem>
                     <DropdownMenuItem asChild>
                        <Link href="/favorites">
                            <Heart className="mr-2 h-4 w-4" /> {/* Corrected Icon */}
                            Favorites
                       </Link>
                    </DropdownMenuItem>
                     <DropdownMenuItem asChild>
                         <Link href="/settings">
                             <Settings className="mr-2 h-4 w-4" /> {/* Corrected Icon */}
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
            // Show Login/Signup buttons if not loading and no user
            <>
              <Button variant="ghost" size="sm" asChild>
                 <Link href="/login">Login</Link>
              </Button>
              <Button size="sm" asChild>
                 <Link href="/signup">Sign Up</Link>
              </Button>
            </>
          )}
           {error && <span className='text-destructive text-xs ml-2'>!</span>}
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
