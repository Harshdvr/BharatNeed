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
import { auth, firestore } from '@/lib/firebase/clientApp'; // Import auth and firestore instance
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore'; // Import Firestore functions

// TODO: Remove initialMyPostings and fetch actual data for the logged-in user
const initialMyPostings: any[] = [
 // Example Structure (replace with fetched data)
 // { id: '...', status: 'active' | 'pending' | 'inactive', title: '...', category: '...', location: '...', budget: '...', description: '...', image: '...', views: 0, datePosted: '...' },
];

export default function MyAdsPage() {
    const [user, authLoading, authError] = auth ? useAuthState(auth) : [null, true, new Error("Auth not initialized")];
    const [myPostings, setMyPostings] = useState<any[]>([]); // State for user's postings
    const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
    const [loadingDeleteId, setLoadingDeleteId] = useState<string | number | null>(null); // State for delete loading
    const { toast } = useToast();

    useEffect(() => {
      const fetchMyAds = async () => {
        if (!user || !firestore) {
          setIsLoadingInitialData(false);
          return; // Exit if not logged in or firestore not ready
        }
        setIsLoadingInitialData(true);
        try {
          const adsRef = collection(firestore, 'postings'); // Adjust collection name
          const q = query(adsRef, where('userId', '==', user.uid)); // Assuming 'userId' field exists
          const querySnapshot = await getDocs(q);
          const userAds = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setMyPostings(userAds);
          console.log("Fetched user ads from Firestore");
        } catch (error) {
          console.error("Error fetching user ads:", error);
          toast({ title: "Error", description: "Could not fetch your ads.", variant: "destructive" });
        } finally {
          setIsLoadingInitialData(false);
        }
      };

      if (!authLoading) {
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
    }, [user, authLoading, toast, authError]);


    const activeAds = myPostings.filter(ad => ad.status === 'active');
    const pendingAds = myPostings.filter(ad => ad.status === 'pending');
    const inactiveAds = myPostings.filter(ad => ad.status === 'inactive');

    const handleDelete = async (id: string | number) => {
        if (!firestore || !user) {
             toast({ title: "Error", description: "Cannot perform delete action.", variant: "destructive" });
             return;
        }
        setLoadingDeleteId(id); // Start loading for this ad deletion
        console.log(`Deleting ad ${id}`);
        try {
            // Call server action or directly delete from Firestore using the ad ID
            await deleteDoc(doc(firestore, 'postings', id as string));
            console.log(`Deleted ad ${id} from Firestore`);
            setMyPostings(prev => prev.filter(ad => ad.id !== id));
            toast({ title: "Ad Deleted", description: "Your ad has been successfully deleted." });
        } catch (error) {
            console.error("Failed to delete ad:", error);
            toast({ title: "Error", description: "Could not delete the ad.", variant: "destructive" });
        } finally {
            setLoadingDeleteId(null); // Stop loading
        }
    };

    if (isLoadingInitialData || authLoading) {
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
    ad: any, // Use a specific type based on your data structure
    onDelete: (id: string | number) => void,
    loadingDeleteId: string | number | null
}) {
    const isDeleting = loadingDeleteId === ad.id;
    // Format date if available
    const datePostedFormatted = ad.datePosted?.toDate ? ad.datePosted.toDate().toLocaleDateString() : 'N/A'; // Adjust formatting


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
                    src={ad.image || 'https://picsum.photos/300/200'} // Use ad image or default
                    alt={ad.title || 'Ad image'}
                    fill
                    style={{ objectFit: 'cover' }}
                    sizes="(max-width: 640px) 100vw, 192px" // Adjust sizes
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
                               <Link href={`/post-need?edit=${ad.id}`}> {/* Link to edit page */}
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
