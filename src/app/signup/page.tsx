
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
import { useState, useEffect, useRef } from 'react';
import { auth, firestore } from '@/lib/firebase/clientApp'; // Import auth, firestore
import {
  signInWithPhoneNumber,
  RecaptchaVerifier,
  updateProfile,
  ConfirmationResult,
  Auth,
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  sendSignInLinkToEmail, // Import Email Link functions
  getAdditionalUserInfo,
} from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/loading-spinner';
import { doc, setDoc, getDoc } from "firebase/firestore"; // Import Firestore functions
import { Separator } from '@/components/ui/separator';
import { FcGoogle } from 'react-icons/fc';
import { Mail } from 'lucide-react'; // Import Mail icon

// Define sign-up types
type SignUpMethod = 'phone' | 'email' | 'google';

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

// Email signup schema
const emailSchema = commonSchema.extend({
    email: z.string().email('Invalid email address'),
});

// Combined schema for validation based on type (though form structure might vary)
const signUpSchema = z.union([phoneSchema, emailSchema]);

// Type for form values - Adjust based on active method
type SignUpFormValues = z.infer<typeof phoneSchema> | z.infer<typeof emailSchema>;

// Declare window object augmentation for reCAPTCHA
declare global {
    interface Window {
        grecaptcha?: any;
        signUpConfirmationResult?: ConfirmationResult;
        signUpRecaptchaVerifier?: RecaptchaVerifier;
    }
}

