
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form'; // Import Controller
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
  sendSignInLinkToEmail, // Import Email Link functions
  isSignInWithEmailLink, // To check if the link is a sign-in link
  signInWithEmailLink // To complete the sign-in
} from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/loading-spinner';
import { doc, setDoc, getDoc } from "firebase/firestore"; // Import Firestore functions
import { Separator } from '@/components/ui/separator'; // Import Separator
import { FcGoogle } from 'react-icons/fc'; // Using react-icons/fc for Google logo
import { Mail } from 'lucide-react'; // Import Mail icon

type LoginMethod = 'phone' | 'email' | 'google';

// Phone schema is needed now for the form itself
const phoneSchema = z.object({
    phone: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Invalid phone number format (e.g., +919876543210)'),
    otp: z.string().optional(), // OTP is optional initially, required later
}).refine(data => !data.otp || data.otp.length === 6, {
    message: "OTP must be 6 digits",
    path: ["otp"], // specific path for the error
});

// Email login schema
const emailSchema = z.object({
    email: z.string().email('Invalid email address'),
});

// Combined schema for validation (adjust if needed)
const loginSchema = z.union([phoneSchema, emailSchema]);

// Type for form values - Adjust based on active method
type LoginFormValues = z.infer<typeof phoneSchema> | z.infer<typeof emailSchema>;

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
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('phone'); // Default to phone
  const [otpSent, setOtpSent] = useState(false); // Only for phone
  const recaptchaContainerId = "recaptcha-container-login";
  const [authInstance, setAuthInstance] = useState<Auth | null>(null);

  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const recaptchaWidgetIdRef = useRef<number | null>(null);

  useEffect(() => {
    try {
        const auth = ensureAuthInitialized();
        setAuthInstance(auth);

        // Check if the URL is an email sign-in link
        if (auth && isSignInWithEmailLink(auth, window.location.href)) {
            handleCompleteEmailSignIn(auth);
        }

    } catch (error: any) {
        console.error("Auth initialization failed:", error);
        toast({
            title: "Initialization Error",
            description: "Could not initialize authentication. Please try refreshing.",
            variant: "destructive",
        });
    }
  }, [toast]); // Only run on mount

  // Separate useEffect for cleanup
  useEffect(() => {
    return () => {
        console.log("LoginPage cleanup: Attempting to clear reCAPTCHA verifier if exists.");
        // Safely clear using the ref
        if (recaptchaVerifierRef.current) {
            try {
                recaptchaVerifierRef.current.clear();
                console.log("Cleared reCAPTCHA verifier using ref.");
            } catch (e) {
                console.error("Error clearing reCAPTCHA verifier using ref:", e);
            } finally {
                recaptchaVerifierRef.current = null;
                recaptchaWidgetIdRef.current = null;
            }
        }

        // Safely clear the window object property (secondary check)
        if (window.loginRecaptchaVerifier && typeof window.loginRecaptchaVerifier.clear === 'function') {
          try {
             window.loginRecaptchaVerifier.clear();
             console.log("Cleared window.loginRecaptchaVerifier");
          } catch (e) {
             console.error("Error clearing window.loginRecaptchaVerifier:", e);
             // Avoid throwing errors from cleanup
             if (e instanceof Error && e.message.includes('auth/internal-error')) {
                console.warn("Caught Firebase internal error during cleanup, likely already handled or verifier invalid.");
             }
          } finally {
            window.loginRecaptchaVerifier = undefined;
          }
        }

        window.loginConfirmationResult = undefined; // Clear confirmation result
    };
  }, []);


  // Use different schemas based on the selected login method
  const currentSchema = loginMethod === 'phone' ? phoneSchema : emailSchema;

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(currentSchema),
    defaultValues: { phone: '', email: '', otp: '' },
    mode: 'onChange',
  });

  // Reset form validation when login method changes
  useEffect(() => {
    form.reset();
    setOtpSent(false); // Reset OTP state when method changes
  }, [loginMethod, form]);


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
        toast({ title: "UI Error", description: "Login UI failed to load correctly. Please refresh.", variant: "destructive" });
        return reject(new Error("Recaptcha container not found"));
      }

      // Clean up previous verifier instance if exists in ref
      if (recaptchaVerifierRef.current) {
         console.log("Clearing previous reCAPTCHA verifier instance from ref.");
         try {
             recaptchaVerifierRef.current.clear();
         } catch (e) {
             console.warn("Error clearing previous ref verifier:", e);
         } finally {
             recaptchaVerifierRef.current = null;
             recaptchaWidgetIdRef.current = null;
         }
      }
       // Also clear window property if exists
        if (window.loginRecaptchaVerifier) {
            try {
                window.loginRecaptchaVerifier.clear();
                console.log("Cleared previous window.loginRecaptchaVerifier.");
            } catch (e) {
                console.error("Error clearing previous window.loginRecaptchaVerifier:", e);
            } finally {
                window.loginRecaptchaVerifier = undefined;
            }
        }

        console.log("Creating new RecaptchaVerifier instance for login.");
        createNewVerifier(resolve, reject);
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
                    toast({ title: "reCAPTCHA Expired", description: "Please try sending the OTP/Link again.", variant: "destructive" });
                    if (recaptchaVerifierRef.current) {
                        try { recaptchaVerifierRef.current.clear(); } catch (e) { console.warn("Error clearing expired ref verifier:", e); }
                        recaptchaVerifierRef.current = null;
                        recaptchaWidgetIdRef.current = null;
                    }
                    if (window.loginRecaptchaVerifier) {
                         try { window.loginRecaptchaVerifier.clear(); } catch (e) { console.warn("Error clearing expired window verifier:", e); }
                         window.loginRecaptchaVerifier = undefined;
                    }
                    setOtpSent(false);
                    reject(new Error("reCAPTCHA expired"));
                },
                'error-callback': (error: any) => {
                    console.error("reCAPTCHA error (error-callback):", error);
                    toast({ title: "reCAPTCHA Error", description: `Verification failed. ${error?.message || 'Please try again.'}`, variant: "destructive"});
                     if (recaptchaVerifierRef.current) {
                        try { recaptchaVerifierRef.current.clear(); } catch (e) { console.warn("Error clearing error ref verifier:", e); }
                        recaptchaVerifierRef.current = null;
                        recaptchaWidgetIdRef.current = null;
                    }
                    if (window.loginRecaptchaVerifier) {
                         try { window.loginRecaptchaVerifier.clear(); } catch (e) { console.warn("Error clearing error window verifier:", e); }
                         window.loginRecaptchaVerifier = undefined;
                    }
                    setOtpSent(false);
                    reject(new Error("reCAPTCHA verification error"));
                }
            });

            recaptchaVerifierRef.current = verifier; // Store in ref
            window.loginRecaptchaVerifier = verifier; // Also store in window for compatibility

            verifier.render().then((widgetId) => {
                console.log("reCAPTCHA rendered successfully. Widget ID:", widgetId);
                recaptchaWidgetIdRef.current = widgetId;
                resolve(verifier);
            }).catch((error) => {
                console.error("Recaptcha render failed:", error);
                toast({ title: "reCAPTCHA Error", description: "Could not initialize reCAPTCHA. Refresh might help.", variant: "destructive" });
                if (recaptchaVerifierRef.current) {
                    try { recaptchaVerifierRef.current.clear(); } catch(e) { console.warn("Error clearing failed-render ref verifier:", e); }
                    recaptchaVerifierRef.current = null;
                    recaptchaWidgetIdRef.current = null;
                }
                window.loginRecaptchaVerifier = undefined;
                reject(error);
            });
        } catch (error) {
            console.error("Error creating RecaptchaVerifier:", error);
            toast({ title: "Setup Error", description: "Could not initialize login system. Please refresh.", variant: "destructive" });
            reject(error);
        }
  };

  // Combined submit handler
  const handleLogin = async (values: LoginFormValues) => {
    setLoading(true);
    if (loginMethod === 'phone' && 'phone' in values) {
      await handlePhoneLogin(values);
    } else if (loginMethod === 'email' && 'email' in values) {
      await handleEmailLogin(values);
    } else {
      console.error("Invalid login method or form values");
      toast({ title: "Error", description: "Invalid login method selected.", variant: "destructive" });
      setLoading(false);
    }
  };

  const handlePhoneLogin = async (values: Extract<LoginFormValues, { phone: string }>) => {
    if (!authInstance) {
        toast({ title: "Error", description: "Authentication service not ready.", variant: "destructive" });
        setLoading(false);
        return;
    }

     try {
        if (!otpSent) {
            // --- Send OTP Phase ---
            const appVerifier = await setupRecaptcha(); // Use the setup function which now handles cleanup
            if (!appVerifier) {
                 console.error("reCAPTCHA setup failed, cannot send OTP.");
                 setLoading(false);
                 return;
            }

            console.log("Using appVerifier:", appVerifier);
            console.log("Attempting to send OTP to:", values.phone);

            // signInWithPhoneNumber uses the rendered reCAPTCHA implicitly
            const confirmationResult = await signInWithPhoneNumber(authInstance, values.phone!, appVerifier);

            window.loginConfirmationResult = confirmationResult; // Store globally for simplicity
            setOtpSent(true);
            // form.reset({...values, otp: ''}); // Keep phone number in form, reset OTP
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
                // No need to clear ref here, setupRecaptcha will handle it on next attempt
                throw new Error("Confirmation session expired or invalid.");
            }

             console.log("Attempting to confirm OTP:", values.otp);
             const userCredential = await window.loginConfirmationResult.confirm(values.otp);
             console.log('User logged in with phone:', userCredential.user.uid);
             toast({ title: 'Login Successful', description: 'Welcome back!' });

             await checkProfileAndRedirect(userCredential.user);

             // Cleanup global state on success
             window.loginConfirmationResult = undefined;
             // No need to clear ref here, useEffect cleanup will handle it, or next setupRecaptcha
        }
    } catch (error: any) {
        console.error(`Phone login error (${otpSent ? 'Verify OTP' : 'Send OTP'}):`, error);
        console.error('Error Code:', error.code);
        console.error('Error Message:', error.message);

         // Attempt reset on error if verifier exists in ref (setupRecaptcha should handle this on retry anyway)
         // It's generally safer to let setupRecaptcha manage the cleanup and recreation.
         if (recaptchaVerifierRef.current) {
            try {
                recaptchaVerifierRef.current.clear();
                console.log("Cleared verifier ref on error.");
            } catch(e) {
                console.warn("Error clearing verifier ref on error:", e);
            } finally {
                recaptchaVerifierRef.current = null;
                recaptchaWidgetIdRef.current = null;
            }
         }
         if (window.loginRecaptchaVerifier) {
             try {
                 window.loginRecaptchaVerifier.clear();
                 console.log("Cleared window verifier on error.");
             } catch (e) {
                 console.warn("Error clearing window verifier on error:", e);
             } finally {
                 window.loginRecaptchaVerifier = undefined;
             }
         }


        const title = otpSent ? 'OTP Verification Failed' : 'Failed to Send OTP';
        let description = `Error: ${error.message || 'Unknown error.'}`;

         // Specific error handling...
         if (error.code === 'auth/captcha-check-failed' || error.message?.includes('captcha-check-failed') || error.code === 'auth/invalid-recaptcha-token' || (error.code === 'auth/network-request-failed' && error.message.includes('recaptcha')) || error.code === 'auth/internal-error') {
            description = 'reCAPTCHA verification failed or network issue. Please try sending the OTP again.';
            setOtpSent(false);
        } else if (error.code === 'auth/invalid-phone-number') {
            description = "Invalid phone number format. Please use the format +91XXXXXXXXXX.";
             setOtpSent(false);
             // form.setValue('phone', ''); // Don't clear, let user correct it
        } else if (error.code === 'auth/invalid-verification-code') {
            description = 'Invalid OTP entered. Please try again.';
            form.setValue('otp', ''); // Clear OTP field
        } else if (error.code === 'auth/code-expired') {
            description = 'The verification code has expired. Please send a new one.';
            setOtpSent(false);
        } else if (error.code === 'auth/too-many-requests') {
             description = 'Too many attempts. Please try again later.';
             setOtpSent(false); // Allow retry after some time
        } // Add other specific errors

        toast({
            title: title,
            description: description,
            variant: 'destructive',
        });

         if (error.code === 'auth/session-expired' || error.message?.includes('expired')) {
              setOtpSent(false);
         }
    } finally {
        setLoading(false);
    }
  };

  const handleEmailLogin = async (values: Extract<LoginFormValues, { email: string }>) => {
     if (!authInstance) {
        toast({ title: "Error", description: "Authentication service not ready.", variant: "destructive" });
        setLoading(false);
        return;
     }

     const actionCodeSettings = {
        url: `${window.location.origin}/login`, // Redirect back to login page to complete sign-in
        handleCodeInApp: true,
     };

     try {
        await sendSignInLinkToEmail(authInstance, values.email, actionCodeSettings);
        // Save email locally
        window.localStorage.setItem('emailForSignIn', values.email);
        toast({
           title: 'Check your email',
           description: `A sign-in link has been sent to ${values.email}.`,
        });
        form.reset(); // Clear form
     } catch (error: any) {
        console.error('Error sending email link:', error);
        toast({
           title: 'Failed to Send Link',
           description: error.message || 'Could not send sign-in link.',
           variant: 'destructive',
        });
     } finally {
        setLoading(false);
     }
   };

   // Function to complete email sign-in
   const handleCompleteEmailSignIn = async (auth: Auth) => {
      setLoading(true);
      let email = window.localStorage.getItem('emailForSignIn');
      if (!email) {
         // User opened the link on a different device. To prevent session fixation
         // attacks, ask the user to provide the email again. For example:
         // This is a basic prompt, consider a more user-friendly modal/input
         email = window.prompt('Please provide your email for confirmation');
         if (!email) {
             toast({ title: 'Sign In Failed', description: 'Email is required to complete sign-in.', variant: 'destructive' });
             setLoading(false);
             return;
         }
      }

      try {
         const userCredential = await signInWithEmailLink(auth, email, window.location.href);
         // Clear email from storage.
         window.localStorage.removeItem('emailForSignIn');
         console.log('User signed in with email link:', userCredential.user.uid);
         toast({ title: 'Login Successful', description: 'Welcome!' });

         // Check if this is a new user and redirect to profile completion if needed
         await checkProfileAndRedirect(userCredential.user);

         // Remove the sign-in link parameters from the URL for cleaner UX
         if (window.history.replaceState) {
            window.history.replaceState({}, document.title, window.location.pathname);
         }

      } catch (error: any) {
         console.error('Error signing in with email link:', error);
         toast({
            title: 'Sign In Failed',
            description: error.message || 'Could not sign in with email link.',
            variant: 'destructive',
         });
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

            await checkProfileAndRedirect(user);

        } catch (error: any) {
            console.error("Google Sign-In Error:", error);
            // Handle popup closed error specifically
            if (error.code === 'auth/popup-closed-by-user') {
                 toast({ title: "Sign-In Cancelled", description: "Google Sign-In window was closed.", variant: "default" });
            } else {
                toast({
                    title: "Google Sign-In Failed",
                    description: error.message || "Could not sign in with Google.",
                    variant: "destructive",
                });
            }
        } finally {
            setLoading(false);
        }
    };

    // Helper function to check profile completion and redirect
    const checkProfileAndRedirect = async (user: any) => {
         if (!user || !firestore) return;

         try {
            const userDocRef = doc(firestore, "users", user.uid);
            const docSnap = await getDoc(userDocRef);
             // Try to get isNewUser info - might not always be available
             let isNewUser = false;
             try {
                 // Cast user to the expected type if necessary, or handle potential mismatch
                 const additionalUserInfo = getAdditionalUserInfo({user: user} as any);
                 isNewUser = additionalUserInfo?.isNewUser ?? false;
             } catch (infoError) {
                 console.warn("Could not get additional user info:", infoError);
                 // Assume existing if info cannot be retrieved, check Firestore doc existence
                 isNewUser = !docSnap.exists(); // Fallback: Consider new if doc doesn't exist
             }


             // If Firestore doc doesn't exist, or profile is explicitly incomplete
            if (!docSnap.exists() || !docSnap.data()?.isProfileComplete) {
                 // Ensure Firestore doc exists (especially for new Google/Email users)
                 // This covers the case where a user logs in via Google/Email first
                 if (!docSnap.exists()) {
                      await setDoc(userDocRef, {
                         uid: user.uid,
                         name: user.displayName || 'Unnamed User', // Use auth name as default
                         email: user.email || null,
                         phone: user.phoneNumber || null,
                         createdAt: new Date(),
                         isProfileComplete: false,
                     }, { merge: true }); // Merge to avoid overwriting if created concurrently
                      console.log("Created Firestore doc for new user:", user.uid);
                 } else if (!docSnap.data()?.isProfileComplete && user.displayName && docSnap.data()?.name !== user.displayName) {
                     // If profile exists but is incomplete, update name from Auth provider if different
                     await setDoc(userDocRef, { name: user.displayName }, { merge: true });
                      console.log("Updated name from Auth provider for incomplete profile:", user.uid);
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
             router.push('/'); // Fallback redirect home
         }
    };


    return (
    <>
    <div className="flex items-center justify-center py-12 relative">
        {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-50">
                <LoadingSpinner />
            </div>
        )}
         {/* Container for invisible reCAPTCHA (only for phone) */}
        <div id={recaptchaContainerId} className="absolute -top-96 -left-96"></div>

      <Card className="mx-auto max-w-sm w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>Choose your login method below.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
           {/* Google Sign-In Button */}
            <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={loading}>
                <FcGoogle className="mr-2 h-4 w-4" />
                Login with Google
            </Button>

             {/* Method Selection Buttons */}
            <div className="flex gap-2">
                <Button
                    variant={loginMethod === 'email' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setLoginMethod('email')}
                    disabled={loading}
                >
                    <Mail className="mr-2 h-4 w-4" /> Email Link
                </Button>
                 <Button
                    variant={loginMethod === 'phone' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setLoginMethod('phone')}
                    disabled={loading}
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    Phone OTP
                </Button>
            </div>

            <Separator />

            {/* Dynamic Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleLogin)} className="grid gap-4">
                 <CardDescription className="text-center">
                    {loginMethod === 'email' ? 'Enter your email to receive a login link' : 'Or login with phone'}
                 </CardDescription>

                {/* Phone Fields */}
                {loginMethod === 'phone' && (
                    <>
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
                                form.reset({...form.getValues(), otp: ''}); // Keep phone number, reset OTP
                                window.loginConfirmationResult = undefined;
                                // Safely clear reCAPTCHA if needed
                                if (recaptchaVerifierRef.current) {
                                    try { recaptchaVerifierRef.current.clear(); } catch(e) { console.warn("Error clearing verifier on change/resend:", e); }
                                    recaptchaVerifierRef.current = null;
                                    recaptchaWidgetIdRef.current = null;
                                }
                                if (window.loginRecaptchaVerifier) {
                                    try { window.loginRecaptchaVerifier.clear(); } catch(e) { console.warn("Error clearing window verifier on change/resend:", e); }
                                    window.loginRecaptchaVerifier = undefined;
                                }
                            }} className="text-sm" type="button" disabled={loading}>
                                Change Number or Resend OTP
                            </Button>
                        )}
                    </>
                )}

                {/* Email Fields */}
                {loginMethod === 'email' && (
                     <>
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email Address</FormLabel>
                                <FormControl>
                                <Input type="email" placeholder="you@example.com" {...field} disabled={loading} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full" disabled={loading}>
                             {loading ? 'Sending Link...' : 'Send Login Link'}
                        </Button>
                    </>
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
