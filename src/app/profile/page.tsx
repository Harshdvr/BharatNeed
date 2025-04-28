'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Mail, MapPin, Phone, UserCheck } from "lucide-react";
import Link from "next/link";

// Placeholder user data - In a real app, fetch this for the logged-in user
const userProfile = {
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

export default function ProfilePage() {

    // TODO: Implement profile editing logic
    const handleEditProfile = () => {
        // Navigate to an edit profile page or open a modal
        alert("Navigate to edit profile page (Not implemented)");
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8">
                <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-primary">
                    <AvatarImage src={userProfile.avatarUrl} alt={userProfile.name} />
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
                        <div className="flex items-center gap-3">
                            <Mail className="h-5 w-5 text-muted-foreground"/>
                            <span>{userProfile.email}</span>
                        </div>
                         <div className="flex items-center gap-3">
                            <Phone className="h-5 w-5 text-muted-foreground"/>
                            <span>{userProfile.phone}</span> {/* TODO: Add logic to show/hide */}
                        </div>
                        <div className="flex items-center gap-3">
                            <MapPin className="h-5 w-5 text-muted-foreground"/>
                            <span>{userProfile.location}</span>
                        </div>
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