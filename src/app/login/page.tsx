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
import { useState } from 'react';
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

// Make recaptchaVerifier and confirmationResult global or manage in component state
declare global {
    interface Window {
        recaptchaVerifier?: RecaptchaVerifier;
        confirmationResult?: ConfirmationResult;
    }
}


export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false); // State to control loading spinner
  const [loginType, setLoginType] = useState<LoginType>('email');
  const [otpSent, setOtpSent] = useState(false);


  const currentSchema = loginType === 'email' ? emailSchema : phoneSchema;

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(currentSchema),
    defaultValues: loginType === 'email' ? { email: '', password: '' } : { phone: '', otp: '' },
     mode: 'onChange',
  });

 // Function to set up reCAPTCHA
    const setupRecaptcha = () => {
        if (!window.recaptchaVerifier) {
             // Check if container exists before creating verifier
            const container = document.getElementById('recaptcha-container-login');
            if (!container) {
                console.error("Recaptcha container not found");
                toast({ title: "Error", description: "Could not initialize login system. Please refresh.", variant: "destructive" });
                return false; // Indicate failure
            }
            try {
                window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container-login', {
                    'size': 'invisible', // Use invisible reCAPTCHA
                    'callback': (response: any) => {
                        console.log("reCAPTCHA verified for login");
                    },
                    'expired-callback': () => {
                        toast({ title: "reCAPTCHA Expired", description: "Please try sending the OTP again.", variant: "destructive" });
                         window.recaptchaVerifier?.render().then(widgetId => {
                             // @ts-ignore
                             window.grecaptcha?.reset(widgetId);
                         });
                    }
                });
                 window.recaptchaVerifier.render().catch((error) => {
                     console.error("Recaptcha render failed", error);
                     toast({ title: "reCAPTCHA Error", description: "Could not initialize reCAPTCHA. Please refresh.", variant: "destructive" });
                 });
            } catch (error) {
                 console.error("Error creating RecaptchaVerifier:", error);
                 toast({ title: "Error", description: "Could not initialize login system. Please refresh.", variant: "destructive" });
                 return false; // Indicate failure
            }
        }
        return true; // Indicate success
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
       if (!setupRecaptcha()) { // Setup reCAPTCHA and check if successful
           setLoading(false);
           return;
       }
       const appVerifier = window.recaptchaVerifier;
         if (!appVerifier) {
             toast({ title: "reCAPTCHA Error", description: "reCAPTCHA not initialized.", variant: "destructive" });
             setLoading(false);
             return;
         }

        if (!otpSent) {
             // Send OTP
            try {
                 const confirmationResult = await signInWithPhoneNumber(auth, values.phone!, appVerifier);
                 window.confirmationResult = confirmationResult;
                 setOtpSent(true);
                 toast({ title: 'OTP Sent', description: `Verification code sent to ${values.phone}` });
            } catch (error: any) {
                 console.error('Phone login error (Send OTP):', error);
                  window.recaptchaVerifier?.render().then(widgetId => {
                      // @ts-ignore
                      window.grecaptcha?.reset(widgetId);
                  });
                 toast({
                    title: 'Failed to Send OTP',
                    description: error.message || 'Could not send verification code. Is the number registered?',
                    variant: 'destructive',
                 });
            } finally {
                setLoading(false); // Stop loading after OTP attempt
            }
        } else {
             // Verify OTP
             if (!values.otp || values.otp.length !== 6) {
                 toast({ title: 'Invalid OTP', description: 'Please enter the 6-digit code.', variant: 'destructive' });
                 setLoading(false);
                 return;
             }
             if (!window.confirmationResult) {
                toast({ title: 'Verification Error', description: 'Please request OTP again.', variant: 'destructive' });
                setOtpSent(false); // Reset state
                setLoading(false);
                return;
             }
            try {
                 const userCredential = await window.confirmationResult.confirm(values.otp);
                 console.log('User logged in with phone:', userCredential.user);
                 toast({ title: 'Login Successful', description: 'Welcome back!' });
                 router.push('/');
            } catch (error: any) {
                 console.error('Phone login error (Verify OTP):', error);
                 toast({
                     title: 'OTP Verification Failed',
                     description: error.message || 'Invalid code or error occurred.',
                     variant: 'destructive',
                 });
            } finally {
                setLoading(false); // Stop loading after OTP verification attempt
            }
        }
    } else {
         // Fallback if values don't match expected structure
         setLoading(false);
    }

  };

  // TODO: Implement Google Login
  // const handleGoogleLogin = async () => {
  //   setLoading(true);
  //   const provider = new GoogleAuthProvider();
  //   try {
  //     const result = await signInWithPopup(auth, provider);
  //     console.log('User logged in with Google:', result.user);
  //     toast({ title: 'Login Successful', description: 'Welcome back!' });
  //     router.push('/');
  //   } catch (error: any) {
  //     console.error('Google login error:', error);
  //     toast({
  //       title: 'Google Login Failed',
  //       description: error.message || 'An unknown error occurred.',
  //       variant: 'destructive',
  //     });
  //   }
  //   setLoading(false);
  // };


  return (
    <div className="flex items-center justify-center py-12 relative"> {/* Added relative for spinner positioning */}
        {/* Conditionally render the spinner */}
        {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-50">
                <LoadingSpinner />
            </div>
        )}
         {/* Container for invisible reCAPTCHA - Needs unique ID if signup is on same page potentially */}
        <div id="recaptcha-container-login"></div>
      <Card className="mx-auto max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>Enter your credentials below to login</CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs value={loginType} onValueChange={(value) => {
                setLoginType(value as LoginType);
                setOtpSent(false); // Reset OTP state
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
                </>
               )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Processing...' : (loginType === 'phone' && !otpSent ? 'Send OTP' : (loginType === 'phone' ? 'Verify OTP & Login' : 'Login'))}
              </Button>
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
