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
import { ensureAuthInitialized } from '@/lib/firebase/clientApp'; // Import the helper
import {
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
  Auth, // Import Auth type
  // GoogleAuthProvider, // If implementing Google Sign-In
  // signInWithPopup,    // If implementing Google Sign-In
} from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoadingSpinner from '@/components/loading-spinner';

const emailSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'), // Min 1 for login
});

const phoneSchema = z.object({
    phone: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Invalid phone number format (e.g., +919876543210)'),
    otp: z.string().optional(), // OTP is optional initially, required later
}).refine(data => !data.otp || data.otp.length === 6, {
    message: "OTP must be 6 digits",
    path: ["otp"], // specific path for the error
});


type LoginFormValues = z.infer<typeof emailSchema> | z.infer<typeof phoneSchema>;
type LoginType = 'email' | 'phone';

// Refactor: Use useRef for verifier and confirmationResult instead of window object
// Use global window object only for reCAPTCHA instance if necessary for callbacks,
// but prefer refs for internal state management.
declare global {
    interface Window {
        grecaptcha?: any; // For potential direct reset access
        // loginRecaptchaVerifier?: RecaptchaVerifier; // Removed, managed by ref now
        loginConfirmationResult?: ConfirmationResult; // Keep using window object for simplicity for now, could be refactored later
    }
}


