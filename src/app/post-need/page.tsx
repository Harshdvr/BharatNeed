
'use client'; // Need client component for state, hooks

import { useState, useEffect } from 'react'; // Import useState, useEffect
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import LoadingSpinner from "@/components/loading-spinner"; // Keep spinner import
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '@/hooks/use-toast'; // Import useToast
import { handlePostSubmitAction } from '@/actions/postActions'; // Import the server action
import { useAuthState } from 'react-firebase-hooks/auth'; // Import auth hook
import { auth } from '@/lib/firebase/clientApp'; // Import auth instance
import { useRouter } from 'next/navigation'; // Import router for redirection

export default function PostNeedPage() {
    const [user, authLoading, authError] = auth ? useAuthState(auth) : [null, true, new Error("Auth not initialized")];
    const [loading, setLoading] = useState(false); // State for form submission loading
    const { toast } = useToast();
    const router = useRouter();

     // Redirect unauthenticated users
     useEffect(() => {
        if (!authLoading && !user) {
            toast({
                title: "Login Required",
                description: "You need to be logged in to post.",
                variant: "destructive"
            });
            router.push('/login');
        }
        // Handle auth errors during initial check
        if (authError) {
            console.error("Firebase Auth Hook Error:", authError);
            toast({
              title: "Authentication Error",
              description: authError.message || "Could not verify user.",
              variant: "destructive",
            });
            router.push('/login'); // Redirect on auth error too
        }
    }, [user, authLoading, authError, router, toast]);


    // Placeholder for categories and urgencies
    const categories = ["Services", "Buy/Sell", "Jobs", "Farming", "Tuitions", "Help", "Other"];
    const urgencies = ["Low", "Medium", "High", "Urgent"];

     // Client-side wrapper for form submission
    const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!user) { // Double check user exists before submitting
            toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
            return;
        }
        setLoading(true);
        const formData = new FormData(event.currentTarget);

        // Call the imported server action
        const result = await handlePostSubmitAction(formData);

        setLoading(false);

        if (result?.success) {
            toast({ title: "Post Submitted!", description: "Your need/offer has been posted." });
            // Optionally reset form or redirect
            (event.target as HTMLFormElement).reset();
            // router.push('/'); // Example redirect to home after successful post
        } else {
            toast({ title: "Error", description: result?.error || "Could not submit post.", variant: "destructive" });
        }
    };

    // Show loading spinner while auth state is being determined
     if (authLoading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <LoadingSpinner />
            </div>
        );
    }

     // If user is null after loading (should have been redirected, but as a fallback)
     if (!user) {
        // Or return a message indicating redirection is happening
        return (
             <div className="flex justify-center items-center min-h-[60vh]">
                 <p className="text-muted-foreground">Redirecting to login...</p>
             </div>
        );
     }


    // Render the form only if user is authenticated and not loading
    return (
        <div className="max-w-2xl mx-auto relative"> {/* Added relative for spinner */}
            {loading && ( // Show spinner during form submission
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10 rounded-lg">
                    <LoadingSpinner />
                </div>
            )}
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">Post Your Need or Offer</CardTitle>
                    <CardDescription>Fill in the details below to connect with the community.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleFormSubmit} className="space-y-6">
                         {/* Post Type Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="post-type">I want to...</Label>
                            <Select name="post-type" required disabled={loading}>
                                <SelectTrigger id="post-type">
                                    <SelectValue placeholder="Select if you need something or offering something" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="need">Post a Need (I need help/product/service)</SelectItem>
                                    <SelectItem value="offer">Post an Offer (I can provide help/product/service)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Title */}
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" name="title" placeholder="E.g., Need Electrician, Offering Homemade Snacks" required disabled={loading}/>
                        </div>

                         {/* Category */}
                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Select name="category" required disabled={loading}>
                                <SelectTrigger id="category">
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map(category => (
                                        <SelectItem key={category} value={category.toLowerCase()}>{category}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                         {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" name="description" placeholder="Provide more details about your need or offer..." required disabled={loading}/>
                        </div>

                        {/* Location */}
                         <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <Input id="location" name="location" placeholder="E.g., Your City, State or 'Remote'" required disabled={loading}/>
                             <p className="text-xs text-muted-foreground">Be specific if location matters, or type 'Remote' if it doesn't.</p>
                        </div>

                        {/* Budget */}
                        <div className="space-y-2">
                            <Label htmlFor="budget">Budget / Price (Optional)</Label>
                            <Input id="budget" name="budget" placeholder="E.g., ₹500, Negotiable, Free, Daily Wage" disabled={loading}/>
                             <p className="text-xs text-muted-foreground">Enter an amount, range, or terms like 'Negotiable'.</p>
                        </div>

                         {/* Urgency */}
                        <div className="space-y-2">
                            <Label htmlFor="urgency">Urgency</Label>
                            <Select name="urgency" disabled={loading}>
                                <SelectTrigger id="urgency">
                                    <SelectValue placeholder="Select urgency level" />
                                </SelectTrigger>
                                <SelectContent>
                                     {urgencies.map(urgency => (
                                        <SelectItem key={urgency} value={urgency.toLowerCase()}>{urgency}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Image Upload */}
                        <div className="space-y-2">
                            <Label htmlFor="image">Upload Image</Label> {/* Removed "(Optional)" */}
                            {/* TODO: Implement actual image upload handling */}
                            <Input id="image" name="image" type="file" accept="image/*" required disabled={loading}/> {/* Added required attribute */}
                            <p className="text-xs text-muted-foreground">Add an image (max 5MB).</p>
                        </div>


                        <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={loading}>
                             {loading ? 'Submitting...' : 'Post Now'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

