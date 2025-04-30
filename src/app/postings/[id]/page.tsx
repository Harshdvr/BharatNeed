
'use client';

import { useState, useEffect } from 'react'; // Import useState, useEffect
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import LoadingSpinner from "@/components/loading-spinner"; // Keep spinner import
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { IndianRupee, MapPin, MessageSquare, Phone, Share2, Tag, User, Heart } from "lucide-react"; // Added Heart
import Image from "next/image";
import Link from "next/link";
import { usePathname } from 'next/navigation'; // Using App Router hook
import { useToast } from '@/hooks/use-toast'; // Import useToast

// Define posting type structure
interface Posting {
    id: string;
    type: 'Need' | 'Offer';
    title: string;
    category: string;
    location: string;
    urgency: string;
    budget: string;
    description: string;
    image: string | null;
    sellerName: string;
    sellerSince: string;
    phone: string;
    verified: boolean;
    isFavorite: boolean; // Added isFavorite
}


// Placeholder data fetching simulation - In a real app, fetch this based on the ID
const getPostingDetails = async (id: string): Promise<Posting | null> => {
    console.log(`Fetching details for ID: ${id}`);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    const postings: Posting[] = [
        { id: '1', type: 'Need', title: 'Need Plumber for Leaky Faucet', category: 'Services', location: 'Mumbai, MH', urgency: 'Urgent', budget: 'Negotiable', description: 'Small leak under kitchen sink needs fixing ASAP. Contact for details. Experienced plumber preferred.', image: 'https://picsum.photos/seed/plumber/600/400', sellerName: 'Amit Patel', sellerSince: 'Member since 2023', phone: '+91 98XXXXXX01', verified: true, isFavorite: false },
        { id: '2', type: 'Offer', title: 'Homemade Pickles for Sale', category: 'Buy/Sell', location: 'Pune, MH', urgency: 'Low', budget: '₹150/kg', description: 'Delicious mango and lemon pickles, made with traditional recipes. Freshly prepared. Bulk orders accepted.', image: 'https://picsum.photos/seed/pickles/600/400', sellerName: 'Sunita Rao', sellerSince: 'Member since 2022', phone: '+91 99XXXXXX02', verified: false, isFavorite: true },
        { id: '3', type: 'Need', title: 'Help with Rice Harvesting', category: 'Farming', location: 'Rural Village, UP', urgency: 'High', budget: 'Daily Wage', description: 'Need 5-6 laborers for 3 days of rice harvesting next week. Food and accommodation provided. Call for wage details.', image: 'https://picsum.photos/seed/harvest/600/400', sellerName: 'Rajesh Singh', sellerSince: 'Member since 2024', phone: '+91 91XXXXXX03', verified: true, isFavorite: false },
        { id: '4', type: 'Offer', title: 'Mathematics Tuition (Class 10)', category: 'Tuitions', location: 'Delhi', urgency: 'Medium', budget: '₹2000/month', description: 'Experienced teacher offering maths tuition for CBSE Class 10. Focus on concept clarity and practice. Weekend batches available.', image: 'https://picsum.photos/seed/tuition/600/400', sellerName: 'Deepa Khanna', sellerSince: 'Member since 2021', phone: '+91 95XXXXXX04', verified: true, isFavorite: false },
        { id: '5', type: 'Need', title: 'Part-time Graphic Designer', category: 'Jobs', location: 'Remote', urgency: 'Medium', budget: '₹15k/month', description: 'Looking for a designer for social media posts, 10-15 hours/week. Must know Canva/Figma. Send portfolio link.', image: 'https://picsum.photos/seed/designer/600/400', sellerName: 'Creative Solutions', sellerSince: 'Member since 2023', phone: '+91 92XXXXXX05', verified: false, isFavorite: false },
    ];
    const found = postings.find(p => p.id === id);
    // Simulate not found scenario
    // if (id === 'notfound') return null;
    return found || null;
};

