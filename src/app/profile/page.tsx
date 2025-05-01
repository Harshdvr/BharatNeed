
'use client';

import { useState, useEffect } from 'react'; // Import hooks
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import LoadingSpinner from "@/components/loading-spinner"; // Keep spinner import
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Edit, UserCheck, List, Heart, MessageSquare, Settings, ChevronRight } from "lucide-react"; // Import new icons
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
    email?: string | null; // Made optional
    phone?: string | null; // Made optional
    location?: string | null; // Made optional
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
                            email: data.email !== undefined ? data.email : (user.email || null), // Prefer Firestore email if explicitly set (even if null)
                            phone: data.phone !== undefined ? data.phone : (user.phoneNumber || null), // Prefer Firestore phone if explicitly set
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
        <div className="container mx-auto px-4 py-8 max-w-3xl"> {/* Reduced max width */}
            {/* Top Profile Section */}
            <Card className="mb-8 overflow-hidden shadow-md">
                 <CardContent className="p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
                    <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-4 border-primary">
                        <AvatarImage src={userProfile.avatarUrl || `https://avatar.vercel.sh/${userProfile.uid}.png`} alt={userProfile.name} />
                        <AvatarFallback className="text-3xl">{userProfile.name?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-grow text-center sm:text-left">
                        <h1 className="text-2xl font-bold">{userProfile.name}</h1>
                        <p className="text-muted-foreground text-sm">Member since {userProfile.memberSince}</p>
                        {userProfile.isVerified && (
                            <Badge variant="secondary" className="mt-2 text-xs">
                                <UserCheck className="h-3 w-3 mr-1"/> Verified User
                            </Badge>
                        )}
                    </div>
                    <Button variant="outline" size="sm" className="mt-3 sm:mt-0 sm:ml-auto flex-shrink-0" onClick={handleEditProfile}>
                        <Edit className="h-4 w-4 mr-1" /> Edit Profile
                     </Button>
                 </CardContent>
            </Card>

            {/* Navigation Links Section */}
            <Card className="shadow-md">
                <CardContent className="p-0">
                    <nav className="flex flex-col">
                        <ProfileLink href="/my-ads" Icon={List} label="My Ads" />
                        <Separator />
                        <ProfileLink href="/favorites" Icon={Heart} label="Favorites" />
                        <Separator />
                        <ProfileLink href="/chat" Icon={MessageSquare} label="Chats" />
                         <Separator />
                        <ProfileLink href="/settings" Icon={Settings} label="Settings" />
                    </nav>
                </CardContent>
            </Card>

             {/* Placeholder for Recent Activity or Stats if needed */}
             {/*
             <Card className="mt-8">
                <CardHeader>
                    <CardTitle>Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Recent activity section (optional).</p>
                </CardContent>
             </Card>
             */}
        </div>
    );
}


// Helper component for profile navigation links
function ProfileLink({ href, Icon, label }: { href: string, Icon: React.ElementType, label: string }) {
    return (
        <Link href={href} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group">
            <div className="flex items-center gap-3">
                <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                <span className="text-base font-medium">{label}</span>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </Link>
    );
}

