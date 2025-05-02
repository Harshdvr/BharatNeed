
'use client';

import { useState, useEffect } from 'react'; // Import useState
import LoadingSpinner from "@/components/loading-spinner"; // Keep LoadingSpinner import
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { IndianRupee, MapPin, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useToast } from '@/hooks/use-toast'; // Import useToast
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, firestore, ensureFirestoreInitialized } from '@/lib/firebase/clientApp'; // Import auth, firestore, and helper
import { Button } from '@/components/ui/button';
import { doc, updateDoc, arrayRemove, getDoc, getDocs, collection, query, where } from 'firebase/firestore'; // Import Firestore functions

// Posting type definition
interface Posting {
    id: string;
    title?: string;
    budget?: string;
    location?: string;
    imageUrls?: string[]; // Assuming multiple images
    dateFavorited?: any; // Or Date if converted
    // Add other relevant fields from your posting data structure
    category?: string;
    description?: string;
    urgency?: string;
    postType?: 'need' | 'offer';
    createdAt?: any; // Firestore Timestamp
}

interface UserProfile {
  favorites?: string[]; // Array of favorite posting IDs
}

// Mock Data for testing favorites
const mockFavoritesData: Posting[] = [
   {
    id: 'mockFav1', // Use a unique ID, can overlap with mock posts on home page
    title: 'Mock Favorite: Homemade Mango Pickles',
    description: 'Selling delicious homemade mango pickles, prepared with traditional recipes. Order now!',
    category: 'buy/sell',
    postType: 'offer',
    location: 'Pune, MH',
    budget: '₹150/kg',
    urgency: 'low',
    imageUrls: ['https://picsum.photos/seed/pickles/300/200'],
    createdAt: new Date(Date.now() - 86400000 * 2), // 2 days ago
    dateFavorited: new Date(), // Favorited today
  },
   {
    id: 'mockFav2',
    title: 'Mock Favorite: Maths Tuition Class 10',
    description: 'Experienced teacher offering online Maths tuition for CBSE Class 10 students.',
    category: 'tuitions',
    postType: 'offer',
    location: 'Delhi',
    budget: '₹2000/month',
    urgency: 'medium',
    imageUrls: ['https://picsum.photos/seed/tuition/300/200'],
    createdAt: new Date(Date.now() - 86400000), // 1 day ago
     dateFavorited: new Date(Date.now() - 86400000 * 1), // Favorited yesterday
  },
];


