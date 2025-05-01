
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
import { usePathname, useRouter } from 'next/navigation'; // Using App Router hook, added useRouter
import { useToast } from '@/hooks/use-toast'; // Import useToast
import { useAuthState } from 'react-firebase-hooks/auth'; // Import auth hook
import { auth, firestore } from '@/lib/firebase/clientApp'; // Import Firebase instances
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore'; // Import Firestore functions
import { formatDistanceToNow } from 'date-fns'; // For relative time

// Define posting type structure - adjust based on your actual data model
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
    createdAt: any; // Firestore Timestamp or Date
    sellerName: string; // Name of the poster (fetched separately or stored with post)
    sellerId: string; // ID of the poster
    sellerSince?: string; // Date poster joined (fetched separately)
    phone?: string | null; // Poster's phone (optional, fetched separately)
    verified?: boolean; // Poster's verification status (fetched separately)
    isFavorite?: boolean; // Whether the current user favorited this post
}

// Fetch posting details and related user data
const getPostingDetails = async (id: string, db: typeof firestore | null, currentUserId: string | null): Promise<Posting | null> => {
    if (!db) return null;
    console.log(`Fetching details for ID: ${id}`);
    try {
        const postRef = doc(db, 'postings', id); // Adjust collection name
        const postSnap = await getDoc(postRef);

        if (postSnap.exists()) {
            const postData = postSnap.data();
            let sellerName = 'Unknown User';
            let sellerSince = 'N/A';
            let sellerPhone = null;
            let sellerVerified = false;

            // Fetch related user data if userId exists
            if (postData.userId) {
                try {
                    const userRef = doc(db, 'users', postData.userId);
                    const userSnap = await getDoc(userRef);
                    if (userSnap.exists()) {
                        const userData = userSnap.data();
                        sellerName = userData.name || 'Unnamed User';
                        // Ensure createdAt exists and is a timestamp before converting
                        sellerSince = userData.createdAt?.toDate ? formatDistanceToNow(userData.createdAt.toDate(), { addSuffix: true }) : 'N/A';
                        sellerPhone = userData.phone || null; // Check privacy settings if needed
                        sellerVerified = userData.isVerified || false; // Assuming 'isVerified' field exists in user doc
                    }
                } catch (userError) {
                    console.error("Error fetching user data:", userError);
                }
            }

            // Check if current user favorited this post
            let isFavorite = false;
            if (currentUserId) {
                try {
                     const currentUserRef = doc(db, 'users', currentUserId);
                     const currentUserSnap = await getDoc(currentUserRef);
                     if (currentUserSnap.exists()) {
                        const currentUserData = currentUserSnap.data();
                        isFavorite = currentUserData.favorites?.includes(id) || false;
                     }
                } catch(favError) {
                     console.error("Error checking favorite status:", favError);
                }
            }

            return {
                id: postSnap.id,
                type: postData.type || 'Need',
                title: postData.title || 'Untitled Post',
                category: postData.category || 'Uncategorized',
                location: postData.location || 'N/A',
                urgency: postData.urgency || 'N/A',
                budget: postData.budget || 'N/A',
                description: postData.description || 'No description',
                image: postData.image || null,
                createdAt: postData.createdAt || null,
                sellerId: postData.userId || 'unknown',
                sellerName: sellerName,
                sellerSince: sellerSince,
                phone: sellerPhone,
                verified: sellerVerified,
                isFavorite: isFavorite,
            } as Posting;
        } else {
            console.log("No such posting document!");
            return null;
        }
    } catch (error) {
        console.error("Error getting posting document:", error);
        return null;
    }
};


