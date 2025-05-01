
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import LoadingSpinner from "@/components/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, IndianRupee, MapPin, MoreVertical, Trash2, Tag, Clock, MessageSquare, Heart, Share2, Flag } from "lucide-react"; // Added Tag and other icons
import Image from "next/image";
import Link from "next/link";
import { useToast } from '@/hooks/use-toast';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, firestore, ensureFirestoreInitialized } from '@/lib/firebase/clientApp'; // Import auth, firestore, and helper
import { useState } from 'react';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore'; // Import Firestore functions


interface Posting {
    id: string;
    status?: 'active' | 'pending' | 'inactive';
    title?: string;
    category?: string;
    location?: string;
    budget?: string;
    description?: string;
    imageUrls?: string[]; // Assuming multiple images
    canBid?: boolean; // Indicate if bidding is allowed
    canNegotiate?: boolean; // Indicate if negotiation is allowed
    views?: number;
    datePosted?: any; // Firestore Timestamp or Date
    userId?: string; // Added userId field
    createdAt?: any; // Firestore Timestamp
    postType?: 'need' | 'offer'; // Added postType
    urgency?: 'low' | 'medium' | 'high' | 'urgent'; // Added urgency
}

// Mock Data - Replace with actual data fetching
const ad: Posting = {
  id: 'mockPost123',
  title: 'Need Urgent Repair for Leaky Roof (Mock)',
  description: 'Water leaking through the ceiling in the living room. Need a professional roofer immediately. Please provide quotes. Located in South Delhi.',
  category: 'services',
  postType: 'need',
  location: 'South Delhi, Delhi',
  budget: '₹5,000 - ₹8,000',
  urgency: 'urgent',
  imageUrls: [
    'https://picsum.photos/seed/roofleak/800/600',
    'https://picsum.photos/seed/roofinside/800/600',
    'https://picsum.photos/seed/damageclose/800/600',
  ],
  userId: 'userMock1',
  createdAt: new Date(Date.now() - 3600000 * 3), // 3 hours ago
  canBid: true,
  canNegotiate: true,
  status: 'active',
};


