
"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react'; // Import useEffect and useState
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, LogOut } from 'lucide-react'; // Removed unused icons
import LanguageSwitcher from '@/components/language-switcher';
import LocationSelector from '@/components/location-selector';
import BharatNeedLogo from '@/components/bharat-need-logo';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase/clientApp';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Skeleton } from '../ui/skeleton';
import { useRouter } from 'next/navigation';


export default function Header() {
  const [user, loading, error] = auth ? useAuthState(auth) : [null, true, new Error("Auth not initialized")];
  const { toast } = useToast();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false); // State to track client-side rendering

  // Ensure component only renders auth-dependent UI on the client
  useEffect(() => {
    setIsClient(true);
  }, []);


  const handleLogout = async () => {
     if (!auth) {
        toast({ title: 'Error', description: 'Authentication service not available.', variant: 'destructive' });
        return;
     }
    try {
      await signOut(auth);
      toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
       router.push('/'); // Redirect to home after logout
    } catch (error: any) {
      console.error("Logout failed:", error);
      toast({ title: 'Logout Failed', description: error.message, variant: 'destructive' });
    }
  };

  // Handle case where auth failed to initialize (client-side)
   useEffect(() => {
     if (error && isClient) { // Only show toast on client after mount
       console.error("Firebase Auth Hook Error:", error);
       // Avoid showing toast directly in header, rely on specific pages for critical auth errors
       // toast({
       //   title: "Authentication Error",
       //   description: "Could not initialize authentication.",
       //   variant: "destructive",
       // });
     }
   }, [error, isClient, toast]);


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

          {/* Only render auth-dependent part on the client */}
          {isClient ? (
            loading ? (
              // Show skeleton loaders while auth state is loading
              <Skeleton className="h-9 w-9 rounded-full" />
            ) : user ? (
              // User is logged in - Show Avatar + Logout Button
              <>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full" asChild>
                  <Link href="/profile" aria-label="View Profile">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.photoURL || `https://avatar.vercel.sh/${user.uid}.png`} alt={user.displayName || 'User'} />
                      <AvatarFallback>{user.displayName?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                  </Link>
                </Button>
                <Button size="sm" variant="outline" onClick={handleLogout}>
                  <LogOut className="mr-1 h-4 w-4" /> Logout
                </Button>
              </>
            ) : (
              // User is logged out - Show single Login / Sign Up button
              <Button size="sm" asChild>
                <Link href="/login">Login / Sign Up</Link>
              </Button>
            )
          ) : (
             // Render a placeholder (e.g., Skeleton) on the server and before hydration
             <Skeleton className="h-9 w-24 rounded-md" /> // Placeholder for button/avatar area
          )}
          {/* Auth error indicator - only render on client if error exists */}
          {/* Removing the error indicator directly in header to avoid hydration mismatch */}
          {/* {isClient && error && <span className='text-destructive text-xs ml-2'>!</span>} */}
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
