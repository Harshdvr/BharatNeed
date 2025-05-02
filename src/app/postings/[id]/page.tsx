'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import LoadingSpinner from "@/components/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, IndianRupee, MapPin, Tag, Clock, MessageSquare, Heart, Share2, Flag, ChevronLeft, ChevronRight, ArrowDown, ArrowUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useToast } from '@/hooks/use-toast';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, firestore, ensureFirestoreInitialized } from '@/lib/firebase/clientApp';
import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, getDocs, deleteDoc, doc, getDoc, addDoc, serverTimestamp, onSnapshot, orderBy } from 'firebase/firestore'; // Added Firestore imports
import { useRouter } from 'next/navigation';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface Posting {
    id: string;
    status?: 'active' | 'pending' | 'inactive';
    title?: string;
    category?: string;
    location?: string;
    budget?: string; // Original budget/price set by poster
    description?: string;
    imageUrls?: string[];
    canBid?: boolean;
    canNegotiate?: boolean;
    views?: number;
    datePosted?: any;
    userId?: string;
    createdAt?: any;
    postType?: 'need' | 'offer';
    urgency?: 'low' | 'medium' | 'high' | 'urgent';
}

// Interface for a Bid document
interface Bid {
    id: string;
    bidderId: string;
    bidAmount: number;
    timestamp: any; // Firestore Timestamp
    // Optional fields
    bidderName?: string;
    bidderAvatar?: string;
}

// Mock Data - Replace with actual data fetching
const initialAd: Posting = {
  id: 'mockPost123', // This will be replaced by params.id
  title: 'Loading Posting Details...',
  description: 'Loading description...',
  category: 'Loading...',
  postType: 'need',
  location: 'Loading...',
  budget: 'Loading...',
  urgency: 'medium',
  imageUrls: ['https://picsum.photos/800/600'], // Placeholder image
  userId: '',
  createdAt: null,
  canBid: true,
  canNegotiate: true,
  status: 'active',
};


