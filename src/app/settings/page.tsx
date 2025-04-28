'use client';

import { useState } from 'react'; // Import useState
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Bell, Lock, Shield, Loader2 } from "lucide-react"; // Import Loader2
import Link from "next/link";
import { useToast } from '@/hooks/use-toast'; // Import useToast
import LoadingSpinner from '@/components/loading-spinner'; // Keep spinner import

export default function SettingsPage() {
    const [loadingPassword, setLoadingPassword] = useState(false); // Loading state for password change
    const [loadingDelete, setLoadingDelete] = useState(false); // Loading state for delete account
    // TODO: Add loading states for notification and privacy toggles if they involve server calls
    const { toast } = useToast();

    // TODO: Implement actual password change logic (likely a server action)
    const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoadingPassword(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        setLoadingPassword(false);
        toast({ title: "Success", description: "Password change simulated (not implemented)." });
        // alert("Password change functionality not implemented.");
        (e.target as HTMLFormElement).reset(); // Reset form on success/simulation
    };

    // TODO: Implement actual account deletion logic (likely a server action with confirmation)
    const handleDeleteAccount = async () => {
        // Add a confirmation dialog here first!
        const confirmed = window.confirm("Are you sure you want to delete your account? This action cannot be undone.");
        if (confirmed) {
            setLoadingDelete(true);
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000));
            setLoadingDelete(false);
            toast({ title: "Account Deletion", description: "Account deletion simulated (not implemented).", variant: "destructive" });
            // alert('Account deletion not implemented.');
            // TODO: Log user out and redirect
        }
    }

    // TODO: Implement actual save logic for notification/privacy settings (server action)
    const handleNotificationChange = async (id: string, checked: boolean) => {
        console.log(`Notification ${id} changed to ${checked}`);
        // Show temporary loading/toast
        toast({ description: `Updating ${id}...` });
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate save
        toast({ description: `Notification settings updated.` });
    };
    const handlePrivacyChange = async (id: string, checked: boolean) => {
        console.log(`Privacy setting ${id} changed to ${checked}`);
         toast({ description: `Updating ${id}...` });
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate save
        toast({ description: `Privacy settings updated.` });
    };


    return (
        <div className="container mx-auto px-4 py-8 max-w-3xl">
            <h1 className="text-3xl font-bold mb-8">Settings</h1>

            {/* Account Settings */}
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5"/> Account</CardTitle>
                    <CardDescription>Manage your account settings and password.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                     {/* Change Password Section */}
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                         <h3 className="text-lg font-medium">Change Password</h3>
                        <div className="space-y-2">
                            <Label htmlFor="current-password">Current Password</Label>
                            <Input id="current-password" type="password" required disabled={loadingPassword} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new-password">New Password</Label>
                            <Input id="new-password" type="password" required disabled={loadingPassword} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirm New Password</Label>
                            <Input id="confirm-password" type="password" required disabled={loadingPassword} />
                        </div>
                        <Button type="submit" size="sm" disabled={loadingPassword}>
                            {loadingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {loadingPassword ? 'Updating...' : 'Update Password'}
                        </Button>
                    </form>

                    <Separator />

                    {/* Delete Account Section */}
                     <div>
                        <h3 className="text-lg font-medium text-destructive">Delete Account</h3>
                        <p className="text-sm text-muted-foreground mb-3">Permanently delete your account and all associated data. This action cannot be undone.</p>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDeleteAccount}
                            disabled={loadingDelete}
                        >
                            {loadingDelete && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {loadingDelete ? 'Deleting...' : 'Delete My Account'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Notification Settings */}
             <Card className="mb-8">
                <CardHeader>
                     <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5"/> Notifications</CardTitle>
                    <CardDescription>Manage how you receive notifications.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* TODO: Add disabled state while saving */}
                    <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="email-notifications" className="flex flex-col space-y-1">
                             <span>Email Notifications</span>
                             <span className="font-normal leading-snug text-muted-foreground">
                                Receive important updates via email.
                             </span>
                        </Label>
                         <Switch
                            id="email-notifications"
                            defaultChecked
                            onCheckedChange={(checked) => handleNotificationChange('email-notifications', checked)}
                         />
                    </div>
                    <div className="flex items-center justify-between space-x-2">
                         <Label htmlFor="chat-notifications" className="flex flex-col space-y-1">
                             <span>New Chat Messages</span>
                             <span className="font-normal leading-snug text-muted-foreground">
                                Get notified about new messages in your chats.
                             </span>
                         </Label>
                         <Switch
                             id="chat-notifications"
                             defaultChecked
                             onCheckedChange={(checked) => handleNotificationChange('chat-notifications', checked)}
                          />
                    </div>
                    <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="promotions" className="flex flex-col space-y-1">
                             <span>Promotions & Offers</span>
                             <span className="font-normal leading-snug text-muted-foreground">
                                Receive occasional promotional content.
                             </span>
                        </Label>
                         <Switch
                            id="promotions"
                            onCheckedChange={(checked) => handleNotificationChange('promotions', checked)}
                         />
                    </div>
                </CardContent>
            </Card>

            {/* Privacy Settings */}
            <Card>
                <CardHeader>
                     <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5"/> Privacy</CardTitle>
                    <CardDescription>Control your privacy settings.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* TODO: Add disabled state while saving */}
                     <div className="flex items-center space-x-2">
                        <Checkbox
                            id="show-phone"
                            onCheckedChange={(checked) => handlePrivacyChange('show-phone', !!checked)} // Convert CheckedState
                         />
                        <Label htmlFor="show-phone" className="text-sm font-normal cursor-pointer">
                            Allow others to see my phone number on my ads
                        </Label>
                     </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                            id="show-location"
                            defaultChecked
                            onCheckedChange={(checked) => handlePrivacyChange('show-location', !!checked)} // Convert CheckedState
                        />
                        <Label htmlFor="show-location" className="text-sm font-normal cursor-pointer">
                           Show approximate location (City, State) on my ads
                        </Label>
                     </div>
                     <div>
                        <p className="text-sm mt-4">For more details, please review our <Link href="/privacy" className="underline text-primary">Privacy Policy</Link>.</p>
                     </div>
                </CardContent>
            </Card>

        </div>
    );
}
