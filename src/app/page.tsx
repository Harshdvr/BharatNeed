'use client'; // Required for useState, useEffect and useAuthState

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import LoadingSpinner from "@/components/loading-spinner";
import { Plus, PlusCircle, Search as SearchIcon, MessageSquare, MapPin, Clock, Tag, IndianRupee, Heart } from 'lucide-react';
import Link from "next/link";
import Image from "next/image";
import { useToast } from '@/hooks/use-toast';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, firestore, ensureFirestoreInitialized } from '@/lib/firebase/clientApp'; // Import auth and firestore instance, and helper
import { doc, updateDoc, arrayUnion, arrayRemove, collection, query, orderBy, limit, getDocs, getDoc } from 'firebase/firestore'; // Import Firestore functions
import { useSearchParams } from 'next/navigation'; // Import useSearchParams
import CategorySelector from '@/components/category-selector'; // Import the new component
import { cn } from '@/lib/utils';


// Mock Data for testing - Updated to better match reference image content
const mockPostings = [
  {
    id: 'mock1',
    title: 'Urgent Plumber Needed for Kitchen Sink Leak',
    description: 'My kitchen sink pipe burst this morning. Need a plumber immediately in Koramangala, Bangalore. Please quote.',
    category: 'services',
    postType: 'need',
    location: 'Koramangala, Bangalore',
    budget: 'Budget: ₹2,000', // Changed format to match image
    urgency: 'urgent',
    imageUrls: ['https://picsum.photos/seed/plumberleak/300/200'],
    createdAt: new Date(Date.now() - 3600000), // 1 hour ago
    isFavorite: false,
    featured: true, // Added featured flag
  },
  {
    id: 'mock2',
    title: 'Authentic Punjabi Tiffin Service - Daily Delivery',
    description: 'Home-cooked Punjabi meals (Veg/Non-Veg options) delivered daily across South Delhi. Hygienic & Tasty. Monthly plans available.',
    category: 'services', // Or maybe Buy/Sell? Using Services based on description
    postType: 'offer',
    location: 'South Delhi, Delhi',
    budget: '₹130', // Changed format
    urgency: 'low',
    imageUrls: ['https://picsum.photos/seed/tiffin/300/200'],
    createdAt: new Date(Date.now() - 86400000 * 4), // 4 days ago
    isFavorite: false,
    featured: true,
  },
  {
    id: 'mock3',
    title: 'Handcrafted Terracotta Pots & Planters',
    description: 'Beautiful, eco-friendly terracotta pots in various sizes and designs. Perfect for home gardens and balconies. Made by local artisans.',
    category: 'buy/sell',
    postType: 'offer',
    location: 'Jaipur, Rajasthan',
    budget: '₹250', // Changed format
    urgency: 'medium',
    imageUrls: ['https://picsum.photos/seed/terracotta/300/200'],
    createdAt: new Date(Date.now() - 86400000 * 7), // 7 days ago
    isFavorite: false,
    featured: true,
  },
    {
    id: 'mock4',
    title: 'Fresh Organic Mangoes - Direct from Farm (Ratnagiri)',
    description: 'Order delicious, naturally ripened Alphonso mangoes directly from our farm in Ratnagiri. Minimum order 1 dozen.',
    category: 'farming', // Or Buy/Sell
    postType: 'offer',
    location: 'Ratnagiri, Maharashtra',
    budget: '₹1,500', // Changed format (per dozen implied)
    urgency: 'low',
    imageUrls: ['https://picsum.photos/seed/mangoes/300/200'],
    createdAt: new Date(Date.now() - 86400000), // 1 day ago
    isFavorite: false,
    featured: true,
  },
   // Add mock data for Recently Viewed - can duplicate or add new ones
   {
    id: 'mock5',
    title: 'Gently Used Mountain Bike (MTB) for Sale',
    description: 'Selling my Firefox MTB, 1 year old. Serviced regularly. Good condition, minor scratches. Selling as I upgraded.',
    category: 'buy/sell',
    postType: 'offer',
    location: 'Mumbai, Maharashtra',
    budget: '₹8,500',
    urgency: 'low',
    imageUrls: ['https://picsum.photos/seed/mtbbike/300/200'],
    createdAt: new Date(Date.now() - 86400000 * 7), // 7 days ago
    isFavorite: false,
    recentlyViewed: true, // Flag for this section
  },
   {
    id: 'mock6',
    title: 'Looking for Used Washing Machine In Good Condition',
    description: 'Need a functional, used top-load washing machine (6-7kg capacity) in Chennai. Budget around ₹5000-₹7000.',
    category: 'buy/sell',
    postType: 'need',
    location: 'Chennai, Tamil Nadu',
    budget: 'Budget: ₹7,000',
    urgency: 'medium',
    imageUrls: ['https://picsum.photos/seed/washingmachine/300/200'],
    createdAt: new Date(Date.now() - 86400000 * 2), // 2 days ago
    isFavorite: false,
     recentlyViewed: true,
  },
   {
    id: 'mock7',
    title: 'Farm Labour Required for Paddy Planting Season',
    description: 'Need 5-6 experienced farm workers for paddy planting near Ludhiana. Duration 2 weeks. Daily wages + food.',
    category: 'farming',
    postType: 'need',
    location: 'Near Ludhiana, Punjab',
    budget: 'Budget: ₹600', // Assuming per day
    urgency: 'high',
    imageUrls: ['https://picsum.photos/seed/paddyfarm/300/200'],
    createdAt: new Date(Date.now() - 86400000 * 3), // 3 days ago
    isFavorite: false,
     recentlyViewed: true,
  },
   { // Duplicating tiffin for recently viewed
    id: 'mock8',
    title: 'Authentic Punjabi Tiffin Service - Daily Delivery',
    description: 'Home-cooked Punjabi meals (Veg/Non-Veg options) delivered daily across South Delhi. Hygienic & Tasty. Monthly plans available.',
    category: 'services',
    postType: 'offer',
    location: 'South Delhi, Delhi',
    budget: '₹130',
    urgency: 'low',
    imageUrls: ['https://picsum.photos/seed/tiffin2/300/200'], // Use different seed for image
    createdAt: new Date(Date.now() - 86400000 * 4), // 4 days ago
    isFavorite: false,
     recentlyViewed: true,
  },
];


