
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
import { useState, useEffect } from 'react';
import { ensureAuthInitialized } from '@/lib/firebase/clientApp'; // Import the helper
import {
  createUserWithEmailAndPassword,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  updateProfile,
  ConfirmationResult,
  Auth, // Import Auth type
} from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoadingSpinner from '@/components/loading-spinner';

const emailSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const phoneSchema = z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    phone: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Invalid phone number format (e.g., +919876543210)'),
    otp: z.string().optional(), // OTP is optional initially, required later
}).refine(data => !data.otp || data.otp.length === 6, {
    message: "OTP must be 6 digits",
    path: ["otp"], // specific path for the error
});

type SignUpFormValues = z.infer<typeof emailSchema> | z.infer<typeof phoneSchema>;
type SignUpType = 'email' | 'phone';

// Use window object carefully for global state like this, refs or state management is better
declare global {
    interface Window {
        grecaptcha?: any; // Added for direct grecaptcha access if needed
        signUpRecaptchaVerifier?: RecaptchaVerifier;
        signUpConfirmationResult?: ConfirmationResult;
    }
}

export default function SignUpPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [signUpType, setSignUpType] = useState<SignUpType>('email');
  const [otpSent, setOtpSent] = useState(false);
  const recaptchaContainerId = "recaptcha-container-signup"; // Define ID
  const [authInstance, setAuthInstance] = useState<Auth | null>(null);

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


  // Ensure reCAPTCHA cleanup
  useEffect(() => {
     // Attempt to clear any existing verifier when switching tabs or unmounting
    return () => {
      console.log("SignUpPage cleanup: Clearing reCAPTCHA verifier if exists.");
      try {
         window.signUpRecaptchaVerifier?.clear();
         window.signUpRecaptchaVerifier = undefined;
         window.signUpConfirmationResult = undefined; // Also clear confirmation result
      } catch(error) {
         console.warn("Error cleaning up signup reCAPTCHA:", error);
      }
    };
  }, [signUpType]); // Rerun cleanup if signUpType changes


  const currentSchema = signUpType === 'email' ? emailSchema : phoneSchema;

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(currentSchema),
    defaultValues: signUpType === 'email'
        ? { firstName: '', lastName: '', email: '', password: '' }
        : { firstName: '', lastName: '', phone: '', otp: '' },
    mode: 'onChange', // Validate on change
  });


    // Function to set up reCAPTCHA
    const setupRecaptcha = (): Promise<RecaptchaVerifier | null> => {
        if (!authInstance) {
             toast({ title: "Error", description: "Authentication service not ready.", variant: "destructive" });
             return Promise.resolve(null);
        }
      return new Promise((resolve, reject) => {
        // Ensure container exists
        const container = document.getElementById(recaptchaContainerId);
        if (!container) {
            console.error("Recaptcha container not found:", recaptchaContainerId);
            // Wait a bit for the DOM maybe? Or ensure it's rendered before calling setupRecaptcha
             setTimeout(() => {
                 const checkAgain = document.getElementById(recaptchaContainerId);
                 if (!checkAgain) {
                     toast({ title: "Error", description: "Sign up UI Initialization Failed. Please refresh.", variant: "destructive" });
                     reject(new Error("Recaptcha container not found"));
                 } else {
                     // If found after delay, proceed with creation (though this suggests a race condition)
                      createVerifier(authInstance, recaptchaContainerId).then(resolve).catch(reject);
                 }
             }, 100); // Short delay to allow DOM update
            return;
        }

         // Avoid creating multiple verifiers if one exists and hasn't been cleared
         if (window.signUpRecaptchaVerifier) {
            console.log("Existing reCAPTCHA verifier found for signup. Attempting to reuse.");
             // No need to render again if it exists and is likely rendered
             return resolve(window.signUpRecaptchaVerifier);
         }

        createVerifier(authInstance, recaptchaContainerId).then(resolve).catch(reject);
      });
    };

     // Helper to actually create the verifier
    const createVerifier = (auth: Auth, containerId: string): Promise<RecaptchaVerifier> => {
         return new Promise((resolve, reject) => {
             console.log("Creating new RecaptchaVerifier instance for signup.");
             try {
                 const verifier = new RecaptchaVerifier(auth, containerId, {
                    'size': 'invisible',
                    'callback': (response: any) => {
                        console.log("reCAPTCHA verified for signup (callback). Response:", response);
                        // This callback indicates success for visible reCAPTCHA or explicit solve for invisible
                        // The promise from signInWithPhoneNumber usually handles invisible success
                    },
                    'expired-callback': () => {
                        toast({ title: "reCAPTCHA Expired", description: "Please try sending the OTP again.", variant: "destructive" });
                        window.signUpRecaptchaVerifier?.clear(); // Clear the expired verifier
                        window.signUpRecaptchaVerifier = undefined;
                        setOtpSent(false); // Allow user to retry sending OTP
                        reject(new Error("reCAPTCHA expired")); // Reject the promise
                    },
                    'error-callback': (error: any) => {
                       console.error("reCAPTCHA error (error-callback) for signup:", error);
                       toast({ title: "reCAPTCHA Error", description: `Failed to verify. ${error?.message || 'Please try again.'}`, variant: "destructive"});
                       window.signUpRecaptchaVerifier?.clear();
                       window.signUpRecaptchaVerifier = undefined;
                       setOtpSent(false);
                       reject(new Error("reCAPTCHA verification error")); // Reject the promise
                    }
                });
                window.signUpRecaptchaVerifier = verifier;

                 // Render the invisible reCAPTCHA
                verifier.render().then((widgetId) => {
                  console.log("Signup reCAPTCHA rendered successfully. Widget ID:", widgetId);
                  resolve(verifier); // Resolve the promise once rendered
                }).catch((error) => {
                   console.error("Signup Recaptcha render failed:", error);
                   toast({ title: "reCAPTCHA Error", description: "Could not initialize sign up reCAPTCHA. Refresh might help.", variant: "destructive" });
                   window.signUpRecaptchaVerifier = undefined; // Ensure cleanup on render fail
                   reject(error); // Reject the promise on render failure
                });

            } catch (error) {
                console.error("Error creating/rendering signup RecaptchaVerifier:", error);
                toast({ title: "Setup Error", description: "Could not initialize sign up system. Please refresh.", variant: "destructive" });
                reject(error); // Indicate failure
            }
         });
    };


   const handleSignUp = async (values: SignUpFormValues) => {
    if (!authInstance) {
        toast({ title: "Error", description: "Authentication service not ready.", variant: "destructive" });
        return;
    }
    setLoading(true);
    const displayName = `${values.firstName} ${values.lastName}`;

    if (signUpType === 'email' && 'email' in values && 'password' in values) {
      // --- Email Signup ---
      console.log("Attempting email signup for:", values.email);
      try {
        const userCredential = await createUserWithEmailAndPassword(authInstance, values.email!, values.password!);
        await updateProfile(userCredential.user, { displayName });
        console.log('User signed up with email:', userCredential.user.uid, " Name:", displayName);
        toast({ title: 'Sign Up Successful', description: 'Welcome! Redirecting...' });
        router.push('/');
      } catch (error: any) {
        console.error('Email sign up error:', error);
        console.error('Error Code:', error.code);
        console.error('Error Message:', error.message);
        toast({
          title: 'Sign Up Failed',
          description: error.code === 'auth/email-already-in-use'
            ? 'This email is already registered. Try logging in.'
            : `Error: ${error.code || error.message}`,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    } else if (signUpType === 'phone' && 'phone' in values) {
        // --- Phone Signup ---
        let appVerifier: RecaptchaVerifier | null = null;
        try {
            if (!otpSent) {
                // --- Send OTP Phase ---
                appVerifier = await setupRecaptcha(); // Ensure reCAPTCHA is ready
                if (!appVerifier) throw new Error("reCAPTCHA Verifier setup failed.");

                 console.log("Using appVerifier for signup:", appVerifier);
                 console.log("Attempting to send OTP for signup to:", values.phone);
                const confirmationResult = await signInWithPhoneNumber(authInstance, values.phone!, appVerifier);
                window.signUpConfirmationResult = confirmationResult; // Store globally
                setOtpSent(true); // Update state to show OTP field
                form.reset({...values, otp: ''}); // Clear OTP field after sending
                 toast({ title: 'OTP Sent', description: `Verification code sent to ${values.phone}` });
                 console.log("Signup OTP sent, confirmation result stored.");
            } else {
                 // --- Verify OTP Phase ---
                 if (!values.otp) {
                     form.setError("otp", { type: "manual", message: "OTP is required." });
                     throw new Error("OTP is required."); // Throw to stop execution and indicate error
                 }
                 if (values.otp.length !== 6) {
                     form.setError("otp", { type: "manual", message: "OTP must be 6 digits." });
                     throw new Error("OTP must be 6 digits.");
                 }
                 if (!window.signUpConfirmationResult) {
                    toast({ title: 'Verification Error', description: 'Confirmation session expired or invalid. Please request OTP again.', variant: 'destructive' });
                    setOtpSent(false); // Reset state
                    throw new Error("Confirmation session expired or invalid.");
                 }
                 console.log("Attempting to confirm signup OTP:", values.otp);
                 // Phone Auth signs the user in. If the number is new, it creates the account.
                 // If the number exists, it signs them in.
                 const userCredential = await window.signUpConfirmationResult.confirm(values.otp);

                 // Update profile *after* confirming OTP and potentially creating the user
                 if (userCredential.user) {
                     console.log("Phone user confirmed/created:", userCredential.user.uid);
                     // Check if display name needs update (e.g., for new users)
                     if (userCredential.user.displayName !== displayName) {
                        console.log("Updating display name for user:", userCredential.user.uid, "to:", displayName);
                        await updateProfile(userCredential.user, { displayName });
                     }
                     console.log('User signed up/logged in with phone:', userCredential.user.uid);
                     toast({ title: 'Sign Up Successful', description: 'Welcome! Redirecting...' });
                      // Cleanup on success
                      window.signUpConfirmationResult = undefined;
                      window.signUpRecaptchaVerifier?.clear();
                      window.signUpRecaptchaVerifier = undefined;
                     router.push('/');
                 } else {
                    // Should not happen if confirm() resolves, but good practice to check
                    throw new Error("User object not found after OTP confirmation.");
                 }
            }
        } catch (error: any) {
             console.error(`Phone sign up error (${otpSent ? 'Verify OTP' : 'Send OTP'}):`, error);
             console.error('Error Code:', error.code);
             console.error('Error Message:', error.message);
              // Attempt to reset reCAPTCHA widget if possible, especially for send OTP errors
             if (!otpSent && appVerifier) {
                try {
                     if (window.grecaptcha && appVerifier?.widgetId !== undefined) {
                         window.grecaptcha.reset(appVerifier.widgetId);
                         console.log("Explicitly reset signup reCAPTCHA widget");
                     }
                 } catch (resetError) {
                    console.warn("Could not explicitly reset signup reCAPTCHA widget:", resetError);
                 }
                 window.signUpRecaptchaVerifier?.clear(); // Clear Firebase wrapper state regardless
                 window.signUpRecaptchaVerifier = undefined;
             }

             const title = otpSent ? 'OTP Verification Failed' : 'Failed to Send OTP';
             const description = `Error: ${error.code === 'auth/invalid-verification-code' && otpSent ? 'Invalid OTP.' : (error.message || 'Unknown error.')}`;

             toast({
                title: title,
                description: description + (otpSent ? '' : " Check number or try again."),
                variant: 'destructive',
             });
             // Optionally reset OTP state based on error
             if (error.message.includes('expired')) { // Example check
                 setOtpSent(false);
             }
        } finally {
            setLoading(false); // Stop loading after attempt (success or failure)
        }

    } else {
        console.error("Form submission error: values structure mismatch or invalid signup type.");
         toast({ title: "Error", description: "An unexpected error occurred during signup.", variant: "destructive" });
        setLoading(false);
    }
  };

   // --- Google Signup (Placeholder) ---
   // const handleGoogleSignup = async () => {
   //    setLoading(true);
   //    console.log("Attempting Google signup...");
   //    // Implement Google Sign-up logic here (similar to login, might need name handling if new user)
   //    setLoading(false);
   // };


  return (
    <div className="flex items-center justify-center py-12 relative">
       {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-50">
                 <LoadingSpinner />
            </div>
        )}
      {/* Container MUST exist in the DOM for invisible reCAPTCHA */}
      <div id={recaptchaContainerId}></div>

      <Card className="mx-auto max-w-sm w-full">
        <CardHeader>
          <CardTitle className="text-xl">Sign Up</CardTitle>
          <CardDescription>Enter your information to create an account</CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs value={signUpType} onValueChange={(value) => {
                const newType = value as SignUpType;
                 console.log("Switching signup type to:", newType);
                setSignUpType(newType);
                setOtpSent(false); // Reset OTP state on tab change
                form.reset(newType === 'email'
                  ? { firstName: '', lastName: '', email: '', password: '' }
                  : { firstName: '', lastName: '', phone: '', otp: '' });
                 // Trigger reCAPTCHA cleanup via useEffect dependency change
              }} className="w-full mb-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="phone">Phone</TabsTrigger>
              </TabsList>
            </Tabs>

          <Form {...form}>
             {/* Use key prop to force re-render on type change, ensures schema updates */}
            <form key={signUpType} onSubmit={form.handleSubmit(handleSignUp)} className="grid gap-4">
               {/* Common Fields: First Name, Last Name */}
               <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First name</FormLabel>
                          <FormControl>
                            <Input placeholder="Max" {...field} disabled={loading || (signUpType === 'phone' && otpSent)}/>
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
                            <Input placeholder="Robinson" {...field} disabled={loading || (signUpType === 'phone' && otpSent)}/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

               {signUpType === 'email' ? (
                 <>
                    {/* Email Specific Fields */}
                    <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="m@example.com" {...field} disabled={loading}/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} disabled={loading}/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Processing...' : 'Create an account'}
                  </Button>
                 </>
               ) : (
                <>
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
                            window.signUpConfirmationResult = undefined; // Clear confirmation
                            window.signUpRecaptchaVerifier?.clear(); // Clear verifier
                            window.signUpRecaptchaVerifier = undefined;
                        }} className="text-sm" type="button" disabled={loading}> {/* Added type="button" */}
                            Change Number or Resend OTP
                        </Button>
                     )}
                </>
               )}

              {/* Google Button (Placeholder) */}
              {/* <Button variant="outline" className="w-full" onClick={handleGoogleSignup} disabled={loading}>
                Sign up with Google
              </Button> */}
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
