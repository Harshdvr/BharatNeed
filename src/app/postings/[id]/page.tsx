'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { IndianRupee, MapPin, MessageSquare, Phone, Share2, Tag, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from 'next/navigation'; // Using App Router hook

// Placeholder data - In a real app, fetch this based on the ID
const getPostingDetails = (id: string) => {
    // Simulate fetching data
    const postings = [
        { id: '1', type: 'Need', title: 'Need Plumber for Leaky Faucet', category: 'Services', location: 'Mumbai, MH', urgency: 'Urgent', budget: 'Negotiable', description: 'Small leak under kitchen sink needs fixing ASAP. Contact for details. Experienced plumber preferred.', image: 'https://picsum.photos/seed/plumber/600/400', sellerName: 'Amit Patel', sellerSince: 'Member since 2023', phone: '+91 98XXXXXX01', verified: true },
        { id: '2', type: 'Offer', title: 'Homemade Pickles for Sale', category: 'Buy/Sell', location: 'Pune, MH', urgency: 'Low', budget: '₹150/kg', description: 'Delicious mango and lemon pickles, made with traditional recipes. Freshly prepared. Bulk orders accepted.', image: 'https://picsum.photos/seed/pickles/600/400', sellerName: 'Sunita Rao', sellerSince: 'Member since 2022', phone: '+91 99XXXXXX02', verified: false },
        { id: '3', type: 'Need', title: 'Help with Rice Harvesting', category: 'Farming', location: 'Rural Village, UP', urgency: 'High', budget: 'Daily Wage', description: 'Need 5-6 laborers for 3 days of rice harvesting next week. Food and accommodation provided. Call for wage details.', image: 'https://picsum.photos/seed/harvest/600/400', sellerName: 'Rajesh Singh', sellerSince: 'Member since 2024', phone: '+91 91XXXXXX03', verified: true },
        { id: '4', type: 'Offer', title: 'Mathematics Tuition (Class 10)', category: 'Tuitions', location: 'Delhi', urgency: 'Medium', budget: '₹2000/month', description: 'Experienced teacher offering maths tuition for CBSE Class 10. Focus on concept clarity and practice. Weekend batches available.', image: 'https://picsum.photos/seed/tuition/600/400', sellerName: 'Deepa Khanna', sellerSince: 'Member since 2021', phone: '+91 95XXXXXX04', verified: true },
        { id: '5', type: 'Need', title: 'Part-time Graphic Designer', category: 'Jobs', location: 'Remote', urgency: 'Medium', budget: '₹15k/month', description: 'Looking for a designer for social media posts, 10-15 hours/week. Must know Canva/Figma. Send portfolio link.', image: 'https://picsum.photos/seed/designer/600/400', sellerName: 'Creative Solutions', sellerSince: 'Member since 2023', phone: '+91 92XXXXXX05', verified: false },
    ];
    return postings.find(p => p.id === id);
};

export default function PostingDetailPage({ params }: { params: { id: string } }) {
    const pathname = usePathname();
    const posting = getPostingDetails(params.id);

    if (!posting) {
        return <div className="text-center py-10">Posting not found.</div>;
    }

    // Placeholder share function
    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: posting.title,
                text: `Check out this posting on Bharat Need: ${posting.title}`,
                url: window.location.href,
            })
            .then(() => console.log('Successful share'))
            .catch((error) => console.log('Error sharing', error));
        } else {
            // Fallback for browsers that don't support navigator.share
            navigator.clipboard.writeText(window.location.href);
            alert('Link copied to clipboard!'); // Replace with a proper toast notification
        }
    };


    return (
        <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                {/* Left Column (Image & Description) */}
                <div className="md:col-span-2 space-y-6">
                    {/* Image Carousel Placeholder */}
                    <Card className="overflow-hidden">
                         <div className="relative aspect-video bg-muted">
                            <Image
                                src={posting.image || 'https://picsum.photos/600/400'}
                                alt={posting.title}
                                fill
                                style={{ objectFit: 'cover' }}
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 800px"
                                priority // Prioritize loading the main image
                            />
                         </div>
                    </Card>

                    {/* Description Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Description</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground whitespace-pre-wrap">{posting.description}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column (Price, Seller, Actions) */}
                <div className="md:col-span-1 space-y-6">
                    {/* Price & Title Card */}
                    <Card>
                        <CardHeader className="pb-2">
                           <div className="flex justify-between items-start gap-2">
                                <span className="text-2xl font-bold text-primary flex items-center">
                                    <IndianRupee className="inline h-6 w-6 mr-1" /> {posting.budget}
                                </span>
                                <Button variant="ghost" size="icon" onClick={handleShare}>
                                     <Share2 className="h-5 w-5" />
                                     <span className="sr-only">Share</span>
                                </Button>
                           </div>
                            <CardTitle className="text-xl pt-1">{posting.title}</CardTitle>
                            <div className="flex justify-between items-center text-xs text-muted-foreground pt-2">
                                <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3"/>
                                    <span>{posting.location}</span>
                                </div>
                                <span>Posted: {/* TODO: Add actual date */} Today</span>
                            </div>
                        </CardHeader>
                        <CardFooter>
                             <Badge variant={posting.type === 'Need' ? 'destructive' : 'default'}>
                                {posting.type}
                             </Badge>
                             <Badge variant="secondary" className="ml-2 flex items-center gap-1">
                                <Tag className="h-3 w-3"/> {posting.category}
                             </Badge>
                        </CardFooter>
                    </Card>

                     {/* Seller Info Card */}
                     <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Posted by</CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-center gap-4">
                            <Avatar className="h-12 w-12">
                                <AvatarImage src={`https://picsum.photos/seed/${posting.sellerName}/100/100`} alt={posting.sellerName} />
                                <AvatarFallback>{posting.sellerName?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">{posting.sellerName}</p>
                                <p className="text-xs text-muted-foreground">{posting.sellerSince}</p>
                                {posting.verified && <Badge variant="secondary" className="mt-1 text-xs">Verified User</Badge>}
                            </div>
                        </CardContent>
                         <Separator />
                         <CardFooter className="flex flex-col gap-2 pt-4">
                           <Button className="w-full" size="lg">
                                <MessageSquare className="mr-2 h-5 w-5" /> Chat with Poster
                           </Button>
                           <Button variant="outline" className="w-full" size="lg">
                                <Phone className="mr-2 h-5 w-5" /> Show Phone Number
                           </Button>
                         </CardFooter>
                    </Card>

                    {/* Location Map Placeholder */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Location</CardTitle>
                        </CardHeader>
                        <CardContent>
                           <div className="aspect-video bg-muted rounded-md flex items-center justify-center text-muted-foreground">
                                <MapPin className="h-8 w-8 mr-2"/>
                                <span>Map Placeholder ({posting.location})</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

             {/* Related Postings Placeholder */}
            <div className="mt-12">
                <h2 className="text-2xl font-semibold mb-4">Related Postings</h2>
                {/* TODO: Add a grid or list of related postings */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Example related item */}
                    <Card className="text-center p-4 border-dashed">
                        <p className="text-muted-foreground">Related Item Placeholder</p>
                    </Card>
                     <Card className="text-center p-4 border-dashed">
                        <p className="text-muted-foreground">Related Item Placeholder</p>
                    </Card>
                    <Card className="text-center p-4 border-dashed">
                        <p className="text-muted-foreground">Related Item Placeholder</p>
                    </Card>
                     <Card className="text-center p-4 border-dashed">
                        <p className="text-muted-foreground">Related Item Placeholder</p>
                    </Card>
                </div>
            </div>

        </div>
    );
}