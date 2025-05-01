
'use client'; // Needs to be a client component to manage loading state

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import LoadingSpinner from "@/components/loading-spinner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '@/hooks/use-toast';
import { handleContactSubmitAction } from '@/actions/contactActions'; // Import the server action

export default function ContactPage() {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    // Client-side wrapper for form submission to handle loading state
    const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        const formData = new FormData(event.currentTarget);

        // Call the server action
        const result = await handleContactSubmitAction(formData);

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
