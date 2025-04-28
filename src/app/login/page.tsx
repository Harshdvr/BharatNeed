
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

// Make recaptchaVerifier and confirmationResult accessible globally for simplicity
// Using state or refs might be cleaner in complex scenarios.
declare global {
    interface Window {
        grecaptcha?: any; // For potential direct reset access
        loginRecaptchaVerifier?: RecaptchaVerifier;
        loginConfirmationResult?: ConfirmationResult;
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
      console.log("LoginPage cleanup: Clearing reCAPTCHA verifier if exists.");
      try {
        window.loginRecaptchaVerifier?.clear();
        window.loginRecaptchaVerifier = undefined;
        window.loginConfirmationResult = undefined; // Also clear confirmation result
      } catch (error) {
         console.warn("Error cleaning up login reCAPTCHA verifier:", error);
      }
    };
  }, [loginType]); // Rerun cleanup if loginType changes


  const currentSchema = loginType === 'email' ? emailSchema : phoneSchema;

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(currentSchema),
    defaultValues: loginType === 'email' ? { email: '', password: '' } : { phone: '', otp: '' },
    mode: 'onChange',
  });

 // Function to set up reCAPTCHA
    const setupRecaptcha = (): Promise<RecaptchaVerifier | null> => {
        if (!authInstance) {
            toast({ title: "Error", description: "Authentication service not ready.", variant: "destructive" });
            return Promise.resolve(null);
        }
      return new Promise((resolve, reject) => {
        // Check if container exists before creating verifier
        const container = document.getElementById(recaptchaContainerId);
        if (!container) {
            console.error("Recaptcha container not found:", recaptchaContainerId);
             // Wait a bit for the DOM maybe? Or ensure it's rendered before calling setupRecaptcha
            setTimeout(() => {
                const checkAgain = document.getElementById(recaptchaContainerId);
                if (!checkAgain) {
                     toast({ title: "Error", description: "Login UI Initialization Failed. Please refresh.", variant: "destructive" });
                    reject(new Error("Recaptcha container not found"));
                } else {
                     createLoginVerifier(authInstance, recaptchaContainerId).then(resolve).catch(reject);
                }
            }, 100); // Short delay
            return;
        }

        // If verifier exists and isn't cleared, try to reuse it
        if (window.loginRecaptchaVerifier) {
             console.log("Existing reCAPTCHA verifier found. Attempting to reuse.");
             // No need to render again if it exists and is likely rendered
             return resolve(window.loginRecaptchaVerifier);
         }

         createLoginVerifier(authInstance, recaptchaContainerId).then(resolve).catch(reject);
      });
    };

     // Helper to create login verifier
     const createLoginVerifier = (auth: Auth, containerId: string): Promise<RecaptchaVerifier> => {
         return new Promise((resolve, reject) => {
              console.log("Creating new RecaptchaVerifier instance for login.");
             try {
                const verifier = new RecaptchaVerifier(auth, containerId, {
                    'size': 'invisible',
                    'callback': (response: any) => {
                        console.log("reCAPTCHA challenge solved (callback). Response:", response);
                        // For invisible reCAPTCHA, this often means the user passed the check implicitly.
                        // The signInWithPhoneNumber promise should resolve.
                    },
                    'expired-callback': () => {
                        toast({ title: "reCAPTCHA Expired", description: "Please try sending the OTP again.", variant: "destructive" });
                        window.loginRecaptchaVerifier?.clear();
                        window.loginRecaptchaVerifier = undefined;
                        setOtpSent(false); // Allow user to retry
                        reject(new Error("reCAPTCHA expired")); // Reject the promise
                    },
                    'error-callback': (error: any) => {
                       console.error("reCAPTCHA error (error-callback):", error);
                       toast({ title: "reCAPTCHA Error", description: `Failed to verify. ${error?.message || 'Please try again.'}`, variant: "destructive"});
                       window.loginRecaptchaVerifier?.clear();
                       window.loginRecaptchaVerifier = undefined;
                       setOtpSent(false);
                       reject(new Error("reCAPTCHA verification error")); // Reject the promise
                    }
                });

                window.loginRecaptchaVerifier = verifier;

                // Render the invisible reCAPTCHA
                verifier.render().then((widgetId) => {
                  console.log("reCAPTCHA rendered successfully. Widget ID:", widgetId);
                  resolve(verifier); // Resolve the promise once rendered
                }).catch((error) => {
                   console.error("Recaptcha render failed:", error);
                   toast({ title: "reCAPTCHA Error", description: "Could not initialize reCAPTCHA. Refresh might help.", variant: "destructive" });
                   window.loginRecaptchaVerifier = undefined; // Ensure cleanup on render fail
                   reject(error); // Reject the promise on render failure
                });
            } catch (error) {
                 console.error("Error creating RecaptchaVerifier:", error);
                 toast({ title: "Setup Error", description: "Could not initialize login system. Please refresh.", variant: "destructive" });
                 reject(error); // Reject the promise
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
            : `Error: ${error.code || error.message}`,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    } else if (loginType === 'phone' && 'phone' in values) {
        // --- Phone Login ---
        let appVerifier: RecaptchaVerifier | null = null;
         try {
            if (!otpSent) {
                // --- Send OTP Phase ---
                appVerifier = await setupRecaptcha(); // Setup/get reCAPTCHA
                if (!appVerifier) throw new Error("reCAPTCHA Verifier not available.");

                console.log("Using appVerifier:", appVerifier);
                console.log("Attempting to send OTP to:", values.phone);
                const confirmationResult = await signInWithPhoneNumber(authInstance, values.phone!, appVerifier);
                window.loginConfirmationResult = confirmationResult;
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
                if (!window.loginConfirmationResult) {
                    toast({ title: 'Verification Error', description: 'Confirmation session expired or invalid. Please request OTP again.', variant: 'destructive' });
                    setOtpSent(false); // Reset state to allow resend
                    window.loginRecaptchaVerifier?.clear(); // Cleanup verifier too
                    window.loginRecaptchaVerifier = undefined;
                    throw new Error("Confirmation session expired or invalid.");
                }

                 console.log("Attempting to confirm OTP:", values.otp);
                 const userCredential = await window.loginConfirmationResult.confirm(values.otp);
                 console.log('User logged in with phone:', userCredential.user.uid);
                 toast({ title: 'Login Successful', description: 'Welcome back!' });
                 // Cleanup on success
                 window.loginConfirmationResult = undefined;
                 window.loginRecaptchaVerifier?.clear();
                 window.loginRecaptchaVerifier = undefined;
                 router.push('/');
            }
        } catch (error: any) {
            console.error(`Phone login error (${otpSent ? 'Verify OTP' : 'Send OTP'}):`, error);
            console.error('Error Code:', error.code);
            console.error('Error Message:', error.message);
            // Attempt to reset reCAPTCHA widget if possible
             if (!otpSent && appVerifier) {
                try {
                    if (window.grecaptcha && appVerifier?.widgetId !== undefined) {
                        window.grecaptcha.reset(appVerifier.widgetId);
                        console.log("Explicitly reset reCAPTCHA widget");
                    }
                } catch (resetError) {
                   console.warn("Could not explicitly reset reCAPTCHA widget:", resetError);
                }
                window.loginRecaptchaVerifier?.clear(); // Clear Firebase wrapper state regardless
                window.loginRecaptchaVerifier = undefined;
             }

            const title = otpSent ? 'OTP Verification Failed' : 'Failed to Send OTP';
            const description = `Error: ${error.code === 'auth/invalid-verification-code' && otpSent ? 'Invalid OTP.' : (error.message || 'Unknown error.')}`;

            toast({
                title: title,
                description: description + (otpSent ? '' : " Check number or try again."),
                variant: 'destructive',
            });
             // Optionally reset OTP state based on error (e.g., don't reset for invalid code, do reset for expired session)
             if (error.message.includes('expired')) {
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

  // --- Google Login (Placeholder) ---
  // const handleGoogleLogin = async () => {
  //     setLoading(true);
  //     console.log("Attempting Google login...");
  //     // Implement Google Sign-In logic here
  //     // const provider = new GoogleAuthProvider();
  //     // try {
  //     //   const result = await signInWithPopup(authInstance, provider); // Use authInstance
  //     //   console.log("Google login successful:", result.user.uid);
  //     //   toast({ title: "Login Successful", description: "Welcome!" });
  //     //   router.push('/');
  //     // } catch (error: any) {
  //     //   console.error("Google login error:", error);
  //     //   toast({ title: "Google Login Failed", description: error.message || "Could not sign in with Google.", variant: "destructive" });
  //     // } finally {
  //     //   setLoading(false);
  //     // }
  // };


  return (
    <div className="flex items-center justify-center py-12 relative">
        {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-50">
                <LoadingSpinner />
            </div>
        )}
         {/* Container for invisible reCAPTCHA - MUST exist in the DOM */}
        <div id={recaptchaContainerId}></div>

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
                 // Trigger reCAPTCHA cleanup via useEffect dependency change
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
                            <div className="flex items-center">
                                <FormLabel>Password</FormLabel>
                                <Link href="#" className="ml-auto inline-block text-sm underline text-muted-foreground hover:text-foreground">
                                    Forgot password?
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
                            window.loginConfirmationResult = undefined; // Clear confirmation
                            window.loginRecaptchaVerifier?.clear(); // Clear verifier
                            window.loginRecaptchaVerifier = undefined;
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
  );
}
