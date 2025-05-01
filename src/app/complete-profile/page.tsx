
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea'; // Import Textarea
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
   FormDescription, // Import FormDescription
} from '@/components/ui/form';
import { useState, useEffect } from 'react';
import { auth, firestore, ensureFirestoreInitialized } from '@/lib/firebase/clientApp'; // Import Firestore helper
import { useAuthState } from 'react-firebase-hooks/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/loading-spinner';
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore"; // Import Firestore functions
import { updateProfile, updateEmail } from "firebase/auth"; // Import updateEmail and updateProfile

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')), // Optional email
  age: z.coerce.number().positive('Age must be a positive number').optional().nullable(), // Optional age
  bio: z.string().max(500, 'Bio cannot exceed 500 characters').optional(), // Optional bio
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function CompleteProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [user, authLoading, authError] = useAuthState(auth);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
   const [firestoreInitialized, setFirestoreInitialized] = useState(false); // Track firestore init

    // Check Firestore initialization status
     useEffect(() => {
         if (firestore) {
             setFirestoreInitialized(true);
         } else {
             const timeoutId = setTimeout(() => {
                 if (firestore) {
                     setFirestoreInitialized(true);
                 } else {
                     console.error("Firestore still not initialized after delay for complete profile.");
                     toast({ title: "Database Error", description: "Could not connect to the database.", variant: "destructive" });
                     setLoading(false); // Ensure loading stops if DB fails
                 }
             }, 2000);
             return () => clearTimeout(timeoutId);
         }
     }, [toast]);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      age: null,
      bio: '',
    },
    mode: 'onChange',
  });

  // Fetch existing basic profile data to pre-fill the form
  useEffect(() => {
    const fetchInitialData = async () => {
      if (user && !initialDataLoaded && firestoreInitialized) { // Check firestoreInitialized
        setLoading(true);
        try {
           const fs = ensureFirestoreInitialized(); // Ensure firestore is ready
          const userDocRef = doc(fs, "users", user.uid);
          const docSnap = await getDoc(userDocRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            // Pre-fill form with existing data
            const nameParts = data.name?.split(' ') || ['', ''];
            form.reset({
              firstName: nameParts[0] || user.displayName?.split(' ')[0] || '',
              lastName: nameParts.slice(1).join(' ') || user.displayName?.split(' ').slice(1).join(' ') || '',
              email: data.email || user.email || '',
              age: data.age || null,
              bio: data.bio || '',
            });
          } else {
             // If doc doesn't exist, pre-fill with auth data if available
             const nameParts = user.displayName?.split(' ') || ['', ''];
              form.reset({
                  firstName: nameParts[0] || '',
                  lastName: nameParts.slice(1).join(' ') || '',
                  email: user.email || '',
                  age: null, // No age in auth
                  bio: '', // No bio in auth
             });
          }
           setInitialDataLoaded(true);
        } catch (error: any) {
          console.error("Error fetching profile data:", error);
           if (error.message.includes("Firestore is not initialized")) {
               toast({ title: "Database Error", description: "Could not load profile data.", variant: "destructive" });
           } else if (error.code === 'unavailable' || error.message.includes('offline')) {
               toast({ title: "Offline", description: "Could not load profile. Please check connection.", variant: "default" });
           } else {
               toast({ title: "Error", description: "Could not load profile data.", variant: "destructive" });
           }
        } finally {
          setLoading(false);
        }
      }
    };

    if (!authLoading) {
        if (!user) {
            // Redirect if user is not logged in
            toast({ title: "Access Denied", description: "Please log in to complete your profile.", variant: "destructive"});
            router.push('/login');
        } else if (firestoreInitialized) { // Only fetch if firestore is ready
            fetchInitialData();
        }
    }
     // Handle Auth Error
     if (authError) {
         console.error("Authentication Error:", authError);
         toast({ title: "Authentication Error", description: authError.message || "Could not verify user.", variant: "destructive"});
         router.push('/login');
     }
  }, [user, authLoading, router, toast, form, initialDataLoaded, firestoreInitialized, authError]); // Add dependencies


  const handleProfileUpdate = async (values: ProfileFormValues) => {
    if (!user) {
      toast({ title: "Error", description: "User not available.", variant: "destructive" });
      return;
    }
    setLoading(true);

    try {
        const fs = ensureFirestoreInitialized(); // Ensure firestore is ready
      const userDocRef = doc(fs, "users", user.uid);
      const newName = `${values.firstName} ${values.lastName}`;

      // Data to save/update in Firestore
      const profileDataToSave = {
            uid: user.uid, // Ensure UID is set
            name: newName,
            email: values.email || null, // Store null if empty
            age: values.age || null, // Store null if empty
            bio: values.bio || null, // Store null if empty
            isProfileComplete: true, // Mark profile as complete
            // Add createdAt on initial creation, merge otherwise
            // createdAt: serverTimestamp() // Use serverTimestamp for creation ideally
      };

       // Check if document exists to decide between set with merge or update
       const docSnap = await getDoc(userDocRef);
       if (docSnap.exists()) {
           await updateDoc(userDocRef, profileDataToSave); // Update existing doc
           console.log("Firestore profile updated.");
       } else {
           // Add createdAt if creating for the first time
           await setDoc(userDocRef, { ...profileDataToSave, createdAt: new Date() }); // Set new doc
           console.log("Firestore profile created.");
       }


       // Update Auth display name if it differs
      if (user.displayName !== newName) {
          await updateProfile(user, { displayName: newName });
          console.log("Firebase Auth display name updated.");
      }

       // Update Auth email if provided and differs (requires recent login or re-authentication)
      if (values.email && user.email !== values.email) {
           try {
               await updateEmail(user, values.email);
               console.log("Firebase Auth email updated.");
           } catch (authError: any) {
               console.warn("Could not update email in Firebase Auth:", authError);
               // Inform user about potential re-authentication need
               toast({ title: "Email Update Notice", description: "Could not update email directly in authentication. You might need to re-authenticate for the change to fully apply.", variant: "default", duration: 5000});
           }
      }


      toast({ title: 'Profile Updated', description: 'Your profile is now complete.' });
      router.push('/'); // Redirect to home page after completion
    } catch (error: any) {
      console.error('Profile update error:', error);
       if (error.message.includes("Firestore is not initialized")) {
           toast({ title: "Database Error", description: "Could not save profile.", variant: "destructive" });
       } else if (error.code === 'unavailable' || error.message.includes('offline')) {
            toast({ title: "Offline", description: "Could not save profile. Please check connection.", variant: "destructive" });
       } else if (error.code?.startsWith('auth/')) {
           // Handle specific Firebase Auth errors during email/profile update if needed
           toast({ title: 'Authentication Issue', description: `Could not update auth profile: ${error.message}`, variant: 'destructive' });
       }
       else {
            toast({
                title: 'Update Failed',
                description: error.message || 'Could not update profile.',
                variant: 'destructive',
            });
        }
    } finally {
      setLoading(false);
    }
  };

   // Show loading if auth is loading, or if user exists but initial data/firestore isn't ready
   if (authLoading || (user && (!initialDataLoaded || !firestoreInitialized))) {
     return (
         <div className="flex justify-center items-center min-h-[60vh]">
             <LoadingSpinner />
         </div>
     );
   }


  return (
    <div className="flex items-center justify-center py-12 relative">
       {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-50">
                 <LoadingSpinner />
            </div>
        )}
      <Card className="mx-auto max-w-lg w-full">
        <CardHeader>
          <CardTitle className="text-xl">Complete Your Profile</CardTitle>
          <CardDescription>Tell us a bit more about yourself.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleProfileUpdate)} className="grid gap-6">
               <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Your first name" {...field} disabled={loading}/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Your last name" {...field} disabled={loading}/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                {/* Optional Fields */}
                 <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email (Optional)</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="your.email@example.com" {...field} disabled={loading}/>
                        </FormControl>
                         <FormDescription>
                          Visible only if you choose to show it on ads.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                   <FormField
                      control={form.control}
                      name="age"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Age (Optional)</FormLabel>
                          <FormControl>
                            {/* Treat empty input as null */}
                            <Input type="number" placeholder="Your age" {...field} onChange={e => field.onChange(e.target.value === '' ? null : +e.target.value)} value={field.value ?? ''} disabled={loading} />
                          </FormControl>
                           <FormDescription>
                             Must be a positive number.
                           </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>About Me (Optional)</FormLabel>
                          <FormControl>
                             <Textarea placeholder="Tell the community a little about yourself (max 500 characters)..." {...field} rows={4} disabled={loading}/>
                          </FormControl>
                           <FormDescription>
                             Keep it brief and relevant.
                           </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Profile'}
                  </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
