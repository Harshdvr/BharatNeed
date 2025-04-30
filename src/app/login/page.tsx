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
import { useState, useEffect, useRef } from 'react'; // Import useRef
import { ensureAuthInitialized, firestore } from '@/lib/firebase/clientApp'; // Import the helper and firestore
import {
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
  Auth, // Import Auth type
  getAuth, // Import getAuth if not already imported implicitly by ensureAuthInitialized
  GoogleAuthProvider, // Import GoogleAuthProvider
  signInWithPopup, // Import signInWithPopup
  getAdditionalUserInfo, // Import getAdditionalUserInfo
  updateProfile, // Import updateProfile
} from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/loading-spinner';
import { doc, setDoc, getDoc } from "firebase/firestore"; // Import Firestore functions
import { Separator } from '@/components/ui/separator'; // Import Separator
import { FcGoogle } from 'react-icons/fc'; // Using react-icons/fc for Google logo


// Only phone schema is needed now for the form itself
const phoneSchema = z.object({
    phone: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Invalid phone number format (e.g., +919876543210)'),
    otp: z.string().optional(), // OTP is optional initially, required later
}).refine(data => !data.otp || data.otp.length === 6, {
    message: "OTP must be 6 digits",
    path: ["otp"], // specific path for the error
});


type LoginFormValues = z.infer<typeof phoneSchema>;

// Use global window object for reCAPTCHA instances for simplicity
declare global {
    interface Window {
        grecaptcha?: any; // For potential direct reset access
        loginConfirmationResult?: ConfirmationResult;
        loginRecaptchaVerifier?: RecaptchaVerifier; // Add specific verifier for login
    }
}


