'use client';

import { useState } from 'react'; // Import useState
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/loading-spinner"; // Keep LoadingSpinner import
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { IndianRupee, MapPin, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useToast } from '@/hooks/use-toast'; // Import useToast

// Placeholder data for favorited postings - In a real app, fetch this for the logged-in user
const initialFavoritePostings = [
  { id: 2, type: 'Offer', title: 'Homemade Pickles for Sale', category: 'Buy/Sell', location: 'Pune, MH', budget: '₹150/kg', description: 'Delicious mango and lemon pickles...', image: 'https://picsum.photos/seed/pickles/300/200', dateFavorited: '3 days ago' },
  { id: 4, type: 'Offer', title: 'Mathematics Tuition (Class 10)', category: 'Tuitions', location: 'Delhi', budget: '₹2000/month', description: 'Experienced teacher offering...', image: 'https://picsum.photos/seed/tuition/300/200', dateFavorited: '1 week ago' },
];

export default function FavoritesPage() {
    // TODO: Add loading state for initial data fetch
    const [favorites, setFavorites] = useState(initialFavoritePostings);
    const [loadingRemoveId, setLoadingRemoveId] = useState<string | number | null>(null); // State to track which item is being removed
    const { toast } = useToast();

    // TODO: Implement remove from favorites action
    const handleRemoveFavorite = async (id: string | number) => {
        setLoadingRemoveId(id); // Start loading for this specific item
        console.log(`Removing favorite ${id}`);
        // Simulate server action call
        await new Promise(resolve => setTimeout(resolve, 1000));
        try {
            // In a real app, call server action to remove from DB
            console.log(`Simulating remove favorite for ad ${id}`);
            setFavorites(prev => prev.filter(ad => ad.id !== id));
            toast({ title: "Removed", description: "Posting removed from favorites." });
        } catch (error) {
            console.error("Failed to remove favorite:", error);
            toast({ title: "Error", description: "Could not remove favorite.", variant: "destructive" });
        } finally {
            setLoadingRemoveId(null); // Stop loading
        }
    };

    // TODO: Add loading indicator for initial data fetch
    // if (isLoadingInitialData) {
    //     return <LoadingSpinner />;
    // }

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
                                    <span className="text-xs text-muted-foreground">Favorited: {ad.dateFavorited}</span>
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
                    <p className="text-lg text-muted-foreground">You haven't favorited any ads yet.</p>
                    <Button asChild className="mt-4">
                        <Link href="/">Browse Ads</Link>
                    </Button>
                </div>
            )}
        </div>
    );
}
