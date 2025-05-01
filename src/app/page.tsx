
'use client'; // Required for useState, useEffect and useAuthState

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import LoadingSpinner from "@/components/loading-spinner";
import { PlusCircle, MapPin, Clock, Tag, IndianRupee, Heart, Plus, Search, MessageSquare } from 'lucide-react'; // Added new icons
import Link from "next/link";
import Image from "next/image";
import { useToast } from '@/hooks/use-toast';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, firestore, ensureFirestoreInitialized } from '@/lib/firebase/clientApp'; // Import auth and firestore instance, and helper
import { doc, updateDoc, arrayUnion, arrayRemove, collection, query, orderBy, limit, getDocs, getDoc } from 'firebase/firestore'; // Import Firestore functions
import { useSearchParams } from 'next/navigation'; // Import useSearchParams


// Placeholder for category icons - Assuming these remain static
const categoryIcons: { [key: string]: React.ElementType } = {
  'Services': Tag,
  'Buy/Sell': IndianRupee,
  'Farming': () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343m11.314 11.314a8 8 0 01-11.314 0m5.657-5.657a3 3 0 11-5.657 0 3 3 0 015.657 0zM15.5 7.5l-4 4" /></svg>, // Placeholder leaf icon
  'Tuitions': () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>, // Placeholder book icon
  'Jobs': () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>, // Placeholder briefcase icon
  'Help': () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>, // Placeholder heart icon
  'Other': Tag, // Added Other category
};

const getCategoryIcon = (category: string): React.ElementType => {
  return categoryIcons[category] || Tag; // Default to Tag icon
};

