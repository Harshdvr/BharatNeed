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
import { ensureAuthInitialized } from '@/lib/firebase/clientApp';
import { sendPasswordResetEmail, Auth } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/loading-spinner';

const emailSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotPasswordFormValues = z.infer<typeof emailSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
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

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
    mode: 'onChange',
  });

  const handlePasswordReset = async (values: ForgotPasswordFormValues) => {
    if (!authInstance) {
      toast({ title: "Error", description: "Authentication service not ready.", variant: "destructive" });
      return;
    }
    setLoading(true);

    console.log("Attempting password reset for:", values.email);
    try {
      await sendPasswordResetEmail(authInstance, values.email);
      console.log('Password reset email sent to:', values.email);
      toast({ title: 'Reset Email Sent', description: 'Check your inbox for instructions to reset your password.' });
      router.push('/login'); // Redirect to login page after sending email
    } catch (error: any) {
      console.error('Password reset error:', error);
      let description = error.message || 'Unknown error.';
      if (error.code === 'auth/user-not-found') {
          description = 'No account found with this email address.';
      } else if (error.code === 'auth/invalid-email') {
          description = 'Please enter a valid email address.';
      }
      toast({
        title: 'Password Reset Failed',
        description: description,
        variant: 'destructive',
      });
    } finally {
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
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader>
          <CardTitle className="text-xl">Forgot Password</CardTitle>
          <CardDescription>Enter your email address and we&apos;ll send you a link to reset your password.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handlePasswordReset)} className="grid gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="m@example.com" {...field} disabled={loading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            Remember your password?{' '}
            <Link href="/login" className="underline text-primary hover:text-primary/80">
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