export default function Home() {
  const [user, authLoading, authError] = auth ? useAuthState(auth) : [null, true, new Error("Auth not initialized")];
  const [currentPostings, setCurrentPostings] = useState<any[]>(mockPostings); // Initialize with mock data
  const [isLoading, setIsLoading] = useState(false); // Set initial loading to false as we use mock data
  const [userFavorites, setUserFavorites] = useState<string[]>([]); // State for user's favorite IDs
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [firestoreInitialized, setFirestoreInitialized] = useState(true); // Assume initialized for mock data
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);


  // --- Commented out Firestore fetching logic ---
  /*
   useEffect(() => {
    if (firestore) {
      setFirestoreInitialized(true);
    } else {
      const timeoutId = setTimeout(() => {
        if (firestore) {
          setFirestoreInitialized(true);
        } else {
          console.error("Firestore still not initialized after delay.");
          toast({ title: "Database Error", description: "Could not connect to the database.", variant: "destructive" });
          setIsLoading(false);
        }
      }, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [toast]);


  useEffect(() => {
    const filter = searchParams.get('filter');
    const sort = searchParams.get('sort');
    if (filter || sort) {
        console.log('Applying filters - Filter:', filter, 'Sort:', sort);
    }

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const fs = ensureFirestoreInitialized();

            const postingsRef = collection(fs, 'postings');
            const q = query(postingsRef, orderBy('createdAt', 'desc'), limit(20));
            const postingsSnapshot = await getDocs(q);
            const fetchedPostings = postingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            let favs: string[] = [];
            if (user) {
                const userDocRef = doc(fs, 'users', user.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    favs = userDocSnap.data().favorites || [];
                    setUserFavorites(favs);
                }
            }

            const postingsWithFavorites = fetchedPostings.map(p => ({
                ...p,
                isFavorite: favs.includes(p.id)
            }));

            setCurrentPostings(postingsWithFavorites);
            console.log("Fetched postings and favorites (if applicable)");

        } catch (error: any) {
            console.error("Error fetching data:", error);
             if (error.message.includes("Firestore is not initialized")) {
                  toast({ title: "Database Error", description: "Could not connect to the database.", variant: "destructive" });
             } else if (error.code === 'unavailable' || error.message.includes('offline')) {
                 toast({ title: "Offline", description: "Could not reach the server. Displaying cached data if available.", variant: "default" });
             }
             else {
                 toast({ title: "Error", description: "Could not load postings.", variant: "destructive" });
             }
        } finally {
            setIsLoading(false);
        }
    };

     if (!authLoading && firestoreInitialized) {
         fetchData();
     }

  }, [toast, authLoading, user, searchParams, firestoreInitialized]);
  */
  // --- End of commented out Firestore fetching logic ---

  // Handle favoriting logic (Simulated for mock data)
  const handleToggleFavorite = async (postId: string) => {
    if (!user) {
        toast({ title: "Login Required", description: "Please log in to add favorites.", variant: "destructive" });
        return;
    }
     // Optimistically update UI for mock data
    const isCurrentlyFavorite = userFavorites.includes(postId);
    setCurrentPostings(prevPostings =>
      prevPostings.map(p =>
        p.id === postId ? { ...p, isFavorite: !isCurrentlyFavorite } : p
      )
    );
    setUserFavorites(prevFavs =>
        isCurrentlyFavorite ? prevFavs.filter(id => id !== postId) : [...prevFavs, postId]
    );

    toast({
      description: !isCurrentlyFavorite ? "Added to favorites!" : "Removed from favorites.",
    });

    // Simulate Firestore update (remove in final version)
    console.log(`Simulating favorite toggle for post ${postId}. New state: ${!isCurrentlyFavorite}`);
    console.log("Updated user favorites (simulated):", userFavorites);

    // In real app, keep the try/catch and Firestore update logic here
    /*
     try {
         const fs = ensureFirestoreInitialized();
         const userDocRef = doc(fs, 'users', user.uid);
        if (isCurrentlyFavorite) {
            await updateDoc(userDocRef, { favorites: arrayRemove(postId) });
        } else {
            await updateDoc(userDocRef, { favorites: arrayUnion(postId) }, { merge: true });
        }
        console.log("Firestore favorite status updated");
    } catch (error: any) {
         // Error handling and UI revert
    }
    */
  };


  // Handle auth error display
  useEffect(() => {
    if (authError && !authLoading) { // Check !authLoading to avoid toast during initial check
      console.error("Firebase Auth Hook Error:", authError);
      // Consider if a toast is the best UX here, or just rely on login/signup prompts
      // toast({
      //   title: "Authentication Error",
      //   description: "Could not verify user status.",
      //   variant: "destructive",
      // });
    }
  }, [authError, authLoading, toast]);

  // Filter posts for sections
  const featuredPostings = currentPostings.filter(post => post.featured && !post.recentlyViewed);
  const recentlyViewedPostings = currentPostings.filter(post => post.recentlyViewed);


  return (
    <div className="relative min-h-full">
      {isLoading && <LoadingSpinner className="absolute inset-0 bg-background/50 z-10" />}

      {/* Hero Section - Adjusted to match reference */}
      <div className="text-center py-16 px-4 bg-gradient-to-b from-orange-50 via-white to-white"> {/* Added gradient background */}
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl mb-4">
          Find What You Need,<br/> Offer What You Have.
        </h1>
        <p className="mt-2 text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
           BharatNeed connects your local community across India - from bustling cities to remote villages - for everything you need or offer.
        </p>
         <div className="flex justify-center gap-4">
             <Button
                variant="default"
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md rounded-md px-8 py-3" // Changed to rounded-md
                asChild
              >
                <Link href="/post-need">
                  Post Your Need/Offer
                </Link>
              </Button>
              <Button
                  variant="outline"
                  size="lg"
                  className="shadow-sm rounded-md px-8 py-3"
                  asChild // Make button act like a link
              >
                  <Link href="/"> {/* Link to browse page (assuming home for now) */}
                    Browse Listings →
                  </Link>
              </Button>
         </div>
      </div>

      {/* Explore Categories Section */}
       <div className="py-12 px-4">
         <h2 className="text-2xl font-semibold text-center mb-8">Explore Categories</h2>
          <CategorySelector
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
          />
       </div>


       {/* Featured Needs & Offers Section */}
       {featuredPostings.length > 0 && (
           <div className="py-12 px-4 bg-muted/30"> {/* Light background for section */}
             <h2 className="text-2xl font-semibold mb-6">Featured Needs & Offers</h2>
             <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {featuredPostings.slice(0, 4).map((post) => ( // Limit to 4 featured posts
                    <PostCard key={post.id} post={post} user={user} handleToggleFavorite={handleToggleFavorite} />
                ))}
             </div>
           </div>
       )}


       {/* Recently Viewed Section */}
       {recentlyViewedPostings.length > 0 && (
            <div className="py-16 px-4">
             <h2 className="text-2xl font-semibold mb-6">Recently Viewed</h2>
             <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                 {recentlyViewedPostings.slice(0, 4).map((post) => ( // Limit to 4 recently viewed
                    <PostCard key={post.id} post={post} user={user} handleToggleFavorite={handleToggleFavorite} isRecentlyViewed={true} />
                 ))}
             </div>
            </div>
        )}


        {/* How BharatNeed Works Section */}
        <section className="bg-muted/50 py-16 mt-12">
            <div className="container mx-auto px-4 text-center">
                <h2 className="text-3xl font-bold mb-10">How BharatNeed Works</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Step 1: Post Easily */}
                    <div className="flex flex-col items-center">
                        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary mb-4 text-primary-foreground">
                            <Plus className="h-8 w-8" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">1. Post Easily</h3>
                        <p className="text-muted-foreground">
                            Quickly post your need or offer in just a few steps.
                        </p>
                    </div>
                    {/* Step 2: Find Locally */}
                    <div className="flex flex-col items-center">
                        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary mb-4 text-primary-foreground">
                            <SearchIcon className="h-8 w-8" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">2. Find Locally</h3>
                        <p className="text-muted-foreground">
                            Discover relevant listings prioritized by your location.
                        </p>
                    </div>
                    {/* Step 3: Connect Directly */}
                    <div className="flex flex-col items-center">
                         <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary mb-4 text-primary-foreground">
                            <MessageSquare className="h-8 w-8" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">3. Connect Directly</h3>
                        <p className="text-muted-foreground">
                            Chat and negotiate in real-time with other users.
                        </p>
                    </div>
                </div>
            </div>
        </section>

    </div>
  );
}


