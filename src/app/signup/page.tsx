'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  // FormDescription, // No longer needed for password
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useState, useEffect, useRef } from 'react';
import { auth, firestore } from '@/lib/firebase/clientApp'; // Import auth, firestore
import {
  // createUserWithEmailAndPassword, // Removed
  signInWithPhoneNumber,
  RecaptchaVerifier,
  updateProfile,
  ConfirmationResult,
  Auth, // Import Auth type
  getAdditionalUserInfo, // Import getAdditionalUserInfo
  getAuth, // Import getAuth if not already imported implicitly by ensureAuthInitialized
} from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Removed Tabs
import LoadingSpinner from '@/components/loading-spinner';
import { doc, setDoc } from "firebase/firestore"; // Import Firestore functions

// Common fields schema part
const commonSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
});

// Phone signup schema only
const phoneSchema = commonSchema.extend({
    phone: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Invalid phone number format (e.g., +919876543210)'),
    otp: z.string().optional(),
}).refine(data => !data.otp || data.otp.length === 6, {
    message: "OTP must be 6 digits",
    path: ["otp"],
});

// Combined type for form values - now only phone
type SignUpFormValues = z.infer<typeof phoneSchema>;
// type SignUpType = 'email' | 'phone'; // Removed, only phone

// Declare window object augmentation for reCAPTCHA (keep as is for simplicity)
declare global {
    interface Window {
        grecaptcha?: any; // For potential direct reset access
        signUpConfirmationResult?: ConfirmationResult; // Keep using window object for simplicity for now
    }
}


