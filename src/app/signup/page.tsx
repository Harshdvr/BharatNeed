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
  createUserWithEmailAndPassword,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  updateProfile,
  ConfirmationResult,
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
    otp: z.string().length(6, 'OTP must be 6 digits').optional(),
});

type SignUpFormValues = z.infer<typeof emailSchema> | z.infer<typeof phoneSchema>;
type SignUpType = 'email' | 'phone';

declare global {
    interface Window {
        recaptchaVerifier?: RecaptchaVerifier;
        confirmationResult?: ConfirmationResult;
    }
}

export default function SignUpPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false); // State for loading spinner
  const [signUpType, setSignUpType] = useState<SignUpType>('email');
  const [otpSent, setOtpSent] = useState(false);

  const currentSchema = signUpType === 'email' ? emailSchema : phoneSchema;

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(currentSchema),
    defaultValues: signUpType === 'email'
        ? { firstName: '', lastName: '', email: '', password: '' }
        : { firstName: '', lastName: '', phone: '', otp: '' },
    mode: 'onChange', // Validate on change after first submission attempt
  });


    // Function to set up reCAPTCHA
    const setupRecaptcha = () => {
        // Ensure container exists
        const container = document.getElementById('recaptcha-container');
        if (!container) {
            console.error("Recaptcha container not found");
            toast({ title: "Error", description: "Could not initialize sign up system. Please refresh.", variant: "destructive" });
            return false;
        }

        if (!window.recaptchaVerifier) {
            try {
                 window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                    'size': 'invisible', // Use invisible reCAPTCHA
                    'callback': (response: any) => {
                        console.log("reCAPTCHA verified");
                    },
                    'expired-callback': () => {
                        toast({ title: "reCAPTCHA Expired", description: "Please try sending the OTP again.", variant: "destructive" });
                        window.recaptchaVerifier?.render().then(widgetId => {
                        // @ts-ignore - grecaptcha might not be typed correctly
                        window.grecaptcha?.reset(widgetId);
                        });
                    }
                });
                // Initial render is important for invisible reCAPTCHA
                window.recaptchaVerifier.render().catch((error) => {
                    console.error("Initial Recaptcha render failed", error);
                    toast({ title: "reCAPTCHA Error", description: "Could not initialize reCAPTCHA. Check console.", variant: "destructive" });
                 });
                 return true; // Indicate success
            } catch (error) {
                console.error("Error creating RecaptchaVerifier:", error);
                toast({ title: "Error", description: "Could not initialize sign up system. Please refresh.", variant: "destructive" });
                return false; // Indicate failure
            }
        }
         return true; // Already initialized
    };


   const handleSignUp = async (values: SignUpFormValues) => {
    setLoading(true); // Show spinner
    const displayName = `${values.firstName} ${values.lastName}`;

    if (signUpType === 'email' && 'email' in values && 'password' in values) {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, values.email!, values.password!);
        await updateProfile(userCredential.user, { displayName });
        console.log('User signed up with email:', userCredential.user);
        toast({ title: 'Sign Up Successful', description: 'Welcome! Redirecting...' });
        router.push('/'); // Redirect to home or profile page
      } catch (error: any) {
        console.error('Email sign up error:', error);
        toast({
          title: 'Sign Up Failed',
          description: error.message || 'An unknown error occurred.',
          variant: 'destructive',
        });
      }
    } else if (signUpType === 'phone' && 'phone' in values) {
        if (!setupRecaptcha()) { // Ensure reCAPTCHA is ready and handle failure
             setLoading(false);
             return;
        }
        const appVerifier = window.recaptchaVerifier;
        if (!appVerifier) {
             toast({ title: "reCAPTCHA Error", description: "reCAPTCHA not initialized. Please wait or refresh.", variant: "destructive" });
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
                console.error('Phone sign up error (Send OTP):', error);
                 // Reset reCAPTCHA is crucial on error
                 window.recaptchaVerifier?.render().then(widgetId => {
                     // @ts-ignore - grecaptcha might not be typed correctly
                     window.grecaptcha?.reset(widgetId);
                 }).catch(resetError => console.error("Error resetting reCAPTCHA:", resetError));
                toast({
                    title: 'Failed to Send OTP',
                    description: error.message || 'Could not send verification code. Check the number or try again.',
                    variant: 'destructive',
                });
            }
        } else {
             // Verify OTP
            if (!values.otp || values.otp.length !== 6) {
                 toast({ title: 'Invalid OTP', description: 'Please enter the 6-digit code.', variant: 'destructive' });
                 setLoading(false); // Keep loading false if validation fails client-side
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
                 await updateProfile(userCredential.user, { displayName });
                 console.log('User signed up with phone:', userCredential.user);
                 toast({ title: 'Sign Up Successful', description: 'Welcome! Redirecting...' });
                 router.push('/');
             } catch (error: any) {
                 console.error('Phone sign up error (Verify OTP):', error);
                 toast({
                     title: 'OTP Verification Failed',
                     description: error.message || 'Invalid code or error occurred.',
                     variant: 'destructive',
                 });
                  // Optionally reset OTP sent state here if verification fails permanently
                  // setOtpSent(false);
             }
         }
    }
    // Only set loading to false if it's not Phone OTP step or if an error occurred before OTP was sent/verified successfully
    if (signUpType !== 'phone' || (signUpType === 'phone' && !otpSent) || (signUpType === 'phone' && otpSent && window.confirmationResult /* Check if verification attempt happened */)) {
       setLoading(false); // Hide spinner
    }
  };


  return (
    <div className="flex items-center justify-center py-12 relative"> {/* Added relative */}
       {/* Conditionally render the spinner */}
        {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-50">
                 <LoadingSpinner />
            </div>
        )}
      {/* Container MUST exist in the DOM for invisible reCAPTCHA */}
      <div id="recaptcha-container"></div>
      <Card className="mx-auto max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Sign Up</CardTitle>
          <CardDescription>Enter your information to create an account</CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs value={signUpType} onValueChange={(value) => {
                setSignUpType(value as SignUpType);
                setOtpSent(false); // Reset OTP state on tab change
                form.reset(value === 'email'
                  ? { firstName: '', lastName: '', email: '', password: '' }
                  : { firstName: '', lastName: '', phone: '', otp: '' });
              }} className="w-full mb-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="phone">Phone</TabsTrigger>
              </TabsList>
            </Tabs>

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
                            <Input placeholder="Max" {...field} disabled={loading}/>
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
                            <Input placeholder="Robinson" {...field} disabled={loading}/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

               {signUpType === 'email' ? (
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
                        <FormLabel>Password</FormLabel>
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
                                 <Input type="number" placeholder="Enter 6-digit OTP" {...field} disabled={loading}/>
                             </FormControl>
                             <FormMessage />
                             </FormItem>
                         )}
                         />
                    )}

                </>
               )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Processing...' : (signUpType === 'phone' && !otpSent ? 'Send OTP' : (signUpType === 'phone' ? 'Verify OTP & Sign Up' : 'Create an account'))}
              </Button>
              <Button variant="outline" className="w-full" disabled> {/* TODO: Add Google Signup */}
                Sign up with Google
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="underline">
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
