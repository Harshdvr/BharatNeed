
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import LoadingSpinner from "@/components/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, IndianRupee, MapPin, Tag, Clock, MessageSquare, Heart, Share2, Flag, ChevronLeft, ChevronRight } from "lucide-react"; // Added Chevron icons
import Image from "next/image";
import Link from "next/link";
import { useToast } from '@/hooks/use-toast';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, firestore, ensureFirestoreInitialized } from '@/lib/firebase/clientApp';
import { useState } from 'react';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
// Import Swiper styles - **NOTE: Requires `npm install swiper`**
// import 'swiper/css';
// import 'swiper/css/navigation';
// import 'swiper/css/pagination';
// Import Swiper React components - **NOTE: Requires `npm install swiper`**
// import { Swiper, SwiperSlide } from 'swiper/react';
// import { Navigation, Pagination } from 'swiper/modules';

interface Posting {
    id: string;
    status?: 'active' | 'pending' | 'inactive';
    title?: string;
    category?: string;
    location?: string;
    budget?: string;
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
    'https://picsum.photos/seed/anotherangle/800/600' // Added another image
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
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const [user, authLoading] = useAuthState(auth);
    const router = useRouter();

    // Convert Firestore timestamp if needed
    const datePostedFormatted = ad.createdAt instanceof Date ? ad.createdAt.toLocaleDateString() : ad.createdAt?.toDate ? ad.createdAt.toDate().toLocaleDateString() : 'N/A';