export default function SignUpPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [signUpMethod, setSignUpMethod] = useState<SignUpMethod>('phone'); // Default to phone
  const [otpSent, setOtpSent] = useState(false); // Only for phone OTP
  const recaptchaContainerId = "recaptcha-container-signup";
  const [authInstance, setAuthInstance] = useState<Auth | null>(null);

  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const recaptchaWidgetIdRef = useRef<number | null>(null);

  useEffect(() => {
     try {
         // Ensure getAuth() is called correctly. Assuming 'auth' imported is the instance.
         if (auth) {
             setAuthInstance(auth);
         } else {
             throw new Error("Firebase Auth not initialized");
         }
     } catch (error: any) {
         console.error("Auth initialization failed:", error);
         toast({
             title: "Initialization Error",
             description: "Could not initialize authentication. Please try refreshing.",
             variant: "destructive",
         });
     }
   }, [toast]);

  useEffect(() => {
    return () => {
      console.log("SignUpPage cleanup: Attempting to clear reCAPTCHA verifier if exists.");
       // Safely clear using the ref
       if (recaptchaVerifierRef.current) {
           try {
               recaptchaVerifierRef.current.clear();
               console.log("Cleared sign-up reCAPTCHA verifier using ref.");
           } catch (e) {
               console.error("Error clearing sign-up reCAPTCHA verifier using ref:", e);
           } finally {
               recaptchaVerifierRef.current = null;
               recaptchaWidgetIdRef.current = null;
           }
       }

       // Safely clear the window object property
      if (window.signUpRecaptchaVerifier && typeof window.signUpRecaptchaVerifier.clear === 'function') {
          try {
              window.signUpRecaptchaVerifier.clear();
              console.log("Cleared window.signUpRecaptchaVerifier");
          } catch(e) {
               console.error("Error clearing window.signUpRecaptchaVerifier:", e);
               // Avoid throwing errors from cleanup
                if (e instanceof Error && e.message.includes('auth/internal-error')) {
                  console.warn("Caught Firebase internal error during cleanup, likely already handled or verifier invalid.");
                }
          } finally {
            window.signUpRecaptchaVerifier = undefined;
          }
      }
      window.signUpConfirmationResult = undefined; // Clear confirmation result
    };
  }, []);

  // Use different schemas based on the selected sign-up method
  const currentSchema = signUpMethod === 'phone' ? phoneSchema : emailSchema;

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(currentSchema),
    defaultValues: { firstName: '', lastName: '', phone: '', email: '', otp: '' },
    mode: 'onChange',
  });

  // Reset form validation when signup method changes
  useEffect(() => {
    form.reset(); // Reset form values
    // Need to trigger re-validation based on the new schema, zodResolver might need re-initialization or use a key prop on Form
    setOtpSent(false); // Reset OTP state when method changes
  }, [signUpMethod, form]);


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

       // Clean up previous verifier instance if exists in ref
        if (recaptchaVerifierRef.current) {
            console.log("Clearing previous sign-up reCAPTCHA verifier instance from ref.");
             try {
                recaptchaVerifierRef.current.clear();
             } catch (e) {
                console.warn("Error clearing previous sign-up ref verifier:", e);
             } finally {
                recaptchaVerifierRef.current = null;
                recaptchaWidgetIdRef.current = null;
             }
        }
        // Also clear window property if exists
        if (window.signUpRecaptchaVerifier) {
             try {
                 window.signUpRecaptchaVerifier.clear();
                 console.log("Cleared previous window.signUpRecaptchaVerifier.");
             } catch (e) {
                 console.error("Error clearing previous window.signUpRecaptchaVerifier:", e);
             } finally {
                 window.signUpRecaptchaVerifier = undefined;
             }
        }


        console.log("Creating new RecaptchaVerifier instance for signup.");
        createNewVerifier(resolve, reject);
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
                toast({ title: "reCAPTCHA Expired", description: "Please try sending the OTP/Link again.", variant: "destructive" });
                if (recaptchaVerifierRef.current) {
                    try { recaptchaVerifierRef.current.clear(); } catch (e) { console.warn("Error clearing expired sign-up ref verifier:", e); }
                    recaptchaVerifierRef.current = null;
                    recaptchaWidgetIdRef.current = null;
                }
                if (window.signUpRecaptchaVerifier) {
                     try { window.signUpRecaptchaVerifier.clear(); } catch (e) { console.warn("Error clearing expired sign-up window verifier:", e); }
                     window.signUpRecaptchaVerifier = undefined;
                }
                setOtpSent(false); // Reset phone state
                reject(new Error("reCAPTCHA expired"));
            },
            'error-callback': (error: any) => {
                console.error("reCAPTCHA error (error-callback) for signup:", error);
                toast({ title: "reCAPTCHA Error", description: `Verification failed. ${error?.message || 'Please try again.'}`, variant: "destructive"});
                if (recaptchaVerifierRef.current) {
                    try { recaptchaVerifierRef.current.clear(); } catch (e) { console.warn("Error clearing error sign-up ref verifier:", e); }
                    recaptchaVerifierRef.current = null;
                    recaptchaWidgetIdRef.current = null;
                }
                if (window.signUpRecaptchaVerifier) {
                     try { window.signUpRecaptchaVerifier.clear(); } catch (e) { console.warn("Error clearing error sign-up window verifier:", e); }
                     window.signUpRecaptchaVerifier = undefined;
                }
                setOtpSent(false); // Reset phone state
                reject(new Error("reCAPTCHA verification error"));
            }
            });
            recaptchaVerifierRef.current = verifier;
            window.signUpRecaptchaVerifier = verifier; // Keep this for compatibility if needed

            verifier.render().then((widgetId) => {
                console.log("Signup reCAPTCHA rendered successfully. Widget ID:", widgetId);
                recaptchaWidgetIdRef.current = widgetId;
                resolve(verifier);
            }).catch((error) => {
                console.error("Signup Recaptcha render failed:", error);
                toast({ title: "reCAPTCHA Error", description: "Could not initialize sign up reCAPTCHA. Refresh might help.", variant: "destructive" });
                if (recaptchaVerifierRef.current) {
                    try { recaptchaVerifierRef.current.clear(); } catch(e) { console.warn("Error clearing failed-render sign-up ref verifier:", e); }
                    recaptchaVerifierRef.current = null;
                    recaptchaWidgetIdRef.current = null;
                }
                window.signUpRecaptchaVerifier = undefined;
                reject(error);
            });

        } catch (error) {
            console.error("Error creating/rendering signup RecaptchaVerifier:", error);
            toast({ title: "Setup Error", description: "Could not initialize sign up system. Please refresh.", variant: "destructive" });
            reject(error);
        }
  };

   // Combined handler for form submission
   const handleSignUp = async (values: SignUpFormValues) => {
     setLoading(true);
     const displayName = `${values.firstName} ${values.lastName}`;

     if (signUpMethod === 'phone' && 'phone' in values) {
       await handlePhoneSignUp(values, displayName);
     } else if (signUpMethod === 'email' && 'email' in values) {
       await handleEmailSignUp(values, displayName);
     } else {
       console.error("Invalid sign-up method or form values");
       toast({ title: "Error", description: "Invalid sign-up method selected.", variant: "destructive" });
       setLoading(false);
     }
   };


   const handlePhoneSignUp = async (values: Extract<SignUpFormValues, { phone: string }>, displayName: string) => {
    if (!authInstance || !firestore) {
        toast({ title: "Error", description: "Authentication or database service not ready.", variant: "destructive" });
        setLoading(false);
        return;
    }
    let appVerifier: RecaptchaVerifier | null = null; // Declare here

    try {
        if (!otpSent) {
            // --- Send OTP Phase ---
            appVerifier = await setupRecaptcha(); // Assign here
            if (!appVerifier) {
                 console.error("reCAPTCHA setup failed, cannot send OTP for signup.");
                 setLoading(false);
                 return;
            }

             console.log("Using appVerifier for signup:", appVerifier);
             console.log("Attempting to send OTP for signup to:", values.phone);
             // Ensure reCAPTCHA is rendered before calling signInWithPhoneNumber (render() is called in setup)


             const confirmationResult = await signInWithPhoneNumber(authInstance, values.phone!, appVerifier);

             window.signUpConfirmationResult = confirmationResult;
             setOtpSent(true);
            //  form.reset({...values, otp: ''}); // Keep name/phone, reset OTP
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
                 // Clean up verifier if session expires
                if (recaptchaVerifierRef.current) {
                    try { recaptchaVerifierRef.current.clear(); } catch(e) { console.warn("Error clearing verifier ref on session expiry:", e); }
                    recaptchaVerifierRef.current = null;
                    recaptchaWidgetIdRef.current = null;
                }
                if (window.signUpRecaptchaVerifier) {
                     try { window.signUpRecaptchaVerifier.clear(); } catch(e) { console.warn("Error clearing window verifier on session expiry:", e); }
                     window.signUpRecaptchaVerifier = undefined;
                }
                throw new Error("Confirmation session expired or invalid.");
             }
             console.log("Attempting to confirm signup OTP:", values.otp);
             const userCredential = await window.signUpConfirmationResult.confirm(values.otp);

             if (userCredential.user) {
                 console.log("Phone user confirmed/created:", userCredential.user.uid);
                 await handleUserCreation(userCredential.user, displayName, values.phone);
                 // Redirect is handled within handleUserCreation
                 // toast({ title: 'Sign Up Successful', description: 'Please complete your profile.' });
                 // router.push('/complete-profile');

                 // Cleanup global state and verifier on success
                 window.signUpConfirmationResult = undefined;
                if (recaptchaVerifierRef.current) {
                    try { recaptchaVerifierRef.current.clear(); } catch(e) { console.warn("Error clearing verifier ref on success:", e); }
                    recaptchaVerifierRef.current = null;
                    recaptchaWidgetIdRef.current = null;
                }
                if (window.signUpRecaptchaVerifier) {
                     try { window.signUpRecaptchaVerifier.clear(); } catch(e) { console.warn("Error clearing window verifier on success:", e); }
                     window.signUpRecaptchaVerifier = undefined;
                }
             } else {
                throw new Error("User object not found after OTP confirmation.");
             }
        }
    } catch (error: any) {
         console.error(`Phone sign up error (${otpSent ? 'Verify OTP' : 'Send OTP'}):`, error);
         console.error('Error Code:', error.code);
         console.error('Error Message:', error.message);

         // Attempt to reset reCAPTCHA widget if possible
         try {
              // Reset using ref primarily
             if (recaptchaVerifierRef.current) {
                  recaptchaVerifierRef.current.clear();
                  console.log("Cleared signup reCAPTCHA ref due to error.");
                  recaptchaVerifierRef.current = null;
                  recaptchaWidgetIdRef.current = null;
             } else if (window.signUpRecaptchaVerifier) {
                  window.signUpRecaptchaVerifier.clear();
                  console.log("Cleared window signup reCAPTCHA due to error.");
                  window.signUpRecaptchaVerifier = undefined;
             } else if (window.grecaptcha && recaptchaWidgetIdRef.current !== null) {
                window.grecaptcha.reset(recaptchaWidgetIdRef.current);
                console.log("Explicitly reset signup reCAPTCHA widget ID:", recaptchaWidgetIdRef.current);
                 recaptchaWidgetIdRef.current = null; // Reset widget ID ref as well
             }
         } catch (resetError) {
            console.error("Error clearing/resetting signup reCAPTCHA:", resetError);
         }
         // No finally block needed here for refs, handled within try/catch


         const title = otpSent ? 'OTP Verification Failed' : 'Failed to Send OTP';
         let description = `Error: ${error.message || 'Unknown error.'}`;

         // Specific error handling...
          if (error.code === 'auth/captcha-check-failed' || error.message?.includes('captcha-check-failed') || error.code === 'auth/invalid-recaptcha-token' || (error.code === 'auth/network-request-failed' && error.message.includes('recaptcha')) || error.code === 'auth/internal-error') {
            description = 'reCAPTCHA verification failed or network issue. Please try again.';
            setOtpSent(false); // Allow retry
        } else if (error.code === 'auth/invalid-phone-number') {
             description = "Invalid phone number format. Please use the format +91XXXXXXXXXX.";
             setOtpSent(false);
            // form.setValue('phone', ''); // Don't clear, let user correct it
        } else if (error.code === 'auth/invalid-verification-code') {
             description = 'Invalid OTP entered. Please try again.';
             form.setValue('otp', ''); // Clear OTP field
        } else if (error.code === 'auth/code-expired') {
             description = 'The verification code has expired. Please send a new one.';
             setOtpSent(false); // Allow resend
        } else if (error.code === 'auth/too-many-requests') {
             description = 'Too many attempts. Please try again later.';
             // Keep otpSent state as is, just inform user
        } else if (error.code === 'auth/missing-client-identifier') {
            description = 'Missing application verification. Please ensure reCAPTCHA is set up correctly.';
            setOtpSent(false); // Reset OTP state
        }
        else if (error.code === 'auth/hostname-mismatch' || (error.message && error.message.includes('Hostname match not found'))) {
            description = "Authentication domain mismatch. Check your Firebase project's authorized domains and ensure your current domain is listed.";
            setOtpSent(false); // Reset OTP state
        }


         toast({
            title: title,
            description: description,
            variant: 'destructive',
         });
         if (error.code === 'auth/session-expired' || error.message?.includes('expired')) {
             setOtpSent(false); // Reset if session expired
         }
    } finally {
        setLoading(false);
    }
  };

    const handleGoogleSignUp = async () => {
        if (!authInstance || !firestore) {
            toast({ title: "Error", description: "Authentication service not ready.", variant: "destructive" });
            return;
        }
        setLoading(true);
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(authInstance, provider);
            const user = result.user;
            console.log("Google Sign-Up/Login Successful:", user.uid);

            await handleUserCreation(user, user.displayName || 'Unnamed User');
            // Redirect is handled in handleUserCreation

        } catch (error: any) {
            console.error("Google Sign-Up Error:", error);
            if (error.code === 'auth/popup-closed-by-user') {
                toast({ title: "Sign-Up Cancelled", description: "Google Sign-Up window was closed.", variant: "default" });
            } else {
                toast({
                    title: "Google Sign-Up Failed",
                    description: error.message || "Could not sign up with Google.",
                    variant: "destructive",
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleEmailSignUp = async (values: Extract<SignUpFormValues, { email: string }>, displayName: string) => {
       if (!authInstance || !firestore) {
         toast({ title: "Error", description: "Service not ready.", variant: "destructive" });
         setLoading(false);
         return;
       }

       const actionCodeSettings = {
         // URL you want to redirect back to. The domain (www.example.com) for this
         // URL must be in the authorized domains list in the Firebase Console.
         // Redirect to login page after clicking link to complete sign-in
         url: `${window.location.origin}/login`, // Redirect to login to complete
         handleCodeInApp: true, // This must be true.
       };

       try {
         await sendSignInLinkToEmail(authInstance, values.email, actionCodeSettings);
         // The link was successfully sent. Inform the user.
         // Save the email locally so you don't need to ask the user for it again
         // if they open the link on the same device.
         window.localStorage.setItem('emailForSignIn', values.email);
         // Save the name temporarily as well, maybe in session storage
         // It's better to fetch/update name AFTER user confirms via link
         window.localStorage.setItem('nameForSignIn', displayName); // Use cautiously

         toast({
           title: 'Check your email',
           description: `A sign-in link has been sent to ${values.email}. Open the link to complete sign-up.`,
         });
         // Optionally clear the form or disable it
         form.reset();

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


    // Handles Firestore user document creation/update for all sign-up methods
    // This function might be called AFTER email link sign-in is completed on the redirect page (login page).
    const handleUserCreation = async (user: any, name: string, phone: string | null = null) => {
        if (!user || !firestore) return;

        const userDocRef = doc(firestore, "users", user.uid);
        try {
            const docSnap = await getDoc(userDocRef);

            let isNewUser = false;
            try {
                const additionalUserInfo = getAdditionalUserInfo({user: user} as any);
                isNewUser = additionalUserInfo?.isNewUser ?? !docSnap.exists(); // Use doc existence as fallback
            } catch (infoError) {
                console.warn("Could not get additional user info:", infoError);
                isNewUser = !docSnap.exists();
            }

            if (!docSnap.exists()) {
                // User is definitely new, create Firestore document
                await setDoc(userDocRef, {
                    uid: user.uid,
                    name: name,
                    email: user.email || null,
                    phone: phone || user.phoneNumber || null, // Use provided phone or from auth
                    createdAt: new Date(),
                    isProfileComplete: false // Mark as incomplete
                }, { merge: false }); // Don't merge if creating new
                 console.log("Firestore document created for new user:", user.uid);
                 toast({ title: 'Sign Up Successful', description: 'Please complete your profile.' });
                 router.push('/complete-profile'); // Redirect new users to complete profile
            } else {
                // User exists, check if profile is complete and if name needs update
                const existingData = docSnap.data();
                let updateData: { [key: string]: any } = {};

                 // Update name from Auth provider only if it's different AND profile is incomplete
                 // Avoid overwriting a user-set name if profile is already complete
                if (!existingData?.isProfileComplete && name && existingData?.name !== name) {
                    updateData.name = name;
                    if (user.displayName !== name) {
                         try {
                            await updateProfile(user, { displayName: name });
                            console.log("Auth display name updated for existing user.");
                         } catch (authProfileError) {
                            console.warn("Could not update Auth display name:", authProfileError);
                         }
                    }
                }
                 // Update phone number if signing up via phone after other methods
                 if (phone && existingData?.phone !== phone) {
                    updateData.phone = phone;
                 }

                 if (Object.keys(updateData).length > 0) {
                     await setDoc(userDocRef, updateData, { merge: true });
                     console.log("Updated details for existing user:", user.uid, updateData);
                 } else {
                     console.log("User document already exists and matches or profile complete:", user.uid);
                 }

                 // Redirect existing but incomplete profiles
                 if (!existingData?.isProfileComplete) {
                    toast({ title: 'Login Successful', description: 'Please complete your profile.' });
                    router.push('/complete-profile');
                 } else {
                    // Existing user with complete profile, redirect home
                    toast({ title: 'Login Successful', description: 'Welcome back!' });
                    router.push('/');
                 }
            }

        } catch (error) {
            console.error("Error creating/updating Firestore user document:", error);
            toast({ title: "Profile Error", description: "Could not save profile data.", variant: "destructive" });
             // Redirect home as a fallback on Firestore error
             router.push('/');
        }
    };


  return (
    <div className="flex items-center justify-center py-12 relative">
       {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-50">
                 <LoadingSpinner />
            </div>
        )}
      {/* Container MUST exist in the DOM for invisible reCAPTCHA (only needed for phone) */}
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

            {/* Method Selection Buttons */}
            <div className="flex gap-2">
                <Button
                    variant={signUpMethod === 'email' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setSignUpMethod('email')}
                    disabled={loading}
                >
                    <Mail className="mr-2 h-4 w-4" /> Email Link
                </Button>
                 <Button
                    variant={signUpMethod === 'phone' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setSignUpMethod('phone')}
                    disabled={loading}
                 >
                    {/* Phone icon placeholder */}
                     <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    Phone OTP
                </Button>
            </div>


             <Separator />

            {/* Dynamic Form based on selected method */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSignUp)} className="grid gap-4">
               <CardDescription className="text-center">
                    {signUpMethod === 'email' ? 'Enter your details to sign up with Email' : 'Enter your details to sign up with Phone'}
               </CardDescription>

               {/* Common Fields */}
               <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your" {...field} disabled={loading || (signUpMethod === 'phone' && otpSent)} />
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
                            <Input placeholder="Name" {...field} disabled={loading || (signUpMethod === 'phone' && otpSent)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                {/* Phone Specific Fields */}
                {signUpMethod === 'phone' && (
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
                        {loading ? 'Processing...' : (otpSent ? 'Verify OTP & Sign Up' : 'Send OTP')}
                    </Button>
                    {otpSent && (
                        <Button variant="link" size="sm" onClick={() => {
                            setOtpSent(false);
                            form.reset({...form.getValues(), otp: ''});
                            window.signUpConfirmationResult = undefined;
                            // Safely clear reCAPTCHA
                             if (recaptchaVerifierRef.current) {
                                 try { recaptchaVerifierRef.current.clear(); } catch(e) { console.warn("Error clearing verifier on change/resend:", e); }
                                 recaptchaVerifierRef.current = null;
                                 recaptchaWidgetIdRef.current = null;
                             }
                             if (window.signUpRecaptchaVerifier) {
                                 try { window.signUpRecaptchaVerifier.clear(); } catch(e) { console.warn("Error clearing window verifier on change/resend:", e); }
                                 window.signUpRecaptchaVerifier = undefined;
                             }
                        }} className="text-sm" type="button" disabled={loading}>
                            Change Number or Resend OTP
                        </Button>
                    )}
                  </>
                )}

                 {/* Email Specific Fields */}
                {signUpMethod === 'email' && (
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
                             {loading ? 'Sending Link...' : 'Send Sign-Up Link'}
                        </Button>
                    </>
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
