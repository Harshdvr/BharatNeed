'use client';

import { useState, useEffect } from 'react'; // Import useState
import LoadingSpinner from "@/components/loading-spinner"; // Keep LoadingSpinner import
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { IndianRupee, MapPin, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useToast } from '@/hooks/use-toast'; // Import useToast
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, firestore } from '@/lib/firebase/clientApp';
import { Button } from '@/components/ui/button';
// TODO: Import necessary Firestore functions (e.g., doc, updateDoc, arrayRemove, getDoc)

// TODO: Remove initialFavoritePostings and fetch actual data for the logged-in user
const initialFavoritePostings: any[] = [
  // Example Structure (replace with fetched data)
  // { id: '2', type: 'Offer', title: 'Fetched Item 1', category: '...', location: '...', budget: '...', description: '...', image: '...', dateFavorited: '...' },
];

export default function FavoritesPage() {
    const [user, authLoading, authError] = auth ? useAuthState(auth) : [null, true, new Error("Auth not initialized")];
    const [favorites, setFavorites] = useState<any[]>([]);
    const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
    const [loadingRemoveId, setLoadingRemoveId] = useState<string | number | null>(null); // State to track which item is being removed
    const { toast } = useToast();

    useEffect(() => {
      const fetchFavorites = async () => {
          if (!user || !firestore) {
             setIsLoadingInitialData(false);
             return; // Exit if not logged in or firestore not ready
          }
          setIsLoadingInitialData(true);
          try {
              // TODO: Fetch user's favorite list (IDs) from their profile document
              // const userDocRef = doc(firestore, 'users', user.uid);
              // const userDocSnap = await getDoc(userDocRef);
              // const favoriteIds = userDocSnap.exists() ? userDocSnap.data().favorites || [] : [];

              // TODO: Fetch the actual posting details for each favorite ID
              // This might involve multiple `getDoc` calls or a more complex query
              // Example: const favoritePostingsPromises = favoriteIds.map(id => getDoc(doc(firestore, 'postings', id)));
              // const favoritePostingsSnaps = await Promise.all(favoritePostingsPromises);
              // const fetchedFavorites = favoritePostingsSnaps.map(snap => snap.exists() ? { id: snap.id, ...snap.data() } : null).filter(Boolean);

              setFavorites(initialFavoritePostings); // Replace with actual fetched data
              console.log("Fetched favorite postings (simulated)");
          } catch (error) {
              console.error("Error fetching favorites:", error);
              toast({ title: "Error", description: "Could not load your favorites.", variant: "destructive" });
          } finally {
              setIsLoadingInitialData(false);
          }
      };

      if (!authLoading) {
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

  }, [user, authLoading, toast, authError]);


    const handleRemoveFavorite = async (id: string | number) => {
         if (!user || !firestore) {
             toast({ title: "Login Required", description: "Please log in to manage favorites.", variant: "destructive"});
             return;
         }
        setLoadingRemoveId(id); // Start loading for this specific item
        console.log(`Removing favorite ${id}`);
        try {
            // Call server action or directly update Firestore to remove from DB
             const userDocRef = doc(firestore, 'users', user.uid);
             await updateDoc(userDocRef, { favorites: arrayRemove(id) }); // Firestore function
            console.log(`Removed favorite ${id} from Firestore`);
            setFavorites(prev => prev.filter(ad => ad.id !== id));
            toast({ title: "Removed", description: "Posting removed from favorites." });
        } catch (error) {
            console.error("Failed to remove favorite:", error);
            toast({ title: "Error", description: "Could not remove favorite.", variant: "destructive" });
        } finally {
            setLoadingRemoveId(null); // Stop loading
        }
    };

    if (isLoadingInitialData || authLoading) {
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
                    {favorites.map((ad) => (
                        <Card key={ad.id} className="overflow-hidden flex flex-col shadow-md hover:shadow-lg transition-shadow duration-200 relative">
                             {/* Show spinner overlay if this item is being removed */}
                            {loadingRemoveId === ad.id && (
                                <div className="absolute inset-0 bg-background/70 flex items-center justify-center z-10 rounded-lg">
                                    <LoadingSpinner showText={false} className="h-8 w-8" />
                                </div>
                            )}
                            <Link href={`/postings/${ad.id}`} className="block relative w-full aspect-[3/2] bg-muted">
                                <Image
                                    src={ad.image || 'https://picsum.photos/300/200'} // Use ad image or default
                                    alt={ad.title}
                                    fill
                                    style={{ objectFit: 'cover' }}
                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                                />
                            </Link>
                            <div className="p-4 flex flex-col flex-grow">
                                <Link href={`/postings/${ad.id}`} className="hover:underline flex-grow">
                                    <CardTitle className="text-base line-clamp-2 mb-1">{ad.title}</CardTitle>
                                    <p className="font-semibold text-primary flex items-center gap-1 text-sm mb-1">
                                        <IndianRupee className="h-4 w-4" /> {ad.budget}
                                    </p>
                                    <CardDescription className="text-xs text-muted-foreground line-clamp-1 flex items-center gap-1">
                                        <MapPin className="h-3 w-3"/> {ad.location}
                                    </CardDescription>
                                </Link>
                                <div className="flex justify-between items-center mt-3 pt-2 border-t">
                                    {/* TODO: Display actual favorited date if available */}
                                    <span className="text-xs text-muted-foreground">Favorited {ad.dateFavorited || ''}</span>
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
                    ))}
                </div>
            ) : (
                <div className="text-center py-10">
                    {isLoadingInitialData ? (
                         <LoadingSpinner />
                    ) : (
                         <>
                            <p className="text-lg text-muted-foreground">You haven't favorited any ads yet.</p>
                            <Button asChild className="mt-4">
                                <Link href="/">Browse Ads</Link>
                            </Button>
                         </>
                    )}
                </div>
            )}
        </div>
    );
}