    // Handlers remain the same
    const handleBidSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        console.log("Submitting bid...");
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
        setTimeout(() => {
             toast({ description: "Offer sent (Simulated)" });
             setIsLoading(false);
             (e.target as HTMLFormElement).reset();
        }, 1000);
    };

     const handleToggleFavorite = () => {
        if (!user) return toast({ title: "Login Required", variant: "destructive" });
        console.log("Toggling favorite...");
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
            navigator.clipboard.writeText(window.location.href);
            toast({ description: "Link copied to clipboard!" });
        }
     }

     const handleReport = () => {
        if (!user) return toast({ title: "Login Required", variant: "destructive" });
        console.log("Reporting ad...");
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


    return (
        <div className="container mx-auto px-4 py-8">
            {authLoading && <LoadingSpinner />}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                {/* Left Column (Image & Description) */}
                <div className="md:col-span-2 space-y-6">
                    {/* Image Gallery - Using Swiper */}
                    <Card className="overflow-hidden shadow-md relative group"> {/* Added group for navigation buttons */}
                         {/* **NOTE: Requires `npm install swiper` and uncommenting imports above ** */}
                         {/* <Swiper
                            modules={[Navigation, Pagination]}
                            spaceBetween={0}
                            slidesPerView={1}
                            navigation={{
                                nextEl: '.swiper-button-next',
                                prevEl: '.swiper-button-prev',
                            }}
                            pagination={{ clickable: true }}
                            className="relative aspect-[4/3]"
                        >
                            {(ad.imageUrls && ad.imageUrls.length > 0) ? ad.imageUrls.map((url, index) => (
                                <SwiperSlide key={index} className="bg-muted">
                                    <Image
                                        src={url}
                                        alt={`${ad.title || 'Posting image'} ${index + 1}`}
                                        fill
                                        style={{ objectFit: 'cover' }}
                                        priority={index === 0} // Prioritize first image
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 800px"
                                        data-ai-hint="posting detail image"
                                    />
                                </SwiperSlide>
                            )) : (
                                <SwiperSlide className="bg-muted flex items-center justify-center">
                                     <Image
                                        src={'https://picsum.photos/800/600'} // Default placeholder
                                        alt={ad.title || 'Posting image'}
                                        fill
                                        style={{ objectFit: 'cover' }}
                                        priority
                                        data-ai-hint="posting detail image placeholder"
                                    />
                                </SwiperSlide>
                            )} */}

                            {/* --- Placeholder Structure (if Swiper is not installed) --- */}
                            <div className="relative aspect-[4/3] bg-muted">
                                <Image
                                    src={ad.imageUrls?.[0] || 'https://picsum.photos/800/600'}
                                    alt={ad.title || 'Posting image'}
                                    fill
                                    style={{ objectFit: 'cover' }}
                                    priority
                                    data-ai-hint="posting detail image"
                                />
                                {/* Simple static buttons for placeholder */}
                                {ad.imageUrls && ad.imageUrls.length > 1 && (
                                    <>
                                        <Button variant="ghost" size="icon" className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-background/50 hover:bg-background/80 text-foreground">
                                            <ChevronLeft/>
                                        </Button>
                                        <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-background/50 hover:bg-background/80 text-foreground">
                                            <ChevronRight/>
                                        </Button>
                                    </>
                                )}
                            </div>
                             <p className="text-center text-xs text-muted-foreground p-1">(Carousel/Swipe functionality requires 'swiper' installation)</p>
                            {/* --- End Placeholder Structure --- */}


                            {/* Badge Overlay (remains the same) */}
                             <div className="absolute top-2 left-2 z-10">
                                <Badge
                                    variant={ad.postType === 'need' ? 'destructive' : 'default'}
                                    className="text-xs py-0.5 px-1.5 rounded-sm shadow"
                                >
                                    {ad.postType === 'need' ? 'Need' : 'Offer'}
                                </Badge>
                             </div>

                              {/* Swiper Navigation Buttons (requires swiper) */}
                              {/* {ad.imageUrls && ad.imageUrls.length > 1 && (
                                 <>
                                    <Button variant="ghost" size="icon" className="swiper-button-prev absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-background/50 hover:bg-background/80 text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ChevronLeft/>
                                    </Button>
                                    <Button variant="ghost" size="icon" className="swiper-button-next absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-background/50 hover:bg-background/80 text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ChevronRight/>
                                    </Button>
                                 </>
                             )} */}
                    </Card>

                    {/* Ad Details */}
                    <Card className="shadow-md">
                        <CardHeader>
                            <CardTitle className="text-2xl">{ad.title || 'Untitled Post'}</CardTitle>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground pt-2">
                                <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {ad.location || 'N/A'}</span>
                                <span className="flex items-center gap-1"><Tag className="h-4 w-4" /> {ad.category || 'N/A'}</span>
                                {/* Hiding date for now, as Swiper might cover it */}
                                {/* <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> Posted {datePostedFormatted}</span> */}
                            </div>
                             <p className="font-semibold text-lg text-primary pt-2 flex items-center gap-1">
                                <IndianRupee className="h-5 w-5" /> {ad.budget || 'N/A'}
                            </p>
                        </CardHeader>
                        <CardContent>
                            <h3 className="text-lg font-semibold mb-2">Description</h3>
                            <p className="text-muted-foreground whitespace-pre-line">{ad.description || 'No description available.'}</p>
                        </CardContent>
                         {/* Add Posted Date here if removed from header */}
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
                             <Button variant="default" className="w-full" onClick={handleContactSeller} disabled={isLoading || authLoading || user?.uid === ad.userId}>
                                 <MessageSquare className="mr-2 h-4 w-4" />
                                 {user?.uid === ad.userId ? "Your Post" : "Contact Poster"}
                             </Button>
                             <div className="grid grid-cols-3 gap-2">
                                 <Button variant="outline" size="sm" className="w-full" onClick={handleToggleFavorite} disabled={isLoading || authLoading}>
                                     <Heart className="mr-1 h-4 w-4" /> Favorite
                                 </Button>
                                 <Button variant="outline" size="sm" className="w-full" onClick={handleShare} disabled={isLoading}>
                                     <Share2 className="mr-1 h-4 w-4" /> Share
                                 </Button>
                                 <Button variant="outline" size="sm" className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={handleReport} disabled={isLoading || authLoading}>
                                      <Flag className="mr-1 h-4 w-4" /> Report
                                 </Button>
                             </div>
                        </CardContent>
                     </Card>

                     {/* User Info Card */}
                     <Card className="shadow-md">
                        <CardHeader>
                            <CardTitle>Poster Information</CardTitle>
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
                                {/* <Badge variant="secondary" className="mt-1 text-xs"><UserCheck className="h-3 w-3 mr-1"/>Verified</Badge> */}
                            </div>
                        </CardContent>
                         {/* <CardFooter>
                            <Button variant="outline" size="sm" asChild><Link href={`/profile/${ad.userId}`}>View Profile</Link></Button>
                        </CardFooter> */}
                    </Card>
                </div>
            </div>
        </div>
    );
}
