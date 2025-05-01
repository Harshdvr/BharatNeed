
'use client';

import { useState, useEffect } from 'react'; // Import useState and useEffect
import LoadingSpinner from "@/components/loading-spinner"; // Keep LoadingSpinner import
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, IndianRupee, MapPin, MoreVertical, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useToast } from '@/hooks/use-toast'; // Import useToast
import { useAuthState } from 'react-firebase-hooks/auth'; // Import hook
import { auth, firestore, ensureFirestoreInitialized } from '@/lib/firebase/clientApp'; // Import auth, firestore, and helper
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore'; // Import Firestore functions

// Posting type definition
interface Posting {
    id: string;
    status?: 'active' | 'pending' | 'inactive';
    title?: string;
    category?: string;
    location?: string;
    budget?: string;
    description?: string;
    imageUrls?: string[]; // Assuming multiple images
    views?: number;
    datePosted?: any; // Firestore Timestamp or Date
    userId?: string; // Added userId field
    createdAt?: any; // Firestore Timestamp
}

// Mock Data for testing
const mockUserAds: Posting[] = [
  {
    id: 'myad1',
    userId: 'mockUserId123', // Add a mock user ID
    title: 'My Mock Ad: Offering Web Design Services',
    description: 'Experienced web designer available for freelance projects. Specializing in React and Next.js.',
    category: 'services',
    postType: 'offer',
    location: 'Remote',
    budget: 'Project-based',
    urgency: 'medium',
    imageUrls: ['https://picsum.photos/seed/webdesign/300/200'],
    createdAt: new Date(Date.now() - 86400000 * 3), // 3 days ago
    status: 'active',
    views: 25,
  },
  {
    id: 'myad2',
    userId: 'mockUserId123',
    title: 'My Mock Need: Looking for Used Bicycle',
    description: 'Need a decent condition used bicycle for daily commute. Budget around ₹3000.',
    category: 'buy/sell',
    postType: 'need',
    location: 'Bangalore, KA',
    budget: '₹3000',
    urgency: 'low',
    imageUrls: ['https://picsum.photos/seed/bicycle/300/200'],
    createdAt: new Date(Date.now() - 86400000 * 10), // 10 days ago
    status: 'active',
    views: 40,
  },
    {
    id: 'myad3',
    userId: 'mockUserId123',
    title: 'Pending Ad: Guitar Lessons',
    description: 'Offering beginner guitar lessons online.',
    category: 'tuitions',
    postType: 'offer',
    location: 'Online',
    budget: '₹500/hour',
    urgency: 'low',
    imageUrls: ['https://picsum.photos/seed/guitar/300/200'],
    createdAt: new Date(), // Today
    status: 'pending', // Pending status
    views: 0,
  },
    {
    id: 'myad4',
    userId: 'mockUserId123',
    title: 'Inactive Ad: Sold Old Table',
    description: 'Solid wood table, sold.',
    category: 'buy/sell',
    postType: 'offer',
    location: 'Chennai, TN',
    budget: '₹1500',
    urgency: 'low',
    imageUrls: ['https://picsum.photos/seed/table/300/200'],
    createdAt: new Date(Date.now() - 86400000 * 30), // 30 days ago
    status: 'inactive', // Inactive status
    views: 55,
  },
];

