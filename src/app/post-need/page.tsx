'use client'; // Need client component for state

import { useState } from 'react'; // Import useState
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import LoadingSpinner from "@/components/loading-spinner"; // Keep spinner import
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '@/hooks/use-toast'; // Import useToast
// TODO: Import server action for posting

export default function PostNeedPage() {
    const [loading, setLoading] = useState(false); // State for loading
    const { toast } = useToast();

    // Placeholder for categories and urgencies
    const categories = ["Services", "Buy/Sell", "Jobs", "Farming", "Tuitions", "Help", "Other"];
    const urgencies = ["Low", "Medium", "High", "Urgent"];

    // Server action (defined elsewhere, e.g., src/actions/postActions.ts)
    const handlePostSubmitAction = async (formData: FormData) => {
        'use server';
        console.log("Post form submitted (server action)");
        const title = formData.get('title');
        const description = formData.get('description');
        // ... get other fields
        console.log({ title, description });
        // Simulate saving to Firestore...
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log("Post saved successfully.");
        // TODO: Revalidate path or redirect
        // Cannot call toast from server action
        return { success: true }; // Indicate success
        // Or return { success: false, error: 'Failed to save post.' }; on error
    };

     // Client-side wrapper for form submission
    const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        const formData = new FormData(event.currentTarget);

        // Call the server action
        const result = await handlePostSubmitAction(formData);

        setLoading(false);

        if (result?.success) {
            toast({ title: "Post Submitted!", description: "Your need/offer has been posted." });
            // Optionally reset form or redirect
            (event.target as HTMLFormElement).reset();
            // router.push('/'); // Example redirect
        } else {
            toast({ title: "Error", description: result?.error || "Could not submit post.", variant: "destructive" });
        }
    };


    return (
        <div className="max-w-2xl mx-auto relative"> {/* Added relative */}
            {loading && (
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

                        {/* Image Upload Placeholder */}
                        <div className="space-y-2">
                            <Label htmlFor="image">Upload Image (Optional)</Label>
                            {/* TODO: Implement actual image upload handling */}
                            <Input id="image" name="image" type="file" accept="image/*" disabled={loading}/>
                            <p className="text-xs text-muted-foreground">Add an image if helpful (max 5MB).</p>
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