// Reusable Post Card Component
function PostCard({ post, user, handleToggleFavorite, isRecentlyViewed = false }: {
    post: any,
    user: any, // Consider defining a proper user type
    handleToggleFavorite: (id: string) => void,
    isRecentlyViewed?: boolean
}) {
    const CategoryIcon = CategorySelector.categoryDetails.find(c => c.name.toLowerCase() === post.category?.toLowerCase())?.icon || Tag;
    const createdAtDate = post.createdAt instanceof Date ? post.createdAt : post.createdAt?.toDate ? post.createdAt.toDate() : null;
    // Simple date formatting (days ago) - consider using date-fns for more complex formatting
    let formattedDate = 'N/A';
    if (createdAtDate) {
        const diffTime = Math.abs(new Date().getTime() - createdAtDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        formattedDate = diffDays <= 1 ? 'Today' : `${diffDays} days ago`;
    }

     // Determine badge text and variant based on post type and featured status
     let badgeText = post.postType === 'need' ? 'Need' : 'Offer';
     let badgeVariant: "default" | "destructive" | "secondary" | "outline" = post.postType === 'need' ? 'destructive' : 'default';
     if (post.featured && !isRecentlyViewed) {
         // Use a different badge style for featured? Example: secondary
         // Or combine: badgeText = `Featured ${badgeText}`
         // For now, just stick to Need/Offer
     }


    return (
        <Card className="flex flex-col overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200 group/card border rounded-lg">
            <div className="relative w-full aspect-[4/3]"> {/* Adjusted aspect ratio */}
                <Link href={`/postings/${post.id}`} className="block absolute inset-0 bg-muted">
                    <Image
                        src={post.imageUrls?.[0] || 'https://picsum.photos/400/300'} // Use first image or default
                        alt={post.title || 'Posting image'}
                        fill
                        style={{ objectFit: 'cover' }}
                        className="rounded-t-lg"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                        data-ai-hint="product service picture"
                        priority={post.id.startsWith('mock')}
                    />
                </Link>
                 {/* Badges Overlay */}
                 <div className="absolute top-2 left-2 flex gap-1.5 z-10">
                    <Badge variant={badgeVariant} className="text-xs py-0.5 px-1.5 rounded-sm">
                       {badgeText}
                    </Badge>
                    {post.featured && !isRecentlyViewed && (
                        <Badge variant="secondary" className="text-xs py-0.5 px-1.5 rounded-sm bg-yellow-400 text-yellow-900">
                            Featured
                        </Badge>
                    )}
                </div>
                {/* Favorite Button Overlay */}
                {user && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 z-10 h-8 w-8 rounded-full bg-background/70 text-destructive hover:bg-background hover:text-destructive"
                        onClick={() => handleToggleFavorite(post.id)}
                        aria-label={post.isFavorite ? "Remove from favorites" : "Add to favorites"}
                        >
                        <Heart className={`h-5 w-5 transition-colors ${post.isFavorite ? 'fill-destructive' : 'fill-transparent'}`} />
                     </Button>
                )}
            </div>
            <Link href={`/postings/${post.id}`} className="flex flex-col flex-grow p-4">
              <CardHeader className="p-0 pb-2"> {/* Reduced padding */}
                <CardTitle className="text-base leading-snug line-clamp-2 mb-1">{post.title || 'Untitled Post'}</CardTitle> {/* Slightly smaller title */}
                 <CardDescription className="flex items-center gap-1 text-xs text-muted-foreground">
                    {/* <CategoryIcon className="h-3 w-3" /> {post.category || 'Uncategorized'} • */}
                    <MapPin className="h-3 w-3"/> <span className="truncate">{post.location || 'N/A'}</span>
                 </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground flex-grow p-0 pb-3 line-clamp-2"> {/* Line clamp description */}
                {post.description || 'No description'}
              </CardContent>
              <CardFooter className="flex justify-between items-center pt-3 text-xs p-0 mt-auto border-t">
                 <span className="font-semibold text-primary text-sm">
                    {/* Display budget differently based on content */}
                    {post.budget?.toLowerCase().includes('budget:') ? post.budget : `₹${post.budget}`}
                 </span>
                 <span className="text-muted-foreground">{formattedDate}</span>
              </CardFooter>
            </Link>
        </Card>
    );
}