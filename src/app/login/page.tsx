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
import { useState, useEffect } from 'react'; // Import useEffect
import { auth } from '@/lib/firebase/clientApp'; // Import auth instance
import {
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
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
    otp: z.string().length(6, 'OTP must be 6 digits').optional(),
});

type LoginFormValues = z.infer<typeof emailSchema> | z.infer<typeof phoneSchema>;
type LoginType = 'email' | 'phone';

// Make recaptchaVerifier and confirmationResult accessible
// Using state or refs might be cleaner, but window works for simplicity here.
declare global {
    interface Window {
        loginRecaptchaVerifier?: RecaptchaVerifier;
        loginConfirmationResult?: ConfirmationResult;
    }
}


export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false); // State to control loading spinner
  const [loginType, setLoginType] = useState<LoginType>('email');
  const [otpSent, setOtpSent] = useState(false);
  const recaptchaContainerId = "recaptcha-container-login"; // Define ID

  // Cleanup function for reCAPTCHA
  useEffect(() => {
    return () => {
      try {
        window.loginRecaptchaVerifier?.clear(); // Clean up verifier instance if component unmounts
      } catch (error) {
         console.warn("Error cleaning up reCAPTCHA verifier:", error);
      }
    };
  }, []);


  const currentSchema = loginType === 'email' ? emailSchema : phoneSchema;

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(currentSchema),
    defaultValues: loginType === 'email' ? { email: '', password: '' } : { phone: '', otp: '' },
     mode: 'onChange',
  });

 // Function to set up reCAPTCHA
    const setupRecaptcha = () => {
        // Check if container exists before creating verifier
        const container = document.getElementById(recaptchaContainerId);
        if (!container) {
            console.error("Recaptcha container not found:", recaptchaContainerId);
            // Attempt to create the container dynamically if absolutely necessary, though it should exist
            // const newContainer = document.createElement('div');
            // newContainer.id = recaptchaContainerId;
            // document.body.appendChild(newContainer);
            // container = newContainer;
             toast({ title: "Error", description: "Login system initialization failed. Please refresh.", variant: "destructive" });
             return null; // Indicate failure
        }

        // If verifier exists and isn't cleared, return it
        if (window.loginRecaptchaVerifier) {
             try {
                 // Attempt to render to be sure it's active, handle potential errors if already rendered/cleared
                 window.loginRecaptchaVerifier.render();
                 return window.loginRecaptchaVerifier;
             } catch (error) {
                 console.warn("Re-rendering existing verifier failed, creating new one.", error);
                 // Proceed to create a new one if re-render fails
             }
         }


         try {
            const verifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
                'size': 'invisible', // Use invisible reCAPTCHA
                'callback': (response: any) => {
                    console.log("reCAPTCHA verified for login (callback)");
                    // Invisible reCAPTCHA resolves the promise from signInWithPhoneNumber directly
                    // This callback might not be strictly necessary for invisible type unless debugging
                },
                'expired-callback': () => {
                    toast({ title: "reCAPTCHA Expired", description: "Please try sending the OTP again.", variant: "destructive" });
                    window.loginRecaptchaVerifier?.clear(); // Clear the expired verifier
                    window.loginRecaptchaVerifier = undefined;
                    setupRecaptcha(); // Attempt to re-setup immediately might cause issues, maybe reset state instead
                    setOtpSent(false); // Allow user to retry sending OTP
                }
            });
            window.loginRecaptchaVerifier = verifier;
            // Initial render is important!
            return verifier.render().then(() => verifier).catch((error) => {
                 console.error("Recaptcha render failed on setup:", error);
                 toast({ title: "reCAPTCHA Error", description: "Could not initialize reCAPTCHA. Refresh might help.", variant: "destructive" });
                 return null;
            });
        } catch (error) {
             console.error("Error creating RecaptchaVerifier:", error);
             toast({ title: "Error", description: "Could not initialize login system. Please refresh.", variant: "destructive" });
             return null; // Indicate failure
        }
    };


  const handleLogin = async (values: LoginFormValues) => {
    setLoading(true); // Show spinner

    if (loginType === 'email' && 'email' in values && 'password' in values) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, values.email!, values.password!);
        console.log('User logged in with email:', userCredential.user);
        toast({ title: 'Login Successful', description: 'Welcome back!' });
        router.push('/'); // Redirect to home or dashboard
      } catch (error: any) {
        console.error('Email login error:', error);
        toast({
          title: 'Login Failed',
          description: error.code === 'auth/invalid-credential'
            ? 'Invalid email or password.'
            : error.message || 'An unknown error occurred.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false); // Hide spinner for email login regardless of outcome
      }
    } else if (loginType === 'phone' && 'phone' in values) {
        if (!otpSent) {
            // Send OTP phase
            const appVerifier = await setupRecaptcha(); // Setup reCAPTCHA and get the instance
            if (!appVerifier) {
                setLoading(false);
                return; // Stop if reCAPTCHA setup failed
            }

            try {
                console.log("Attempting to send OTP to:", values.phone);
                const confirmationResult = await signInWithPhoneNumber(auth, values.phone!, appVerifier);
                window.loginConfirmationResult = confirmationResult;
                setOtpSent(true);
                toast({ title: 'OTP Sent', description: `Verification code sent to ${values.phone}` });
                console.log("OTP sent, confirmation result stored.");
            } catch (error: any) {
                console.error('Phone login error (Send OTP):', error);
                console.error('Error Code:', error.code);
                console.error('Error Message:', error.message);
                // Reset reCAPTCHA on error
                 window.loginRecaptchaVerifier?.clear();
                 window.loginRecaptchaVerifier = undefined;
                toast({
                    title: 'Failed to Send OTP',
                    description: `Error: ${error.code || error.message}. Check number or try again.`,
                    variant: 'destructive',
                });
            } finally {
                setLoading(false); // Stop loading after OTP attempt
            }
        } else {
            // Verify OTP phase
            if (!values.otp || values.otp.length !== 6) {
                toast({ title: 'Invalid OTP', description: 'Please enter the 6-digit code.', variant: 'destructive' });
                setLoading(false);
                return;
            }
            if (!window.loginConfirmationResult) {
                toast({ title: 'Verification Error', description: 'Please request OTP again.', variant: 'destructive' });
                setOtpSent(false); // Reset state
                setLoading(false);
                return;
            }
            try {
                 console.log("Attempting to confirm OTP:", values.otp);
                 const userCredential = await window.loginConfirmationResult.confirm(values.otp);
                 console.log('User logged in with phone:', userCredential.user);
                 toast({ title: 'Login Successful', description: 'Welcome back!' });
                 router.push('/');
                 // Cleanup on success
                 window.loginConfirmationResult = undefined;
                 window.loginRecaptchaVerifier?.clear();
                 window.loginRecaptchaVerifier = undefined;
            } catch (error: any) {
                 console.error('Phone login error (Verify OTP):', error);
                 console.error('Error Code:', error.code);
                 console.error('Error Message:', error.message);
                 toast({
                     title: 'OTP Verification Failed',
                     description: `Error: ${error.code === 'auth/invalid-verification-code' ? 'Invalid OTP.' : (error.message || 'Unknown error.')}`,
                     variant: 'destructive',
                 });
                 // Consider if OTP state should be reset here depending on error type
                 // if (error.code === 'auth/invalid-verification-code') { /* Keep OTP state */ }
                 // else { setOtpSent(false); }
            } finally {
                setLoading(false); // Stop loading after OTP verification attempt
            }
        }
    } else {
         console.error("Form submission error: values structure mismatch.");
         setLoading(false);
    }

  };

  // TODO: Implement Google Login
  // const handleGoogleLogin = async () => { ... };


  return (
    <div className="flex items-center justify-center py-12 relative"> {/* Added relative for spinner positioning */}
        {/* Conditionally render the spinner */}
        {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-50">
                <LoadingSpinner />
            </div>
        )}
         {/* Container for invisible reCAPTCHA - Must exist in the DOM */}
        <div id={recaptchaContainerId}></div>

      <Card className="mx-auto max-w-sm w-full"> {/* Added w-full */}
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>Enter your credentials below to login</CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs value={loginType} onValueChange={(value) => {
                setLoginType(value as LoginType);
                setOtpSent(false); // Reset OTP state
                 // Clear relevant reCAPTCHA if switching away from phone
                 if (value !== 'phone') {
                     window.loginRecaptchaVerifier?.clear();
                     window.loginRecaptchaVerifier = undefined;
                     window.loginConfirmationResult = undefined;
                 }
                form.reset(value === 'email' ? { email: '', password: '' } : { phone: '', otp: '' });
            }} className="w-full mb-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="phone">Phone</TabsTrigger>
              </TabsList>
            </Tabs>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleLogin)} className="grid gap-4">
               {loginType === 'email' ? (
                <>
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
                                <Link href="#" className="ml-auto inline-block text-sm underline">
                                    Forgot your password?
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
                        {loading ? 'Processing...' : 'Login'}
                     </Button>
                </>
               ) : (
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
                                 <Input type="number" placeholder="Enter 6-digit OTP" {...field} disabled={loading} />
                             </FormControl>
                             <FormMessage />
                             </FormItem>
                         )}
                         />
                     )}
                     {/* Button text changes based on OTP state */}
                     <Button type="submit" className="w-full" disabled={loading}>
                       {loading ? 'Processing...' : (otpSent ? 'Verify OTP & Login' : 'Send OTP')}
                     </Button>
                </>
               )}

              <Button variant="outline" className="w-full" disabled> {/* onClick={handleGoogleLogin} disabled={loading}> */}
                Login with Google
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

    