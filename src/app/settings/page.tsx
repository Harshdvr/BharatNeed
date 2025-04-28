'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Bell, Lock, Shield } from "lucide-react";

// TODO: Implement actual settings logic (state management, server actions)

export default function SettingsPage() {

    const handlePasswordChange = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle password change logic
        alert("Password change functionality not implemented.");
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
                            <Input id="current-password" type="password" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new-password">New Password</Label>
                            <Input id="new-password" type="password" required />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirm New Password</Label>
                            <Input id="confirm-password" type="password" required />
                        </div>
                        <Button type="submit" size="sm">Update Password</Button>
                    </form>

                    <Separator />

                    {/* Delete Account Section */}
                     <div>
                        <h3 className="text-lg font-medium text-destructive">Delete Account</h3>
                        <p className="text-sm text-muted-foreground mb-3">Permanently delete your account and all associated data. This action cannot be undone.</p>
                        <Button variant="destructive" size="sm" onClick={() => alert('Account deletion not implemented.')}>Delete My Account</Button>
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
                    <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="email-notifications" className="flex flex-col space-y-1">
                             <span>Email Notifications</span>
                             <span className="font-normal leading-snug text-muted-foreground">
                                Receive important updates via email.
                             </span>
                        </Label>
                         <Switch id="email-notifications" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between space-x-2">
                         <Label htmlFor="chat-notifications" className="flex flex-col space-y-1">
                             <span>New Chat Messages</span>
                             <span className="font-normal leading-snug text-muted-foreground">
                                Get notified about new messages in your chats.
                             </span>
                         </Label>
                         <Switch id="chat-notifications" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="promotions" className="flex flex-col space-y-1">
                             <span>Promotions & Offers</span>
                             <span className="font-normal leading-snug text-muted-foreground">
                                Receive occasional promotional content.
                             </span>
                        </Label>
                         <Switch id="promotions" />
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
                     <div className="flex items-center space-x-2">
                        <Checkbox id="show-phone" />
                        <Label htmlFor="show-phone" className="text-sm font-normal">
                            Allow others to see my phone number on my ads
                        </Label>
                     </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="show-location" defaultChecked />
                        <Label htmlFor="show-location" className="text-sm font-normal">
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