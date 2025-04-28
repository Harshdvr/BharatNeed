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
import { auth } from '@/lib/firebase/clientApp';
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
  const [loading, setLoading] = useState(false); // State for loading spinner
  const [signUpType, setSignUpType] = useState<SignUpType>('email');
  const [otpSent, setOtpSent] = useState(false);
  const recaptchaContainerId = "recaptcha-container-signup"; // Define ID

  // Cleanup function for reCAPTCHA
  useEffect(() => {
    return () => {
      try {
         window.signUpRecaptchaVerifier?.clear(); // Clean up verifier instance if component unmounts
      } catch(error) {
         console.warn("Error cleaning up signup reCAPTCHA:", error);
      }
    };
  }, []);

  const currentSchema = signUpType === 'email' ? emailSchema : phoneSchema;

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(currentSchema),
    defaultValues: signUpType === 'email'
        ? { firstName: '', lastName: '', email: '', password: '' }
        : { firstName: '', lastName: '', phone: '', otp: '' },
    mode: 'onChange', // Validate on change after first submission attempt
  });


    // Function to set up reCAPTCHA
    const setupRecaptcha = async (): Promise<RecaptchaVerifier | null> => {
        // Ensure container exists
        const container = document.getElementById(recaptchaContainerId);
        if (!container) {
            console.error("Recaptcha container not found:", recaptchaContainerId);
            toast({ title: "Error", description: "Sign up system initialization failed. Please refresh.", variant: "destructive" });
            return null;
        }

         // Avoid creating multiple verifiers if one exists and hasn't been cleared
         if (window.signUpRecaptchaVerifier) {
            try {
                // Attempt to render to be sure it's active
                await window.signUpRecaptchaVerifier.render();
                return window.signUpRecaptchaVerifier;
            } catch (error) {
                console.warn("Re-rendering existing signup verifier failed, creating new one.", error);
                // If render fails, clear the old one and proceed to create a new one
                 window.signUpRecaptchaVerifier.clear();
                 window.signUpRecaptchaVerifier = undefined;
            }
         }


        try {
             const verifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
                'size': 'invisible', // Use invisible reCAPTCHA
                'callback': (response: any) => {
                    console.log("reCAPTCHA verified for signup (callback)");
                    // For invisible reCAPTCHA, this might not be essential as signIn promise resolves
                },
                'expired-callback': () => {
                    toast({ title: "reCAPTCHA Expired", description: "Please try sending the OTP again.", variant: "destructive" });
                    window.signUpRecaptchaVerifier?.clear(); // Clear the expired verifier
                    window.signUpRecaptchaVerifier = undefined;
                    setOtpSent(false); // Allow user to retry sending OTP
                }
            });
            window.signUpRecaptchaVerifier = verifier;
            // Initial render is important!
            await verifier.render();
            console.log("Signup reCAPTCHA rendered.");
            return verifier;

        } catch (error) {
            console.error("Error creating/rendering signup RecaptchaVerifier:", error);
            toast({ title: "reCAPTCHA Error", description: "Could not initialize sign up system. Please refresh.", variant: "destructive" });
            return null; // Indicate failure
        }
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
          description: error.code === 'auth/email-already-in-use'
            ? 'This email is already registered. Try logging in.'
            : error.message || 'An unknown error occurred.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false); // Hide spinner for email signup
      }
    } else if (signUpType === 'phone' && 'phone' in values) {

        if (!otpSent) {
            // Send OTP phase
            const appVerifier = await setupRecaptcha(); // Ensure reCAPTCHA is ready
            if (!appVerifier) {
                setLoading(false);
                return; // Stop if reCAPTCHA setup failed
            }

            try {
                console.log("Attempting to send OTP for signup to:", values.phone);
                const confirmationResult = await signInWithPhoneNumber(auth, values.phone!, appVerifier);
                window.signUpConfirmationResult = confirmationResult; // Store globally (or in state/ref)
                setOtpSent(true); // Update state to show OTP field
                 toast({ title: 'OTP Sent', description: `Verification code sent to ${values.phone}` });
                 console.log("Signup OTP sent, confirmation result stored.");
            } catch (error: any) {
                console.error('Phone sign up error (Send OTP):', error);
                console.error('Error Code:', error.code);
                console.error('Error Message:', error.message);
                 // Reset reCAPTCHA on error
                 window.signUpRecaptchaVerifier?.render().then(widgetId => {
                    window.grecaptcha?.reset(widgetId); // Use grecaptcha directly if available
                    window.signUpRecaptchaVerifier?.clear(); // Also clear Firebase wrapper state
                    window.signUpRecaptchaVerifier = undefined;
                 }).catch(resetError => console.warn("Error resetting reCAPTCHA:", resetError));

                toast({
                    title: 'Failed to Send OTP',
                    description: `Error: ${error.message || error.code || 'Unknown error'}. Check the number or try again.`,
                    variant: 'destructive',
                });
            } finally {
                setLoading(false); // Stop loading after OTP attempt
            }
        } else {
             // Verify OTP phase
            if (!values.otp || values.otp.length !== 6) {
                 toast({ title: 'Invalid OTP', description: 'Please enter the 6-digit code.', variant: 'destructive' });
                 setLoading(false); // Keep loading false if validation fails client-side
                 return;
            }
             if (!window.signUpConfirmationResult) {
                toast({ title: 'Verification Error', description: 'Please request OTP again.', variant: 'destructive' });
                setOtpSent(false); // Reset state
                setLoading(false);
                return;
             }
             try {
                 console.log("Attempting to confirm signup OTP:", values.otp);
                 // Phone Auth signs the user in. If the number is new, it creates the account.
                 // If the number exists, it signs them in. We need to handle the display name update.
                 const userCredential = await window.signUpConfirmationResult.confirm(values.otp);
                 // Update profile *after* confirming OTP
                 if (userCredential.user) {
                     await updateProfile(userCredential.user, { displayName });
                     console.log('User signed up/logged in with phone:', userCredential.user);
                     toast({ title: 'Sign Up Successful', description: 'Welcome! Redirecting...' });
                     router.push('/');
                      // Cleanup on success
                      window.signUpConfirmationResult = undefined;
                      window.signUpRecaptchaVerifier?.clear();
                      window.signUpRecaptchaVerifier = undefined;
                 } else {
                    throw new Error("User not found after OTP confirmation.");
                 }

             } catch (error: any) {
                 console.error('Phone sign up error (Verify OTP):', error);
                 console.error('Error Code:', error.code);
                 console.error('Error Message:', error.message);
                 toast({
                     title: 'OTP Verification Failed',
                      description: `Error: ${error.code === 'auth/invalid-verification-code' ? 'Invalid OTP.' : (error.message || 'Unknown error.')}`,
                     variant: 'destructive',
                 });
                  // Consider if OTP state should be reset here
                  // setOtpSent(false);
             } finally {
                 setLoading(false); // Stop loading after OTP verification attempt
             }
         }
    } else {
        console.error("Form submission error: values structure mismatch.");
        setLoading(false);
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
      <div id={recaptchaContainerId}></div>

      <Card className="mx-auto max-w-sm w-full"> {/* Added w-full */}
        <CardHeader>
          <CardTitle className="text-xl">Sign Up</CardTitle>
          <CardDescription>Enter your information to create an account</CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs value={signUpType} onValueChange={(value) => {
                setSignUpType(value as SignUpType);
                setOtpSent(false); // Reset OTP state on tab change
                 // Clear relevant reCAPTCHA if switching away from phone
                 if (value !== 'phone') {
                     window.signUpRecaptchaVerifier?.clear();
                     window.signUpRecaptchaVerifier = undefined;
                     window.signUpConfirmationResult = undefined;
                 }
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
             {/* Use key prop to force re-render on type change, ensures schema updates */}
            <form key={signUpType} onSubmit={form.handleSubmit(handleSignUp)} className="grid gap-4">
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
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Processing...' : 'Create an account'}
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
                                 <Input type="number" placeholder="Enter 6-digit OTP" {...field} disabled={loading}/>
                             </FormControl>
                             <FormMessage />
                             </FormItem>
                         )}
                         />
                    )}
                    {/* Button text changes based on OTP state */}
                    <Button type="submit" className="w-full" disabled={loading}>
                       {loading ? 'Processing...' : (otpSent ? 'Verify OTP & Sign Up' : 'Send OTP')}
                     </Button>

                </>
               )}

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

    