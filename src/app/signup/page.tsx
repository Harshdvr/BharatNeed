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
  const [loading, setLoading] = useState(false);
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
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'size': 'invisible', // Use invisible reCAPTCHA
                'callback': (response: any) => {
                    // reCAPTCHA solved, allow signInWithPhoneNumber.
                    console.log("reCAPTCHA verified");
                },
                'expired-callback': () => {
                    // Response expired. Ask user to solve reCAPTCHA again.
                    toast({ title: "reCAPTCHA Expired", description: "Please try sending the OTP again.", variant: "destructive" });
                    window.recaptchaVerifier?.render().then(widgetId => {
                     // @ts-ignore - grecaptcha might not be typed correctly
                      window.grecaptcha?.reset(widgetId);
                    });
                }
            });
             window.recaptchaVerifier.render().catch((error) => {
                 console.error("Recaptcha render failed", error);
                 toast({ title: "reCAPTCHA Error", description: "Could not initialize reCAPTCHA. Please refresh.", variant: "destructive" });
             });
        }
    };


   const handleSignUp = async (values: SignUpFormValues) => {
    setLoading(true);
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
        setupRecaptcha(); // Ensure reCAPTCHA is ready
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
                console.error('Phone sign up error (Send OTP):', error);
                 window.recaptchaVerifier?.render().then(widgetId => {
                     // @ts-ignore - grecaptcha might not be typed correctly
                     window.grecaptcha?.reset(widgetId);
                 });
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
             }
         }
    }
    setLoading(false);
  };


  return (
    <div className="flex items-center justify-center py-12">
      {loading && <LoadingSpinner className="absolute inset-0 bg-background/50 z-50" />}
      <div id="recaptcha-container"></div> {/* Container for invisible reCAPTCHA */}
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
                            <Input placeholder="Max" {...field} />
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
                            <Input placeholder="Robinson" {...field} />
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
                          <Input type="email" placeholder="m@example.com" {...field} />
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
                          <Input type="password" {...field} />
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
                            <Input type="tel" placeholder="+919876543210" {...field} disabled={otpSent} />
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
                                 <Input type="number" placeholder="Enter 6-digit OTP" {...field} />
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