// Mock Data for testing
const mockPostings = [
  {
    id: 'mock1',
    title: 'Mock Need: Urgent Plumbing Help',
    description: 'Need a plumber urgently for a leaky kitchen sink. Available anytime today.',
    category: 'services',
    postType: 'need',
    location: 'Mumbai, MH',
    budget: 'Negotiable',
    urgency: 'urgent',
    imageUrls: ['https://picsum.photos/seed/plumber/300/200'],
    createdAt: new Date(),
    isFavorite: false, // Initial state
  },
  {
    id: 'mock2',
    title: 'Mock Offer: Homemade Mango Pickles',
    description: 'Selling delicious homemade mango pickles, prepared with traditional recipes. Order now!',
    category: 'buy/sell',
    postType: 'offer',
    location: 'Pune, MH',
    budget: '₹150/kg',
    urgency: 'low',
    imageUrls: ['https://picsum.photos/seed/pickles/300/200'],
    createdAt: new Date(Date.now() - 86400000 * 2), // 2 days ago
    isFavorite: false,
  },
  {
    id: 'mock3',
    title: 'Mock Need: Farm Laborers for Harvest',
    description: 'Looking for 5-6 laborers for rice harvesting for 3 days next week. Daily wage provided.',
    category: 'farming',
    postType: 'need',
    location: 'Rural Village, UP',
    budget: 'Daily Wage',
    urgency: 'high',
    imageUrls: ['https://picsum.photos/seed/harvest/300/200'],
    createdAt: new Date(Date.now() - 86400000 * 5), // 5 days ago
    isFavorite: false,
  },
    {
    id: 'mock4',
    title: 'Mock Offer: Maths Tuition Class 10',
    description: 'Experienced teacher offering online Maths tuition for CBSE Class 10 students.',
    category: 'tuitions',
    postType: 'offer',
    location: 'Delhi',
    budget: '₹2000/month',
    urgency: 'medium',
    imageUrls: ['https://picsum.photos/seed/tuition/300/200'],
    createdAt: new Date(Date.now() - 86400000), // 1 day ago
    isFavorite: false,
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
    if (authError) {
      console.error("Firebase Auth Hook Error:", authError);
    }
  }, [authError, toast]);

  // Show LoadingSpinner only if auth is loading, not for data fetching (using mock data)
   if (authLoading) {
       return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <LoadingSpinner />
            </div>
       );
   }


  return (
    <div className="relative min-h-full">
      {/* Hero Section */}
      <div className="mb-12 text-center pt-8 pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
          Welcome to Bharat Need
        </h1>
        <p className="mt-2 text-lg text-muted-foreground max-w-2xl mx-auto">
          Connecting needs and offers across India. Post what you need, offer what you have.
        </p>
         <Button
            variant="default"
            size="lg"
            className="mt-6 bg-accent hover:bg-accent/90 text-accent-foreground shadow-md rounded-full px-6 py-3"
            asChild
          >
            <Link href="/post-need">
              <PlusCircle className="mr-2 h-5 w-5" />
              Post Your Need or Offer
            </Link>
          </Button>
      </div>

      {/* Category Filters Placeholder */}
      <div className="mb-8 flex flex-wrap justify-center gap-2">
        {Object.keys(categoryIcons).map((category) => {
          const Icon = getCategoryIcon(category);
          return (
            <Button key={category} variant="outline" size="sm" className="gap-1 capitalize">
              <Icon />
              {category}
            </Button>
          );
        })}
         <Button variant="secondary" size="sm">All Categories</Button>
      </div>

      {/* Postings Grid */}
      {currentPostings.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pb-12">
            {currentPostings.map((post) => {
              const CategoryIcon = getCategoryIcon(post.category);
              const createdAtDate = post.createdAt instanceof Date ? post.createdAt : post.createdAt?.toDate ? post.createdAt.toDate() : null;
              const formattedDate = createdAtDate ? createdAtDate.toLocaleDateString() : 'N/A';

              return (
              <Card key={post.id} className="flex flex-col overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200 group/card">
                 <div className="relative w-full aspect-[3/2]">
                     <Link href={`/postings/${post.id}`} className="block absolute inset-0 bg-muted">
                        <Image
                            src={post.imageUrls?.[0] || 'https://picsum.photos/300/200'} // Use first image or default
                            alt={post.title || 'Posting image'}
                            fill
                            style={{ objectFit: 'cover' }}
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                            data-ai-hint="product service picture" /* Added AI hint */
                            priority={post.id.startsWith('mock')} // Prioritize loading mock images
                        />
                     </Link>
                    {/* Favorite Button Overlay */}
                    {user && ( // Only show if user is logged in
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
                  <CardHeader className="p-0 pb-3">
                    <div className="flex justify-between items-start gap-2">
                       <CardTitle className="text-lg leading-tight line-clamp-2">{post.title || 'Untitled Post'}</CardTitle>
                       <Badge variant={post.postType === 'need' ? 'destructive' : 'default'} className="shrink-0 capitalize">
                         {post.postType}
                       </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-1 text-xs pt-1 capitalize">
                       <CategoryIcon /> {post.category || 'Uncategorized'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground flex-grow p-0 pb-3">
                    <p className="line-clamp-3">{post.description || 'No description'}</p>
                  </CardContent>
                  <CardFooter className="flex flex-col items-start gap-2 pt-3 text-xs border-t bg-muted/50 p-0 mt-auto">
                     <div className="flex items-center gap-1.5 w-full pt-3 px-4">
                        <MapPin className="h-3.5 w-3.5" /> <span className="truncate">{post.location || 'N/A'}</span>
                     </div>
                     <div className="flex items-center gap-1.5 w-full px-4 capitalize">
                        <Clock className="h-3.5 w-3.5" /> Urgency: {post.urgency || 'N/A'}
                     </div>
                     <div className="flex items-center gap-1.5 w-full font-semibold px-4">
                        <IndianRupee className="h-3.5 w-3.5" /> {post.budget || 'N/A'}
                     </div>
                      <div className="flex items-center gap-1.5 w-full text-muted-foreground pb-3 px-4">
                         <Clock className="h-3.5 w-3.5" /> Posted: {formattedDate}
                      </div>
                  </CardFooter>
                </Link>
              </Card>
              );
            })}
          </div>
      ) : (
         <div className="text-center py-10">
            <p className="text-lg text-muted-foreground">No postings found. Be the first to post!</p>
            <Button asChild className="mt-4">
                <Link href="/post-need">Post Need/Offer</Link>
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
                        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary mb-4">
                            <Plus className="h-8 w-8 text-primary-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">1. Post Easily</h3>
                        <p className="text-muted-foreground">
                            Quickly post your need or offer in just a few steps.
                        </p>
                    </div>
                    {/* Step 2: Find Locally */}
                    <div className="flex flex-col items-center">
                        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary mb-4">
                            <Search className="h-8 w-8 text-primary-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">2. Find Locally</h3>
                        <p className="text-muted-foreground">
                            Discover relevant listings prioritized by your location.
                        </p>
                    </div>
                    {/* Step 3: Connect Directly */}
                    <div className="flex flex-col items-center">
                         <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary mb-4">
                            <MessageSquare className="h-8 w-8 text-primary-foreground" />
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
