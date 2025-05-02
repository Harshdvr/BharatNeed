'use client'; // Required for useState, useEffect and useAuthState

import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import LoadingSpinner from "@/components/loading-spinner";
import { Plus, Search as SearchIcon, MessageSquare, MapPin, Clock, Tag, IndianRupee, Heart } from 'lucide-react';
import Link from "next/link";
import Image from "next/image";
import { useToast } from '@/hooks/use-toast';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, firestore, ensureFirestoreInitialized, ensureAuthInitialized } from '@/lib/firebase/clientApp'; // Import auth and firestore instance, and helper
import { doc, updateDoc, arrayUnion, arrayRemove, collection, query, orderBy, limit, getDocs, getDoc } from 'firebase/firestore'; // Import Firestore functions
import { useSearchParams } from 'next/navigation'; // Import useSearchParams hook
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

   // 1. Proximity Bonus (Weight: 7 - Adjusted to prioritize location)
  if (isNearby(post.location, userLocation)) {
    score += 7;
  }

   // 2. Recency Bonus (Weight: 3) - Higher for very recent
  if (hoursSincePost <= 24) { // Within 1 day
    score += 3;
  } else if (hoursSincePost <= 72) { // Within 3 days
    score += 1.5;
  }

   // 3. Image Bonus (Weight: 2) - Prioritize posts with images
   if (post.imageUrls && post.imageUrls.length > 0) {
     score += 2;
   }

   // 4. Category Match Bonus (Weight: 5)
  if (isCategoryMatch(post.category, userPrefs.categories)) {
      score += 5;
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
  selectedCategory: string | null, // Add selected category filter
  limit: number = 20
): any[] => {

  const scoredPosts = allPosts
    .filter(post => !post.recentlyViewed) // Exclude recently viewed for the main feed
    .filter(post => !selectedCategory || post.category?.toLowerCase() === selectedCategory) // Filter by selected category if present
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

// Function to get Recently Viewed Feed
const getRecentlyViewedFeed = (
    allPosts: any[],
    limit: number = 4
): any[] => {
    return allPosts
        .filter(p => p.recentlyViewed)
        .sort((a, b) => { // Sort recently viewed by date viewed (assuming we add this later) or createdAt
            const dateA = a.createdAt instanceof Date ? a.createdAt : a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
            const dateB = b.createdAt instanceof Date ? b.createdAt : b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
            return dateB.getTime() - dateA.getTime();
        })
        .slice(0, limit);
};

// --- End of Simplified Feed Algorithm ---


export default function Home() {
  // Safely call useAuthState only if auth is initialized
  const [user, authLoading, authError] = auth ? useAuthState(auth) : [null, true, new Error("Auth not initialized")];
  const [isLoading, setIsLoading] = useState(false);
  const [userFavorites, setUserFavorites] = useState<string[]>([]);
  const { toast } = useToast();
  const searchParams = useSearchParams(); // Use the hook
  const categoryParam = searchParams?.get('category'); // Get category from URL
  const [firestoreInitialized, setFirestoreInitialized] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(categoryParam);
  const [currentUserLocation, setCurrentUserLocation] = useState<string | null>(null);

  const [personalizedFeed, setPersonalizedFeed] = useState<any[]>([]);
  const [recentlyViewedPostings, setRecentlyViewedPostings] = useState<any[]>([]);
  const [allPostings, setAllPostings] = useState<any[]>([]); // Store all fetched posts

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
          // toast({ title: "Database Error", description: "Could not connect to the database.", variant: "destructive" });
        }
      }, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, []);

   useEffect(() => {
    // Update selected category based on URL parameter
    setSelectedCategory(categoryParam);
  }, [categoryParam]);


   useEffect(() => {
    const fetchData = async () => {
        setIsLoading(true);

        // --- 1. Get User Context (Location & Favorites) ---
        let fetchedUserLocation = mockUserLocation; // Default to mock
        let fetchedUserFavorites: string[] = [];
        if (user && firestoreInitialized) {
           try {
             const fs = ensureFirestoreInitialized();
             const authInstance = ensureAuthInitialized(); // Ensure auth is ready
             const currentUser = authInstance.currentUser; // Use currentUser from the initialized auth instance
             if (!currentUser) {
                 console.warn("User not available yet for fetching profile.");
             } else {
                 const userDocRef = doc(fs, 'users', currentUser.uid);
                 const userDocSnap = await getDoc(userDocRef);
                 if (userDocSnap.exists()) {
                   const userData = userDocSnap.data();
                   fetchedUserLocation = userData.location || mockUserLocation;
                   fetchedUserFavorites = userData.favorites || [];
                 } else {
                    console.log("User document not found, using defaults.");
                 }
             }
           } catch (error: any) {
             console.error("Error fetching user data:", error);
             if (error.code === 'unavailable' || error.message.includes('offline')) {
                 toast({ title: "Offline", description: "Could not load user data. Showing default content.", variant: "default" });
             } else {
                 toast({ title: "Error", description: "Could not load user profile.", variant: "destructive" });
             }
           }
         }
        setCurrentUserLocation(fetchedUserLocation);
        setUserFavorites(fetchedUserFavorites);

        // --- 2. Fetch Posts (Simulated with Mock Data for now) ---
        let fetchedPostings: any[] = [];
        if (firestoreInitialized) {
          try {
            const fs = ensureFirestoreInitialized();
            const postingsRef = collection(fs, 'postings');
            const q = query(postingsRef, orderBy('createdAt', 'desc'), limit(100)); // Fetch more for algorithm
            const querySnapshot = await getDocs(q);
            fetchedPostings = querySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
            }));
            setAllPostings(fetchedPostings); // Store all fetched postings
             console.log("Fetched postings from Firestore:", fetchedPostings.length);
          } catch (error: any) {
            console.error("Error fetching postings:", error);
            if (error.code === 'unavailable' || error.message.includes('offline')) {
                 toast({ title: "Offline", description: "Could not load postings. Showing mock data.", variant: "default" });
                 fetchedPostings = mockPostings; // Fallback to mock data
                 setAllPostings(fetchedPostings);
            } else {
                 toast({ title: "Error", description: "Could not load postings.", variant: "destructive" });
                 fetchedPostings = mockPostings; // Fallback to mock data
                 setAllPostings(fetchedPostings);
            }
          }
        } else {
           fetchedPostings = mockPostings; // Use mock if Firestore not ready
           setAllPostings(fetchedPostings);
            console.log("Using mock postings as Firestore is not initialized.");
        }

        setIsLoading(false);
    };

    // Fetch data when component mounts, user changes, or Firestore becomes ready
    fetchData();

  }, [user, firestoreInitialized, toast]); // Removed selectedCategory from here


  // Handle favoriting logic
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
     setAllPostings(prev => // Update the main source of truth
        prev.map(p => p.id === postId ? { ...p, isFavorite: !isCurrentlyFavorite } : p)
     );
     // Update derived feeds immediately based on the change
     setPersonalizedFeed(prev =>
       prev.map(p => p.id === postId ? { ...p, isFavorite: !isCurrentlyFavorite } : p)
     );
     setRecentlyViewedPostings(prev =>
       prev.map(p => p.id === postId ? { ...p, isFavorite: !isCurrentlyFavorite } : p)
     );


    // Update Firestore
    try {
        const fs = ensureFirestoreInitialized();
        const authInstance = ensureAuthInitialized();
        const currentUser = authInstance.currentUser;
        if (!currentUser) throw new Error("User not found for favorite update.");

        const userDocRef = doc(fs, 'users', currentUser.uid);
        if (isCurrentlyFavorite) {
            await updateDoc(userDocRef, { favorites: arrayRemove(postId) });
            toast({ description: "Removed from favorites!" });
        } else {
            await updateDoc(userDocRef, { favorites: arrayUnion(postId) });
            toast({ description: "Added to favorites!" });
        }
        console.log(`Favorite status for ${postId} updated in Firestore.`);
    } catch (error: any) {
        console.error("Error updating favorites:", error);
        if (error.code === 'unavailable' || error.message.includes('offline')) {
            toast({ title: "Offline", description: "Could not update favorites. Please check connection.", variant: "destructive" });
        } else {
            toast({ title: "Error", description: "Could not update favorites.", variant: "destructive" });
        }
        // Revert optimistic UI update on error
        setUserFavorites(prevFavs =>
            isCurrentlyFavorite ? [...prevFavs, postId] : prevFavs.filter(id => id !== postId)
        );
         setAllPostings(prev =>
            prev.map(p => p.id === postId ? { ...p, isFavorite: isCurrentlyFavorite } : p)
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
    if (authError && !authLoading) {
      console.error("Firebase Auth Hook Error:", authError);
    }
  }, [authError, authLoading, toast]);

  // --- Re-filter feed when `allPostings` or `selectedCategory` changes ---
  useEffect(() => {
    if (allPostings.length > 0) { // Only run if postings have been fetched
        const postingsWithFavorites = allPostings.map(p => ({
            ...p,
            isFavorite: userFavorites.includes(p.id),
            recentlyViewed: p.recentlyViewed || false
        }));

        const feed = getPersonalizedFeed(postingsWithFavorites, currentUserLocation, mockUserPreferences, selectedCategory);
        setPersonalizedFeed(feed);

        const recentViews = getRecentlyViewedFeed(postingsWithFavorites);
        setRecentlyViewedPostings(recentViews);
    }
  }, [allPostings, selectedCategory, userFavorites, currentUserLocation]); // Added dependencies


  return (
    <div className="relative min-h-full">
      {/* Loading Spinner - Conditionally render */}
       {(isLoading || authLoading) && firestoreInitialized && (
         <div className="fixed inset-0 flex items-center justify-center bg-background/80 z-50">
           <LoadingSpinner />
         </div>
       )}

       {/* Hero Section with Background Gradient */}
        <div className="text-center pt-16 pb-12 px-4 bg-gradient-to-b from-[--gradient-start] via-[--gradient-middle] to-[--gradient-end] dark:from-[--gradient-start] dark:via-[--gradient-middle] dark:to-[--gradient-end]">
         <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl mb-4">
           Find What You Need,<br/> Offer What You Have.
         </h1>
         <p className="mt-2 text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
            BharatNeed connects your local community across India - from bustling cities to remote villages - for everything you need or offer.
         </p>
         {/* Floating Action Button Style - Centered below text */}
          <div className="flex justify-center">
             <Button
                variant="default"
                size="lg"
                className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg rounded-full px-6 py-3" // Updated style
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
       {!isLoading && personalizedFeed.length > 0 && (
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
       {!isLoading && recentlyViewedPostings.length > 0 && (
            <div className="py-16 px-4">
             <h2 className="text-2xl font-semibold mb-6">Recently Viewed</h2>
             <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                 {recentlyViewedPostings.map((post) => (
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
    user: any,
    handleToggleFavorite: (id: string) => void,
    isRecentlyViewed?: boolean
}) {
    const CategoryIcon = CategorySelector.categoryDetails.find(c => c.name.toLowerCase() === post.category?.toLowerCase())?.icon || Tag;
    const createdAtDate = post.createdAt instanceof Date ? post.createdAt : post.createdAt?.toDate ? post.createdAt.toDate() : null;

    let formattedDate = 'N/A';
    if (createdAtDate) {
       try {
         formattedDate = formatRelativeTime(createdAtDate);
       } catch (e) {
         console.error("Error formatting date:", e);
         formattedDate = createdAtDate.toLocaleDateString(); // Fallback
       }
    }

     let typeBadgeText = post.postType === 'need' ? 'Need' : 'Offer';
     let typeBadgeVariant: "default" | "destructive" | "secondary" | "outline" = post.postType === 'need' ? 'destructive' : 'default';


    return (
        <Card className="flex flex-col overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200 group/card border rounded-lg bg-card">
            <div className="relative w-full aspect-[4/3]">
                <Link href={`/postings/${post.id}`} className="block absolute inset-0 bg-muted">
                    <Image
                        src={post.imageUrls?.[0] || 'https://picsum.photos/400/300'}
                        alt={post.title || 'Posting image'}
                        fill
                        style={{ objectFit: 'cover' }}
                        className="rounded-t-lg transition-transform duration-300 group-hover/card:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                        data-ai-hint="product service picture"
                        priority={post.id.startsWith('mock')}
                    />
                </Link>
                 <div className="absolute top-2 left-2 flex flex-wrap gap-1.5 z-10">
                    <Badge variant={typeBadgeVariant} className="text-xs py-0.5 px-1.5 rounded-sm shadow">
                       {typeBadgeText}
                    </Badge>
                    {!isRecentlyViewed && (
                        <>
                            {post.isRecent && (
                                <Badge variant="secondary" className="text-xs py-0.5 px-1.5 rounded-sm shadow bg-green-500 text-white">
                                    New
                                </Badge>
                            )}
                            {post.isNearby && (
                                <Badge variant="secondary" className="text-xs py-0.5 px-1.5 rounded-sm shadow bg-blue-500 text-white">
                                   <MapPin className="inline h-3 w-3 mr-0.5"/> Nearby
                                </Badge>
                            )}
                             {post.isTrending && (
                                 <Badge variant="secondary" className="text-xs py-0.5 px-1.5 rounded-sm shadow bg-orange-400 text-orange-900">
                                     🔥 Trending
                                 </Badge>
                             )}
                        </>
                    )}
                </div>
                {user && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "absolute top-2 right-2 z-10 h-8 w-8 rounded-full bg-background/70 text-destructive hover:bg-background hover:text-destructive transition-colors",
                            post.isFavorite ? "text-destructive" : "text-muted-foreground" // Dynamic text color based on favorite state
                        )}
                        onClick={() => handleToggleFavorite(post.id)}
                        aria-label={post.isFavorite ? "Remove from favorites" : "Add to favorites"}
                        >
                        <Heart className={cn(
                            "h-5 w-5 transition-all",
                            post.isFavorite ? 'fill-destructive scale-110' : 'fill-transparent' // Fill and scale effect
                        )} />
                     </Button>
                )}
            </div>
            <Link href={`/postings/${post.id}`} className="flex flex-col flex-grow p-4">
              <CardHeader className="p-0 pb-2">
                <CardTitle className="text-base leading-snug line-clamp-2 mb-1 group-hover/card:text-primary transition-colors">{post.title || 'Untitled Post'}</CardTitle>
                 <CardDescription className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3"/> <span className="truncate">{post.location || 'N/A'}</span>
                 </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground flex-grow p-0 pb-3 line-clamp-2">
                {post.description || 'No description'}
              </CardContent>
              <CardFooter className="flex justify-between items-center pt-3 text-xs p-0 mt-auto border-t">
                 <span className="font-semibold text-primary text-sm">
                    {post.budget?.toLowerCase().includes('budget:') ? post.budget : `₹${post.budget || 'N/A'}`}
                 </span>
                 <span className="text-muted-foreground">{formattedDate}</span>
              </CardFooter>
            </Link>
        </Card>
    );
}


// Function to format relative time nicely
function formatRelativeTime(date: Date): string {
   const now = new Date();
   const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
   const diffInMinutes = Math.floor(diffInSeconds / 60);
   const diffInHours = Math.floor(diffInMinutes / 60);
   const diffInDays = Math.floor(diffInHours / 24);
   const diffInWeeks = Math.floor(diffInDays / 7);
   const diffInMonths = Math.floor(diffInDays / 30); // Approximate
   const diffInYears = Math.floor(diffInDays / 365); // Approximate

   if (diffInSeconds < 60) return 'Just now';
   if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
   if (diffInHours < 24) return `${diffInHours}h ago`;
   if (diffInDays < 7) return `${diffInDays}d ago`;
   if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
   if (diffInMonths < 12) return `${diffInMonths}m ago`;
   return `${diffInYears}y ago`;
}
