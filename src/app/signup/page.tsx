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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useState, useEffect, useRef } from 'react';
import { auth, firestore } from '@/lib/firebase/clientApp'; // Import auth, firestore
import {
  signInWithPhoneNumber,
  RecaptchaVerifier,
  updateProfile,
  ConfirmationResult,
  Auth, // Import Auth type
  getAdditionalUserInfo, // Import getAdditionalUserInfo
  getAuth, // Import getAuth if not already imported implicitly by ensureAuthInitialized
  GoogleAuthProvider, // Import GoogleAuthProvider
  signInWithPopup, // Import signInWithPopup
} from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/loading-spinner';
import { doc, setDoc, getDoc } from "firebase/firestore"; // Import Firestore functions
import { Separator } from '@/components/ui/separator'; // Import Separator
import { FcGoogle } from 'react-icons/fc'; // Using react-icons/fc for Google logo


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

// Type for form values (now only phone schema based)
type SignUpFormValues = z.infer<typeof phoneSchema>;


// Declare window object augmentation for reCAPTCHA
declare global {
    interface Window {
        grecaptcha?: any;
        signUpConfirmationResult?: ConfirmationResult;
        signUpRecaptchaVerifier?: RecaptchaVerifier; // Specific verifier for signup
    }
}


export default function SignUpPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const recaptchaContainerId = "recaptcha-container-signup"; // Define ID
  const [authInstance, setAuthInstance] = useState<Auth | null>(null);

  // Use refs to manage Firebase objects safely
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const recaptchaWidgetIdRef = useRef<number | null>(null);


  // Ensure Firebase Auth is initialized
   useEffect(() => {
     try {
         const auth = getAuth(); // Ensure auth is initialized from clientApp
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
      window.signUpConfirmationResult = undefined;
      window.signUpRecaptchaVerifier?.clear(); // Clear specific signup verifier
      window.signUpRecaptchaVerifier = undefined;
    };
  }, []); // Only run on unmount

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(phoneSchema), // Use phone schema resolver
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

      let container = document.getElementById(recaptchaContainerId);
      if (!container) {
        console.error("Recaptcha container element not found:", recaptchaContainerId);
        toast({ title: "UI Error", description: "Sign up UI failed to load correctly. Please refresh.", variant: "destructive" });
        return reject(new Error("Recaptcha container not found"));
      }

      // Use ref to manage the verifier instance
      if (recaptchaVerifierRef.current) {
        console.log("Using existing reCAPTCHA verifier instance via ref for signup.");
        recaptchaVerifierRef.current.render().then((widgetId) => {
             recaptchaWidgetIdRef.current = widgetId;
             resolve(recaptchaVerifierRef.current);
         }).catch((error) => {
             console.error("Error re-rendering existing signup reCAPTCHA:", error);
             recaptchaVerifierRef.current?.clear();
             recaptchaVerifierRef.current = null;
             recaptchaWidgetIdRef.current = null;
             createNewVerifier(resolve, reject); // Create new if re-render fails
         });
      } else {
        console.log("Creating new RecaptchaVerifier instance for signup.");
        createNewVerifier(resolve, reject);
      }
    });
  };

    const createNewVerifier = (resolve: (verifier: RecaptchaVerifier) => void, reject: (reason?: any) => void) => {
        if (!authInstance) {
          return reject(new Error("Auth not ready during signup verifier creation"));
        }
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

            verifier.render().then((widgetId) => {
            console.log("Signup reCAPTCHA rendered successfully. Widget ID:", widgetId);
            recaptchaWidgetIdRef.current = widgetId; // Store widget ID
            resolve(verifier);
            }).catch((error) => {
            console.error("Signup Recaptcha render failed:", error);
            toast({ title: "reCAPTCHA Error", description: "Could not initialize sign up reCAPTCHA. Refresh might help.", variant: "destructive" });
            recaptchaVerifierRef.current?.clear();
            recaptchaVerifierRef.current = null;
            recaptchaWidgetIdRef.current = null;
            reject(error);
            });

        } catch (error) {
            console.error("Error creating/rendering signup RecaptchaVerifier:", error);
            toast({ title: "Setup Error", description: "Could not initialize sign up system. Please refresh.", variant: "destructive" });
            reject(error);
        }
  };

   const handlePhoneSignUp = async (values: SignUpFormValues) => {
    if (!authInstance || !firestore) {
        toast({ title: "Error", description: "Authentication or database service not ready.", variant: "destructive" });
        return;
    }
    setLoading(true);
    const displayName = `${values.firstName} ${values.lastName}`;

    try {
        if (!otpSent) {
            // --- Send OTP Phase ---
            const appVerifier = await setupRecaptcha(); // Setup/get reCAPTCHA
            if (!appVerifier) {
                 console.error("reCAPTCHA setup failed, cannot send OTP for signup.");
                 setLoading(false);
                 return;
            }

             console.log("Using appVerifier for signup:", appVerifier);
             console.log("Attempting to send OTP for signup to:", values.phone);

             const confirmationResult = await signInWithPhoneNumber(authInstance, values.phone!, appVerifier);

             window.signUpConfirmationResult = confirmationResult;
             setOtpSent(true);
             form.reset({...values, otp: ''}); // Clear OTP field after sending
             toast({ title: 'OTP Sent', description: `Verification code sent to ${values.phone}` });
             console.log("Signup OTP sent, confirmation result stored.");
        } else {
            // --- Verify OTP Phase ---
             if (!values.otp || values.otp.length !== 6) {
                form.setError("otp", { type: "manual", message: "OTP must be 6 digits." });
                 throw new Error("OTP must be 6 digits.");
             }
             if (!window.signUpConfirmationResult) {
                toast({ title: 'Verification Error', description: 'Confirmation session expired or invalid. Please request OTP again.', variant: 'destructive' });
                setOtpSent(false);
                recaptchaVerifierRef.current?.clear();
                recaptchaVerifierRef.current = null;
                recaptchaWidgetIdRef.current = null;
                throw new Error("Confirmation session expired or invalid.");
             }
             console.log("Attempting to confirm signup OTP:", values.otp);
             const userCredential = await window.signUpConfirmationResult.confirm(values.otp);

             if (userCredential.user) {
                 console.log("Phone user confirmed/created:", userCredential.user.uid);

                 // Always update profile name, and create Firestore doc
                 // The check inside handleUserCreation handles both new/existing logic
                 await handleUserCreation(userCredential.user, displayName, values.phone);

                 toast({ title: 'Sign Up Successful', description: 'Please complete your profile.' });
                 router.push('/complete-profile'); // Redirect new users to complete profile

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
                // Explicitly reset the reCAPTCHA widget using its ID if available
                if (recaptchaWidgetIdRef.current !== null && window.grecaptcha) {
                     window.grecaptcha.reset(recaptchaWidgetIdRef.current);
                     console.log("Explicitly reset signup reCAPTCHA widget ID:", recaptchaWidgetIdRef.current);
                } else {
                     recaptchaVerifierRef.current.clear();
                }
            } catch (clearError) {
                console.error("Error clearing/resetting signup reCAPTCHA:", clearError);
            } finally {
                recaptchaVerifierRef.current = null;
                recaptchaWidgetIdRef.current = null;
            }
         }

         const title = otpSent ? 'OTP Verification Failed' : 'Failed to Send OTP';
         let description = `Error: ${error.message || 'Unknown error.'}`;

        // Handle specific Firebase Auth errors for better user feedback
         if (error.code === 'auth/captcha-check-failed' || error.message?.includes('captcha-check-failed') || error.message?.includes('auth/invalid-recaptcha-token')) {
            description = 'reCAPTCHA verification failed. Please try sending the OTP again.';
            setOtpSent(false);
             recaptchaVerifierRef.current = null; // Ensure verifier is recreated
             recaptchaWidgetIdRef.current = null;
        } else if (error.code === 'auth/invalid-phone-number') {
             description = "Invalid phone number format. Please use the format +91XXXXXXXXXX.";
             setOtpSent(false);
             form.setValue('phone', '');
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
             recaptchaVerifierRef.current = null; // Ensure verifier is recreated
             recaptchaWidgetIdRef.current = null;
         }
    } finally {
        setLoading(false);
    }
  };

    const handleGoogleSignUp = async () => {
        if (!authInstance) {
            toast({ title: "Error", description: "Authentication service not ready.", variant: "destructive" });
            return;
        }
        setLoading(true);
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(authInstance, provider);
            const user = result.user;
            console.log("Google Sign-Up/Login Successful:", user.uid);

            // Create/update user profile in Firestore
            await handleUserCreation(user, user.displayName || 'Unnamed User');

            toast({ title: "Sign Up Successful", description: "Please complete your profile." });
            router.push('/complete-profile'); // Always redirect Google sign-ups to complete profile for now

        } catch (error: any) {
            console.error("Google Sign-Up Error:", error);
            toast({
                title: "Google Sign-Up Failed",
                description: error.message || "Could not sign up with Google.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    // Handles Firestore user document creation/update for all sign-up methods
    const handleUserCreation = async (user: any, name: string, phone: string | null = null) => {
        if (!user || !firestore) return;

        const userDocRef = doc(firestore, "users", user.uid);
        try {
            const docSnap = await getDoc(userDocRef);
            if (!docSnap.exists()) {
                // Only create the document if it truly doesn't exist
                await setDoc(userDocRef, {
                    uid: user.uid,
                    name: name,
                    email: user.email || null, // Get email from Google auth if available
                    phone: phone || user.phoneNumber || null, // Get phone from Phone auth or Google if linked
                    createdAt: new Date(),
                    isProfileComplete: false // Always false on initial creation
                }, { merge: false }); // Use merge: false to ensure it's a creation
                 console.log("Firestore document created for new user:", user.uid);
            } else {
                // If doc exists, ensure name is updated (e.g., if user logged in via phone first then Google)
                if (docSnap.data()?.name !== name) {
                    await updateProfile(user, { displayName: name }); // Update Auth profile
                    await setDoc(userDocRef, { name: name }, { merge: true }); // Update Firestore name
                    console.log("Updated display name for existing user:", user.uid);
                }
                 console.log("User document already exists:", user.uid);
            }
        } catch (error) {
            console.error("Error creating/updating Firestore user document:", error);
            toast({ title: "Profile Error", description: "Could not save initial profile data.", variant: "destructive" });
            // Decide how to handle this - maybe still redirect?
        }
    };

    const handleEmailOtpSignUp = async () => {
         // TODO: Implement Email OTP/Link Sign-Up logic
         // This would involve:
         // 1. Collecting the user's email address.
         // 2. Calling `sendSignInLinkToEmail` or a custom OTP function.
         // 3. Handling the link/OTP verification on a separate page or logic branch.
         toast({ title: "Coming Soon", description: "Email Sign-Up is under development.", variant: "default" });
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
          <CardTitle className="text-xl">Sign Up</CardTitle>
          <CardDescription>Create your account using one of the methods below.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
           {/* Google Sign-Up Button */}
           <Button variant="outline" className="w-full" onClick={handleGoogleSignUp} disabled={loading}>
                <FcGoogle className="mr-2 h-4 w-4" />
                Sign Up with Google
            </Button>

            {/* Email OTP/Link Button (Placeholder) */}
            <Button variant="outline" className="w-full" onClick={handleEmailOtpSignUp} disabled={true} >
                {/* <Mail className="mr-2 h-4 w-4" /> */} {/* Add Mail icon if desired */}
                Sign Up with Email (Coming Soon)
            </Button>

             <Separator />

            {/* Phone Sign Up Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handlePhoneSignUp)} className="grid gap-4">
               <CardDescription className="text-center">Or sign up with phone</CardDescription>
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
                        window.signUpConfirmationResult = undefined;
                        recaptchaVerifierRef.current?.clear();
                        recaptchaVerifierRef.current = null;
                        recaptchaWidgetIdRef.current = null;
                    }} className="text-sm" type="button" disabled={loading}>
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
