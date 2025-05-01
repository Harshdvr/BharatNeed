'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import LoadingSpinner from "@/components/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, IndianRupee, MapPin, MoreVertical, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useToast } from '@/hooks/use-toast';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, firestore, ensureFirestoreInitialized } from '@/lib/firebase/clientApp'; // Import auth, firestore, and helper
import { useState } from 'react';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore'; // Import Firestore functions


interface Posting {
    id: string;
    status?: 'active' | 'pending' | 'inactive';
    title?: string;
    category?: string;
    location?: string;
    budget?: string;
    description?: string;
    imageUrls?: string[]; // Assuming multiple images
    canBid?: boolean; // Indicate if bidding is allowed
    canNegotiate?: boolean; // Indicate if negotiation is allowed
    views?: number;
    datePosted?: any; // Firestore Timestamp or Date
    userId?: string; // Added userId field
    createdAt?: any; // Firestore Timestamp
}

// Mock Data - Replace with actual data fetching
const ad: Posting = {
  id: 'mockPost123',
  title: 'Need Urgent Repair for Leaky Roof (Mock)',
  description: 'Water leaking through the ceiling in the living room. Need a professional roofer immediately. Please provide quotes. Located in South Delhi.',
  category: 'services',
  postType: 'need',
  location: 'South Delhi, Delhi',
  budget: '₹5,000 - ₹8,000',
  urgency: 'urgent',
  imageUrls: [
    'https://picsum.photos/seed/roofleak/800/600',
    'https://picsum.photos/seed/roofinside/800/600',
    'https://picsum.photos/seed/damageclose/800/600',
  ],
  userId: 'userMock1',
  createdAt: new Date(Date.now() - 3600000 * 3), // 3 hours ago
  canBid: true,
  canNegotiate: true,
};


export default function PostingDetailPage({ params }: { params: { id: string } }) {
    // TODO: Fetch actual ad data based on params.id
    // const { data: ad, isLoading, error } = useQuery(['posting', params.id], fetchPosting);

    /*
    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (error || !ad) {
        return <div>Error loading post or post not found.</div>;
    }

    // Convert Firestore timestamp if needed
     const datePostedFormatted = ad.createdAt instanceof Date ? ad.createdAt.toLocaleDateString() : ad.createdAt?.toDate ? ad.createdAt.toDate().toLocaleDateString() : 'N/A';
    */

    return (
        <div className="container mx-auto px-4 py-8"><LoadingSpinner />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                {/* Left Column (Image & Description) */}
                <div className="md:col-span-2 space-y-6">
                    {/* Image Gallery */}
                    <Card className="overflow-hidden shadow-md">
                        <div className="relative aspect-[4/3] bg-muted">
                            {/* Main Image - TODO: Implement image selection/carousel */}
                            <Image
                                src={ad.imageUrls?.[0] || 'https://picsum.photos/800/600'}
                                alt={ad.title || 'Posting image'}
                                fill
                                style={{ objectFit: 'cover' }}
                                priority
                            />
                        </div>
                         {/* Thumbnails - TODO: Add carousel logic */}
                         {ad.imageUrls && ad.imageUrls.length > 1 && (
                            <div className="flex gap-2 p-2 border-t overflow-x-auto">
                                {ad.imageUrls.map((url, index) => (
                                    <div key={index} className="relative h-16 w-16 shrink-0 cursor-pointer border rounded hover:border-primary">
                                         <Image
                                            src={url}
                                            alt={`Thumbnail ${index + 1}`}
                                            fill
                                            style={{ objectFit: 'cover' }}
                                            className="rounded"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    {/* Ad Details */}
                    <Card className="shadow-md">
                        <CardHeader>
                            <CardTitle className="text-2xl">{ad.title || 'Untitled Post'}</CardTitle>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
                                <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {ad.location || 'N/A'}</span>
                                <span className="flex items-center gap-1"><Tag className="h-4 w-4" /> {ad.category || 'N/A'}</span>
                                {/* <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> Posted {datePostedFormatted}</span> */}
                            </div>
                             <p className="font-semibold text-lg text-primary pt-2 flex items-center gap-1">
                                <IndianRupee className="h-5 w-5" /> {ad.budget || 'N/A'}
                            </p>
                        </CardHeader>
                        <CardContent>
                            <h3 className="text-lg font-semibold mb-2">Description</h3>
                            <p className="text-muted-foreground whitespace-pre-line">{ad.description || 'No description available.'}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column (Actions & Seller Info) */}
                <div className="md:col-span-1 space-y-4">
                    {/* Actions Card */}
                     <Card className="shadow-md">
                        <CardHeader>
                             <CardTitle>Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             {ad?.canBid && (
                                <div className="border rounded-lg p-3 bg-muted/30">
                                    <h4 className="text-sm font-medium mb-2">Submit a Bid</h4>
                                    <Input type="number" placeholder="Your Bid (₹)" className="mb-2 bg-background"/>
                                    <Button size="sm" className="w-full">Submit Bid</Button>
                                     {/* TO DO: Implement bid submission logic here (Server Action) */}
                                </div>
                            )}
                            {ad?.canNegotiate && (
                                <div className="border rounded-lg p-3 bg-muted/30">
                                     <h4 className="text-sm font-medium mb-2">Negotiate Price</h4>
                                     <Input type="number" placeholder="Your Offer (₹)" className="mb-2 bg-background"/>
                                     <Button size="sm" className="w-full">Send Offer</Button>
                                      {/* TO DO: Implement send offer logic here (Server Action) */}
                                </div>
                            )}
                             <Button variant="default" className="w-full">Contact Seller</Button>
                             {/* TODO: Add Favorite Button Logic */}
                             <Button variant="outline" className="w-full">Add to Favorites</Button>
                             <Button variant="outline" className="w-full">Share</Button>
                             <Button variant="destructive" className="w-full">Report Ad</Button>
                        </CardContent>
                     </Card>

                     {/* User Info Card */}
                     <Card className="shadow-md">
                        <CardHeader>
                            <CardTitle>Seller Information</CardTitle>
                            {/* Add placeholder for seller details */}
                            <CardDescription>Details about the person who posted this.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-center gap-4">
                             <Avatar className="h-12 w-12">
                                <AvatarImage src="https://picsum.photos/id/102/100/100" alt="Seller Avatar" />
                                <AvatarFallback>SN</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">Seller Name (Mock)</p>
                                <p className="text-xs text-muted-foreground">Member since Mock Date</p>
                                {/* Optional: Add verification badge */}
                            </div>
                        </CardContent>
                         <CardFooter>
                            {/* Optional: Link to seller's profile page */}
                            {/* <Button variant="outline" size="sm" asChild><Link href={`/profile/${ad.userId}`}>View Profile</Link></Button> */}
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}