export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loginType, setLoginType] = useState<LoginType>('email');
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

  // Ensure reCAPTCHA cleanup when component unmounts or loginType changes
  useEffect(() => {
    return () => {
        console.log("LoginPage cleanup: Clearing reCAPTCHA verifier if exists.");
        // Use the ref for cleanup
        recaptchaVerifierRef.current?.clear();
        recaptchaVerifierRef.current = null;
        recaptchaWidgetIdRef.current = null; // Clear widget ID ref
        window.loginConfirmationResult = undefined; // Clear window object too
    };
  }, [loginType]); // Depend on loginType to trigger cleanup on switch


  const currentSchema = loginType === 'email' ? emailSchema : phoneSchema;

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(currentSchema),
    defaultValues: loginType === 'email' ? { email: '', password: '' } : { phone: '', otp: '' },
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
        // It's better if the container is always present in the JSX.
        // Avoid creating it dynamically unless absolutely necessary.
        toast({ title: "UI Error", description: "Login UI failed to load correctly. Please refresh.", variant: "destructive" });
        return reject(new Error("Recaptcha container not found"));
      }

      // Clear previous instance managed by ref if it exists
      if (recaptchaVerifierRef.current) {
        console.log("Clearing previous reCAPTCHA verifier instance via ref.");
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
        recaptchaWidgetIdRef.current = null;
      }

      console.log("Creating new RecaptchaVerifier instance for login.");
      try {
        const verifier = new RecaptchaVerifier(authInstance, recaptchaContainerId, {
          'size': 'invisible',
          'callback': (response: any) => {
            // reCAPTCHA solved, allow signInWithPhoneNumber.
            // For invisible reCAPTCHA, this typically means the sign-in process can proceed.
            console.log("reCAPTCHA challenge solved (callback). Response:", response);
            // This callback might not be strictly necessary for the 'invisible' size
            // as the promise from signInWithPhoneNumber resolves upon success.
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

        // Render the invisible reCAPTCHA and resolve the promise *after* rendering
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
    });
  };


  const handleLogin = async (values: LoginFormValues) => {
    if (!authInstance) {
        toast({ title: "Error", description: "Authentication service not ready.", variant: "destructive" });
        return;
    }
    setLoading(true);

    if (loginType === 'email' && 'email' in values && 'password' in values) {

      // --- Email Login ---
      console.log("Attempting email login with:", values.email);
      try {
        const userCredential = await signInWithEmailAndPassword(authInstance, values.email!, values.password!);
        console.log('User logged in with email:', userCredential.user.uid);
        toast({ title: 'Login Successful', description: 'Welcome back!' });
        router.push('/');
      } catch (error: any) {
        console.error('Email login error:', error);
        console.error('Error Code:', error.code);
        console.error('Error Message:', error.message);
        toast({
          title: 'Login Failed',
          description: error.code === 'auth/invalid-credential' || error.code === 'auth/user-disabled' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found'
            ? 'Invalid email or password.'
            : `Error: ${error.message || 'Unknown error.'}`, // Display Firebase error message
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    } else if (loginType === 'phone' && 'phone' in values) {
        // --- Phone Login ---
         try {
            if (!otpSent) {
                // --- Send OTP Phase ---
                const appVerifier = await setupRecaptcha(); // Setup/get reCAPTCHA
                if (!appVerifier) {
                     console.error("reCAPTCHA setup failed, cannot send OTP.");
                     // Error toast is handled inside setupRecaptcha
                     setLoading(false); // Stop loading if setup failed
                     return; // Exit the function
                }

                console.log("Using appVerifier:", appVerifier);
                console.log("Attempting to send OTP to:", values.phone);

                // signInWithPhoneNumber uses the rendered reCAPTCHA implicitly
                const confirmationResult = await signInWithPhoneNumber(authInstance, values.phone!, appVerifier);

                window.loginConfirmationResult = confirmationResult; // Store globally for simplicity
                setOtpSent(true);
                form.reset({...values, otp: ''}); // Clear OTP field after sending
                toast({ title: 'OTP Sent', description: `Verification code sent to ${values.phone}` });
                console.log("OTP sent successfully. Confirmation result stored.");
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
                // Use window object for confirmation result (as stored previously)
                if (!window.loginConfirmationResult) {
                    toast({ title: 'Verification Error', description: 'Confirmation session expired or invalid. Please request OTP again.', variant: 'destructive' });
                    setOtpSent(false); // Reset state to allow resend
                    recaptchaVerifierRef.current?.clear(); // Cleanup verifier ref
                    recaptchaVerifierRef.current = null;
                    recaptchaWidgetIdRef.current = null;
                    throw new Error("Confirmation session expired or invalid.");
                }

                 console.log("Attempting to confirm OTP:", values.otp);
                 const userCredential = await window.loginConfirmationResult.confirm(values.otp);
                 console.log('User logged in with phone:', userCredential.user.uid);
                 toast({ title: 'Login Successful', description: 'Welcome back!' });
                 // Cleanup on success
                 window.loginConfirmationResult = undefined;
                 recaptchaVerifierRef.current?.clear();
                 recaptchaVerifierRef.current = null;
                 recaptchaWidgetIdRef.current = null;
                 router.push('/');
            }
        } catch (error: any) {
            console.error(`Phone login error (${otpSent ? 'Verify OTP' : 'Send OTP'}):`, error);
            console.error('Error Code:', error.code);
            console.error('Error Message:', error.message);

            // Attempt to reset reCAPTCHA only if it exists and we were sending OTP
            // Don't reset if the error was during OTP *verification*
            if (!otpSent && recaptchaVerifierRef.current) {
                console.warn("Resetting reCAPTCHA due to Send OTP error.");
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

            // Specific error messages
            if (error.code === 'auth/captcha-check-failed') {
                description = 'reCAPTCHA verification failed. Please try sending the OTP again.';
                setOtpSent(false); // Force user to restart the process
            } else if (error.code === 'auth/invalid-phone-number') {
                description = "Invalid phone number format. Please use the format +91XXXXXXXXXX.";
                 setOtpSent(false); // Allow user to correct number
                 form.setValue('phone', ''); // Clear invalid phone number
            } else if (error.code === 'auth/invalid-verification-code') {
                description = 'Invalid OTP entered. Please try again.';
                form.setValue('otp', ''); // Clear the OTP field on invalid code
            } else if (error.code === 'auth/code-expired') {
                description = 'The verification code has expired. Please send a new one.';
                setOtpSent(false); // Reset to send OTP again
            } else if (error.code === 'auth/too-many-requests') {
                 description = 'Too many attempts. Please try again later.';
                 setOtpSent(false); // Prevent further immediate attempts
            } else if (error.code?.includes('auth/network-request-failed')) {
                 description = 'Network error. Please check your connection and try again.';
            }


            toast({
                title: title,
                description: description,
                variant: 'destructive',
            });

            // If the session expired during OTP verification, reset
             if (error.message.includes('expired') || error.code === 'auth/session-expired') {
                  setOtpSent(false);
             }
        } finally {
            setLoading(false);
        }
    } else {
         console.error("Form submission error: values structure mismatch or invalid login type.");
         toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
         setLoading(false);
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
         {/* Container for invisible reCAPTCHA - MUST exist in the DOM when setupRecaptcha is called */}
        {/* It's often placed outside the main form content, but needs to be in the DOM */}
        <div id={recaptchaContainerId} className="absolute -top-96 -left-96"></div>


      <Card className="mx-auto max-w-sm w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>Enter your credentials below to login</CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs value={loginType} onValueChange={(value) => {
                const newType = value as LoginType;
                console.log("Switching login type to:", newType);
                setLoginType(newType);
                setOtpSent(false); // Reset OTP state crucial for UX
                form.reset(newType === 'email' ? { email: '', password: '' } : { phone: '', otp: '' });
                // Cleanup verifier via useEffect dependency change
            }} className="w-full mb-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="phone">Phone</TabsTrigger>
              </TabsList>
            </Tabs>

          <Form {...form}>
            {/* We use a key prop to force re-render form when loginType changes, ensuring validation schema updates */}
            <form key={loginType} onSubmit={form.handleSubmit(handleLogin)} className="grid gap-4">
               {loginType === 'email' ? (
                <>
                     {/* Email Fields */}
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
                            <div className="flex items-center justify-between">
                                <FormLabel>Password</FormLabel>
                                <Link
                                  href="/forgot-password" // Link to the forgot password page
                                  className="text-sm text-primary hover:underline"
                                >
                                  Forgot Password?
                                </Link>
                            </div>
                            <FormControl>
                            <Input type="password" {...field} disabled={loading}/>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Processing...' : 'Login with Email'}
                     </Button>

                </>
               ) : (
                <>
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
                        }} className="text-sm" type="button" disabled={loading}> {/* Added type="button" */}
                            Change Number or Resend OTP
                        </Button>
                     )}
                </>
               )}

              {/* Google Button (Placeholder) */}
              {/* <Button variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={loading}>
                Login with Google
              </Button> */}
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