export default function PostingDetailPage({ params }: { params: { id: string } }) {
    const pathname = usePathname();
    const { toast } = useToast();
    const router = useRouter();
    // Safely use useAuthState
    const [user, authLoading, authError] = auth ? useAuthState(auth) : [null, true, new Error("Auth not initialized")];
    const [posting, setPosting] = useState<Posting | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showingPhone, setShowingPhone] = useState(false); // State for showing phone number

    useEffect(() => {
        const fetchDetails = async () => {
            setIsLoading(true);
            setError(null);
            setShowingPhone(false); // Reset phone view on new load

            if (!firestore) {
                setError('Database connection failed.');
                setIsLoading(false);
                return;
            }

            // Wait until auth state is resolved before fetching
            if (authLoading) {
                 // Still loading auth state, wait...
                 return;
            }

             // Handle auth errors during fetch setup
            if (authError) {
                console.error("Firebase Auth Hook Error:", authError);
                setError('Authentication error.');
                setIsLoading(false);
                 // Optionally redirect or show login prompt
                 // router.push('/login');
                return;
            }


            try {
                // Pass current user's UID (or null if not logged in)
                const data = await getPostingDetails(params.id, firestore, user?.uid || null);
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
    }, [params.id, user, authLoading, authError]); // Refetch when ID, user, or loading state changes


    const handleShare = () => {
         if (!posting || typeof window === 'undefined') return;
        if (navigator.share) {
            navigator.share({
                title: posting.title,
                text: `Check out this posting on Bharat Need: ${posting.title}`,
                url: window.location.href,
            })
            .then(() => console.log('Successful share'))
            .catch((error) => console.log('Error sharing', error));
        } else {
             try {
                navigator.clipboard.writeText(window.location.href);
                toast({ description: 'Link copied to clipboard!' });
             } catch (err) {
                 toast({ description: 'Failed to copy link.', variant: 'destructive'});
             }
        }
    };

    const handleShowPhone = () => {
        if (user?.uid === posting?.sellerId) {
            toast({ description: "This is your contact number.", variant: "default" });
             setShowingPhone(true);
             return;
        }
        if (posting?.phone) {
            setShowingPhone(true);
            // TODO: Optionally track this event or require confirmation
            console.log("Showing phone number");
        } else {
            toast({ description: "Phone number not available for this user.", variant: "default" });
        }
    }

     const handleChatClick = () => {
        if (!user) {
            toast({ description: "Please log in to chat.", variant: "default"});
            router.push('/login'); // Redirect to login if not authenticated
            return;
        }
        if (!posting || user.uid === posting.sellerId) return; // Don't chat with self

        // Navigate to chat page with context
        router.push(`/chat?userId=${posting.sellerId}&postId=${posting.id}`);
        // toast({ description: "Chat functionality under development." });
     }

     const handleToggleFavorite = async () => {
        if (!user) {
            toast({ title: "Login Required", description: "Please log in to manage favorites.", variant: "default" });
            router.push('/login');
            return;
        }
        if (!posting || !firestore) {
             toast({ title: "Error", description: "Cannot update favorites.", variant: "destructive"});
             return;
        }

        const isCurrentlyFavorite = posting.isFavorite;

        // Optimistically update UI
        setPosting(prev => prev ? { ...prev, isFavorite: !isCurrentlyFavorite } : null);
        console.log(`Toggled favorite for post ${posting.id}. New state: ${!isCurrentlyFavorite}`);
        toast({
            description: !isCurrentlyFavorite ? "Added to favorites!" : "Removed from favorites.",
        });

        // Update Firestore
        try {
             const userDocRef = doc(firestore, 'users', user.uid);
             if (isCurrentlyFavorite) {
                await updateDoc(userDocRef, { favorites: arrayRemove(posting.id) });
             } else {
                // Ensure favorites array exists before trying to add to it
                await updateDoc(userDocRef, { favorites: arrayUnion(posting.id) }, { merge: true });
             }
            console.log("Firestore favorite status updated successfully.");
        } catch (error) {
             console.error("Error updating favorite status in Firestore:", error);
             toast({ title: "Error", description: "Failed to update favorites.", variant: "destructive" });
             // Revert optimistic update on failure
             setPosting(prev => prev ? { ...prev, isFavorite: isCurrentlyFavorite } : null);
        }
     };


    if (isLoading || authLoading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <LoadingSpinner />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-10">
                 <p className="text-destructive">{error}</p>
                 <Button onClick={() => window.location.reload()} className="mt-4">Retry</Button>
            </div>
        );
    }


    if (!posting) {
        return (
            <div className="text-center py-10">
                <p>Posting not found.</p>
                 <Button asChild className="mt-4">
                    <Link href="/">Go Home</Link>
                </Button>
            </div>
        );
    }

    // Safely format date only if createdAt is valid
    const postedDateFormatted = posting.createdAt?.toDate ? formatDistanceToNow(posting.createdAt.toDate(), { addSuffix: true }) : 'recently';


    return (
        <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                {/* Left Column (Image & Description) */}
                <div className="md:col-span-2 space-y-6">
                    {/* Image */}
                    <Card className="overflow-hidden shadow-lg rounded-lg">
                         <div className="relative aspect-video bg-muted">
                            <Image
                                src={posting.image || 'https://picsum.photos/600/400?random=' + posting.id} // Add random query for picsum
                                alt={posting.title}
                                fill
                                style={{ objectFit: 'cover' }}
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 800px"
                                priority // Prioritize loading the main image
                                data-ai-hint="product service image"
                            />
                            {/* Favorite Button Overlay on Image */}
                            {user && ( // Only show if user is logged in
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-2 right-2 z-10 h-9 w-9 rounded-full bg-background/70 text-destructive hover:bg-background hover:text-destructive focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                    onClick={handleToggleFavorite}
                                    aria-label={posting.isFavorite ? "Remove from favorites" : "Add to favorites"}
                                    disabled={user.uid === posting.sellerId} // Disable if it's user's own post
                                    >
                                    <Heart className={`h-5 w-5 transition-colors ${posting.isFavorite ? 'fill-destructive' : 'fill-transparent'}`} />
                                </Button>
                            )}
                         </div>
                    </Card>

                    {/* Description Card */}
                    <Card className="shadow-md rounded-lg">
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
                    <Card className="shadow-md rounded-lg">
                        <CardHeader className="pb-2">
                           <div className="flex justify-between items-start gap-2">
                                <span className="text-2xl font-bold text-primary flex items-center">
                                    <IndianRupee className="inline h-6 w-6 mr-1" /> {posting.budget}
                                </span>
                                <Button variant="ghost" size="icon" onClick={handleShare} aria-label="Share Posting">
                                     <Share2 className="h-5 w-5" />
                                </Button>
                           </div>
                            <CardTitle className="text-xl pt-1">{posting.title}</CardTitle>
                            <div className="flex justify-between items-center text-xs text-muted-foreground pt-2">
                                <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3"/>
                                    <span className='truncate'>{posting.location}</span>
                                </div>
                                <span>Posted {postedDateFormatted}</span>
                            </div>
                        </CardHeader>
                        <CardFooter className="pt-4 flex flex-wrap gap-2">
                             <Badge variant={posting.type === 'Need' ? 'destructive' : 'default'} className="text-xs">
                                {posting.type}
                             </Badge>
                             <Badge variant="secondary" className="ml-auto flex items-center gap-1 text-xs">
                                <Tag className="h-3 w-3"/> {posting.category}
                             </Badge>
                        </CardFooter>
                    </Card>

                     {/* Seller Info Card */}
                     <Card className="shadow-md rounded-lg">
                        <CardHeader>
                            <CardTitle className="text-lg">Posted by</CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-center gap-4">
                            <Avatar className="h-12 w-12">
                                {/* Use sellerId for consistent avatar generation */}
                                <AvatarImage src={posting.sellerId ? `https://avatar.vercel.sh/${posting.sellerId}.png` : undefined} alt={posting.sellerName} data-ai-hint="seller avatar" />
                                <AvatarFallback>{posting.sellerName?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                            </Avatar>
                            <div>
                                {/* TODO: Link to seller's profile page if available */}
                                <p className="font-semibold">{posting.sellerName}</p>
                                <p className="text-xs text-muted-foreground">Member {posting.sellerSince}</p>
                                {posting.verified && <Badge variant="secondary" className="mt-1 text-xs">Verified User</Badge>}
                            </div>
                        </CardContent>
                         <Separator />
                         <CardFooter className="flex flex-col gap-2 pt-4">
                           <Button className="w-full" size="lg" onClick={handleChatClick} disabled={user?.uid === posting.sellerId}>
                                <MessageSquare className="mr-2 h-5 w-5" />
                                {user?.uid === posting.sellerId ? "This is your post" : "Chat with Poster"}
                           </Button>
                           {showingPhone ? (
                                <a href={`tel:${posting.phone}`} className="flex items-center justify-center w-full p-2 border rounded bg-muted hover:bg-muted/80 transition-colors">
                                    <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium text-foreground">{posting.phone}</span>
                                </a>
                           ) : (
                                <Button variant="outline" className="w-full" size="lg" onClick={handleShowPhone} disabled={!posting.phone || user?.uid === posting.sellerId}>
                                    <Phone className="mr-2 h-5 w-5" />
                                    {user?.uid === posting.sellerId ? 'Your Phone' : (posting.phone ? 'Show Phone Number' : 'Phone not available')}
                                </Button>
                           )}
                         </CardFooter>
                    </Card>

                    {/* Location Map Placeholder */}
                    <Card className="shadow-md rounded-lg">
                        <CardHeader>
                            <CardTitle className="text-lg">Location</CardTitle>
                        </CardHeader>
                        <CardContent>
                           {/* TODO: Integrate actual map component */}
                           <div className="aspect-video bg-muted rounded-md flex items-center justify-center text-muted-foreground">
                                <MapPin className="h-8 w-8 mr-2"/>
                                <span className='text-center'>Map Placeholder for<br/>{posting.location}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

             {/* Related Postings Placeholder */}
            {/* TODO: Fetch and display related postings */}
            <div className="mt-12">
                <h2 className="text-2xl font-semibold mb-4">Related Postings</h2>
                 {/* TODO: Add LoadingSpinner while fetching related posts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Replace with actual related items */}
                    <Card className="text-center p-4 border-dashed border-muted-foreground/50 rounded-lg">
                        <p className="text-muted-foreground">Related Item Placeholder</p>
                    </Card>
                     <Card className="text-center p-4 border-dashed border-muted-foreground/50 rounded-lg">
                        <p className="text-muted-foreground">Related Item Placeholder</p>
                    </Card>
                    <Card className="text-center p-4 border-dashed border-muted-foreground/50 rounded-lg">
                        <p className="text-muted-foreground">Related Item Placeholder</p>
                    </Card>
                     <Card className="text-center p-4 border-dashed border-muted-foreground/50 rounded-lg">
                        <p className="text-muted-foreground">Related Item Placeholder</p>
                    </Card>
                </div>
            </div>

        </div>
    );
}
