
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
    location: 'Koramangala, Bangalore', // Closer location
    budget: 'Budget: ₹2,000',
    urgency: 'urgent',
    imageUrls: ['https://picsum.photos/seed/plumberleak/300/200'],
    createdAt: new Date(Date.now() - 3600000), // 1 hour ago (Recent)
    isFavorite: false,
    views: 10, // Example engagement
    saves: 2, // Example engagement
  },
  {
    id: 'mock2',
    title: 'Authentic Punjabi Tiffin Service - Daily Delivery',
    description: 'Home-cooked Punjabi meals (Veg/Non-Veg options) delivered daily across South Delhi. Hygienic & Tasty. Monthly plans available.',
    category: 'services',
    postType: 'offer',
    location: 'South Delhi, Delhi', // Further location
    budget: '₹130',
    urgency: 'low',
    imageUrls: ['https://picsum.photos/seed/tiffin/300/200'],
    createdAt: new Date(Date.now() - 86400000 * 4), // 4 days ago
    isFavorite: false,
    views: 50,
    saves: 5,
  },
  {
    id: 'mock3',
    title: 'Handcrafted Terracotta Pots & Planters',
    description: 'Beautiful, eco-friendly terracotta pots in various sizes and designs. Perfect for home gardens and balconies. Made by local artisans.',
    category: 'buy/sell',
    postType: 'offer',
    location: 'Jaipur, Rajasthan',
    budget: '₹250',
    urgency: 'medium',
    imageUrls: ['https://picsum.photos/seed/terracotta/300/200'],
    createdAt: new Date(Date.now() - 86400000 * 7), // 7 days ago
    isFavorite: false,
    views: 30,
    saves: 1,
  },
    {
    id: 'mock4',
    title: 'Fresh Organic Mangoes - Direct from Farm (Ratnagiri)',
    description: 'Order delicious, naturally ripened Alphonso mangoes directly from our farm in Ratnagiri. Minimum order 1 dozen.',
    category: 'farming',
    postType: 'offer',
    location: 'Ratnagiri, Maharashtra',
    budget: '₹1,500',
    urgency: 'low',
    imageUrls: ['https://picsum.photos/seed/mangoes/300/200'],
    createdAt: new Date(Date.now() - 86400000 * 2), // 2 days ago
    isFavorite: false,
    views: 80, // Higher views
    saves: 10,
  },
   // Add mock data for Recently Viewed - can duplicate or add new ones
   {
    id: 'mock5',
    title: 'Gently Used Mountain Bike (MTB) for Sale',
    description: 'Selling my Firefox MTB, 1 year old. Serviced regularly. Good condition, minor scratches. Selling as I upgraded.',
    category: 'buy/sell',
    postType: 'offer',
    location: 'Mumbai, Maharashtra', // Assume user is in Mumbai for this example
    budget: '₹8,500',
    urgency: 'low',
    imageUrls: ['https://picsum.photos/seed/mtbbike/300/200'],
    createdAt: new Date(Date.now() - 86400000 * 7),
    isFavorite: false,
    recentlyViewed: true, // Flag for this section
    views: 25,
    saves: 0,
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
    createdAt: new Date(Date.now() - 86400000 * 2),
    isFavorite: false,
     recentlyViewed: true,
     views: 40,
     saves: 3,
  },
   {
    id: 'mock7',
    title: 'Farm Labour Required for Paddy Planting Season',
    description: 'Need 5-6 experienced farm workers for paddy planting near Ludhiana. Duration 2 weeks. Daily wages + food.',
    category: 'farming',
    postType: 'need',
    location: 'Near Ludhiana, Punjab',
    budget: 'Budget: ₹600',
    urgency: 'high',
    imageUrls: ['https://picsum.photos/seed/paddyfarm/300/200'],
    createdAt: new Date(Date.now() - 86400000 * 3),
    isFavorite: false,
     recentlyViewed: true,
     views: 15,
     saves: 1,
  },
   { // Duplicating plumber for recently viewed, assume user viewed it
    id: 'mock8',
    title: 'Urgent Plumber Needed for Kitchen Sink Leak',
    description: 'My kitchen sink pipe burst this morning. Need a plumber immediately in Koramangala, Bangalore. Please quote.',
    category: 'services',
    postType: 'need',
    location: 'Koramangala, Bangalore',
    budget: 'Budget: ₹2,000',
    urgency: 'urgent',
    imageUrls: ['https://picsum.photos/seed/plumberleak2/300/200'], // Different image seed
    createdAt: new Date(Date.now() - 3600000), // 1 hour ago
    isFavorite: false,
     recentlyViewed: true,
     views: 10,
     saves: 2,
  },
];


// --- Simplified OLX-like Feed Algorithm ---

