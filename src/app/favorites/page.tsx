'use client';

import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/loading-spinner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { IndianRupee, MapPin, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// Placeholder data for favorited postings - In a real app, fetch this for the logged-in user
const favoritePostings = [
  { id: 2, type: 'Offer', title: 'Homemade Pickles for Sale', category: 'Buy/Sell', location: 'Pune, MH', budget: '₹150/kg', description: 'Delicious mango and lemon pickles...', image: 'https://picsum.photos/seed/pickles/300/200', dateFavorited: '3 days ago' },
  { id: 4, type: 'Offer', title: 'Mathematics Tuition (Class 10)', category: 'Tuitions', location: 'Delhi', budget: '₹2000/month', description: 'Experienced teacher offering...', image: 'https://picsum.photos/seed/tuition/300/200', dateFavorited: '1 week ago' },
];

// TODO: Implement remove from favorites action
const handleRemoveFavorite = (id: string | number) => {
    console.log(`Removing favorite ${id}`);
    // Call server action to remove
    console.log(`Simulating remove favorite for ad ${id}`); // Replaced alert with console.log
};

export default function FavoritesPage() {
    return (
        <div className="container mx-auto px-4 py-8"><LoadingSpinner />
            <h1 className="text-3xl font-bold mb-6">My Favorites</h1>

            {favoritePostings.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {favoritePostings.map((ad) => (
                        <Card key={ad.id} className="overflow-hidden flex flex-col shadow-md hover:shadow-lg transition-shadow duration-200">
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
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => handleRemoveFavorite(ad.id)}>
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">Remove Favorite</span>
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
