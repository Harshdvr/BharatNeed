'use client'; // Required for useState, useEffect and useAuthState

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import LoadingSpinner from "@/components/loading-spinner";
import { PlusCircle, MapPin, Clock, Tag, IndianRupee, Heart } from 'lucide-react';
import Link from "next/link";
import Image from "next/image";
import { useToast } from '@/hooks/use-toast';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, firestore } from '@/lib/firebase/clientApp'; // Import auth and firestore instance
import { doc, updateDoc, arrayUnion, arrayRemove, collection, query, orderBy, limit, getDocs } from 'firebase/firestore'; // Import Firestore functions

// TODO: Remove placeholder postings and fetch actual data from Firestore
const initialPostings: any[] = [
 // Example Structure (replace with fetched data)
 // { id: '1', type: 'Need', title: 'Need Plumber for Leaky Faucet', category: 'Services', location: 'Mumbai, MH', urgency: 'Urgent', budget: 'Negotiable', description: 'Small leak under kitchen sink needs fixing ASAP.', image: 'https://picsum.photos/seed/plumber/300/200', isFavorite: false, userId: 'user1' },
 // { id: '2', type: 'Offer', title: 'Homemade Pickles for Sale', category: 'Buy/Sell', location: 'Pune, MH', urgency: 'Low', budget: '₹150/kg', description: 'Delicious mango and lemon pickles, made with traditional recipes.', image: 'https://picsum.photos/seed/pickles/300/200', isFavorite: false, userId: 'user2' },
 // { id: '3', type: 'Need', title: 'Help with Rice Harvesting', category: 'Farming', location: 'Rural Village, UP', urgency: 'High', budget: 'Daily Wage', description: 'Need 5-6 laborers for 3 days of rice harvesting next week.', image: 'https://picsum.photos/seed/harvest/300/200', isFavorite: false, userId: 'user3' },
 // { id: '4', type: 'Offer', title: 'Mathematics Tuition (Class 10)', category: 'Tuitions', location: 'Delhi', urgency: 'Medium', budget: '₹2000/month', description: 'Experienced teacher offering maths tuition for CBSE Class 10.', image: 'https://picsum.photos/seed/tuition/300/200', isFavorite: false, userId: 'user4' },
 // { id: '5', type: 'Need', title: 'Part-time Graphic Designer', category: 'Jobs', location: 'Remote', urgency: 'Medium', budget: '₹15k/month', description: 'Looking for a designer for social media posts, 10-15 hours/week.', image: 'https://picsum.photos/seed/designer/300/200', isFavorite: false, userId: 'user1' },
];


// Placeholder for category icons - Assuming these remain static
const categoryIcons: { [key: string]: React.ElementType } = {
  'Services': Tag,
  'Buy/Sell': IndianRupee,
  'Farming': () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343m11.314 11.314a8 8 0 01-11.314 0m5.657-5.657a3 3 0 11-5.657 0 3 3 0 015.657 0zM15.5 7.5l-4 4" /></svg>, // Placeholder leaf icon
  'Tuitions': () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>, // Placeholder book icon
  'Jobs': () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>, // Placeholder briefcase icon
  'Help': () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>, // Placeholder heart icon
};

const getCategoryIcon = (category: string): React.ElementType => {
  return categoryIcons[category] || Tag; // Default to Tag icon
};


