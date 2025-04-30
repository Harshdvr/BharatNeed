
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
  FormDescription, // Import FormDescription
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useState, useEffect, useRef } from 'react';
import { ensureAuthInitialized } from '@/lib/firebase/clientApp';
import {
  createUserWithEmailAndPassword,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  updateProfile,
  ConfirmationResult,
  Auth,
} from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoadingSpinner from '@/components/loading-spinner';

// Common fields schema part
const commonSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  age: z.coerce.number().min(18, 'You must be at least 18 years old'), // Added age field with coercion
});

// Email signup schema
const emailSchema = commonSchema.extend({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'], // Set error on confirmPassword field
});

// Phone signup schema
const phoneSchema = commonSchema.extend({
    phone: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Invalid phone number format (e.g., +919876543210)'),
    otp: z.string().optional(),
}).refine(data => !data.otp || data.otp.length === 6, {
    message: "OTP must be 6 digits",
    path: ["otp"],
});

// Combined type for form values
type SignUpFormValues = z.infer<typeof emailSchema> | z.infer<typeof phoneSchema>;
type SignUpType = 'email' | 'phone';

// Declare window object augmentation for reCAPTCHA (keep as is)
declare global {
    interface Window {
        grecaptcha?: any;
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
  const recaptchaContainerId = "recaptcha-container-signup";
  const [authInstance, setAuthInstance] = useState<Auth | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const recaptchaWidgetIdRef = useRef<number | null>(null);

  // Ensure Firebase Auth is initialized
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
    return () => {
      console.log("SignUpPage cleanup: Clearing reCAPTCHA verifier if exists.");
      recaptchaVerifierRef.current?.clear();
      recaptchaVerifierRef.current = null;
      recaptchaWidgetIdRef.current = null;
      window.signUpConfirmationResult = undefined;
    };
  }, [signUpType]);

  const currentSchema = signUpType === 'email' ? emailSchema : phoneSchema;

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(currentSchema),
    defaultValues: signUpType === 'email'
        ? { firstName: '', lastName: '', age: undefined, email: '', password: '', confirmPassword: '' }
        : { firstName: '', lastName: '', age: undefined, phone: '', otp: '' },
    mode: 'onChange',
  });

  // Function to set up reCAPTCHA
  const setupRecaptcha = (): Promise<RecaptchaVerifier | null> => {
    return new Promise((resolve, reject) => {
        if (!authInstance) {
            toast({ title: "Error", description: "Authentication service not ready.", variant: "destructive" });
            return reject(new Error("Auth not ready"));
        }

        let container = document.getElementById(recaptchaContainerId);
        if (!container) {
             console.error("Recaptcha container element not found, creating dynamically:", recaptchaContainerId);
             container = document.createElement('div');
             container.id = recaptchaContainerId;
             document.body.appendChild(container);
        }

        if (recaptchaVerifierRef.current) {
            console.log("Clearing previous reCAPTCHA verifier instance via ref for signup.");
            recaptchaVerifierRef.current.clear();
            recaptchaVerifierRef.current = null;
            recaptchaWidgetIdRef.current = null;
        }
        window.signUpRecaptchaVerifier?.clear();
        window.signUpRecaptchaVerifier = undefined;

        console.log("Creating new RecaptchaVerifier instance for signup.");
        try {
            const verifier = new RecaptchaVerifier(authInstance, recaptchaContainerId, {
                'size': 'invisible',
                'callback': (response: any) => {
                    console.log("reCAPTCHA verified for signup (callback). Response:", response);
                },
                'expired-callback': () => {
                    toast({ title: "reCAPTCHA Expired", description: "Please try sending the OTP again.", variant: "destructive" });
                    recaptchaVerifierRef.current?.clear();
                    recaptchaVerifierRef.current = null;
                    recaptchaWidgetIdRef.current = null;
                    setOtpSent(false);
                    reject(new Error("reCAPTCHA expired"));
                },
                'error-callback': (error: any) => {
                    console.error("reCAPTCHA error (error-callback) for signup:", error);
                    toast({ title: "reCAPTCHA Error", description: `Failed to verify. ${error?.message || 'Please try again.'}`, variant: "destructive"});
                    recaptchaVerifierRef.current?.clear();
                    recaptchaVerifierRef.current = null;
                    recaptchaWidgetIdRef.current = null;
                    setOtpSent(false);
                    reject(new Error("reCAPTCHA verification error"));
                }
            });
            recaptchaVerifierRef.current = verifier;

            verifier.render().then((widgetId) => {
                console.log("Signup reCAPTCHA rendered successfully. Widget ID:", widgetId);
                recaptchaWidgetIdRef.current = widgetId;
                resolve(verifier);
            }).catch((error) => {
                console.error("Signup Recaptcha render failed:", error);
                toast({ title: "reCAPTCHA Error", description: "Could not initialize sign up reCAPTCHA. Refresh might help.", variant: "destructive" });
                recaptchaVerifierRef.current?.clear();
                recaptchaVerifierRef.current = null;
                recaptchaWidgetIdRef.current = null;
                reject(error);
            });

        } catch (error) {
            console.error("Error creating/rendering signup RecaptchaVerifier:", error);
            toast({ title: "Setup Error", description: "Could not initialize sign up system. Please refresh.", variant: "destructive" });
            reject(error);
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
    // Log age (ensure it's part of values)
    console.log("Age submitted:", values.age);

    if (signUpType === 'email' && 'email' in values && 'password' in values) {
      console.log("Attempting email signup for:", values.email);
      try {
        const userCredential = await createUserWithEmailAndPassword(authInstance, values.email!, values.password!);
        await updateProfile(userCredential.user, { displayName });
        // TODO: Save age to user profile in Firestore if needed
        console.log('User signed up with email:', userCredential.user.uid, " Name:", displayName, "Age:", values.age);
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
            : `Error: ${error.message || 'Unknown error.'}`,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    } else if (signUpType === 'phone' && 'phone' in values) {
        try {
            if (!otpSent) {
                const appVerifier = await setupRecaptcha();
                if (!appVerifier) {
                     console.error("reCAPTCHA setup failed, cannot send OTP for signup.");
                     throw new Error("reCAPTCHA Verifier setup failed.");
                }

                 console.log("Using appVerifier for signup:", appVerifier);
                 console.log("Attempting to send OTP for signup to:", values.phone);
                const confirmationResult = await signInWithPhoneNumber(authInstance, values.phone!, appVerifier);
                window.signUpConfirmationResult = confirmationResult;
                setOtpSent(true);
                form.reset({...values, otp: ''});
                 toast({ title: 'OTP Sent', description: `Verification code sent to ${values.phone}` });
                 console.log("Signup OTP sent, confirmation result stored.");
            } else {
                 if (!values.otp) {
                     form.setError("otp", { type: "manual", message: "OTP is required." });
                     throw new Error("OTP is required.");
                 }
                 if (values.otp.length !== 6) {
                     form.setError("otp", { type: "manual", message: "OTP must be 6 digits." });
                     throw new Error("OTP must be 6 digits.");
                 }
                 if (!window.signUpConfirmationResult) {
                    toast({ title: 'Verification Error', description: 'Confirmation session expired or invalid. Please request OTP again.', variant: 'destructive' });
                    setOtpSent(false);
                    recaptchaVerifierRef.current?.clear();
                    recaptchaVerifierRef.current = null;
                    recaptchaWidgetIdRef.current = null;
                    throw new Error("Confirmation session expired or invalid.");
                 }
                 console.log("Attempting to confirm signup OTP:", values.otp);
                 const userCredential = await window.signUpConfirmationResult.confirm(values.otp);

                 if (userCredential.user) {
                     console.log("Phone user confirmed/created:", userCredential.user.uid);
                     if (userCredential.user.displayName !== displayName) {
                        console.log("Updating display name for user:", userCredential.user.uid, "to:", displayName);
                        await updateProfile(userCredential.user, { displayName });
                     }
                      // TODO: Save age to user profile in Firestore if needed
                     console.log('User signed up/logged in with phone:', userCredential.user.uid, "Age:", values.age);
                     toast({ title: 'Sign Up Successful', description: 'Welcome! Redirecting...' });
                      window.signUpConfirmationResult = undefined;
                      recaptchaVerifierRef.current?.clear();
                      recaptchaVerifierRef.current = null;
                      recaptchaWidgetIdRef.current = null;
                     router.push('/');
                 } else {
                    throw new Error("User object not found after OTP confirmation.");
                 }
            }
        } catch (error: any) {
             console.error(`Phone sign up error (${otpSent ? 'Verify OTP' : 'Send OTP'}):`, error);
             console.error('Error Code:', error.code);
             console.error('Error Message:', error.message);

             if (!otpSent && recaptchaVerifierRef.current) {
                console.warn("Resetting reCAPTCHA due to Send OTP error during signup.");
                 // Attempt to reset reCAPTCHA widget if possible
                 try {
                     const widgetId = recaptchaWidgetIdRef.current;
                     if (window.grecaptcha && widgetId !== null) {
                         window.grecaptcha.reset(widgetId);
                         console.log("Explicitly reset reCAPTCHA widget with ID:", widgetId);
                     } else {
                         console.warn("Could not explicitly reset reCAPTCHA widget (window.grecaptcha or widgetId missing). Clearing verifier ref.");
                          recaptchaVerifierRef.current.clear(); // Fallback to clearing the ref
                     }
                 } catch (resetError) {
                      console.error("Error resetting reCAPTCHA widget:", resetError);
                      recaptchaVerifierRef.current.clear(); // Fallback if reset fails
                 }
                recaptchaVerifierRef.current = null;
                recaptchaWidgetIdRef.current = null;
             }

             const title = otpSent ? 'OTP Verification Failed' : 'Failed to Send OTP';
             let description = `Error: ${error.message || 'Unknown error.'}`;

            if (error.code === 'auth/configuration-not-found') {
                description = "reCAPTCHA configuration error. Please ensure Phone Auth is enabled in Firebase and the page has loaded correctly. Refreshing might help.";
            } else if (error.code === 'auth/invalid-phone-number') {
                 description = "Invalid phone number format. Please use the format +91XXXXXXXXXX.";
            } else if (error.code === 'auth/invalid-verification-code') {
                 description = 'Invalid OTP entered. Please try again.';
            } else if (error.code === 'auth/too-many-requests') {
                 description = 'Too many attempts. Please try again later.';
            } else if (error.code?.includes('auth/network-request-failed')) {
                 description = 'Network error. Please check your connection and try again.';
            } else if (error.message?.includes('reCAPTCHA')) {
                 description = 'reCAPTCHA verification failed. Please try again.';
             } else if (error.code === 'auth/api-key-not-valid') {
                 description = 'Invalid Firebase API Key. Please check your configuration.';
             }

             toast({
                title: title,
                description: description,
                variant: 'destructive',
             });
             if (error.message.includes('expired') || error.code === 'auth/code-expired' || error.code === 'auth/session-expired') {
                 setOtpSent(false);
             }
        } finally {
            setLoading(false);
        }
    } else {
        console.error("Form submission error: values structure mismatch or invalid signup type.");
         toast({ title: "Error", description: "An unexpected error occurred during signup.", variant: "destructive" });
        setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center py-12 relative">
       {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-50">
                 <LoadingSpinner />
            </div>
        )}
      {/* Container MUST exist in the DOM for invisible reCAPTCHA */}
      <div id={recaptchaContainerId} style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}></div>

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
                setOtpSent(false);
                form.reset(newType === 'email'
                  ? { firstName: '', lastName: '', age: undefined, email: '', password: '', confirmPassword: '' }
                  : { firstName: '', lastName: '', age: undefined, phone: '', otp: '' });
              }} className="w-full mb-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="phone">Phone</TabsTrigger>
              </TabsList>
            </Tabs>

          <Form {...form}>
            <form key={signUpType} onSubmit={form.handleSubmit(handleSignUp)} className="grid gap-4">
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

                  {/* Age Field - Common to both */}
                   <FormField
                      control={form.control}
                      name="age"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Age</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="Your age (must be 18+)" {...field} onChange={event => field.onChange(+event.target.value)} disabled={loading || (signUpType === 'phone' && otpSent)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />


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
                        <FormDescription>
                          Password must be at least 6 characters long.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
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
                            form.reset({...form.getValues(), otp: ''});
                            window.signUpConfirmationResult = undefined;
                            recaptchaVerifierRef.current?.clear();
                            recaptchaVerifierRef.current = null;
                            recaptchaWidgetIdRef.current = null;
                        }} className="text-sm" type="button" disabled={loading}>
                            Change Number or Resend OTP
                        </Button>
                     )}
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

    