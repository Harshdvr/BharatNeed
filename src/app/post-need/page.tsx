
'use client'; // Need client component for state, hooks

import { useState, useEffect, useRef } from 'react'; // Import useState, useEffect, useRef
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"; // Import Dialog components
import Image from 'next/image';
import { IndianRupee, MapPin, Tag, Clock } from 'lucide-react'; // Import icons for preview

// Define type for preview data
interface PreviewData {
    postType: string;
    title: string;
    category: string;
    description: string;
    location: string;
    budget: string;
    urgency: string;
    imageUrls: string[]; // Store temporary image URLs for preview
    formData?: FormData; // Store original FormData for submission
}


export default function PostNeedPage() {
    const [user, authLoading, authError] = auth ? useAuthState(auth) : [null, true, new Error("Auth not initialized")];
    const [loading, setLoading] = useState(false); // State for form submission loading
    const [isPreviewing, setIsPreviewing] = useState(false); // State for preview mode
    const [previewData, setPreviewData] = useState<PreviewData | null>(null); // State to hold data for preview
    const { toast } = useToast();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null); // Ref for file input


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

     // Client-side handler to initiate preview
    const handlePreviewSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!user) { // Double check user exists before previewing
            toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
            return;
        }

        const formData = new FormData(event.currentTarget);
        const imageFiles = Array.from(formData.getAll('image') as File[]);

         // Basic client-side validation (mirroring required fields)
         const postType = formData.get('post-type') as string;
         const title = formData.get('title') as string;
         const category = formData.get('category') as string;
         const description = formData.get('description') as string;
         const location = formData.get('location') as string;
         const budget = formData.get('budget') as string;
         const urgency = formData.get('urgency') as string;

         if (!postType || !title || !category || !description || !location || !budget || !urgency || imageFiles.length === 0) {
             toast({ title: "Missing Fields", description: "Please fill all required fields (*) and upload at least one image.", variant: "destructive" });
             return;
         }
          if (imageFiles.some(file => file.size === 0)) {
             toast({ title: "Invalid Image", description: "One or more selected image files are empty.", variant: "destructive" });
             return;
         }
         if (imageFiles.length > 10) {
              toast({
                  title: "Too many files",
                  description: "You can upload a maximum of 10 images.",
                  variant: "destructive"
              });
              return;
          }


        // Create temporary URLs for image previews
        const imageUrls = imageFiles.map(file => URL.createObjectURL(file));

        setPreviewData({
            postType: postType || 'N/A',
            title: title || 'N/A',
            category: category || 'N/A',
            description: description || 'N/A',
            location: location || 'N/A',
            budget: budget || 'N/A',
            urgency: urgency || 'N/A',
            imageUrls: imageUrls,
            formData: formData, // Store the original form data
        });
        setIsPreviewing(true); // Open the preview dialog
    };

    // Handler for final post confirmation from preview
    const handleConfirmPost = async () => {
        if (!previewData?.formData) {
            toast({ title: "Error", description: "No data to submit.", variant: "destructive" });
            setIsPreviewing(false);
            return;
        }
        setLoading(true);
        setIsPreviewing(false); // Close dialog immediately, show loading state

        // Call the imported server action with the stored FormData
        const result = await handlePostSubmitAction(previewData.formData);

        setLoading(false);

        // Revoke temporary image URLs after submission attempt
        previewData.imageUrls.forEach(url => URL.revokeObjectURL(url));

        if (result?.success) {
            toast({ title: "Post Submitted!", description: "Your need/offer has been posted." });
             // Reset form state after successful submission
             setPreviewData(null);
             if (fileInputRef.current) {
                 fileInputRef.current.value = ""; // Clear file input
             }
             // TODO: Consider resetting other form fields if needed, or use react-hook-form's reset
             // For now, redirecting might be simpler
             router.push('/'); // Redirect to home after successful post
        } else {
            toast({ title: "Error", description: result?.error || "Could not submit post.", variant: "destructive" });
            // Keep preview data in case user wants to try again (or potentially re-open preview?)
            // For simplicity, we just close the dialog and show error. User needs to click preview again.
            setPreviewData(null); // Clear preview data on error
        }
    };

     const handleEditFromPreview = () => {
        setIsPreviewing(false);
        // Optionally revoke URLs immediately if editing
        // previewData?.imageUrls.forEach(url => URL.revokeObjectURL(url));
        // setPreviewData(null); // Keep data in form, just close dialog
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
        return (
             <div className="flex justify-center items-center min-h-[60vh]">
                 <p className="text-muted-foreground">Redirecting to login...</p>
             </div>
        );
     }


    // Render the form only if user is authenticated and not loading
    return (
        <div className="max-w-2xl mx-auto relative">
            {/* Main Loading Spinner for submission */}
            {loading && (
                <div className="fixed inset-0 flex items-center justify-center bg-background/80 z-50">
                    <LoadingSpinner />
                </div>
            )}
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">Post Your Need or Offer</CardTitle>
                    <CardDescription>Fill in the details below to connect with the community.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handlePreviewSubmit} className="space-y-6">
                         {/* Post Type Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="post-type">I want to... *</Label>
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
                            <Label htmlFor="title">Title *</Label>
                            <Input id="title" name="title" placeholder="E.g., Need Electrician, Offering Homemade Snacks" required disabled={loading}/>
                        </div>

                         {/* Category */}
                        <div className="space-y-2">
                            <Label htmlFor="category">Category *</Label>
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
                            <Label htmlFor="description">Description *</Label>
                            <Textarea id="description" name="description" placeholder="Provide more details about your need or offer..." required disabled={loading}/>
                        </div>

                        {/* Location */}
                         <div className="space-y-2">
                            <Label htmlFor="location">Location *</Label>
                            <Input id="location" name="location" placeholder="E.g., Your City, State or 'Remote'" required disabled={loading}/>
                             <p className="text-xs text-muted-foreground">Be specific if location matters, or type 'Remote' if it doesn't.</p>
                        </div>

                        {/* Budget */}
                        <div className="space-y-2">
                            <Label htmlFor="budget">Budget / Price *</Label>
                            <Input id="budget" name="budget" placeholder="E.g., ₹500, Negotiable, Free, Daily Wage" required disabled={loading}/>
                             <p className="text-xs text-muted-foreground">Enter an amount, range, or terms like 'Negotiable'.</p>
                        </div>

                         {/* Urgency */}
                        <div className="space-y-2">
                            <Label htmlFor="urgency">Urgency *</Label>
                            <Select name="urgency" required disabled={loading}>
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
                            <Label htmlFor="image">Upload Image(s) *</Label>
                            <Input
                                id="image"
                                name="image"
                                type="file"
                                accept="image/*"
                                required
                                disabled={loading}
                                multiple // Allow multiple files
                                ref={fileInputRef}
                                onChange={(e) => {
                                    if (e.target.files && e.target.files.length > 10) {
                                        toast({
                                            title: "Too many files",
                                            description: "You can upload a maximum of 10 images.",
                                            variant: "destructive"
                                        });
                                        e.target.value = ""; // Clear selection
                                    }
                                }}
                            />
                            <p className="text-xs text-muted-foreground">Add up to 10 images (max 5MB each).</p>
                        </div>


                        <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
                             {loading ? 'Processing...' : 'Preview Post'}
                        </Button>
                    </form>
                </CardContent>
            </Card>

             {/* Preview Dialog */}
            <Dialog open={isPreviewing} onOpenChange={setIsPreviewing}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Post Preview</DialogTitle>
                        <DialogDescription>
                            Review your post details below before submitting.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="overflow-y-auto p-1 -m-1 pr-3 flex-grow"> {/* Make content scrollable */}
                        {previewData && (
                            <div className="space-y-4">
                                {/* Image Preview Carousel/Grid */}
                                {previewData.imageUrls.length > 0 && (
                                    <div className="grid grid-cols-3 gap-2">
                                        {previewData.imageUrls.map((url, index) => (
                                            <div key={index} className="relative aspect-square bg-muted rounded">
                                                <Image src={url} alt={`Preview ${index + 1}`} fill style={{ objectFit: 'cover' }} className="rounded"/>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <h3 className="text-xl font-semibold">{previewData.title}</h3>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <span className={`capitalize px-2 py-0.5 rounded text-xs ${previewData.postType === 'need' ? 'bg-destructive/20 text-destructive' : 'bg-primary/20 text-primary'}`}>
                                        {previewData.postType}
                                    </span>
                                    <span className="flex items-center gap-1"><Tag className="h-3.5 w-3.5" /> {previewData.category}</span>
                                </div>
                                <p className="text-base">{previewData.description}</p>
                                <div className="space-y-1 text-sm">
                                     <p className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {previewData.location}</p>
                                     <p className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> Urgency: <span className='capitalize'>{previewData.urgency}</span></p>
                                     <p className="flex items-center gap-1.5 font-medium"><IndianRupee className="h-4 w-4" /> {previewData.budget}</p>
                                </div>

                                {/* TODO: Add seller info preview if relevant */}
                            </div>
                        )}
                    </div>
                    <DialogFooter className="mt-4 flex-col sm:flex-row gap-2 sm:gap-0">
                        <Button variant="outline" onClick={handleEditFromPreview} disabled={loading}>Edit</Button>
                        <Button onClick={handleConfirmPost} disabled={loading} className="bg-accent hover:bg-accent/90">
                             {loading ? <><LoadingSpinner showText={false} className="h-4 w-4 mr-2"/> Posting...</> : 'Confirm & Post'}
                        </Button>
                    </DialogFooter>
                     <DialogClose asChild>
                         <button className="sr-only">Close</button>
                     </DialogClose>
                </DialogContent>
            </Dialog>
        </div>
    );
}