// Mock User Data (Replace with actual data fetching)
const mockUserLocation = "Koramangala, Bangalore"; // Example user location
const mockUserPreferences = { // Example preferences (replace with actual logic)
    categories: ['services', 'buy/sell'],
    keywords: ['repair', 'used', 'homemade'],
};

// Simplified Proximity Check (Replace with actual distance calculation)
const isNearby = (postLocation: string | undefined, userLocation: string | null, radiusKm: number = 15): boolean => {
  if (!postLocation || !userLocation) return false;
  // VERY basic check for demo purposes - replace with Haversine formula or GeoFirestore query
  // Comparing first part (city/area)
  const postCity = postLocation.split(',')[0].trim().toLowerCase();
  const userCity = userLocation.split(',')[0].trim().toLowerCase();
  return postCity === userCity;
};

// Check if post is recent (e.g., within last 48 hours)
const isRecent = (createdAt: any): boolean => {
    const postDate = createdAt instanceof Date ? createdAt : createdAt?.toDate ? createdAt.toDate() : null;
    if (!postDate) return false;
    const hoursSincePost = (new Date().getTime() - postDate.getTime()) / (1000 * 60 * 60);
    return hoursSincePost <= 48; // Definition of "New" for badge
};

// Check if post is trending (simple example: high views or saves)
const isTrending = (post: any): boolean => {
    const viewsThreshold = 50;
    const savesThreshold = 5;
    return (post.views || 0) >= viewsThreshold || (post.saves || 0) >= savesThreshold;
}

// Check if post category matches user preferences
const isCategoryMatch = (postCategory: string | undefined, userCategories: string[]): boolean => {
    if (!postCategory) return false;
    return userCategories.includes(postCategory.toLowerCase());
}

// Check if post title contains user keywords (basic)
const isKeywordMatch = (postTitle: string | undefined, userKeywords: string[]): boolean => {
    if (!postTitle) return false;
    const titleLower = postTitle.toLowerCase();
    return userKeywords.some(keyword => titleLower.includes(keyword.toLowerCase()));
}


// Updated Scoring Function (OLX-like priorities)
const calculateScore = (post: any, userLocation: string | null, userPrefs: typeof mockUserPreferences): number => {
  let score = 0;
  const postDate = post.createdAt instanceof Date ? post.createdAt : post.createdAt?.toDate ? post.createdAt.toDate() : new Date();
  const hoursSincePost = (new Date().getTime() - postDate.getTime()) / (1000 * 60 * 60);

  // 1. Proximity Bonus (Highest Weight: 7)
  if (isNearby(post.location, userLocation)) {
    score += 7;
  }

  // 2. Category Match Bonus (Weight: 5)
  if (isCategoryMatch(post.category, userPrefs.categories)) {
      score += 5;
  }

  // 3. Recency Bonus (Weight: 3) - Higher for very recent
  if (hoursSincePost <= 24) { // Within 1 day
    score += 3;
  } else if (hoursSincePost <= 72) { // Within 3 days
    score += 1.5;
  }
  // Older posts get 0 recency bonus

   // 4. Image Bonus (Weight: 2) - Prioritize posts with images
   if (post.imageUrls && post.imageUrls.length > 0) {
     score += 2;
   }

  // 5. Keyword Match Bonus (Weight: 3)
   if (isKeywordMatch(post.title, userPrefs.keywords)) {
       score += 3;
   }

  // 6. Trending Bonus (Based on simple thresholds, Weight: 4)
  if (isTrending(post)) {
      score += 4;
  }

  // Optional: Add a small base score or decay older posts further
  // score -= Math.floor(hoursSincePost / (24 * 7)); // Example: decay weekly

  return score;
};

// Function to get the personalized feed (OLX-like sorting)
const getPersonalizedFeed = (
  allPosts: any[],
  userLocation: string | null,
  userPrefs: typeof mockUserPreferences,
  limit: number = 20
): any[] => {
  const scoredPosts = allPosts
    .filter(post => !post.recentlyViewed) // Exclude recently viewed for the main feed
    .map(post => {
        const nearby = isNearby(post.location, userLocation);
        const recent = isRecent(post.createdAt);
        const trending = isTrending(post);
        return {
        ...post,
        score: calculateScore(post, userLocation, userPrefs),
        isRecent: recent, // Flag for 'New' badge
        isNearby: nearby, // Flag for 'Nearby' badge
        isTrending: trending, // Flag for 'Trending' badge
        };
    })
    .sort((a, b) => {
        // Primary sort: score descending
        if (b.score !== a.score) {
            return b.score - a.score;
        }
        // Secondary sort: recency descending (newer first) if scores are equal
        const dateA = a.createdAt instanceof Date ? a.createdAt : a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
        const dateB = b.createdAt instanceof Date ? b.createdAt : b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
        return dateB.getTime() - dateA.getTime();
    });

  return scoredPosts.slice(0, limit);
};

