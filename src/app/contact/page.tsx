'use client'; // Needs to be a client component to manage loading state

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import LoadingSpinner from "@/components/loading-spinner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '@/hooks/use-toast';

export default function ContactPage() {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (formData: FormData) => {
        'use server';
        // Note: Cannot directly modify client state (loading) from server action.
        // A common pattern is to use useFormState hook or handle loading/toast on the client after the action returns.
        // For simplicity here, we'll assume client handles loading start/stop around the form submission call.
        console.log("Contact form submitted (server action)");
        const name = formData.get('name');
        const email = formData.get('email');
        const message = formData.get('message');
        console.log({ name, email, message });

        try {
            // Simulate sending email or saving to DB...
            await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
            console.log("Message processed successfully.");
            // In a real app, you'd return a success status from the server action.
            // You cannot call toast() directly from a server action.
            return { success: true };
        } catch (error) {
            console.error("Error processing contact form:", error);
            return { success: false, error: "Failed to send message." };
        }
    };

    // Client-side wrapper for form submission to handle loading state
    const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        const formData = new FormData(event.currentTarget);

        // Call the server action
        const result = await handleSubmit(formData);

        setLoading(false);

        if (result?.success) {
            toast({ title: "Message Sent!", description: "We'll get back to you soon." });
            // Optionally reset the form
            (event.target as HTMLFormElement).reset();
        } else {
            toast({ title: "Error", description: result?.error || "Could not send message.", variant: "destructive" });
        }
    };

    return (
        <div className="max-w-xl mx-auto relative"> {/* Added relative for spinner positioning */}
             {loading && <LoadingSpinner className="absolute inset-0 bg-background/50 z-10" />}
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">Contact Us</CardTitle>
                    <CardDescription>Have questions or feedback? Send us a message!</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleFormSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" name="name" placeholder="Your Name" required disabled={loading}/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" placeholder="your.email@example.com" required disabled={loading}/>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="message">Message</Label>
                            <Textarea id="message" name="message" placeholder="Your message..." rows={5} required disabled={loading}/>
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Sending...' : 'Send Message'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
