
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
import { useAuthState } from 'react-firebase-hooks/auth'; // Import hook
import { auth, firestore } from '@/lib/firebase/clientApp'; // Import auth and firestore instance
import { doc, getDoc } from "firebase/firestore"; // Import Firestore functions
import { format } from 'date-fns'; // For formatting date

// User profile data structure from Firestore
interface UserProfile {
    uid: string;
    name: string;
    email: string | null;
    phone: string | null;
    location: string | null;
    createdAt: any; // Firestore Timestamp or Date
    bio: string | null;
    avatarUrl: string | null; // Assuming you store this
    isVerified: boolean; // You might derive this or store it
    totalAds?: number; // Optional, might calculate elsewhere
    activeAds?: number; // Optional, might calculate elsewhere
    isProfileComplete?: boolean;
    age?: number | null;
}

export default function ProfilePage() {
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const [user, authLoading, authError] = useAuthState(auth); // Get user auth state

     useEffect(() => {
        const loadProfile = async () => {
            setIsLoading(true);
            if (authError) {
                 console.error("Auth Error:", authError);
                 toast({ title: "Authentication Error", description: "Could not verify user.", variant: "destructive"});
                 setIsLoading(false);
                 return;
            }
            if (!authLoading && user && firestore) {
                try {
                    console.log("Fetching profile for UID:", user.uid);
                    const userRef = doc(firestore, "users", user.uid);
                    const docSnap = await getDoc(userRef);

                    if (docSnap.exists()) {
                        const data = docSnap.data() as Omit<UserProfile, 'isVerified'>; // Cast data, handle isVerified separately
                         console.log("Firestore Document data:", data);
                        setUserProfile({
                            ...data,
                            uid: user.uid,
                            name: data.name || user.displayName || 'Unnamed User',
                            email: data.email || user.email, // Prefer Firestore email, fallback to Auth email
                            phone: data.phone || user.phoneNumber, // Prefer Firestore phone, fallback to Auth phone
                            avatarUrl: data.avatarUrl || user.photoURL, // Prefer Firestore avatar, fallback to Auth avatar
                            isVerified: user.emailVerified || !!user.phoneNumber, // Example verification logic
                            // Calculate memberSince from createdAt
                             memberSince: data.createdAt ? format(data.createdAt.toDate(), 'MMMM yyyy') : 'Unknown',
                             // TODO: Add logic to fetch ad counts if needed
                             totalAds: 0, // Placeholder
                             activeAds: 0, // Placeholder
                        });
                    } else {
                         console.log("No profile document found for UID:", user.uid);
                         // Create a minimal profile if document doesn't exist (optional)
                         setUserProfile({
                             uid: user.uid,
                             name: user.displayName || 'New User',
                             email: user.email,
                             phone: user.phoneNumber,
                             location: null,
                             createdAt: new Date(), // Use current date as fallback
                             memberSince: format(new Date(), 'MMMM yyyy'),
                             bio: null,
                             avatarUrl: user.photoURL,
                             isVerified: user.emailVerified || !!user.phoneNumber,
                             totalAds: 0,
                             activeAds: 0,
                             isProfileComplete: false,
                             age: null,
                         });
                         if (!user.displayName) {
                            toast({ title: "Complete Profile", description: "Please complete your profile information."});
                            // Consider redirecting to /complete-profile here if isProfileComplete is false
                         }
                    }
                } catch (error) {
                    console.error("Failed to load profile from Firestore:", error);
                    toast({ title: "Error", description: "Could not load profile data.", variant: "destructive"});
                } finally {
                    setIsLoading(false);
                }
            } else if (!authLoading && !user) {
                 // User is not logged in
                 toast({ title: "Not Logged In", description: "Please log in to view your profile.", variant: "destructive"});
                 // Redirect to login page
                 window.location.href = '/login'; // Or use router.push('/login')
                 // setIsLoading(false); // Set loading false after redirect attempt
            }
        };
        loadProfile();
    }, [user, authLoading, authError, toast]); // Add authError and toast to dependency array

    // TODO: Implement profile editing logic
    const handleEditProfile = () => {
        // Navigate to an edit profile page or open a modal
         router.push('/complete-profile'); // Reuse complete-profile page for editing
        // toast({ description: "Edit profile functionality not implemented." });
    };

     if (isLoading || authLoading) {
        return (
             <div className="flex justify-center items-center min-h-[60vh]">
                <LoadingSpinner />
            </div>
        );
    }

    if (!userProfile) {
        // This case might occur if fetching failed or user is logged out but redirect hasn't happened yet
        return <div className="text-center py-10">Could not load user profile or user not logged in.</div>;
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
                     {/* Placeholder for Ad counts - fetch separately if needed */}
                     <p className="text-lg font-semibold">{userProfile.activeAds ?? 0} / {userProfile.totalAds ?? 0}</p>
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
                                <span>{userProfile.phone}</span> {/* TODO: Add logic to show/hide based on privacy settings */}
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

                 {/* About Me & Age */}
                 <Card>
                    <CardHeader>
                        <CardTitle>About</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {userProfile.age && <p className="text-sm mb-2"><strong>Age:</strong> {userProfile.age}</p>}
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