// --- End of Simplified Feed Algorithm ---


export default function Home() {
  const [user, authLoading, authError] = auth ? useAuthState(auth) : [null, true, new Error("Auth not initialized")];
  const [isLoading, setIsLoading] = useState(false); // Keep loading state
  const [userFavorites, setUserFavorites] = useState<string[]>([]); // State for user's favorite IDs
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [firestoreInitialized, setFirestoreInitialized] = useState(false); // Track firestore init state
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentUserLocation, setCurrentUserLocation] = useState<string | null>(null); // Start null

  // State for the different feed sections
  const [personalizedFeed, setPersonalizedFeed] = useState<any[]>([]);
  const [recentlyViewedPostings, setRecentlyViewedPostings] = useState<any[]>([]);

  // --- Fetching and processing logic ---
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
        }
      }, 2000); // Wait 2 seconds
      return () => clearTimeout(timeoutId);
    }
  }, [toast]); // Removed firestore from dependency array to avoid loop if it becomes available later

   useEffect(() => {
    const fetchData = async () => {
        setIsLoading(true);

        // --- 1. Get User Context (Location & Favorites) ---
        let fetchedUserLocation = mockUserLocation; // Default to mock
        let fetchedUserFavorites: string[] = [];
         // TODO: Replace with actual user profile/location fetching logic
        // Example:
        // if (user && firestoreInitialized) {
        //   try {
        //     const userDocRef = doc(firestore, 'users', user.uid);
        //     const userDocSnap = await getDoc(userDocRef);
        //     if (userDocSnap.exists()) {
        //       const userData = userDocSnap.data();
        //       fetchedUserLocation = userData.location || mockUserLocation; // Use Firestore location or fallback
        //       fetchedUserFavorites = userData.favorites || [];
        //     }
        //   } catch (error) {
        //     console.error("Error fetching user data:", error);
        //     // Handle error, maybe use defaults
        //   }
        // }
        setCurrentUserLocation(fetchedUserLocation);
        setUserFavorites(fetchedUserFavorites);

        // --- 2. Fetch Posts (Simulated with Mock Data for now) ---
        // TODO: Replace mockPostings with actual Firestore query
        // Example Firestore Query (replace with your actual collection/query):
        // let fetchedPostings: any[] = [];
        // if (firestoreInitialized) {
        //   try {
        //     const postingsRef = collection(firestore, 'postings');
        //     // Add more sophisticated querying later (e.g., based on location indexing)
        //     const q = query(postingsRef, orderBy('createdAt', 'desc'), limit(100)); // Fetch latest 100 for now
        //     const querySnapshot = await getDocs(q);
        //     fetchedPostings = querySnapshot.docs.map(doc => ({
        //       id: doc.id,
        //       ...doc.data(),
        //       isFavorite: fetchedUserFavorites.includes(doc.id), // Check if favorited
        //       // TODO: Add recentlyViewed flag based on user history
        //     }));
        //   } catch (error) {
        //     console.error("Error fetching postings:", error);
        //     toast({ title: "Error", description: "Could not load postings.", variant: "destructive" });
        //   }
        // } else {
        //    fetchedPostings = mockPostings.map(p => ({...p, isFavorite: fetchedUserFavorites.includes(p.id)}));
        // }

        // Using mock data for now, adding isFavorite flag
         let fetchedPostings = mockPostings.map(p => ({...p, isFavorite: fetchedUserFavorites.includes(p.id)}));


        // --- 3. Filter by Category (Client-side for now) ---
        if (selectedCategory) {
            fetchedPostings = fetchedPostings.filter(p => p.category?.toLowerCase() === selectedCategory);
        }

        // --- 4. Apply OLX-like Feed Algorithm ---
        // TODO: Get actual user preferences
        const feed = getPersonalizedFeed(fetchedPostings, fetchedUserLocation, mockUserPreferences);
        setPersonalizedFeed(feed);

        // --- 5. Separate Recently Viewed Posts ---
         // TODO: Implement actual recently viewed logic
         const recentViews = fetchedPostings.filter(p => p.recentlyViewed)
             .sort((a, b) => (b.createdAt instanceof Date ? b.createdAt : b.createdAt?.toDate ? b.createdAt.toDate() : new Date()).getTime() - (a.createdAt instanceof Date ? a.createdAt : a.createdAt?.toDate ? a.createdAt.toDate() : new Date()).getTime());
        setRecentlyViewedPostings(recentViews);


        setIsLoading(false);
    };

    // Fetch data when component mounts, user changes, category changes, or Firestore becomes ready
     // Debounce or delay fetching if needed, especially on category change
    fetchData();

  }, [user, selectedCategory, firestoreInitialized, toast]); // Dependencies for fetching


  // Handle favoriting logic (Client-side simulation + optimistic update)
  const handleToggleFavorite = async (postId: string) => {
    if (!user) {
        toast({ title: "Login Required", description: "Please log in to add favorites.", variant: "destructive" });
        return;
    }
     if (!firestoreInitialized) {
        toast({ title: "Database Not Ready", description: "Please wait a moment and try again.", variant: "default" });
        return;
     }


    const isCurrentlyFavorite = userFavorites.includes(postId);

    // Optimistically update UI state
    setUserFavorites(prevFavs =>
        isCurrentlyFavorite ? prevFavs.filter(id => id !== postId) : [...prevFavs, postId]
    );
     setPersonalizedFeed(prev =>
       prev.map(p => p.id === postId ? { ...p, isFavorite: !isCurrentlyFavorite } : p)
     );
     setRecentlyViewedPostings(prev =>
       prev.map(p => p.id === postId ? { ...p, isFavorite: !isCurrentlyFavorite } : p)
     );


    // Update Firestore
    try {
        const userDocRef = doc(firestore, 'users', user.uid);
        if (isCurrentlyFavorite) {
            await updateDoc(userDocRef, { favorites: arrayRemove(postId) });
            toast({ description: "Removed from favorites!" });
        } else {
            await updateDoc(userDocRef, { favorites: arrayUnion(postId) });
            toast({ description: "Added to favorites!" });
        }
    } catch (error: any) {
        console.error("Error updating favorites:", error);
        toast({ title: "Error", description: "Could not update favorites.", variant: "destructive" });
        // Revert optimistic UI update on error
        setUserFavorites(prevFavs =>
            isCurrentlyFavorite ? [...prevFavs, postId] : prevFavs.filter(id => id !== postId)
        );
         setPersonalizedFeed(prev =>
           prev.map(p => p.id === postId ? { ...p, isFavorite: isCurrentlyFavorite } : p)
         );
         setRecentlyViewedPostings(prev =>
           prev.map(p => p.id === postId ? { ...p, isFavorite: isCurrentlyFavorite } : p)
         );
    }
  };


  // Handle auth error display
  useEffect(() => {
    if (authError && !authLoading) { // Check !authLoading to avoid toast during initial check
      console.error("Firebase Auth Hook Error:", authError);
      // Optionally show a toast, but might be annoying on every page load if auth consistently fails
      // toast({ title: "Authentication Error", description: "Could not verify user.", variant: "destructive" });
    }
  }, [authError, authLoading, toast]);


  return (
    <div className="relative min-h-full">
      {/* Use LoadingSpinner component */}
       {(isLoading || authLoading) && <LoadingSpinner className="fixed inset-0 bg-background/80 z-50" />}

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

        {/* Loading/Empty State for Feed */}
         {!isLoading && personalizedFeed.length === 0 && recentlyViewedPostings.length === 0 && (
             <div className="text-center py-16 px-4">
                 <p className="text-lg text-muted-foreground mb-4">
                     {selectedCategory ? `No postings found in the '${selectedCategory}' category yet.` : "No postings found nearby. Be the first to post!"}
                 </p>
                 <Button asChild>
                     <Link href="/post-need">Post Your Need/Offer</Link>
                 </Button>
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
                        priority={post.id.startsWith('mock')} // Prioritize mock images
                    />
                </Link>
                 {/* Badges Overlay */}
                 <div className="absolute top-2 left-2 flex flex-wrap gap-1.5 z-10"> {/* Added flex-wrap */}
                    <Badge variant={typeBadgeVariant} className="text-xs py-0.5 px-1.5 rounded-sm shadow"> {/* Added shadow */}
                       {typeBadgeText}
                    </Badge>
                    {/* Show dynamic badges only if not in 'Recently Viewed' */}
                    {!isRecentlyViewed && (
                        <>
                            {post.isRecent && (
                                <Badge variant="secondary" className="text-xs py-0.5 px-1.5 rounded-sm shadow bg-green-500 text-white"> {/* Custom 'New' badge style */}
                                    New
                                </Badge>
                            )}
                            {post.isNearby && (
                                <Badge variant="secondary" className="text-xs py-0.5 px-1.5 rounded-sm shadow bg-blue-500 text-white"> {/* Custom 'Nearby' badge style */}
                                   <MapPin className="inline h-3 w-3 mr-0.5"/> Nearby
                                </Badge>
                            )}
                             {post.isTrending && (
                                 <Badge variant="secondary" className="text-xs py-0.5 px-1.5 rounded-sm shadow bg-orange-400 text-orange-900"> {/* Custom 'Trending' badge style */}
                                     🔥 Trending
                                 </Badge>
                             )}
                        </>
                    )}
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
