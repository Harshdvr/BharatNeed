'use client';

import { useState, useEffect } from 'react'; // Import hooks
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import LoadingSpinner from "@/components/loading-spinner"; // Keep spinner import
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Mail, MapPin, Phone, UserCheck } from "lucide-react";
import Link from "next/link";
import { useToast } from '@/hooks/use-toast'; // Import useToast

// Placeholder user data structure
interface UserProfile {
    name: string;
    email: string | null;
    phone: string | null;
    location: string | null;
    memberSince: string;
    bio: string | null;
    avatarUrl: string | null;
    isVerified: boolean;
    totalAds: number;
    activeAds: number;
}

// Placeholder fetch function
const fetchUserProfile = async (): Promise<UserProfile> => {
    // Simulate fetching data for the logged-in user
    await new Promise(resolve => setTimeout(resolve, 1500));
    return {
        name: 'Ramesh Kumar',
        email: 'ramesh.k@example.com',
        phone: '+91 9876543210',
        location: 'Mumbai, Maharashtra',
        memberSince: 'January 2023',
        bio: 'Interested in connecting with local service providers and helping others in the community.',
        avatarUrl: 'https://picsum.photos/id/101/200/200',
        isVerified: true,
        totalAds: 5,
        activeAds: 2,
    };
}

export default function ProfilePage() {
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

     useEffect(() => {
        const loadProfile = async () => {
            setIsLoading(true);
            try {
                // In a real app, get user ID from auth state
                const profileData = await fetchUserProfile();
                setUserProfile(profileData);
            } catch (error) {
                console.error("Failed to load profile:", error);
                toast({ title: "Error", description: "Could not load profile data.", variant: "destructive"});
            } finally {
                setIsLoading(false);
            }
        };
        loadProfile();
    }, [toast]); // Add toast to dependency array

    // TODO: Implement profile editing logic
    const handleEditProfile = () => {
        // Navigate to an edit profile page or open a modal
        toast({ description: "Edit profile functionality not implemented." });
    };

     if (isLoading) {
        return (
             <div className="flex justify-center items-center min-h-[60vh]">
                <LoadingSpinner />
            </div>
        );
    }

    if (!userProfile) {
        return <div className="text-center py-10">Could not load user profile.</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8">
                <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-primary">
                    <AvatarImage src={userProfile.avatarUrl || undefined} alt={userProfile.name} />
                    <AvatarFallback className="text-4xl">{userProfile.name?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-grow text-center sm:text-left">
                    <h1 className="text-3xl font-bold">{userProfile.name}</h1>
                    <p className="text-muted-foreground">Member since {userProfile.memberSince}</p>
                    {userProfile.isVerified && (
                        <Badge variant="secondary" className="mt-2">
                            <UserCheck className="h-4 w-4 mr-1"/> Verified User
                        </Badge>
                    )}
                     <Button variant="outline" size="sm" className="mt-3" onClick={handleEditProfile}>
                        <Edit className="h-4 w-4 mr-1" /> Edit Profile
                     </Button>
                </div>
                <div className="text-center sm:text-right flex-shrink-0">
                     <p className="text-lg font-semibold">{userProfile.activeAds} / {userProfile.totalAds}</p>
                     <p className="text-sm text-muted-foreground">Active / Total Ads</p>
                     <Button asChild className="mt-2">
                        <Link href="/my-ads">View My Ads</Link>
                     </Button>
                </div>
            </div>

            <Separator className="my-8" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Contact Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Contact Information</CardTitle>
                         <CardDescription>This information may be visible on your ads.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                         {userProfile.email && (
                            <div className="flex items-center gap-3">
                                <Mail className="h-5 w-5 text-muted-foreground"/>
                                <span>{userProfile.email}</span>
                            </div>
                         )}
                         {userProfile.phone && (
                            <div className="flex items-center gap-3">
                                <Phone className="h-5 w-5 text-muted-foreground"/>
                                <span>{userProfile.phone}</span> {/* TODO: Add logic to show/hide */}
                            </div>
                         )}
                        {userProfile.location && (
                            <div className="flex items-center gap-3">
                                <MapPin className="h-5 w-5 text-muted-foreground"/>
                                <span>{userProfile.location}</span>
                            </div>
                        )}
                         {!userProfile.email && !userProfile.phone && !userProfile.location && (
                            <p className="text-sm text-muted-foreground">No contact information provided.</p>
                         )}
                    </CardContent>
                </Card>

                 {/* About Me */}
                 <Card>
                    <CardHeader>
                        <CardTitle>About Me</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">{userProfile.bio || 'No bio provided.'}</p>
                    </CardContent>
                </Card>
            </div>

             {/* TODO: Add sections for Settings, Notifications, etc. as needed */}
             {/* <Separator className="my-8" />
             <h2 className="text-2xl font-semibold mb-4">Settings</h2>
             ... */}

        </div>
    );
}