export default function PostingDetailPage({ params }: { params: { id: string } }) {
    // TODO: Fetch actual ad data based on params.id
    // const { data: ad, isLoading, error } = useQuery(['posting', params.id], fetchPosting);
    const [isLoading, setIsLoading] = useState(false); // Add loading state for async operations like bidding/negotiating
    const { toast } = useToast();
    const [user, authLoading] = useAuthState(auth); // Get current user state

    /*
    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (error || !ad) {
        return <div>Error loading post or post not found.</div>;
    }
    */

    // Convert Firestore timestamp if needed
    const datePostedFormatted = ad.createdAt instanceof Date ? ad.createdAt.toLocaleDateString() : ad.createdAt?.toDate ? ad.createdAt.toDate().toLocaleDateString() : 'N/A';

    // TODO: Implement handlers for bid, negotiate, favorite, share, report
    const handleBidSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        console.log("Submitting bid...");
        // Add server action call here
        setTimeout(() => {
             toast({ description: "Bid submitted (Simulated)" });
             setIsLoading(false);
             (e.target as HTMLFormElement).reset();
        }, 1000);
    };

     const handleNegotiateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        console.log("Sending offer...");
        // Add server action call here
        setTimeout(() => {
             toast({ description: "Offer sent (Simulated)" });
             setIsLoading(false);
             (e.target as HTMLFormElement).reset();
        }, 1000);
    };

     const handleToggleFavorite = () => {
        if (!user) return toast({ title: "Login Required", variant: "destructive" });
        console.log("Toggling favorite...");
        // Add server action call here
        toast({ description: "Favorite status toggled (Simulated)" });
     }

     const handleShare = () => {
        console.log("Sharing...");
        // Add share logic (navigator.share or copy link)
        toast({ description: "Share functionality not implemented." });
     }

     const handleReport = () => {
        if (!user) return toast({ title: "Login Required", variant: "destructive" });
        console.log("Reporting ad...");
        // Add server action call here
        toast({ description: "Ad reported (Simulated)", variant: "destructive" });
     }

     const handleContactSeller = () => {
         if (!user) return toast({ title: "Login Required", variant: "destructive" });
         console.log("Initiating chat...");
         // Redirect to chat page with seller ID
         // router.push(`/chat?userId=${ad.userId}`) // Assuming router is imported
         toast({ description: "Chat functionality not implemented." });
     }


    return (
        <div className="container mx-auto px-4 py-8">
            {authLoading && <LoadingSpinner />} {/* Show spinner if auth state is loading */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                {/* Left Column (Image & Description) */}
                <div className="md:col-span-2 space-y-6">
                    {/* Image Gallery */}
                    <Card className="overflow-hidden shadow-md">
                        <div className="relative aspect-[4/3] bg-muted">
                            {/* Main Image - TODO: Implement image selection/carousel */}
                            <Image
                                src={ad.imageUrls?.[0] || 'https://picsum.photos/800/600'}
                                alt={ad.title || 'Posting image'}
                                fill
                                style={{ objectFit: 'cover' }}
                                priority
                                data-ai-hint="posting detail image"
                            />
                             {/* Badge Overlay */}
                             <div className="absolute top-2 left-2 z-10">
                                <Badge
                                    variant={ad.postType === 'need' ? 'destructive' : 'default'}
                                    className="text-xs py-0.5 px-1.5 rounded-sm shadow"
                                >
                                    {ad.postType === 'need' ? 'Need' : 'Offer'}
                                </Badge>
                             </div>
                        </div>
                         {/* Thumbnails - TODO: Add carousel logic */}
                         {ad.imageUrls && ad.imageUrls.length > 1 && (
                            <div className="flex gap-2 p-2 border-t overflow-x-auto">
                                {ad.imageUrls.map((url, index) => (
                                    <div key={index} className="relative h-16 w-16 shrink-0 cursor-pointer border rounded hover:border-primary">
                                         <Image
                                            src={url}
                                            alt={`Thumbnail ${index + 1}`}
                                            fill
                                            style={{ objectFit: 'cover' }}
                                            className="rounded"
                                            data-ai-hint="posting thumbnail"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    {/* Ad Details */}
                    <Card className="shadow-md">
                        <CardHeader>
                            <CardTitle className="text-2xl">{ad.title || 'Untitled Post'}</CardTitle>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground pt-2">
                                <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {ad.location || 'N/A'}</span>
                                <span className="flex items-center gap-1"><Tag className="h-4 w-4" /> {ad.category || 'N/A'}</span>
                                <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> Posted {datePostedFormatted}</span>
                            </div>
                             <p className="font-semibold text-lg text-primary pt-2 flex items-center gap-1">
                                <IndianRupee className="h-5 w-5" /> {ad.budget || 'N/A'}
                            </p>
                        </CardHeader>
                        <CardContent>
                            <h3 className="text-lg font-semibold mb-2">Description</h3>
                            <p className="text-muted-foreground whitespace-pre-line">{ad.description || 'No description available.'}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column (Actions & Seller Info) */}
                <div className="md:col-span-1 space-y-4">
                    {/* Actions Card */}
                     <Card className="shadow-md">
                        <CardHeader>
                             <CardTitle>Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                             {ad?.canBid && (
                                <form onSubmit={handleBidSubmit} className="border rounded-lg p-3 bg-muted/30 space-y-2">
                                    <h4 className="text-sm font-medium">Submit a Bid</h4>
                                    <Input type="number" name="bidAmount" placeholder="Your Bid (₹)" required className="mb-2 bg-background" disabled={isLoading}/>
                                    <Button size="sm" className="w-full" type="submit" disabled={isLoading}>
                                       {isLoading ? <LoadingSpinner showText={false} className="h-4 w-4"/> : 'Submit Bid'}
                                    </Button>
                                </form>
                            )}
                            {ad?.canNegotiate && (
                                <form onSubmit={handleNegotiateSubmit} className="border rounded-lg p-3 bg-muted/30 space-y-2">
                                     <h4 className="text-sm font-medium">Negotiate Price</h4>
                                     <Input type="number" name="offerAmount" placeholder="Your Offer (₹)" required className="mb-2 bg-background" disabled={isLoading}/>
                                     <Button size="sm" className="w-full" type="submit" disabled={isLoading}>
                                         {isLoading ? <LoadingSpinner showText={false} className="h-4 w-4"/> : 'Send Offer'}
                                     </Button>
                                </form>
                            )}
                             <Button variant="default" className="w-full" onClick={handleContactSeller} disabled={isLoading}>
                                 <MessageSquare className="mr-2 h-4 w-4" /> Contact Poster
                             </Button>
                             <div className="grid grid-cols-3 gap-2">
                                 <Button variant="outline" size="sm" className="w-full" onClick={handleToggleFavorite} disabled={isLoading}>
                                     <Heart className="mr-1 h-4 w-4" /> Favorite
                                 </Button>
                                 <Button variant="outline" size="sm" className="w-full" onClick={handleShare} disabled={isLoading}>
                                     <Share2 className="mr-1 h-4 w-4" /> Share
                                 </Button>
                                 <Button variant="outline" size="sm" className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={handleReport} disabled={isLoading}>
                                      <Flag className="mr-1 h-4 w-4" /> Report
                                 </Button>
                             </div>
                        </CardContent>
                     </Card>

                     {/* User Info Card */}
                     <Card className="shadow-md">
                        <CardHeader>
                            <CardTitle>Poster Information</CardTitle>
                            {/* Add placeholder for seller details */}
                            <CardDescription>Details about the person who posted this.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-center gap-4">
                             <Avatar className="h-12 w-12">
                                <AvatarImage src="https://picsum.photos/id/102/100/100" alt="Seller Avatar" data-ai-hint="seller avatar"/>
                                <AvatarFallback>SN</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">Seller Name (Mock)</p>
                                <p className="text-xs text-muted-foreground">Member since Mock Date</p>
                                {/* Optional: Add verification badge */}
                                {/* <Badge variant="secondary" className="mt-1 text-xs"><UserCheck className="h-3 w-3 mr-1"/>Verified</Badge> */}
                            </div>
                        </CardContent>
                         <CardFooter>
                            {/* Optional: Link to seller's profile page */}
                            {/* <Button variant="outline" size="sm" asChild><Link href={`/profile/${ad.userId}`}>View Profile</Link></Button> */}
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}
