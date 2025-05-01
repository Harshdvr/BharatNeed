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
import { formatDistanceToNowStrict } from 'date-fns'; // Import date-fns for relative time


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
    createdAt: new Date(Date.now() - 86400000 * 2), // 2 days ago (changed to be not 'new')
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


// --- Simplified Feed Algorithm ---

// Mock User Data (Replace with actual data fetching)
const mockUserPreferences = {
  categories: ['services', 'farming'], // Example preferences
  keywords: ['repair', 'organic'], // Example keywords
};
const mockUserLocation = null; // Replace with actual location logic if available

// Scoring Function (Simplified based on prompt)
const calculateScore = (post: any, preferences: typeof mockUserPreferences): number => {
  let score = 0;
  const now = new Date();
  // Ensure createdAt is a Date object for comparison
  const postDate = post.createdAt instanceof Date ? post.createdAt : post.createdAt?.toDate ? post.createdAt.toDate() : new Date();
  const hoursSincePost = (now.getTime() - postDate.getTime()) / (1000 * 60 * 60);

  // Category Match Bonus (Weight: 5)
  if (preferences.categories.includes(post.category?.toLowerCase())) {
    score += 5;
  }

  // Keyword Match Bonus (simple title check) (Weight: 3)
  if (preferences.keywords.some(keyword => post.title?.toLowerCase().includes(keyword))) {
    score += 3;
  }

  // Trending Bonus (using 'featured' flag as proxy) (Weight: 4)
  if (post.featured) {
    score += 4;
  }

  // Recency Bonus (Higher score for newer posts) (Weight: 2)
  if (hoursSincePost <= 24) { // Within 1 day
    score += 2; // Max recency bonus
  } else if (hoursSincePost <= 72) { // Within 3 days
    score += 1; // Medium recency bonus
  }
  // Older posts get 0 recency bonus

  // Proximity Bonus (Placeholder - cannot calculate with mock strings)
  // if (isNearby(post.location, userLocation)) { score += 4; }

  // Image Bonus (Weight: 1)
  if (post.imageUrls && post.imageUrls.length > 0) {
    score += 1;
  }

  return score;
};

// Function to get the personalized feed (Simplified for mock data)
const getPersonalizedFeed = (
  allPosts: any[],
  preferences: typeof mockUserPreferences,
  limit: number = 20
): any[] => {
  const scoredPosts = allPosts
    .filter(post => !post.recentlyViewed) // Exclude recently viewed for the main feed
    .map(post => ({
      ...post,
      score: calculateScore(post, preferences),
      // Mark as recent if within 48 hours (for the 'New' badge)
      isRecent: (new Date().getTime() - (post.createdAt instanceof Date ? post.createdAt : post.createdAt?.toDate ? post.createdAt.toDate() : new Date()).getTime()) / (1000 * 60 * 60) <= 48
    }))
    .sort((a, b) => b.score - a.score); // Sort by score descending

  // Simple mixing: Take top scored posts. A real implementation would use the 40/30/30 logic.
  // For mock data, sorting by score and applying limit is sufficient.
  return scoredPosts.slice(0, limit);
};

// --- End of Simplified Feed Algorithm ---