export default function MyAdsPage() {
    const [user, authLoading, authError] = auth ? useAuthState(auth) : [null, true, new Error("Auth not initialized")];
    const [myPostings, setMyPostings] = useState<Posting[]>(mockUserAds); // Initialize with mock data
    const [isLoadingInitialData, setIsLoadingInitialData] = useState(false); // No initial loading needed for mock
    const [loadingDeleteId, setLoadingDeleteId] = useState<string | null>(null); // State for delete loading
    const { toast } = useToast();
    const [firestoreInitialized, setFirestoreInitialized] = useState(true); // Assume initialized for mock

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
                     console.error("Firestore still not initialized after delay for my ads.");
                     toast({ title: "Database Error", description: "Could not connect to the database.", variant: "destructive" });
                     setIsLoadingInitialData(false);
                 }
             }, 2000);
             return () => clearTimeout(timeoutId);
         }
     }, [toast]);

    useEffect(() => {
      const fetchMyAds = async () => {
        if (!user) {
          setIsLoadingInitialData(false);
          return; // Exit if not logged in
        }
        setIsLoadingInitialData(true);
        try {
          const fs = ensureFirestoreInitialized(); // Ensure firestore is ready
          const adsRef = collection(fs, 'postings'); // Adjust collection name
          const q = query(adsRef, where('userId', '==', user.uid)); // Assuming 'userId' field exists
          const querySnapshot = await getDocs(q);
          const userAds = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Posting));
          setMyPostings(userAds);
          console.log("Fetched user ads from Firestore");
        } catch (error: any) {
          console.error("Error fetching user ads:", error);
          if (error.message.includes("Firestore is not initialized")) {
               toast({ title: "Database Error", description: "Could not fetch your ads.", variant: "destructive" });
           } else if (error.code === 'unavailable' || error.message.includes('offline')) {
               toast({ title: "Offline", description: "Could not fetch ads. Displaying cached data if available.", variant: "default" });
           } else {
               toast({ title: "Error", description: "Could not fetch your ads.", variant: "destructive" });
           }
        } finally {
          setIsLoadingInitialData(false);
        }
      };

      if (!authLoading && firestoreInitialized) { // Check firestoreInitialized
        fetchMyAds();
      }

       // Handle auth errors
      if (authError) {
        console.error("Firebase Auth Hook Error:", authError);
        toast({
          title: "Authentication Error",
          description: authError.message || "Could not verify user.",
          variant: "destructive",
        });
        setIsLoadingInitialData(false);
      }
    }, [user, authLoading, toast, authError, firestoreInitialized]);
    */
   // --- End of commented out Firestore fetching logic ---


    const activeAds = myPostings.filter(ad => ad.status === 'active');
    const pendingAds = myPostings.filter(ad => ad.status === 'pending');
    const inactiveAds = myPostings.filter(ad => ad.status === 'inactive');

    // Simulated Delete Handler
    const handleDelete = async (id: string) => {
        if (!user) {
             toast({ title: "Login Required", description: "Please log in.", variant: "destructive" });
             return;
        }
        setLoadingDeleteId(id); // Start loading for this ad deletion

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Optimistically update UI
        setMyPostings(prev => prev.filter(ad => ad.id !== id));
        toast({ title: "Ad Deleted", description: "Your ad has been successfully deleted (simulated)." });

        setLoadingDeleteId(null); // Stop loading

        // In real app, keep the try/catch and Firestore delete logic here
        /*
        try {
            const fs = ensureFirestoreInitialized();
            await deleteDoc(doc(fs, 'postings', id));
            console.log(`Deleted ad ${id} from Firestore`);
            // UI update happens above
            toast({ title: "Ad Deleted", description: "Your ad has been successfully deleted." });
        } catch (error: any) {
            console.error("Failed to delete ad:", error);
             if (error.message.includes("Firestore is not initialized")) {
                 toast({ title: "Database Error", description: "Could not delete the ad.", variant: "destructive" });
             } else if (error.code === 'unavailable' || error.message.includes('offline')) {
                  toast({ title: "Offline", description: "Could not delete ad. Please check connection.", variant: "destructive" });
             } else {
                toast({ title: "Error", description: "Could not delete the ad.", variant: "destructive" });
            }
            // Revert UI if needed, or allow retry
        } finally {
            setLoadingDeleteId(null); // Stop loading
        }
        */
    };

     // Show loading only if auth is loading
    if (authLoading) {
        return (
             <div className="flex justify-center items-center min-h-[60vh]">
                <LoadingSpinner />
            </div>
        );
    }

     if (!user && !authLoading) {
         return (
            <div className="text-center py-10">
                 <p className="text-lg text-muted-foreground mb-4">Please log in to view your ads.</p>
                 <Button asChild>
                    <Link href="/login">Login / Sign Up</Link>
                 </Button>
            </div>
         );
     }


    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">My Ads</h1>

            <Tabs defaultValue="active" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="active">Active ({activeAds.length})</TabsTrigger>
                    <TabsTrigger value="pending">Pending ({pendingAds.length})</TabsTrigger>
                    <TabsTrigger value="inactive">Inactive ({inactiveAds.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="active">
                    {activeAds.length > 0 ? (
                        <div className="space-y-4">
                            {activeAds.map((ad) => (
                                <AdCard key={ad.id} ad={ad} onDelete={handleDelete} loadingDeleteId={loadingDeleteId} />
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground py-6">You have no active ads.</p>
                    )}
                </TabsContent>

                <TabsContent value="pending">
                     {pendingAds.length > 0 ? (
                        <div className="space-y-4">
                            {pendingAds.map((ad) => (
                                <AdCard key={ad.id} ad={ad} onDelete={handleDelete} loadingDeleteId={loadingDeleteId}/>
                            ))}
                        </div>
                    ) : (
                         <p className="text-center text-muted-foreground py-6">You have no pending ads.</p>
                    )}
                </TabsContent>

                <TabsContent value="inactive">
                     {inactiveAds.length > 0 ? (
                        <div className="space-y-4">
                            {inactiveAds.map((ad) => (
                                <AdCard key={ad.id} ad={ad} onDelete={handleDelete} loadingDeleteId={loadingDeleteId}/>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground py-6">You have no inactive ads.</p>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}

// Reusable Ad Card Component for My Ads page
function AdCard({ ad, onDelete, loadingDeleteId }: {
    ad: Posting, // Use the specific type
    onDelete: (id: string) => void,
    loadingDeleteId: string | null
}) {
    const isDeleting = loadingDeleteId === ad.id;
    // Format date if available
    const datePostedFormatted = ad.createdAt instanceof Date ? ad.createdAt.toLocaleDateString() : ad.createdAt?.toDate ? ad.createdAt.toDate().toLocaleDateString() : 'N/A';


    return (
        <Card className="overflow-hidden flex flex-col sm:flex-row shadow-md hover:shadow-lg transition-shadow duration-200 relative">
            {/* Spinner overlay for delete operation */}
            {isDeleting && (
                 <div className="absolute inset-0 bg-background/70 flex items-center justify-center z-10 rounded-lg">
                    <LoadingSpinner showText={false} className="h-8 w-8" />
                 </div>
            )}
            <Link href={`/postings/${ad.id}`} className="flex-shrink-0 w-full sm:w-48 h-40 sm:h-auto relative bg-muted block">
                 <Image
                    src={ad.imageUrls?.[0] || 'https://picsum.photos/300/200'} // Use first ad image or default
                    alt={ad.title || 'Ad image'}
                    fill
                    style={{ objectFit: 'cover' }}
                    sizes="(max-width: 640px) 100vw, 192px" // Adjust sizes
                    priority={ad.id.startsWith('myad')} // Prioritize loading mock images
                 />
            </Link>
            <div className="flex-grow flex flex-col">
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-start gap-2">
                        <Link href={`/postings/${ad.id}`} className="hover:underline">
                            <CardTitle className="text-lg line-clamp-1">{ad.title || 'Untitled Ad'}</CardTitle>
                        </Link>
                        {/* Placeholder for potential dropdown menu */}
                        {/* <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                        </Button> */}
                    </div>
                    <CardDescription className="text-xs text-muted-foreground flex items-center gap-1 pt-1">
                         <MapPin className="h-3 w-3"/> {ad.location || 'N/A'} • Posted {datePostedFormatted}
                    </CardDescription>
                </CardHeader>
                <CardContent className="pb-2 text-sm flex-grow">
                    <p className="font-semibold flex items-center gap-1 mb-1 text-primary">
                        <IndianRupee className="h-4 w-4" /> {ad.budget || 'N/A'}
                    </p>
                    <p className="text-muted-foreground line-clamp-2">{ad.description || 'No description'}</p>
                </CardContent>
                <CardFooter className="mt-auto pt-2 pb-3 px-4 flex justify-between items-center border-t bg-muted/50">
                    <div className="text-xs text-muted-foreground">
                        {ad.status === 'pending' ? 'Pending Review' : `${ad.views || 0} Views`}
                         {ad.status === 'pending' && <Badge variant="secondary" className="ml-2">Pending</Badge>}
                         {ad.status === 'inactive' && <Badge variant="outline" className="ml-2">Inactive</Badge>}
                         {ad.status === 'active' && <Badge variant="default" className="ml-2 bg-green-600 hover:bg-green-700">Active</Badge>}
                    </div>
                    <div className="flex gap-2">
                         {/* TODO: Add edit functionality */}
                         {(ad.status === 'active' || ad.status === 'inactive') && ( // Allow edit for active/inactive
                            <Button variant="outline" size="sm" className="h-7 px-2" asChild disabled={!!loadingDeleteId}>
                               {/* TODO: Update edit link/functionality for mock data if needed */}
                               <Link href={`/post-need?edit=${ad.id}`}>
                                  <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                               </Link>
                            </Button>
                         )}
                          <Button
                              variant="destructive"
                              size="sm"
                              className="h-7 px-2"
                              onClick={() => onDelete(ad.id)}
                              disabled={!!loadingDeleteId} // Disable all buttons while deleting
                              aria-label="Delete Ad"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                          </Button>
                    </div>
                </CardFooter>
            </div>
        </Card>
    );
}
