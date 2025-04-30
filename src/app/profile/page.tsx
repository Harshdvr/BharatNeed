'use client';

import { useState, useEffect } from 'react'; // Import hooks
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import LoadingSpinner from "@/components/loading-spinner"; // Keep spinner import
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// Removed unused Input and Label imports
import { Separator } from "@/components/ui/separator";
// Removed unused Textarea import
import { Edit, Mail, MapPin, Phone, UserCheck } from "lucide-react";
import Link from "next/link";
import { useToast } from '@/hooks/use-toast'; // Import useToast
import { useAuthState } from 'react-firebase-hooks/auth'; // Import hook
import { auth, firestore } from '@/lib/firebase/clientApp'; // Import auth and firestore instance
import { doc, getDoc } from "firebase/firestore"; // Import Firestore functions
import { format } from 'date-fns'; // For formatting date
import { useRouter } from 'next/navigation'; // Import router

// User profile data structure from Firestore
interface UserProfile {
    uid: string;
    name: string;
    email: string | null;
    phone: string | null;
    location?: string | null; // Made optional as it might not be in Firestore yet
    createdAt: any; // Firestore Timestamp or Date
    memberSince?: string; // Add memberSince derived property
    bio?: string | null; // Made optional
    avatarUrl?: string | null; // Assuming you store this, made optional
    isVerified?: boolean; // You might derive this or store it, made optional
    totalAds?: number; // Optional, might calculate elsewhere
    activeAds?: number; // Optional, might calculate elsewhere
    isProfileComplete?: boolean;
    age?: number | null; // Made optional
}

export default function ProfilePage() {
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    // Handle potential null auth state safely
    const [user, authLoading, authError] = auth ? useAuthState(auth) : [null, true, new Error("Auth not initialized")];
    const router = useRouter(); // Initialize router

     useEffect(() => {
        const loadProfile = async () => {
            setIsLoading(true);
            if (authError) {
                 console.error("Auth Error:", authError);
                 toast({ title: "Authentication Error", description: "Could not verify user.", variant: "destructive"});
                 setIsLoading(false);
                 router.push('/login'); // Redirect on auth error
                 return;
            }
            if (!authLoading && user && firestore) {
                try {
                    console.log("Fetching profile for UID:", user.uid);
                    const userRef = doc(firestore, "users", user.uid);
                    const docSnap = await getDoc(userRef);

                    if (docSnap.exists()) {
                        const data = docSnap.data() as Partial<UserProfile>; // Use Partial for flexibility
                         console.log("Firestore Document data:", data);

                         // Check if the profile is complete
                         if (!data.isProfileComplete) {
                            toast({ title: "Profile Incomplete", description: "Please complete your profile information.", variant: "default" });
                            router.push('/complete-profile');
                            return; // Stop further execution
                         }

                        setUserProfile({
                            uid: user.uid,
                            name: data.name || user.displayName || 'Unnamed User',
                            email: data.email !== undefined ? data.email : user.email, // Prefer Firestore email if explicitly set (even if null)
                            phone: data.phone !== undefined ? data.phone : user.phoneNumber, // Prefer Firestore phone if explicitly set
                            location: data.location || null,
                            createdAt: data.createdAt || null, // Handle potentially missing createdAt
                            bio: data.bio || null,
                            avatarUrl: data.avatarUrl || user.photoURL || null, // Prefer Firestore avatar
                            isVerified: user.emailVerified || !!user.phoneNumber, // Example verification logic based on Auth
                            memberSince: data.createdAt?.toDate ? format(data.createdAt.toDate(), 'MMMM yyyy') : 'Unknown', // Safely format date
                            isProfileComplete: data.isProfileComplete || false,
                            age: data.age || null,
                             // TODO: Add logic to fetch ad counts if needed
                             totalAds: 0, // Placeholder
                             activeAds: 0, // Placeholder
                        });
                    } else {
                         console.log("No profile document found for UID:", user.uid);
                         toast({ title: "Complete Profile Required", description: "Redirecting to complete your profile.", variant: "default"});
                         router.push('/complete-profile'); // Redirect if profile document doesn't exist
                         return; // Stop further execution
                    }
                } catch (error) {
                    console.error("Failed to load profile from Firestore:", error);
                    toast({ title: "Error", description: "Could not load profile data.", variant: "destructive"});
                    setUserProfile(null); // Clear profile on error
                } finally {
                    setIsLoading(false);
                }
            } else if (!authLoading && !user) {
                 // User is not logged in
                 toast({ title: "Not Logged In", description: "Please log in to view your profile.", variant: "default"});
                 router.push('/login'); // Redirect to login page
            }
            // Keep loading if auth is still loading
             if (authLoading) {
                 setIsLoading(true);
             }

        };
        loadProfile();
    }, [user, authLoading, authError, toast, router]); // Add router to dependency array

    // Handle profile editing navigation
    const handleEditProfile = () => {
         router.push('/complete-profile');
    };

     if (isLoading || authLoading) {
        return (
             <div className="flex justify-center items-center min-h-[60vh]">
                <LoadingSpinner />
            </div>
        );
    }

    if (!userProfile) {
        // This case handles errors during fetch or if redirection is pending
        // It should ideally not be reached if redirects work correctly, but serves as a fallback
        return (
            <div className="text-center py-10">
                <p>Could not load user profile.</p>
                 <Button asChild className="mt-4">
                   <Link href="/login">Login</Link>
                </Button>
            </div>
        );
    }

    // Render profile only if userProfile is loaded and valid
    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8">
                <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-primary">
                    <AvatarImage src={userProfile.avatarUrl || `https://avatar.vercel.sh/${userProfile.uid}.png`} alt={userProfile.name} />
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
                     <Button variant="outline" size="sm" className="mt-3 ml-0 sm:ml-2" onClick={handleEditProfile}>
                        <Edit className="h-4 w-4 mr-1" /> Edit Profile
                     </Button>
                </div>
                <div className="text-center sm:text-right flex-shrink-0 mt-4 sm:mt-0">
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
                         <CardDescription>This information may be visible on your ads based on your privacy settings.</CardDescription>
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
                            <p className="text-sm text-muted-foreground">No contact information provided. <Link href="/complete-profile" className='underline text-primary'>Edit Profile</Link></p>
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
                        {!userProfile.bio && <Link href="/complete-profile" className='text-sm underline text-primary mt-2 inline-block'>Add Bio</Link>}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