export default function Home() {
  // IMPORTANT: Check if auth is initialized before using the hook
  // Default to loading if auth is null or undefined during initialization
  const [user, authLoading, authError] = auth ? useAuthState(auth) : [null, true, new Error("Auth not initialized")];
  const [currentPostings, setCurrentPostings] = useState<any[]>([]); // State for postings data
  const [isLoading, setIsLoading] = useState(true); // State for loading data
  const { toast } = useToast();

  // Fetch postings data from Firestore in useEffect
  useEffect(() => {
    const fetchPostings = async () => {
        setIsLoading(true);
        if (!firestore) {
            console.error("Firestore not initialized");
            toast({ title: "Error", description: "Database connection failed.", variant: "destructive" });
            setIsLoading(false);
            return;
        }
        try {
            // const postingsRef = collection(firestore, 'postings'); // Adjust collection name
            // const q = query(postingsRef, orderBy('createdAt', 'desc'), limit(20)); // Example query
            // const querySnapshot = await getDocs(q);
            // const fetchedPostings = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // TODO: Fetch user's favorites to set the initial `isFavorite` state
            // This might involve another query or checking against a user's favorites list
            // For now, setting isFavorite to false as default placeholder behavior

            // setCurrentPostings(fetchedPostings.map(p => ({...p, isFavorite: false})));
            setCurrentPostings(initialPostings.map(p => ({...p, isFavorite: false}))); // Replace with actual fetched data
            console.log("Fetched postings (simulated)");
        } catch (error) {
            console.error("Error fetching postings:", error);
            toast({ title: "Error", description: "Could not load postings.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };
    fetchPostings();
  }, [toast]); // Add dependencies if needed (e.g., filter criteria)


  // Handle favoriting logic (Server Action updating Firestore)
  const handleToggleFavorite = async (postId: string) => {
    if (!user) {
        toast({ title: "Login Required", description: "Please log in to add favorites.", variant: "destructive" });
        return;
    }
    if (!firestore) {
         toast({ title: "Error", description: "Database connection failed.", variant: "destructive" });
         return;
    }

    const postingIndex = currentPostings.findIndex(p => p.id === postId);
    if (postingIndex === -1) return;

    const posting = currentPostings[postingIndex];
    const isCurrentlyFavorite = posting.isFavorite;

    // Optimistically update UI
    setCurrentPostings(prevPostings =>
      prevPostings.map(p =>
        p.id === postId ? { ...p, isFavorite: !isCurrentlyFavorite } : p
      )
    );

    console.log(`Toggling favorite for post ${postId}. New state: ${!isCurrentlyFavorite}`);
    toast({
      description: !isCurrentlyFavorite ? "Added to favorites!" : "Removed from favorites.",
    });

    try {
        // Update user's favorites array in Firestore
        const userDocRef = doc(firestore, 'users', user.uid);
        if (isCurrentlyFavorite) {
            await updateDoc(userDocRef, { favorites: arrayRemove(postId) });
        } else {
            // Use merge: true to create the favorites array if it doesn't exist
            await updateDoc(userDocRef, { favorites: arrayUnion(postId) }, { merge: true });
        }
        console.log("Firestore favorite status updated");
    } catch (error) {
        console.error("Error updating favorites:", error);
        toast({ title: "Error", description: "Could not update favorites.", variant: "destructive" });
        // Revert optimistic UI update on error
        setCurrentPostings(prevPostings =>
          prevPostings.map(p =>
            p.id === postId ? { ...p, isFavorite: isCurrentlyFavorite } : p
          )
        );
    }
  };

  // Handle auth error display
  useEffect(() => {
    if (authError) {
      console.error("Firebase Auth Hook Error:", authError);
      toast({
        title: "Authentication Error",
        description: authError.message || "Could not verify user.",
        variant: "destructive",
      });
    }
  }, [authError, toast]);

  if (isLoading || authLoading) {
       return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <LoadingSpinner />
            </div>
       );
  }


  return (
    <div className="relative min-h-full">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
          Welcome to Bharat Need
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
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
      {/* TODO: Implement filtering logic */}
      <div className="mb-6 flex flex-wrap justify-center gap-2">
        {Object.keys(categoryIcons).map((category) => {
          const Icon = getCategoryIcon(category);
          return (
            <Button key={category} variant="outline" size="sm" className="gap-1">
              <Icon />
              {category}
            </Button>
          );
        })}
         <Button variant="secondary" size="sm">All Categories</Button>
      </div>

      {/* Postings Grid */}
      {currentPostings.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pb-20">
            {currentPostings.map((post) => {
              const CategoryIcon = getCategoryIcon(post.category);
              return (
              <Card key={post.id} className="flex flex-col overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200 group/card">
                 <div className="relative w-full aspect-[3/2]">
                     <Link href={`/postings/${post.id}`} className="block absolute inset-0 bg-muted">
                        <Image
                            src={post.image || 'https://picsum.photos/300/200'}
                            alt={post.title || 'Posting image'}
                            fill
                            style={{ objectFit: 'cover' }}
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
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
                       <Badge variant={post.type === 'Need' ? 'destructive' : 'default'} className="shrink-0">
                         {post.type}
                       </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-1 text-xs pt-1">
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
                     <div className="flex items-center gap-1.5 w-full px-4">
                        <Clock className="h-3.5 w-3.5" /> Urgency: {post.urgency || 'N/A'}
                     </div>
                     <div className="flex items-center gap-1.5 w-full font-semibold pb-3 px-4">
                        <IndianRupee className="h-3.5 w-3.5" /> {post.budget || 'N/A'}
                     </div>
                  </CardFooter>
                </Link>
              </Card>
              );
            })}
          </div>
      ) : (
         <div className="text-center py-10">
            {isLoading ? ( // Show spinner while postings are loading if no postings yet
                <LoadingSpinner />
            ) : (
                <>
                    <p className="text-lg text-muted-foreground">No postings found. Be the first to post!</p>
                    <Button asChild className="mt-4">
                        <Link href="/post-need">Post Need/Offer</Link>
                    </Button>
                 </>
            )}
        </div>
      )}
    </div>
  );
}