export default function SignUpPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  // const [signUpType, setSignUpType] = useState<SignUpType>('phone'); // Default to phone
  const [otpSent, setOtpSent] = useState(false);
  const recaptchaContainerId = "recaptcha-container-signup"; // Define ID
  const [authInstance, setAuthInstance] = useState<Auth | null>(null);

  // Use refs to manage Firebase objects safely
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const recaptchaWidgetIdRef = useRef<number | null>(null);


  // Ensure Firebase Auth is initialized
   useEffect(() => {
     try {
         const auth = getAuth(auth); // Ensure auth is initialized from clientApp
         setAuthInstance(auth);
     } catch (error: any) {
         console.error("Auth initialization failed:", error);
         toast({
             title: "Initialization Error",
             description: "Could not initialize authentication. Please try refreshing.",
             variant: "destructive",
         });
     }
   }, [toast]);

  // Ensure reCAPTCHA cleanup
  useEffect(() => {
    return () => {
      console.log("SignUpPage cleanup: Clearing reCAPTCHA verifier if exists.");
      recaptchaVerifierRef.current?.clear();
      recaptchaVerifierRef.current = null;
      recaptchaWidgetIdRef.current = null;
      window.signUpConfirmationResult = undefined; // Clear window object too
    };
  }, []); // Only run on unmount

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { firstName: '', lastName: '', phone: '', otp: '' },
    mode: 'onChange',
  });

  // Function to set up reCAPTCHA
 const setupRecaptcha = (): Promise<RecaptchaVerifier | null> => {
    return new Promise((resolve, reject) => {
      if (!authInstance) {
        toast({ title: "Error", description: "Authentication service not ready.", variant: "destructive" });
        return reject(new Error("Auth not ready"));
      }

      // Ensure container exists in the DOM *before* creating the verifier
      let container = document.getElementById(recaptchaContainerId);
      if (!container) {
        console.error("Recaptcha container element not found:", recaptchaContainerId);
        toast({ title: "UI Error", description: "Sign up UI failed to load correctly. Please refresh.", variant: "destructive" });
        return reject(new Error("Recaptcha container not found"));
      }

      // Clear previous instance managed by ref if it exists
      if (recaptchaVerifierRef.current) {
        console.log("Clearing previous reCAPTCHA verifier instance via ref for signup.");
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
        recaptchaWidgetIdRef.current = null;
      }

      console.log("Creating new RecaptchaVerifier instance for signup.");
      try {
        const verifier = new RecaptchaVerifier(authInstance, recaptchaContainerId, {
          'size': 'invisible',
          'callback': (response: any) => {
            console.log("reCAPTCHA verified for signup (callback). Response:", response);
          },
          'expired-callback': () => {
            console.error("reCAPTCHA challenge expired (expired-callback) for signup.");
            toast({ title: "reCAPTCHA Expired", description: "Please try sending the OTP again.", variant: "destructive" });
            recaptchaVerifierRef.current?.clear();
            recaptchaVerifierRef.current = null;
            recaptchaWidgetIdRef.current = null;
            setOtpSent(false);
            reject(new Error("reCAPTCHA expired"));
          },
          'error-callback': (error: any) => {
            console.error("reCAPTCHA error (error-callback) for signup:", error);
            toast({ title: "reCAPTCHA Error", description: `Verification failed. ${error?.message || 'Please try again.'}`, variant: "destructive"});
            recaptchaVerifierRef.current?.clear();
            recaptchaVerifierRef.current = null;
            recaptchaWidgetIdRef.current = null;
            setOtpSent(false);
            reject(new Error("reCAPTCHA verification error"));
          }
        });
        recaptchaVerifierRef.current = verifier; // Store in ref

        // Render and resolve
        verifier.render().then((widgetId) => {
          console.log("Signup reCAPTCHA rendered successfully. Widget ID:", widgetId);
          recaptchaWidgetIdRef.current = widgetId; // Store widget ID
          resolve(verifier);
        }).catch((error) => {
          console.error("Signup Recaptcha render failed:", error);
          toast({ title: "reCAPTCHA Error", description: "Could not initialize sign up reCAPTCHA. Refresh might help.", variant: "destructive" });
          recaptchaVerifierRef.current?.clear(); // Cleanup on render fail
          recaptchaVerifierRef.current = null;
          recaptchaWidgetIdRef.current = null;
          reject(error);
        });

      } catch (error) {
        console.error("Error creating/rendering signup RecaptchaVerifier:", error);
        toast({ title: "Setup Error", description: "Could not initialize sign up system. Please refresh.", variant: "destructive" });
        reject(error);
      }
    });
  };

   const handleSignUp = async (values: SignUpFormValues) => {
    if (!authInstance) {
        toast({ title: "Error", description: "Authentication service not ready.", variant: "destructive" });
        return;
    }
    if (!firestore) {
        toast({ title: "Error", description: "Database service not ready.", variant: "destructive" });
        return;
    }
    setLoading(true);
    const displayName = `${values.firstName} ${values.lastName}`;

    // --- Phone Signup Only ---
    try {
        if (!otpSent) {
            // --- Send OTP Phase ---
            const appVerifier = await setupRecaptcha(); // Setup/get reCAPTCHA
            if (!appVerifier) {
                 console.error("reCAPTCHA setup failed, cannot send OTP for signup.");
                 setLoading(false); // Stop loading if setup fails
                 return; // Exit if setup failed
            }

             console.log("Using appVerifier for signup:", appVerifier);
             console.log("Attempting to send OTP for signup to:", values.phone);

             const confirmationResult = await signInWithPhoneNumber(authInstance, values.phone!, appVerifier);

             window.signUpConfirmationResult = confirmationResult; // Store globally for now
             setOtpSent(true);
             form.reset({...values, otp: ''}); // Clear OTP field after sending
             toast({ title: 'OTP Sent', description: `Verification code sent to ${values.phone}` });
             console.log("Signup OTP sent, confirmation result stored.");
        } else {
            // --- Verify OTP Phase ---
             if (!values.otp) {
                 form.setError("otp", { type: "manual", message: "OTP is required." });
                 throw new Error("OTP is required.");
             }
             if (values.otp.length !== 6) {
                 form.setError("otp", { type: "manual", message: "OTP must be 6 digits." });
                 throw new Error("OTP must be 6 digits.");
             }
             if (!window.signUpConfirmationResult) {
                toast({ title: 'Verification Error', description: 'Confirmation session expired or invalid. Please request OTP again.', variant: 'destructive' });
                setOtpSent(false); // Reset state to allow resend
                recaptchaVerifierRef.current?.clear(); // Cleanup verifier ref
                recaptchaVerifierRef.current = null;
                recaptchaWidgetIdRef.current = null;
                throw new Error("Confirmation session expired or invalid.");
             }
             console.log("Attempting to confirm signup OTP:", values.otp);
             const userCredential = await window.signUpConfirmationResult.confirm(values.otp);

             if (userCredential.user) {
                 console.log("Phone user confirmed/created:", userCredential.user.uid);

                 const additionalUserInfo = getAdditionalUserInfo(userCredential);
                 const isNewUser = additionalUserInfo?.isNewUser ?? true; // Assume new user if info is missing

                 // Always update profile name, and create Firestore doc if new
                 await updateProfile(userCredential.user, { displayName });
                 if (isNewUser) {
                     const userDocRef = doc(firestore, "users", userCredential.user.uid);
                     await setDoc(userDocRef, {
                         uid: userCredential.user.uid,
                         name: displayName,
                         phone: userCredential.user.phoneNumber,
                         createdAt: new Date(),
                         isProfileComplete: false // Flag to indicate profile needs completion
                     }, { merge: true });
                     toast({ title: 'Sign Up Successful', description: 'Please complete your profile.' });
                     router.push('/complete-profile'); // Redirect new users to complete profile
                 } else {
                    // Existing user logged in via phone
                    // Check if Firestore doc exists, create if not (edge case)
                     const userDocRef = doc(firestore, "users", userCredential.user.uid);
                     const docSnap = await getDoc(userDocRef);
                     if (!docSnap.exists()) {
                          await setDoc(userDocRef, {
                             uid: userCredential.user.uid,
                             name: displayName,
                             phone: userCredential.user.phoneNumber,
                             createdAt: new Date(), // Or use existing auth creation time if available
                             isProfileComplete: false // Assume incomplete if doc was missing
                         }, { merge: true });
                          toast({ title: 'Login Successful', description: 'Welcome back! Please complete your profile.' });
                          router.push('/complete-profile');
                     } else if (!docSnap.data()?.isProfileComplete) {
                         toast({ title: 'Login Successful', description: 'Welcome back! Please complete your profile.' });
                         router.push('/complete-profile');
                     } else {
                          toast({ title: 'Login Successful', description: 'Welcome back!' });
                          router.push('/'); // Redirect existing, complete users to home
                     }
                 }

                  // Cleanup on success
                  window.signUpConfirmationResult = undefined;
                  recaptchaVerifierRef.current?.clear();
                  recaptchaVerifierRef.current = null;
                  recaptchaWidgetIdRef.current = null;
             } else {
                throw new Error("User object not found after OTP confirmation.");
             }
        }
    } catch (error: any) {
         console.error(`Phone sign up error (${otpSent ? 'Verify OTP' : 'Send OTP'}):`, error);
         console.error('Error Code:', error.code);
         console.error('Error Message:', error.message);

         if (!otpSent && recaptchaVerifierRef.current) {
            console.warn("Resetting reCAPTCHA due to Send OTP error during signup.");
             try {
                recaptchaVerifierRef.current.clear();
            } catch (clearError) {
                console.error("Error clearing reCAPTCHA:", clearError);
            } finally {
                recaptchaVerifierRef.current = null;
                recaptchaWidgetIdRef.current = null;
            }
         }

         const title = otpSent ? 'OTP Verification Failed' : 'Failed to Send OTP';
         let description = `Error: ${error.message || 'Unknown error.'}`;

        if (error.code === 'auth/captcha-check-failed' || error.message?.includes('captcha-check-failed')) {
            description = 'reCAPTCHA verification failed. Please try sending the OTP again.';
            setOtpSent(false);
        } else if (error.code === 'auth/invalid-phone-number') {
             description = "Invalid phone number format. Please use the format +91XXXXXXXXXX.";
             setOtpSent(false); // Allow re-entry
             form.setValue('phone', ''); // Clear invalid number
        } else if (error.code === 'auth/invalid-verification-code') {
             description = 'Invalid OTP entered. Please try again.';
             form.setValue('otp', '');
        } else if (error.code === 'auth/code-expired') {
             description = 'The verification code has expired. Please send a new one.';
             setOtpSent(false);
        } else if (error.code === 'auth/too-many-requests') {
             description = 'Too many attempts. Please try again later.';
             setOtpSent(false);
        } else if (error.code?.includes('auth/network-request-failed')) {
             description = 'Network error. Please check your connection and try again.';
        } else if (error.code === 'auth/configuration-not-found') {
            description = 'Firebase configuration error. Ensure Phone Auth is enabled.';
            setOtpSent(false);
        } else if (error.code === 'auth/missing-client-identifier' || error.message?.includes('missing client identifier')) {
            description = 'reCAPTCHA configuration error. Check Firebase setup and domain whitelisting.';
            setOtpSent(false);
        }

         toast({
            title: title,
            description: description,
            variant: 'destructive',
         });
         if (error.message.includes('expired') || error.code === 'auth/session-expired') {
             setOtpSent(false);
         }
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center py-12 relative">
       {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-50">
                 <LoadingSpinner />
            </div>
        )}
      {/* Container MUST exist in the DOM for invisible reCAPTCHA */}
      <div id={recaptchaContainerId} className="absolute -top-96 -left-96"></div>

      <Card className="mx-auto max-w-sm w-full">
        <CardHeader>
          <CardTitle className="text-xl">Sign Up with Phone</CardTitle>
          <CardDescription>Enter your details to create an account</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSignUp)} className="grid gap-4">
               <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First name</FormLabel>
                          <FormControl>
                            <Input placeholder="Max" {...field} disabled={loading || otpSent}/>
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
                          <FormLabel>Last name</FormLabel>
                          <FormControl>
                            <Input placeholder="Robinson" {...field} disabled={loading || otpSent}/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                {/* Phone Specific Fields */}
                <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                        <Input type="tel" placeholder="+919876543210" {...field} disabled={otpSent || loading} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                {otpSent && (
                        <FormField
                        control={form.control}
                        name="otp"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Enter OTP</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="Enter 6-digit OTP" {...field} disabled={loading} autoFocus/>
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Processing...' : (otpSent ? 'Verify OTP & Sign Up' : 'Send OTP')}
                    </Button>
                    {otpSent && (
                    <Button variant="link" size="sm" onClick={() => {
                        setOtpSent(false);
                        form.reset({...form.getValues(), otp: ''}); // Reset OTP field
                        window.signUpConfirmationResult = undefined; // Clear confirmation ref/state
                        recaptchaVerifierRef.current?.clear(); // Clear verifier ref
                        recaptchaVerifierRef.current = null;
                        recaptchaWidgetIdRef.current = null;
                    }} className="text-sm" type="button" disabled={loading}> {/* Added type="button" */}
                        Change Number or Resend OTP
                    </Button>
                    )}
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="underline text-primary hover:text-primary/80">
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
