
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import LoadingSpinner from "@/components/loading-spinner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '@/hooks/use-toast';
import { handlePostSubmitAction } from '@/actions/postActions';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase/clientApp';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import Image from 'next/image';
import { IndianRupee, MapPin, Tag, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// Define type for form data across steps
interface FormDataState {
    postType: string;
    title: string;
    category: string;
    description: string;
    location: string;
    budget: string;
    urgency: string;
    imageFiles: File[];
}

// Define type for preview data
interface PreviewData extends Omit<FormDataState, 'imageFiles'> {
    imageUrls: string[];
    originalFormData?: FormData; // To pass to server action
}

const steps = [
    { id: 1, name: 'Details', fields: ['postType', 'title', 'category', 'description'] },
    { id: 2, name: 'Location & Value', fields: ['location', 'budget', 'urgency'] },
    { id: 3, name: 'Media', fields: ['imageFiles'] },
    { id: 4, name: 'Preview' } // Preview step
];

export default function PostNeedPage() {
    const [user, authLoading, authError] = auth ? useAuthState(auth) : [null, true, new Error("Auth not initialized")];
    const [loading, setLoading] = useState(false);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [previewData, setPreviewData] = useState<PreviewData | null>(null);
    const { toast } = useToast();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<FormDataState>({
        postType: '',
        title: '',
        category: '',
        description: '',
        location: '',
        budget: '',
        urgency: '',
        imageFiles: [],
    });

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
        if (authError) {
            console.error("Firebase Auth Hook Error:", authError);
            toast({
              title: "Authentication Error",
              description: authError.message || "Could not verify user.",
              variant: "destructive",
            });
            router.push('/login');
        }
    }, [user, authLoading, authError, router, toast]);

    const categories = ["Services", "Buy/Sell", "Jobs", "Farming", "Tuitions", "Help", "Other"];
    const urgencies = ["Low", "Medium", "High", "Urgent"];

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: keyof FormDataState, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

     const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            if (files.length > 10) {
                toast({
                    title: "Too many files",
                    description: "You can upload a maximum of 10 images.",
                    variant: "destructive"
                });
                if (fileInputRef.current) fileInputRef.current.value = ""; // Clear selection
                setFormData(prev => ({ ...prev, imageFiles: [] }));
            } else if (files.some(file => file.size > 5 * 1024 * 1024)) { // Check for size > 5MB
                 toast({
                     title: "File too large",
                     description: "Each image must be 5MB or less.",
                     variant: "destructive"
                 });
                 if (fileInputRef.current) fileInputRef.current.value = ""; // Clear selection
                 setFormData(prev => ({ ...prev, imageFiles: [] }));
             } else {
                setFormData(prev => ({ ...prev, imageFiles: files }));
            }
        }
    };

    const validateStep = (step: number): boolean => {
        const currentStepFields = steps.find(s => s.id === step)?.fields || [];
        for (const field of currentStepFields) {
            if (field === 'imageFiles') {
                if (formData.imageFiles.length === 0) {
                    toast({ title: "Missing Image", description: "Please upload at least one image.", variant: "destructive" });
                    return false;
                }
                 if (formData.imageFiles.length > 10) {
                     toast({ title: "Too Many Images", description: "Maximum 10 images allowed.", variant: "destructive" });
                     return false;
                 }
                 if (formData.imageFiles.some(f => f.size > 5 * 1024 * 1024)) {
                      toast({ title: "Image Too Large", description: "Maximum 5MB per image.", variant: "destructive" });
                      return false;
                 }
            } else if (!formData[field as keyof FormDataState]) {
                toast({ title: "Missing Field", description: `Please fill in the '${field}' field.`, variant: "destructive" });
                return false;
            }
        }
        return true;
    };


    const nextStep = () => {
        if (validateStep(currentStep)) {
            if (currentStep < steps.length -1 ) { // Don't increment if on last form step
                 setCurrentStep(prev => prev + 1);
            } else if (currentStep === steps.length - 1) { // If on last form step, trigger preview
                handlePreview();
            }
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        }
    };

     // Handler to prepare and show preview
    const handlePreview = () => {
         if (!user) {
            toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
            return;
        }
         if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
             toast({ title: "Incomplete Form", description: "Please complete all required fields in previous steps.", variant: "destructive" });
             // Optionally navigate back to the first invalid step
             if (!validateStep(1)) setCurrentStep(1);
             else if (!validateStep(2)) setCurrentStep(2);
             else if (!validateStep(3)) setCurrentStep(3);
             return;
         }

        const imageUrls = formData.imageFiles.map(file => URL.createObjectURL(file));

        // Create FormData for server action submission
        const submissionFormData = new FormData();
        submissionFormData.append('post-type', formData.postType);
        submissionFormData.append('title', formData.title);
        submissionFormData.append('category', formData.category);
        submissionFormData.append('description', formData.description);
        submissionFormData.append('location', formData.location);
        submissionFormData.append('budget', formData.budget);
        submissionFormData.append('urgency', formData.urgency);
        formData.imageFiles.forEach(file => {
            submissionFormData.append('image', file); // Use 'image' key multiple times
        });


        setPreviewData({
            postType: formData.postType,
            title: formData.title,
            category: formData.category,
            description: formData.description,
            location: formData.location,
            budget: formData.budget,
            urgency: formData.urgency,
            imageUrls: imageUrls,
            originalFormData: submissionFormData, // Store FormData for final submit
        });
        setIsPreviewing(true); // Open the preview dialog
    };

    // Handler for final post confirmation from preview
    const handleConfirmPost = async () => {
        if (!previewData?.originalFormData) {
            toast({ title: "Error", description: "No data to submit.", variant: "destructive" });
            setIsPreviewing(false);
            return;
        }
        setLoading(true);
        setIsPreviewing(false); // Close dialog

        const result = await handlePostSubmitAction(previewData.originalFormData);

        setLoading(false);

        previewData.imageUrls.forEach(url => URL.revokeObjectURL(url)); // Clean up blob URLs

        if (result?.success) {
            toast({ title: "Post Submitted!", description: "Your need/offer has been posted." });
            setFormData({ // Reset form state
                 postType: '', title: '', category: '', description: '',
                 location: '', budget: '', urgency: '', imageFiles: [],
            });
            setCurrentStep(1); // Go back to first step
             if (fileInputRef.current) fileInputRef.current.value = ""; // Clear file input
            router.push('/'); // Redirect home
        } else {
            toast({ title: "Error", description: result?.error || "Could not submit post.", variant: "destructive" });
            setPreviewData(null); // Clear preview data on error
        }
    };

     const handleEditFromPreview = () => {
        setIsPreviewing(false);
        previewData?.imageUrls.forEach(url => URL.revokeObjectURL(url)); // Clean up blob URLs
        setPreviewData(null); // Clear preview data, keep form state
        setCurrentStep(3); // Go back to the last step (Media) for editing
     };

     if (authLoading) {
        return <div className="flex justify-center items-center min-h-[60vh]"><LoadingSpinner /></div>;
     }
     if (!user) {
        return <div className="flex justify-center items-center min-h-[60vh]"><p className="text-muted-foreground">Redirecting to login...</p></div>;
     }

    return (
        <div className="max-w-2xl mx-auto relative">
            {loading && (
                <div className="fixed inset-0 flex items-center justify-center bg-background/80 z-50">
                    <LoadingSpinner />
                </div>
            )}
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">Create New Post ({currentStep}/{steps.length - 1})</CardTitle>
                    <CardDescription>{steps.find(s => s.id === currentStep)?.name || 'Review'}</CardDescription>
                     {/* Progress Indicator (Optional) */}
                     <div className="flex space-x-2 mt-2">
                        {steps.slice(0, -1).map((stepInfo) => (
                             <div key={stepInfo.id} className={cn("h-2 flex-1 rounded-full", currentStep >= stepInfo.id ? 'bg-primary' : 'bg-muted')}></div>
                        ))}
                     </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={(e) => e.preventDefault()} className="space-y-6"> {/* Prevent default submit */}

                        {/* Step 1: Details */}
                        {currentStep === 1 && (
                             <>
                                <div className="space-y-2">
                                    <Label>I want to... *</Label>
                                     <Select name="postType" required onValueChange={(value) => handleSelectChange('postType', value)} value={formData.postType} disabled={loading}>
                                        <SelectTrigger><SelectValue placeholder="Select if you need or offer something" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="need">Post a Need (I need help/product/service)</SelectItem>
                                            <SelectItem value="offer">Post an Offer (I can provide help/product/service)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="title">Title *</Label>
                                    <Input id="title" name="title" placeholder="E.g., Need Electrician, Offering Homemade Snacks" required value={formData.title} onChange={handleInputChange} disabled={loading}/>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="category">Category *</Label>
                                    <Select name="category" required onValueChange={(value) => handleSelectChange('category', value)} value={formData.category} disabled={loading}>
                                        <SelectTrigger id="category"><SelectValue placeholder="Select a category" /></SelectTrigger>
                                        <SelectContent>
                                            {categories.map(category => (
                                                <SelectItem key={category} value={category.toLowerCase()}>{category}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="description">Description *</Label>
                                    <Textarea id="description" name="description" placeholder="Provide more details..." required value={formData.description} onChange={handleInputChange} disabled={loading}/>
                                </div>
                             </>
                        )}

                        {/* Step 2: Location & Value */}
                        {currentStep === 2 && (
                            <>
                               <div className="space-y-2">
                                    <Label htmlFor="location">Location *</Label>
                                    <Input id="location" name="location" placeholder="E.g., Your City, State or 'Remote'" required value={formData.location} onChange={handleInputChange} disabled={loading}/>
                                     <p className="text-xs text-muted-foreground">Be specific if location matters, or type 'Remote'.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="budget">Budget / Price *</Label>
                                    <Input id="budget" name="budget" placeholder="E.g., ₹500, Negotiable, Free, Daily Wage" required value={formData.budget} onChange={handleInputChange} disabled={loading}/>
                                     <p className="text-xs text-muted-foreground">Enter amount, range, or terms like 'Negotiable'.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="urgency">Urgency *</Label>
                                    <Select name="urgency" required onValueChange={(value) => handleSelectChange('urgency', value)} value={formData.urgency} disabled={loading}>
                                        <SelectTrigger id="urgency"><SelectValue placeholder="Select urgency level" /></SelectTrigger>
                                        <SelectContent>
                                             {urgencies.map(urgency => (
                                                <SelectItem key={urgency} value={urgency.toLowerCase()}>{urgency}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </>
                        )}

                        {/* Step 3: Media */}
                        {currentStep === 3 && (
                             <div className="space-y-2">
                                <Label htmlFor="image">Upload Image(s) *</Label>
                                <Input
                                    id="image"
                                    name="image"
                                    type="file"
                                    accept="image/*"
                                    required
                                    multiple // Allow multiple files
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    disabled={loading}
                                />
                                <p className="text-xs text-muted-foreground">Add 1 to 10 images (max 5MB each).</p>
                                {/* Image Preview Grid */}
                                {formData.imageFiles.length > 0 && (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 mt-2">
                                        {formData.imageFiles.map((file, index) => (
                                            <div key={index} className="relative aspect-square bg-muted rounded overflow-hidden">
                                                <Image
                                                    src={URL.createObjectURL(file)}
                                                    alt={`Preview ${index + 1}`}
                                                    fill
                                                    style={{ objectFit: 'cover' }}
                                                    onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)} // Clean up URL after load
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </form>
                </CardContent>
                 <CardFooter className="flex justify-between border-t pt-6">
                     <Button variant="outline" onClick={prevStep} disabled={currentStep === 1 || loading}>
                         <ChevronLeft className="mr-1 h-4 w-4" /> Previous
                     </Button>
                    <Button onClick={nextStep} disabled={loading} className="bg-primary hover:bg-primary/90">
                        {currentStep === steps.length - 1 ? 'Preview Post' : 'Next'}
                         <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                </CardFooter>
            </Card>

             {/* Preview Dialog */}
            <Dialog open={isPreviewing} onOpenChange={setIsPreviewing}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Post Preview</DialogTitle>
                        <DialogDescription>Review your post details before submitting.</DialogDescription>
                    </DialogHeader>
                    <div className="overflow-y-auto p-1 -m-1 pr-3 flex-grow">
                        {previewData && (
                            <div className="space-y-4">
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
                            </div>
                        )}
                    </div>
                    <DialogFooter className="mt-4 flex-col sm:flex-row gap-2 sm:gap-0">
                        <Button variant="outline" onClick={handleEditFromPreview} disabled={loading}>Edit</Button>
                        <Button onClick={handleConfirmPost} disabled={loading} className="bg-accent hover:bg-accent/90">
                             {loading ? <><LoadingSpinner showText={false} className="h-4 w-4 mr-2"/> Posting...</> : 'Confirm & Post'}
                        </Button>
                    </DialogFooter>
                     <DialogClose asChild><button className="sr-only">Close</button></DialogClose>
                </DialogContent>
            </Dialog>
        </div>
    );
}