export default function Home() {
  const [user, authLoading, authError] = auth ? useAuthState(auth) : [null, true, new Error("Auth not initialized")];
  const [isLoading, setIsLoading] = useState(false); // Keep loading state
  const [userFavorites, setUserFavorites] = useState<string[]>([]); // State for user's favorite IDs
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [firestoreInitialized, setFirestoreInitialized] = useState(true); // Assume initialized for mock data
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // State for the different feed sections
  const [personalizedFeed, setPersonalizedFeed] = useState<any[]>([]);
  const [recentlyViewedPostings, setRecentlyViewedPostings] = useState<any[]>([]);

  // --- Commented out Firestore fetching logic ---
  /*
   useEffect(() => {
    if (firestore) {
      setFirestoreInitialized(true);
    } else {
      // ... Firestore initialization check ...
    }
  }, [toast]);


  useEffect(() => {
    // ... Firestore data fetching logic ...
    // Inside fetchData, after getting posts and favs:
    // const feed = getPersonalizedFeed(fetchedPostingsWithFavorites, mockUserPreferences); // Use the algorithm
    // setPersonalizedFeed(feed);
    // setRecentlyViewedPostings(fetchedPostingsWithFavorites.filter(p => p.recentlyViewed)); // Filter for recently viewed

  }, [toast, authLoading, user, searchParams, firestoreInitialized]);
  */
  // --- End of commented out Firestore fetching logic ---

  // Apply algorithm to mock data on initial load and when category changes
  useEffect(() => {
    setIsLoading(true);
    // Simulate fetching and processing
    setTimeout(() => {
      const filteredMockPosts = selectedCategory
        ? mockPostings.filter(p => p.category?.toLowerCase() === selectedCategory)
        : mockPostings;

      const feed = getPersonalizedFeed(filteredMockPosts, mockUserPreferences);
      setPersonalizedFeed(feed);
      // Sort recently viewed separately by date
      setRecentlyViewedPostings(filteredMockPosts.filter(p => p.recentlyViewed).sort((a, b) => (b.createdAt instanceof Date ? b.createdAt : b.createdAt?.toDate ? b.createdAt.toDate() : new Date()).getTime() - (a.createdAt instanceof Date ? a.createdAt : a.createdAt?.toDate ? a.createdAt.toDate() : new Date()).getTime()));
      setIsLoading(false);
    }, 500); // Simulate network delay

  }, [selectedCategory]); // Re-run when category changes


  // Handle favoriting logic (Simulated for mock data)
  const handleToggleFavorite = async (postId: string) => {
    if (!user) {
        toast({ title: "Login Required", description: "Please log in to add favorites.", variant: "destructive" });
        return;
    }
     // Optimistically update UI for mock data in both feeds
    const isCurrentlyFavorite = userFavorites.includes(postId);
    setPersonalizedFeed(prev =>
      prev.map(p => p.id === postId ? { ...p, isFavorite: !isCurrentlyFavorite } : p)
    );
    setRecentlyViewedPostings(prev =>
      prev.map(p => p.id === postId ? { ...p, isFavorite: !isCurrentlyFavorite } : p)
    );
    setUserFavorites(prevFavs =>
        isCurrentlyFavorite ? prevFavs.filter(id => id !== postId) : [...prevFavs, postId]
    );

    toast({
      description: !isCurrentlyFavorite ? "Added to favorites!" : "Removed from favorites.",
    });

    // Simulate Firestore update (remove in final version)
    console.log(`Simulating favorite toggle for post ${postId}. New state: ${!isCurrentlyFavorite}`);

    // In real app, keep the try/catch and Firestore update logic here
    /*
     try {
         const fs = ensureFirestoreInitialized();
         const userDocRef = doc(fs, 'users', user.uid);
        // ... Firestore update logic ...
    } catch (error: any) {
         // Error handling and UI revert
    }
    */
  };


  // Handle auth error display
  useEffect(() => {
    if (authError && !authLoading) { // Check !authLoading to avoid toast during initial check
      console.error("Firebase Auth Hook Error:", authError);
    }
  }, [authError, authLoading, toast]);


  return (
    <div className="relative min-h-full">
      {isLoading && <LoadingSpinner className="fixed inset-0 bg-background/80 z-50" />} {/* Fixed position spinner */}

      {/* Hero Section with Background Gradient */}
       <div className="text-center py-16 px-4 bg-gradient-to-b from-[--gradient-start] via-[--gradient-middle] to-[--gradient-end] dark:from-[--gradient-start] dark:via-[--gradient-middle] dark:to-[--gradient-end]">
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
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md rounded-md px-8 py-3" // Standard button style
                asChild
              >
                <Link href="/post-need">
                  <Plus className="mr-2 h-5 w-5" /> Post Your Need/Offer
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


       {/* Personalized Feed Section */}
       {personalizedFeed.length > 0 && (
           <div className="py-12 px-4 bg-muted/30">
             <h2 className="text-2xl font-semibold mb-6">Suggested For You</h2>
             <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {personalizedFeed.map((post) => (
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
    // Ensure createdAt is a Date object before formatting
    const createdAtDate = post.createdAt instanceof Date ? post.createdAt : post.createdAt?.toDate ? post.createdAt.toDate() : null;

    // Use date-fns for better relative time formatting
    let formattedDate = 'N/A';
    if (createdAtDate) {
       try {
         // Add suffix for "ago"
         formattedDate = formatDistanceToNowStrict(createdAtDate, { addSuffix: true });
         // Optional: Make very recent posts more prominent, e.g., "X minutes ago"
         const minutesAgo = (new Date().getTime() - createdAtDate.getTime()) / (1000 * 60);
         if (minutesAgo < 1) formattedDate = 'Just now';
         else if (minutesAgo < 60) formattedDate = `${Math.round(minutesAgo)}m ago`;
         // formatDistanceToNowStrict handles hours/days/etc.
       } catch (e) {
         console.error("Error formatting date:", e);
         formattedDate = createdAtDate.toLocaleDateString(); // Fallback
       }
    }

     // Determine badge text and variant based on post type
     let typeBadgeText = post.postType === 'need' ? 'Need' : 'Offer';
     let typeBadgeVariant: "default" | "destructive" | "secondary" | "outline" = post.postType === 'need' ? 'destructive' : 'default';

     // Check if the post is recent (using the flag from the algorithm)
     const isNew = post.isRecent;


    return (
        <Card className="flex flex-col overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200 group/card border rounded-lg bg-card"> {/* Added bg-card */}
            <div className="relative w-full aspect-[4/3]">
                <Link href={`/postings/${post.id}`} className="block absolute inset-0 bg-muted">
                    <Image
                        src={post.imageUrls?.[0] || 'https://picsum.photos/400/300'}
                        alt={post.title || 'Posting image'}
                        fill
                        style={{ objectFit: 'cover' }}
                        className="rounded-t-lg transition-transform duration-300 group-hover/card:scale-105" // Added hover effect
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                        data-ai-hint="product service picture"
                        priority={post.id.startsWith('mock')}
                    />
                </Link>
                 {/* Badges Overlay */}
                 <div className="absolute top-2 left-2 flex gap-1.5 z-10">
                    <Badge variant={typeBadgeVariant} className="text-xs py-0.5 px-1.5 rounded-sm shadow"> {/* Added shadow */}
                       {typeBadgeText}
                    </Badge>
                    {isNew && !isRecentlyViewed && ( // Show 'New' badge only if recent and not in 'Recently Viewed'
                         <Badge variant="secondary" className="text-xs py-0.5 px-1.5 rounded-sm shadow bg-green-500 text-white"> {/* Custom 'New' badge style */}
                            New
                        </Badge>
                     )}
                     {/* Keep featured badge logic if needed */}
                     {/* {post.featured && !isRecentlyViewed && (
                        <Badge variant="secondary" className="text-xs py-0.5 px-1.5 rounded-sm shadow bg-yellow-400 text-yellow-900">
                            Featured
                        </Badge>
                    )} */}
                </div>
                {/* Favorite Button Overlay */}
                {user && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 z-10 h-8 w-8 rounded-full bg-background/70 text-destructive hover:bg-background hover:text-destructive transition-colors" // Added transition
                        onClick={() => handleToggleFavorite(post.id)}
                        aria-label={post.isFavorite ? "Remove from favorites" : "Add to favorites"}
                        >
                        <Heart className={cn("h-5 w-5 transition-all", post.isFavorite ? 'fill-destructive scale-110' : 'fill-transparent')} /> {/* Fill and scale effect */}
                     </Button>
                )}
            </div>
            <Link href={`/postings/${post.id}`} className="flex flex-col flex-grow p-4">
              <CardHeader className="p-0 pb-2">
                <CardTitle className="text-base leading-snug line-clamp-2 mb-1 group-hover/card:text-primary transition-colors">{post.title || 'Untitled Post'}</CardTitle> {/* Hover effect */}
                 <CardDescription className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3"/> <span className="truncate">{post.location || 'N/A'}</span>
                 </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground flex-grow p-0 pb-3 line-clamp-2">
                {post.description || 'No description'}
              </CardContent>
              <CardFooter className="flex justify-between items-center pt-3 text-xs p-0 mt-auto border-t">
                 <span className="font-semibold text-primary text-sm">
                    {/* Display budget as is if it contains "Budget:", otherwise prepend ₹ */}
                    {post.budget?.toLowerCase().includes('budget:') ? post.budget : `₹${post.budget || 'N/A'}`}
                 </span>
                 <span className="text-muted-foreground">{formattedDate}</span>
              </CardFooter>
            </Link>
        </Card>
    );
}