export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const recaptchaContainerId = "recaptcha-container-login"; // Define ID
  const [authInstance, setAuthInstance] = useState<Auth | null>(null);

  // Use refs to manage Firebase objects safely within the component lifecycle
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const recaptchaWidgetIdRef = useRef<number | null>(null); // Store widget ID if needed


  // Ensure Firebase Auth is initialized on the client
  useEffect(() => {
    try {
        const auth = ensureAuthInitialized();
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

  // Ensure reCAPTCHA cleanup when component unmounts
  useEffect(() => {
    return () => {
        console.log("LoginPage cleanup: Clearing reCAPTCHA verifier if exists.");
        // Use the ref for cleanup
        recaptchaVerifierRef.current?.clear();
        recaptchaVerifierRef.current = null;
        recaptchaWidgetIdRef.current = null; // Clear widget ID ref
        window.loginConfirmationResult = undefined; // Clear window object too
        window.loginRecaptchaVerifier?.clear(); // Clear specific login verifier
        window.loginRecaptchaVerifier = undefined;
    };
  }, []); // Only run on unmount


  const form = useForm<LoginFormValues>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '', otp: '' },
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
        toast({ title: "UI Error", description: "Login UI failed to load correctly. Please refresh.", variant: "destructive" });
        return reject(new Error("Recaptcha container not found"));
      }

      // Use ref to manage the verifier instance
      if (recaptchaVerifierRef.current) {
        console.log("Using existing reCAPTCHA verifier instance via ref for login.");
        // Optionally re-render or check status, but often reusing is fine if not expired
         recaptchaVerifierRef.current.render().then((widgetId) => {
             recaptchaWidgetIdRef.current = widgetId;
             resolve(recaptchaVerifierRef.current);
         }).catch((error) => {
             console.error("Error re-rendering existing reCAPTCHA:", error);
             recaptchaVerifierRef.current?.clear();
             recaptchaVerifierRef.current = null;
             recaptchaWidgetIdRef.current = null;
             // Proceed to create a new one
             createNewVerifier(resolve, reject);
         });
      } else {
        console.log("Creating new RecaptchaVerifier instance for login.");
        createNewVerifier(resolve, reject);
      }
    });
  };

  const createNewVerifier = (resolve: (verifier: RecaptchaVerifier) => void, reject: (reason?: any) => void) => {
       if (!authInstance) {
         return reject(new Error("Auth not ready during verifier creation"));
       }
        try {
            const verifier = new RecaptchaVerifier(authInstance, recaptchaContainerId, {
                'size': 'invisible',
                'callback': (response: any) => {
                    console.log("reCAPTCHA challenge solved (callback). Response:", response);
                },
                'expired-callback': () => {
                    console.error("reCAPTCHA challenge expired (expired-callback).");
                    toast({ title: "reCAPTCHA Expired", description: "Please try sending the OTP again.", variant: "destructive" });
                    recaptchaVerifierRef.current?.clear();
                    recaptchaVerifierRef.current = null;
                    recaptchaWidgetIdRef.current = null;
                    setOtpSent(false); // Allow user to retry
                    reject(new Error("reCAPTCHA expired"));
                },
                'error-callback': (error: any) => {
                    console.error("reCAPTCHA error (error-callback):", error);
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
                console.log("reCAPTCHA rendered successfully. Widget ID:", widgetId);
                recaptchaWidgetIdRef.current = widgetId; // Store widget ID
                resolve(verifier); // Resolve with the verifier instance
            }).catch((error) => {
                console.error("Recaptcha render failed:", error);
                toast({ title: "reCAPTCHA Error", description: "Could not initialize reCAPTCHA. Refresh might help.", variant: "destructive" });
                recaptchaVerifierRef.current?.clear(); // Cleanup on render fail
                recaptchaVerifierRef.current = null;
                recaptchaWidgetIdRef.current = null;
                reject(error);
            });
        } catch (error) {
            console.error("Error creating RecaptchaVerifier:", error);
            toast({ title: "Setup Error", description: "Could not initialize login system. Please refresh.", variant: "destructive" });
            reject(error);
        }
  };


  const handlePhoneLogin = async (values: LoginFormValues) => {
    if (!authInstance) {
        toast({ title: "Error", description: "Authentication service not ready.", variant: "destructive" });
        return;
    }
    setLoading(true);

     try {
        if (!otpSent) {
            // --- Send OTP Phase ---
            const appVerifier = await setupRecaptcha(); // Setup/get reCAPTCHA
            if (!appVerifier) {
                 console.error("reCAPTCHA setup failed, cannot send OTP.");
                 setLoading(false);
                 return;
            }

            console.log("Using appVerifier:", appVerifier);
            console.log("Attempting to send OTP to:", values.phone);

            // Ensure reCAPTCHA is rendered and ready before signInWithPhoneNumber
            await appVerifier.render(); // Re-render might be necessary if reused or reset

            const confirmationResult = await signInWithPhoneNumber(authInstance, values.phone!, appVerifier);

            window.loginConfirmationResult = confirmationResult; // Store globally for simplicity
            setOtpSent(true);
            form.reset({...values, otp: ''}); // Clear OTP field after sending
            toast({ title: 'OTP Sent', description: `Verification code sent to ${values.phone}` });
            console.log("OTP sent successfully. Confirmation result stored.");
        } else {
            // --- Verify OTP Phase ---
            if (!values.otp || values.otp.length !== 6) {
                form.setError("otp", { type: "manual", message: "OTP must be 6 digits." });
                throw new Error("OTP must be 6 digits.");
            }
            if (!window.loginConfirmationResult) {
                toast({ title: 'Verification Error', description: 'Confirmation session expired or invalid. Please request OTP again.', variant: 'destructive' });
                setOtpSent(false);
                recaptchaVerifierRef.current?.clear();
                recaptchaVerifierRef.current = null;
                recaptchaWidgetIdRef.current = null;
                throw new Error("Confirmation session expired or invalid.");
            }

             console.log("Attempting to confirm OTP:", values.otp);
             const userCredential = await window.loginConfirmationResult.confirm(values.otp);
             console.log('User logged in with phone:', userCredential.user.uid);
             toast({ title: 'Login Successful', description: 'Welcome back!' });

             // Check Firestore profile status after login
             await checkProfileAndRedirect(userCredential.user);

             // Cleanup on success
             window.loginConfirmationResult = undefined;
             recaptchaVerifierRef.current?.clear();
             recaptchaVerifierRef.current = null;
             recaptchaWidgetIdRef.current = null;
             // router.push('/'); // Redirect is handled by checkProfileAndRedirect
        }
    } catch (error: any) {
        console.error(`Phone login error (${otpSent ? 'Verify OTP' : 'Send OTP'}):`, error);
        console.error('Error Code:', error.code);
        console.error('Error Message:', error.message);

        // Reset reCAPTCHA on specific errors or when starting over
        if (!otpSent || error.code === 'auth/captcha-check-failed' || error.message?.includes('captcha-check-failed') || error.code === 'auth/invalid-recaptcha-token') {
            console.warn("Resetting reCAPTCHA due to error or state change.");
             try {
                 if (recaptchaWidgetIdRef.current !== null && window.grecaptcha) {
                    window.grecaptcha.reset(recaptchaWidgetIdRef.current);
                    console.log("Explicitly reset reCAPTCHA widget ID:", recaptchaWidgetIdRef.current);
                 } else {
                    recaptchaVerifierRef.current?.clear();
                 }
             } catch (resetError) {
                console.error("Error clearing/resetting reCAPTCHA:", resetError);
             } finally {
                 recaptchaVerifierRef.current = null;
                 recaptchaWidgetIdRef.current = null;
                 // Force re-setup on next attempt if it was a captcha error
                 if (error.code === 'auth/captcha-check-failed' || error.message?.includes('captcha-check-failed') || error.code === 'auth/invalid-recaptcha-token') {
                    setOtpSent(false);
                 }
             }
        }


        const title = otpSent ? 'OTP Verification Failed' : 'Failed to Send OTP';
        let description = `Error: ${error.message || 'Unknown error.'}`;

         if (error.code === 'auth/captcha-check-failed' || error.message?.includes('captcha-check-failed') || error.code === 'auth/invalid-recaptcha-token' || error.code === 'auth/network-request-failed' && error.message.includes('recaptcha')) {
            description = 'reCAPTCHA verification failed. Please try sending the OTP again.';
            setOtpSent(false); // Force user to restart the process
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
        } else if (error.code === 'auth/unverified-email') {
              description = 'Your email is not verified. Please check your inbox or use another login method.';
              setOtpSent(false); // Allow trying another method
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

    const handleGoogleSignIn = async () => {
        if (!authInstance) {
            toast({ title: "Error", description: "Authentication service not ready.", variant: "destructive" });
            return;
        }
        setLoading(true);
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(authInstance, provider);
            const user = result.user;
            console.log("Google Sign-In Successful:", user.uid);
            toast({ title: "Login Successful", description: "Welcome!" });

            // Check if user exists in Firestore and if profile is complete
            await checkProfileAndRedirect(user);

        } catch (error: any) {
            console.error("Google Sign-In Error:", error);
            toast({
                title: "Google Sign-In Failed",
                description: error.message || "Could not sign in with Google.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    // Helper function to check profile completion and redirect
    const checkProfileAndRedirect = async (user: any) => {
         if (!user || !firestore) return; // Should not happen if called after successful login

         try {
            const userDocRef = doc(firestore, "users", user.uid);
            const docSnap = await getDoc(userDocRef);
            const additionalUserInfo = getAdditionalUserInfo({user: user} as any); // Hacky way to satisfy type, improve if possible
            const isNewUser = additionalUserInfo?.isNewUser ?? false; // Assume existing if info missing after login

             // If it's a new user (via Google or potentially Phone if doc didn't exist) or profile is incomplete
            if (isNewUser || !docSnap.exists() || !docSnap.data()?.isProfileComplete) {
                 // Create/Update Firestore doc if needed (especially for new Google users)
                 if (isNewUser || !docSnap.exists()) {
                      await setDoc(userDocRef, {
                         uid: user.uid,
                         name: user.displayName || 'Unnamed User',
                         email: user.email || null,
                         phone: user.phoneNumber || null,
                         createdAt: new Date(),
                         isProfileComplete: false, // Mark as incomplete
                         // Add other default fields if necessary
                     }, { merge: true }); // Merge to avoid overwriting existing data if any
                 }
                 toast({ title: isNewUser ? 'Sign Up Successful' : 'Login Successful', description: 'Please complete your profile.' });
                 router.push('/complete-profile');
            } else {
                 // Existing user with complete profile
                 router.push('/'); // Redirect to home
            }
         } catch (firestoreError) {
             console.error("Error checking/updating user profile in Firestore:", firestoreError);
             toast({ title: "Profile Check Failed", description: "Could not verify profile status. Redirecting home.", variant: "destructive" });
             router.push('/'); // Fallback redirect to home
         }
    };

     const handleEmailOtpSignIn = async () => {
         // TODO: Implement Email OTP/Link Sign-In logic
         // This would involve:
         // 1. Collecting the user's email address.
         // 2. Calling `sendSignInLinkToEmail` or a custom OTP function.
         // 3. Handling the link/OTP verification on a separate page or logic branch.
         toast({ title: "Coming Soon", description: "Email Sign-In is under development.", variant: "default" });
     };


    return (
    <>
    <div className="flex items-center justify-center py-12 relative">
        {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-50">
                <LoadingSpinner />
            </div>
        )}
         {/* Container for invisible reCAPTCHA */}
        <div id={recaptchaContainerId} className="absolute -top-96 -left-96"></div>


      <Card className="mx-auto max-w-sm w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>Choose your login method below.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
           {/* Google Sign-In Button */}
            <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={loading}>
                <FcGoogle className="mr-2 h-4 w-4" /> {/* Use react-icons Google logo */}
                Login with Google
            </Button>

            {/* Email OTP/Link Button (Placeholder) */}
            <Button variant="outline" className="w-full" onClick={handleEmailOtpSignIn} disabled={true} >
                {/* <Mail className="mr-2 h-4 w-4" /> */} {/* Add Mail icon if desired */}
                Login with Email (Coming Soon)
            </Button>


            <Separator /> {/* Separator */}

             {/* Phone Login Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handlePhoneLogin)} className="grid gap-4">
                 <CardDescription className="text-center">Or login with phone</CardDescription>
                {/* Phone Fields */}
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
                        {loading ? 'Processing...' : (otpSent ? 'Verify OTP & Login' : 'Send OTP')}
                    </Button>
                    {otpSent && (
                    <Button variant="link" size="sm" onClick={() => {
                        setOtpSent(false);
                        form.reset({...form.getValues(), otp: ''}); // Reset OTP field
                        window.loginConfirmationResult = undefined; // Clear confirmation ref/state
                        recaptchaVerifierRef.current?.clear(); // Clear verifier ref
                        recaptchaVerifierRef.current = null;
                        recaptchaWidgetIdRef.current = null;
                    }} className="text-sm" type="button" disabled={loading}>
                        Change Number or Resend OTP
                    </Button>
                    )}
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="underline text-primary hover:text-primary/80">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
    </>
  );
}