export default function PostingDetailPage({ params }: { params: { id: string } }) {
    const pathname = usePathname();
    const { toast } = useToast();
    const [posting, setPosting] = useState<Posting | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showingPhone, setShowingPhone] = useState(false); // State for showing phone number

    useEffect(() => {
        const fetchDetails = async () => {
            setIsLoading(true);
            setError(null);
            setShowingPhone(false); // Reset phone view on new load
            try {
                const data = await getPostingDetails(params.id);
                if (data) {
                    setPosting(data);
                } else {
                     setError('Posting not found.');
                }
            } catch (err) {
                console.error("Failed to fetch posting details:", err);
                setError('Failed to load posting details.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchDetails();
    }, [params.id]); // Refetch when ID changes

    // Placeholder share function
    const handleShare = () => {
         if (!posting) return;
        if (navigator.share) {
            navigator.share({
                title: posting.title,
                text: `Check out this posting on Bharat Need: ${posting.title}`,
                url: window.location.href,
            })
            .then(() => console.log('Successful share'))
            .catch((error) => console.log('Error sharing', error));
        } else {
            // Fallback for browsers that don't support navigator.share
            navigator.clipboard.writeText(window.location.href);
            toast({ description: 'Link copied to clipboard!' }); // Use toast notification
        }
    };

    // Handle showing phone number (add confirmation/logic if needed)
    const handleShowPhone = () => {
        setShowingPhone(true);
        // Optionally track this event
    }

     // Handle chat button click
     const handleChatClick = () => {
        // TODO: Implement navigation to chat page with this user/posting context
        toast({ description: "Chat functionality not implemented yet." });
     }

      // TODO: Implement actual favoriting logic (likely Server Action)
     const handleToggleFavorite = () => {
        if (!posting) return;
        // Requires user to be logged in - Add auth check later
        setPosting(prev => prev ? { ...prev, isFavorite: !prev.isFavorite } : null);
        console.log(`Toggled favorite for post ${posting.id}. New state: ${!posting.isFavorite}`);
        toast({
            description: !posting.isFavorite ? "Added to favorites!" : "Removed from favorites.",
        });
        // Add Server Action call here to update Firestore
     };


    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <LoadingSpinner />
            </div>
        );
    }

    if (error) {
        return <div className="text-center py-10 text-destructive">{error}</div>;
    }

    if (!posting) {
         // This case should ideally be covered by the error state after fetch,
         // but kept as a fallback.
        return <div className="text-center py-10">Posting not found.</div>;
    }


    return (
        <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                {/* Left Column (Image & Description) */}
                <div className="md:col-span-2 space-y-6">
                    {/* Image Carousel Placeholder */}
                    <Card className="overflow-hidden">
                         <div className="relative aspect-video bg-muted">
                            <Image
                                src={posting.image || 'https://picsum.photos/600/400'}
                                alt={posting.title}
                                fill
                                style={{ objectFit: 'cover' }}
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 800px"
                                priority // Prioritize loading the main image
                            />
                             {/* Favorite Button Overlay on Image */}
                            {/* TODO: Add check if user is logged in before showing */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 z-10 h-9 w-9 rounded-full bg-background/70 text-destructive hover:bg-background hover:text-destructive"
                                onClick={handleToggleFavorite}
                                aria-label={posting.isFavorite ? "Remove from favorites" : "Add to favorites"}
                                >
                                <Heart className={`h-5 w-5 transition-colors ${posting.isFavorite ? 'fill-destructive' : 'fill-transparent'}`} />
                            </Button>
                         </div>
                    </Card>

                    {/* Description Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Description</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground whitespace-pre-wrap">{posting.description}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column (Price, Seller, Actions) */}
                <div className="md:col-span-1 space-y-6">
                    {/* Price & Title Card */}
                    <Card>
                        <CardHeader className="pb-2">
                           <div className="flex justify-between items-start gap-2">
                                <span className="text-2xl font-bold text-primary flex items-center">
                                    <IndianRupee className="inline h-6 w-6 mr-1" /> {posting.budget}
                                </span>
                                <Button variant="ghost" size="icon" onClick={handleShare}>
                                     <Share2 className="h-5 w-5" />
                                     <span className="sr-only">Share</span>
                                </Button>
                           </div>
                            <CardTitle className="text-xl pt-1">{posting.title}</CardTitle>
                            <div className="flex justify-between items-center text-xs text-muted-foreground pt-2">
                                <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3"/>
                                    <span>{posting.location}</span>
                                </div>
                                <span>Posted: {/* TODO: Add actual date */} Today</span>
                            </div>
                        </CardHeader>
                        <CardFooter>
                             <Badge variant={posting.type === 'Need' ? 'destructive' : 'default'}>
                                {posting.type}
                             </Badge>
                             <Badge variant="secondary" className="ml-2 flex items-center gap-1">
                                <Tag className="h-3 w-3"/> {posting.category}
                             </Badge>
                        </CardFooter>
                    </Card>

                     {/* Seller Info Card */}
                     <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Posted by</CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-center gap-4">
                            <Avatar className="h-12 w-12">
                                <AvatarImage src={`https://picsum.photos/seed/${posting.sellerName}/100/100`} alt={posting.sellerName} />
                                <AvatarFallback>{posting.sellerName?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">{posting.sellerName}</p>
                                <p className="text-xs text-muted-foreground">{posting.sellerSince}</p>
                                {posting.verified && <Badge variant="secondary" className="mt-1 text-xs">Verified User</Badge>}
                            </div>
                        </CardContent>
                         <Separator />
                         <CardFooter className="flex flex-col gap-2 pt-4">
                           <Button className="w-full" size="lg" onClick={handleChatClick}>
                                <MessageSquare className="mr-2 h-5 w-5" /> Chat with Poster
                           </Button>
                           {showingPhone ? (
                                <div className="flex items-center justify-center w-full p-2 border rounded bg-muted">
                                    <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium text-foreground">{posting.phone}</span>
                                </div>
                           ) : (
                                <Button variant="outline" className="w-full" size="lg" onClick={handleShowPhone}>
                                    <Phone className="mr-2 h-5 w-5" /> Show Phone Number
                                </Button>
                           )}
                         </CardFooter>
                    </Card>

                    {/* Location Map Placeholder */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Location</CardTitle>
                        </CardHeader>
                        <CardContent>
                           {/* TODO: Integrate actual map component */}
                           <div className="aspect-video bg-muted rounded-md flex items-center justify-center text-muted-foreground">
                                <MapPin className="h-8 w-8 mr-2"/>
                                <span>Map Placeholder ({posting.location})</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

             {/* Related Postings Placeholder */}
            {/* TODO: Fetch and display related postings with loading state */}
            <div className="mt-12">
                <h2 className="text-2xl font-semibold mb-4">Related Postings</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Example related item - Replace with actual data/component */}
                    <Card className="text-center p-4 border-dashed">
                        <p className="text-muted-foreground">Related Item Placeholder</p>
                    </Card>
                     <Card className="text-center p-4 border-dashed">
                        <p className="text-muted-foreground">Related Item Placeholder</p>
                    </Card>
                    <Card className="text-center p-4 border-dashed">
                        <p className="text-muted-foreground">Related Item Placeholder</p>
                    </Card>
                     <Card className="text-center p-4 border-dashed">
                        <p className="text-muted-foreground">Related Item Placeholder</p>
                    </Card>
                </div>
            </div>

        </div>
    );
}