export default function FavoritesPage() {
    const [user, authLoading, authError] = auth ? useAuthState(auth) : [null, true, new Error("Auth not initialized")];
    const [favorites, setFavorites] = useState<Posting[]>([]); // Start empty, fetch real data
    const [isLoadingInitialData, setIsLoadingInitialData] = useState(true); // Start loading initially
    const [loadingRemoveId, setLoadingRemoveId] = useState<string | null>(null); // State to track which item is being removed
    const { toast } = useToast();
    const [firestoreInitialized, setFirestoreInitialized] = useState(false); // Start uninitialized

     useEffect(() => {
         if (firestore) {
             setFirestoreInitialized(true);
         } else {
             const timeoutId = setTimeout(() => {
                 if (firestore) {
                     setFirestoreInitialized(true);
                 } else {
                     console.error("Firestore still not initialized after delay for favorites.");
                     toast({ title: "Database Error", description: "Could not connect to the database.", variant: "destructive" });
                     setIsLoadingInitialData(false);
                 }
             }, 2000);
             return () => clearTimeout(timeoutId);
         }
     }, [toast]);

    useEffect(() => {
      const fetchFavorites = async () => {
          if (!user) {
             setIsLoadingInitialData(false);
             setFavorites([]); // Clear favorites if user logs out
             return; // Exit if not logged in
          }

          setIsLoadingInitialData(true);
          try {
              const fs = ensureFirestoreInitialized(); // Ensure firestore is ready

              // Fetch user's favorite list (IDs) from their profile document
              const userDocRef = doc(fs, 'users', user.uid);
              const userDocSnap = await getDoc(userDocRef);
              const favoriteIds: string[] = userDocSnap.exists() ? (userDocSnap.data() as UserProfile).favorites || [] : [];

              if (favoriteIds.length === 0) {
                  setFavorites([]);
                  setIsLoadingInitialData(false);
                  return; // No favorites to fetch
              }

              // Fetch the actual posting details for each favorite ID
              // Note: This fetches documents one by one. For large lists, consider fetching in batches or using 'in' query (max 30 IDs per query).
              const favoritePostingsPromises = favoriteIds.map(id => getDoc(doc(fs, 'postings', id)));
              const favoritePostingsSnaps = await Promise.all(favoritePostingsPromises);
              const fetchedFavorites = favoritePostingsSnaps
                  .map(snap => snap.exists() ? { id: snap.id, ...snap.data() } as Posting : null)
                  .filter((p): p is Posting => p !== null); // Type guard to filter out nulls

              // Add dateFavorited info - Firestore doesn't store this directly with arrayUnion.
              // You might need a subcollection for favorites if you need this timestamp reliably.
              // For now, we'll omit or use createdAt as a placeholder.
              setFavorites(fetchedFavorites);
              console.log("Fetched favorite postings");
          } catch (error: any) {
              console.error("Error fetching favorites:", error);
               if (error.message.includes("Firestore is not initialized")) {
                   toast({ title: "Database Error", description: "Could not load favorites.", variant: "destructive" });
               } else if (error.code === 'unavailable' || error.message.includes('offline')) {
                 toast({ title: "Offline", description: "Could not load favorites. Please check your connection.", variant: "default" });
                 // Potentially display mock/cached data if available
                 // setFavorites(mockFavoritesData);
               } else {
                  toast({ title: "Error", description: "Could not load your favorites.", variant: "destructive" });
               }
          } finally {
              setIsLoadingInitialData(false);
          }
      };

      if (!authLoading && firestoreInitialized) { // Check firestoreInitialized as well
          fetchFavorites();
      }

      // Handle auth errors
      if (authError) {
        console.error("Firebase Auth Hook Error:", authError);
        toast({
          title: "Authentication Error",
          description: authError.message || "Could not verify user.",
          variant: "destructive",
        });
        setIsLoadingInitialData(false);
      }

  }, [user, authLoading, toast, authError, firestoreInitialized]);


    const handleRemoveFavorite = async (id: string) => {
         if (!user) {
             toast({ title: "Login Required", description: "Please log in to manage favorites.", variant: "destructive"});
             return;
         }
          if (!firestoreInitialized) {
             toast({ title: "Database Error", description: "Could not connect. Please try again.", variant: "destructive"});
             return;
         }
        setLoadingRemoveId(id); // Start loading for this specific item

        // Optimistically update UI
        setFavorites(prev => prev.filter(ad => ad.id !== id));

        try {
            const fs = ensureFirestoreInitialized();
             const userDocRef = doc(fs, 'users', user.uid);
             await updateDoc(userDocRef, { favorites: arrayRemove(id) });
            console.log(`Removed favorite ${id} from Firestore`);
            toast({ title: "Removed", description: "Posting removed from favorites." });
        } catch (error: any) {
            console.error("Failed to remove favorite:", error);
             // Revert optimistic update on error
             setFavorites(prev => {
                // This is complex: Need to refetch or insert the item back.
                // Easiest might be to refetch all favorites or show an error and prompt retry.
                // For simplicity, we'll just show an error here.
                return prev; // Keep the optimistically updated state for now
             });

             if (error.message.includes("Firestore is not initialized")) {
                 toast({ title: "Database Error", description: "Could not remove favorite.", variant: "destructive" });
             } else if (error.code === 'unavailable' || error.message.includes('offline')) {
                  toast({ title: "Offline", description: "Could not remove favorite. Please check connection.", variant: "destructive" });
             } else {
                 toast({ title: "Error", description: "Could not remove favorite.", variant: "destructive" });
             }
        } finally {
            setLoadingRemoveId(null); // Stop loading
        }
    };

    // Show loading spinner if auth or initial data is loading
    if (authLoading || isLoadingInitialData) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <LoadingSpinner />
            </div>
        );
    }

     if (!user && !authLoading) {
         return (
            <div className="text-center py-10">
                 <p className="text-lg text-muted-foreground mb-4">Please log in to view your favorites.</p>
                 <Button asChild>
                    <Link href="/login">Login / Sign Up</Link>
                 </Button>
            </div>
         );
     }


    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">My Favorites</h1>

            {favorites.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {favorites.map((ad) => {
                        // Using createdAt as a placeholder for 'dateFavorited'
                        const dateFavoritedFormatted = ad.createdAt instanceof Date ? ad.createdAt.toLocaleDateString() : ad.createdAt?.toDate ? ad.createdAt.toDate().toLocaleDateString() : '';
                        return (
                        <Card key={ad.id} className="overflow-hidden flex flex-col shadow-md hover:shadow-lg transition-shadow duration-200 relative">
                             {/* Show spinner overlay if this item is being removed */}
                            {loadingRemoveId === ad.id && (
                                <div className="absolute inset-0 bg-background/70 flex items-center justify-center z-10 rounded-lg">
                                    <LoadingSpinner showText={false} className="h-8 w-8" />
                                </div>
                            )}
                            <Link href={`/postings/${ad.id}`} className="block relative w-full aspect-[3/2] bg-muted">
                                <Image
                                    src={ad.imageUrls?.[0] || 'https://picsum.photos/300/200'} // Use first image or default
                                    alt={ad.title || 'Favorite Item'}
                                    fill
                                    style={{ objectFit: 'cover' }}
                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                                    priority={ad.id.startsWith('mockFav')} // Prioritize loading mock images
                                    data-ai-hint="favorite posting image"
                                />
                            </Link>
                            <div className="p-4 flex flex-col flex-grow">
                                <Link href={`/postings/${ad.id}`} className="hover:underline flex-grow">
                                    <CardTitle className="text-base line-clamp-2 mb-1">{ad.title || 'Untitled Post'}</CardTitle>
                                    <p className="font-semibold text-primary flex items-center gap-1 text-sm mb-1">
                                        <IndianRupee className="h-4 w-4" /> {ad.budget || 'N/A'}
                                    </p>
                                    <CardDescription className="text-xs text-muted-foreground line-clamp-1 flex items-center gap-1">
                                        <MapPin className="h-3 w-3"/> {ad.location || 'N/A'}
                                    </CardDescription>
                                </Link>
                                <div className="flex justify-between items-center mt-3 pt-2 border-t">
                                    <span className="text-xs text-muted-foreground">
                                         {/* Using createdAt as placeholder for 'Favorited' date */}
                                        {dateFavoritedFormatted ? `Added ${dateFavoritedFormatted}` : 'Favorited'}
                                     </span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                        onClick={() => handleRemoveFavorite(ad.id)}
                                        disabled={!!loadingRemoveId} // Disable all buttons while one is loading
                                        aria-label="Remove Favorite"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-10">
                     <>
                        <p className="text-lg text-muted-foreground">You haven't favorited any ads yet.</p>
                        <Button asChild className="mt-4">
                            <Link href="/">Browse Ads</Link>
                        </Button>
                     </>
                </div>
            )}
        </div>
    );
}
