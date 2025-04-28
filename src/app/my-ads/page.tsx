'use client';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, IndianRupee, MapPin, MoreVertical, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// Placeholder data for user's postings - In a real app, fetch this for the logged-in user
const myPostings = [
  { id: 1, status: 'active', title: 'Need Plumber for Leaky Faucet', category: 'Services', location: 'Mumbai, MH', budget: 'Negotiable', description: 'Small leak under kitchen sink.', image: 'https://picsum.photos/seed/plumber/150/100', views: 15, datePosted: '2 days ago' },
  { id: 5, status: 'active', title: 'Part-time Graphic Designer', category: 'Jobs', location: 'Remote', budget: '₹15k/month', description: 'Looking for a designer...', image: 'https://picsum.photos/seed/designer/150/100', views: 45, datePosted: '5 days ago' },
  { id: 'p1', status: 'pending', title: 'Selling Old Books', category: 'Buy/Sell', location: 'Delhi', budget: '₹500 (Lot)', description: 'Collection of fiction novels.', image: 'https://picsum.photos/seed/books/150/100', views: 0, datePosted: '1 hour ago' },
  { id: 'p2', status: 'inactive', title: 'Room for Rent', category: 'Property', location: 'Bangalore', budget: '₹8000/month', description: 'Single occupancy room available.', image: 'https://picsum.photos/seed/room/150/100', views: 120, datePosted: '1 month ago' },
];

const activeAds = myPostings.filter(ad => ad.status === 'active');
const pendingAds = myPostings.filter(ad => ad.status === 'pending');
const inactiveAds = myPostings.filter(ad => ad.status === 'inactive');

// TODO: Implement delete and edit actions
const handleDelete = (id: string | number) => {
    console.log(`Deleting ad ${id}`);
    // Call server action to delete
    alert(`Simulating delete for ad ${id}`);
};

export default function MyAdsPage() {
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
                                <AdCard key={ad.id} ad={ad} />
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
                                <AdCard key={ad.id} ad={ad} />
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
                                <AdCard key={ad.id} ad={ad} />
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

// Reusable Ad Card Component
function AdCard({ ad }: { ad: typeof myPostings[0] }) {
    return (
        <Card className="overflow-hidden flex flex-col sm:flex-row">
            <div className="flex-shrink-0 w-full sm:w-40 h-32 sm:h-auto relative bg-muted">
                <Image
                    src={ad.image || 'https://picsum.photos/150/100'}
                    alt={ad.title}
                    fill
                    style={{ objectFit: 'cover' }}
                    sizes="(max-width: 640px) 100vw, 160px"
                />
            </div>
            <div className="flex-grow flex flex-col">
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-start gap-2">
                        <Link href={`/postings/${ad.id}`} className="hover:underline">
                            <CardTitle className="text-lg line-clamp-1">{ad.title}</CardTitle>
                        </Link>
                        {/* Actions Dropdown Placeholder */}
                        {/* <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                        </Button> */}
                    </div>
                    <CardDescription className="text-xs text-muted-foreground flex items-center gap-1">
                         <MapPin className="h-3 w-3"/> {ad.location} • Posted {ad.datePosted}
                    </CardDescription>
                </CardHeader>
                <CardContent className="pb-2 text-sm">
                    <p className="font-semibold flex items-center gap-1 mb-1">
                        <IndianRupee className="h-4 w-4" /> {ad.budget}
                    </p>
                    <p className="text-muted-foreground line-clamp-1">{ad.description}</p>
                </CardContent>
                <CardFooter className="mt-auto pt-2 pb-3 px-4 flex justify-between items-center border-t bg-muted/50">
                    <div className="text-xs text-muted-foreground">
                        {ad.status !== 'pending' ? `${ad.views} Views` : 'Pending Review'}
                    </div>
                    <div className="flex gap-2">
                         {ad.status === 'active' && (
                            <Button variant="outline" size="sm" className="h-7 px-2" asChild>
                               <Link href={`/post-need?edit=${ad.id}`}> {/* Link to edit page */}
                                  <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                               </Link>
                            </Button>
                         )}
                          <Button variant="destructive" size="sm" className="h-7 px-2" onClick={() => handleDelete(ad.id)}>
                            <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                          </Button>
                    </div>
                </CardFooter>
            </div>
        </Card>
    );
}