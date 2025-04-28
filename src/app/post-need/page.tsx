import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function PostNeedPage() {
    // Placeholder for categories and urgencies
    const categories = ["Services", "Buy/Sell", "Jobs", "Farming", "Tuitions", "Help", "Other"];
    const urgencies = ["Low", "Medium", "High", "Urgent"];

    // TODO: Implement form handling (React Hook Form, Zod validation) and Server Action
    const handleSubmit = async (formData: FormData) => {
        'use server';
        console.log("Form submitted");
        // Process form data...
        const title = formData.get('title');
        const description = formData.get('description');
        // ... get other fields
        console.log({ title, description });
        // Save to Firestore...
    };


    return (
        <div className="max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">Post Your Need or Offer</CardTitle>
                    <CardDescription>Fill in the details below to connect with the community.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={handleSubmit} className="space-y-6">
                         {/* Post Type Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="post-type">I want to...</Label>
                            <Select name="post-type" required>
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
                            <Input id="title" name="title" placeholder="E.g., Need Electrician, Offering Homemade Snacks" required />
                        </div>

                         {/* Category */}
                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Select name="category" required>
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
                            <Textarea id="description" name="description" placeholder="Provide more details about your need or offer..." required />
                        </div>

                        {/* Location */}
                         <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <Input id="location" name="location" placeholder="E.g., Your City, State or 'Remote'" required />
                             <p className="text-xs text-muted-foreground">Be specific if location matters, or type 'Remote' if it doesn't.</p>
                        </div>

                        {/* Budget */}
                        <div className="space-y-2">
                            <Label htmlFor="budget">Budget / Price (Optional)</Label>
                            <Input id="budget" name="budget" placeholder="E.g., ₹500, Negotiable, Free, Daily Wage" />
                             <p className="text-xs text-muted-foreground">Enter an amount, range, or terms like 'Negotiable'.</p>
                        </div>

                         {/* Urgency */}
                        <div className="space-y-2">
                            <Label htmlFor="urgency">Urgency</Label>
                            <Select name="urgency">
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
                            <Input id="image" name="image" type="file" accept="image/*" />
                            <p className="text-xs text-muted-foreground">Add an image if helpful (max 5MB).</p>
                        </div>


                        <Button type="submit" className="w-full bg-accent hover:bg-accent/90">Post Now</Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