export default function PostingDetailPage({ params }: { params: { id: string } }) {
    const [ad, setAd] = useState<Posting>(initialAd); // State for the posting details
    const [bids, setBids] = useState<Bid[]>([]); // State for bids
    const [isLoadingPost, setIsLoadingPost] = useState(true); // Loading state for post details
    const [isLoadingBids, setIsLoadingBids] = useState(true); // Loading state for bids
    const [isSubmittingBid, setIsSubmittingBid] = useState(false); // Loading state for bid submission
    const [isSubmittingOffer, setIsSubmittingOffer] = useState(false); // Loading state for negotiation offer
    const { toast } = useToast();
    const [user, authLoading] = useAuthState(auth);
    const router = useRouter();
    const [isClient, setIsClient] = useState(false);
    const [bidAmountInput, setBidAmountInput] = useState(''); // State for bid input field
    const [offerAmountInput, setOfferAmountInput] = useState(''); // State for negotiation input

    useEffect(() => {
        setIsClient(true); // Component has mounted
    }, []);

    // Fetch Posting Details
    useEffect(() => {
        if (!params.id || !firestore) return;

        setIsLoadingPost(true);
        const postRef = doc(firestore, 'postings', params.id);

        const unsubscribe = onSnapshot(postRef, (docSnap) => {
            if (docSnap.exists()) {
                setAd({ id: docSnap.id, ...docSnap.data() } as Posting);
            } else {
                console.error("Posting not found");
                toast({ title: "Error", description: "Posting not found.", variant: "destructive" });
                setAd(initialAd); // Reset or show error state
            }
            setIsLoadingPost(false);
        }, (error) => {
            console.error("Error fetching posting details:", error);
            toast({ title: "Error", description: "Could not load posting details.", variant: "destructive" });
            setIsLoadingPost(false);
        });

        // Cleanup listener on unmount
        return () => unsubscribe();

    }, [params.id, toast]);


    // Fetch Bids in Real-time
     useEffect(() => {
        if (!params.id || !firestore) return;

        setIsLoadingBids(true);
        const bidsRef = collection(firestore, 'postings', params.id, 'bids');
        const q = query(bidsRef, orderBy('bidAmount', 'asc')); // Order bids to easily find min/max

        const unsubscribeBids = onSnapshot(q, (querySnapshot) => {
            const fetchedBids = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bid));
            setBids(fetchedBids);
            setIsLoadingBids(false);
        }, (error) => {
            console.error("Error fetching bids:", error);
            toast({ title: "Error", description: "Could not load bids.", variant: "destructive" });
            setIsLoadingBids(false);
        });

        // Cleanup listener on unmount
        return () => unsubscribeBids();

    }, [params.id, toast]);

    // Calculate min, max, and count from bids state
    const { minBid, maxBid, bidCount } = useMemo(() => {
        if (!bids || bids.length === 0) {
            return { minBid: undefined, maxBid: undefined, bidCount: 0 };
        }
        const amounts = bids.map(b => b.bidAmount);
        return {
            minBid: Math.min(...amounts),
            maxBid: Math.max(...amounts),
            bidCount: bids.length,
        };
    }, [bids]);


    const datePostedFormatted = ad.createdAt instanceof Date
        ? ad.createdAt.toLocaleDateString()
        : ad.createdAt?.toDate
        ? ad.createdAt.toDate().toLocaleDateString()
        : 'N/A';


    // Updated Bid Submission Handler
    const handleBidSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user) return toast({ title: "Login Required", variant: "destructive" });
        if (!bidAmountInput || isNaN(parseFloat(bidAmountInput)) || parseFloat(bidAmountInput) <= 0) {
             return toast({ title: "Invalid Bid", description: "Please enter a valid bid amount.", variant: "destructive"});
        }

        const bidAmount = parseFloat(bidAmountInput);
        setIsSubmittingBid(true);
        console.log("Submitting bid:", bidAmount);

        try {
            const fs = ensureFirestoreInitialized();
            const bidsCollectionRef = collection(fs, 'postings', params.id, 'bids');
            await addDoc(bidsCollectionRef, {
                bidderId: user.uid,
                bidAmount: bidAmount,
                timestamp: serverTimestamp(),
                // Optional: Add bidder name/avatar if needed for display, fetch from user profile
                bidderName: user.displayName || 'Anonymous',
            });
            toast({ description: "Bid submitted successfully!" });
            setBidAmountInput(''); // Clear input field
        } catch (error: any) {
             console.error("Error submitting bid:", error);
             toast({ title: "Error", description: `Could not submit bid. ${error.message}`, variant: "destructive" });
        } finally {
             setIsSubmittingBid(false);
        }
    };

     const handleNegotiateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user) return toast({ title: "Login Required", variant: "destructive" });
         // Basic validation
         if (!offerAmountInput || isNaN(parseFloat(offerAmountInput)) || parseFloat(offerAmountInput) <= 0) {
            return toast({ title: "Invalid Offer", description: "Please enter a valid offer amount.", variant: "destructive"});
         }
        const offerAmount = parseFloat(offerAmountInput);
        setIsSubmittingOffer(true);
        console.log("Sending offer...", offerAmount);
         // TODO: Implement negotiation logic (e.g., sending a chat message with the offer)
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast({ description: `Offer of ₹${offerAmount} sent (Simulated)` });
        setOfferAmountInput(''); // Clear input field
        setIsSubmittingOffer(false);
    };

     const handleToggleFavorite = async () => {
        if (!user || !firestore) return toast({ title: "Login Required", variant: "destructive" });
        console.log("Toggling favorite...");
        // TODO: Implement actual Firestore favorite update logic in user's profile
        await new Promise(resolve => setTimeout(resolve, 500));
        toast({ description: "Favorite status toggled (Simulated)" });
     }

     const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: ad.title || 'Check out this listing on BharatNeed',
                text: ad.description || 'Found this on BharatNeed!',
                url: window.location.href,
            })
            .then(() => console.log('Successful share'))
            .catch((error) => console.log('Error sharing', error));
        } else {
             try {
                navigator.clipboard.writeText(window.location.href);
                toast({ description: "Link copied to clipboard!" });
             } catch (err) {
                toast({ description: "Could not copy link.", variant: "destructive"});
             }
        }
     }

     const handleReport = async () => {
        if (!user) return toast({ title: "Login Required", variant: "destructive" });
        console.log("Reporting ad...");
        // TODO: Implement reporting logic (e.g., save report to Firestore)
        await new Promise(resolve => setTimeout(resolve, 500));
        toast({ description: "Ad reported (Simulated)", variant: "destructive" });
     }

     const handleContactSeller = () => {
         if (!user) {
            toast({ title: "Login Required", description: "Please log in to contact the poster.", variant: "destructive" });
            return;
         }
         if (!ad.userId) {
             toast({ title: "Error", description: "Poster ID not found.", variant: "destructive" });
             return;
         }
         if (user.uid === ad.userId) {
            toast({ description: "You cannot contact yourself." });
            return;
         }
         console.log("Redirecting to chat...");
         router.push(`/chat?contact=${ad.userId}&post=${ad.id}`);
     }

     // Show main loading spinner if post details or auth state is loading initially
     if (isLoadingPost || authLoading) {
         return <div className="flex justify-center items-center min-h-[60vh]"><LoadingSpinner /></div>;
     }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                {/* Left Column (Image & Description) */}
                <div className="md:col-span-2 space-y-6">
                    {/* Image Gallery */}
                    <Card className="overflow-hidden shadow-md relative group">
                           {isClient && ad.imageUrls && ad.imageUrls.length > 0 ? (
                               <Swiper
                                   modules={[Navigation, Pagination]}
                                   spaceBetween={0}
                                   slidesPerView={1}
                                   navigation
                                   pagination={{ clickable: true }}
                                   className="relative aspect-[4/3] bg-muted" // Use aspect ratio for consistent size
                               >
                                   {ad.imageUrls.map((url, index) => (
                                       <SwiperSlide key={index}>
                                           <div className="relative w-full h-full">
                                                <Image
                                                    src={url || 'https://picsum.photos/800/600'}
                                                    alt={`${ad.title || 'Posting image'} ${index + 1}`}
                                                    fill
                                                    style={{ objectFit: 'cover' }}
                                                    priority={index === 0} // Prioritize first image
                                                    sizes="(max-width: 768px) 100vw, 66vw"
                                                    data-ai-hint="posting detail image"
                                                />
                                           </div>
                                       </SwiperSlide>
                                   ))}
                                    <div className="absolute top-2 left-2 z-10">
                                        <Badge
                                            variant={ad.postType === 'need' ? 'destructive' : 'default'}
                                            className="text-xs py-0.5 px-1.5 rounded-sm shadow"
                                        >
                                            {ad.postType === 'need' ? 'Need' : 'Offer'}
                                        </Badge>
                                    </div>
                               </Swiper>
                           ) : (
                               <div className="relative aspect-[4/3] bg-muted flex items-center justify-center">
                                   <LoadingSpinner showText={false} />
                               </div>
                           )}
                    </Card>

                    {/* Ad Details */}
                    <Card className="shadow-md">
                        <CardHeader>
                            <CardTitle className="text-2xl">{ad.title || 'Loading...'}</CardTitle>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground pt-2">
                                <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {ad.location || 'N/A'}</span>
                                <span className="flex items-center gap-1"><Tag className="h-4 w-4" /> {ad.category || 'N/A'}</span>
                            </div>
                             {/* Display Poster's Original Budget */}
                             <p className="text-sm text-muted-foreground pt-3">
                                {ad.budget || 'No budget specified'}
                             </p>
                             {/* Display Current Bid Range if applicable */}
                             {ad.canBid && (
                                <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2 text-base font-semibold text-primary">
                                     {isLoadingBids ? (
                                         <span className="text-sm font-normal text-muted-foreground">Loading bids...</span>
                                     ) : bidCount > 0 ? (
                                         <>
                                             {minBid && (
                                                 <span className="flex items-center gap-1">
                                                     <ArrowDown className="h-4 w-4 text-green-600" /> Min Bid: ₹{minBid.toLocaleString()}
                                                 </span>
                                             )}
                                             {maxBid && (
                                                 <span className="flex items-center gap-1">
                                                     <ArrowUp className="h-4 w-4 text-red-600" /> Max Bid: ₹{maxBid.toLocaleString()}
                                                 </span>
                                             )}
                                             <span className="text-sm font-normal text-muted-foreground">({bidCount} bid{bidCount !== 1 ? 's' : ''})</span>
                                         </>
                                     ) : (
                                        <span className="text-sm font-normal text-muted-foreground">No bids yet.</span>
                                     )}
                                </div>
                            )}
                        </CardHeader>
                        <CardContent>
                            <h3 className="text-lg font-semibold mb-2 mt-4 border-t pt-4">Description</h3>
                            <p className="text-muted-foreground whitespace-pre-line">{ad.description || 'No description available.'}</p>
                        </CardContent>
                         <CardFooter className="text-sm text-muted-foreground pt-4 border-t">
                             <Clock className="h-4 w-4 mr-1.5"/> Posted {datePostedFormatted}
                         </CardFooter>
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
                             {/* Bid Form */}
                             {ad?.canBid && (
                                <form onSubmit={handleBidSubmit} className="border rounded-lg p-3 bg-muted/30 space-y-2">
                                    <h4 className="text-sm font-medium">Submit Your Bid</h4>
                                    <Input
                                        type="number"
                                        name="bidAmount"
                                        placeholder={bidCount > 0 ? `Current: ₹${minBid || '?'} - ₹${maxBid || '?'}` : "Your Bid Amount (₹)"}
                                        required
                                        min="0" // Ensure non-negative bids
                                        step="any" // Allow decimals if needed
                                        value={bidAmountInput}
                                        onChange={(e) => setBidAmountInput(e.target.value)}
                                        className="mb-2 bg-background"
                                        disabled={isSubmittingBid || authLoading || user?.uid === ad.userId}
                                    />
                                    <Button size="sm" className="w-full" type="submit" disabled={isSubmittingBid || authLoading || user?.uid === ad.userId}>
                                       {isSubmittingBid ? <LoadingSpinner showText={false} className="h-4 w-4"/> : 'Submit Bid'}
                                    </Button>
                                </form>
                            )}
                             {/* Negotiate Form */}
                            {ad?.canNegotiate && (
                                <form onSubmit={handleNegotiateSubmit} className="border rounded-lg p-3 bg-muted/30 space-y-2">
                                     <h4 className="text-sm font-medium">Make an Offer</h4>
                                     <Input
                                        type="number"
                                        name="offerAmount"
                                        placeholder="Your Offer Amount (₹)"
                                        required
                                        min="0"
                                        step="any"
                                        value={offerAmountInput}
                                        onChange={(e) => setOfferAmountInput(e.target.value)}
                                        className="mb-2 bg-background"
                                        disabled={isSubmittingOffer || authLoading || user?.uid === ad.userId}/>
                                     <Button size="sm" className="w-full" type="submit" disabled={isSubmittingOffer || authLoading || user?.uid === ad.userId}>
                                         {isSubmittingOffer ? <LoadingSpinner showText={false} className="h-4 w-4"/> : 'Send Offer'}
                                     </Button>
                                </form>
                            )}
                             {/* Contact Button */}
                             <Button variant="default" className="w-full" onClick={handleContactSeller} disabled={authLoading || user?.uid === ad.userId}>
                                 <MessageSquare className="mr-2 h-4 w-4" />
                                 {user?.uid === ad.userId ? "Your Post" : "Contact Poster"}
                             </Button>
                              {/* Other Actions */}
                             <div className="grid grid-cols-3 gap-2">
                                 <Button variant="outline" size="sm" className="w-full" onClick={handleToggleFavorite} disabled={authLoading}>
                                     <Heart className="mr-1 h-4 w-4" /> Favorite
                                 </Button>
                                 <Button variant="outline" size="sm" className="w-full" onClick={handleShare}>
                                     <Share2 className="mr-1 h-4 w-4" /> Share
                                 </Button>
                                 <Button variant="outline" size="sm" className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={handleReport} disabled={authLoading}>
                                      <Flag className="mr-1 h-4 w-4" /> Report
                                 </Button>
                             </div>
                        </CardContent>
                     </Card>

                     {/* User Info Card - TODO: Fetch actual poster info */}
                     <Card className="shadow-md">
                        <CardHeader>
                            <CardTitle>Poster Information</CardTitle>
                            <CardDescription>Details about the person who posted this.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-center gap-4">
                             <Avatar className="h-12 w-12">
                                {/* TODO: Replace with actual poster avatar */}
                                <AvatarImage src="https://avatar.vercel.sh/poster-uid.png" alt="Poster Avatar" data-ai-hint="seller avatar"/>
                                <AvatarFallback>{ad.userId?.charAt(0)?.toUpperCase() || 'P'}</AvatarFallback>
                            </Avatar>
                            <div>
                                {/* TODO: Replace with actual poster name */}
                                <p className="font-semibold">Poster Name (Loading...)</p>
                                {/* TODO: Replace with actual member since date */}
                                <p className="text-xs text-muted-foreground">Member since Loading...</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
