
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
} from '@/components/ui/form';
import { useState, useEffect } from 'react';
import { auth, firestore } from '@/lib/firebase/clientApp';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/loading-spinner';
import { doc, getDoc, updateDoc } from "firebase/firestore"; // Import Firestore functions
import { updateEmail } from "firebase/auth"; // Import updateEmail

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
      if (user && !initialDataLoaded) {
        setLoading(true);
        try {
          const userDocRef = doc(firestore, "users", user.uid);
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
          }
           setInitialDataLoaded(true);
        } catch (error) {
          console.error("Error fetching profile data:", error);
          toast({ title: "Error", description: "Could not load profile data.", variant: "destructive" });
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
        } else {
            fetchInitialData();
        }
    }
  }, [user, authLoading, router, toast, form, initialDataLoaded]);


  const handleProfileUpdate = async (values: ProfileFormValues) => {
    if (!user || !firestore) {
      toast({ title: "Error", description: "User or database service not available.", variant: "destructive" });
      return;
    }
    setLoading(true);

    try {
      const userDocRef = doc(firestore, "users", user.uid);
      const newName = `${values.firstName} ${values.lastName}`;

      // Update Firestore document
      await updateDoc(userDocRef, {
        name: newName,
        email: values.email || null, // Store null if empty
        age: values.age || null, // Store null if empty
        bio: values.bio || null, // Store null if empty
        isProfileComplete: true // Mark profile as complete
      });

       // Update Auth display name if it differs
      if (user.displayName !== newName) {
          await updateProfile(user, { displayName: newName });
      }

       // Update Auth email if provided and differs (requires recent login or re-authentication)
       // This might throw an error if the user hasn't logged in recently.
       // Consider adding re-authentication logic if email update is critical.
      if (values.email && user.email !== values.email) {
           try {
               await updateEmail(user, values.email);
               console.log("User email updated in Auth.");
           } catch (authError: any) {
               console.warn("Could not update email in Auth:", authError);
               toast({ title: "Email Update", description: "Could not update email directly. You might need to re-authenticate.", variant: "default"});
           }
      }


      toast({ title: 'Profile Updated', description: 'Your profile is now complete.' });
      router.push('/'); // Redirect to home page after completion
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast({
        title: 'Update Failed',
        description: error.message || 'Could not update profile.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

   if (authLoading || (user && !initialDataLoaded)) {
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
                             <Textarea placeholder="Tell the community a little about yourself..." {...field} rows={4} disabled={loading}/>
                          </FormControl>
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
