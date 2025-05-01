--- a/src/app/postings/[id]/page.tsx
+++ b/src/app/postings/[id]/page.tsx
@@ -5,6 +5,7 @@
 import { Badge } from "@/components/ui/badge";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
+import { Input } from "@/components/ui/input";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { Edit, IndianRupee, MapPin, MoreVertical, Trash2 } from "lucide-react";
 import Image from "next/image";
@@ -12,6 +13,7 @@
 import { useToast } from '@/hooks/use-toast';
 import { useAuthState } from 'react-firebase-hooks/auth';
 import { auth, firestore, ensureFirestoreInitialized } from '@/lib/firebase/clientApp'; // Import auth, firestore, and helper
+import { useState } from 'react';
 import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore'; // Import Firestore functions
 

 interface Posting {
@@ -22,6 +24,8 @@
     budget?: string;
     description?: string;
     imageUrls?: string[]; // Assuming multiple images
+    canBid?: boolean; // Indicate if bidding is allowed
+    canNegotiate?: boolean; // Indicate if negotiation is allowed
     views?: number;
     datePosted?: any; // Firestore Timestamp or Date
     userId?: string; // Added userId field
@@ -60,6 +64,8 @@
 
         }
     }
+
+
 */
 
     return (
@@ -79,6 +85,28 @@
             </div>
             <div className="md:col-span-1 space-y-4">
                  {/* User Info Card */}
+                   <h2 className="text-lg font-semibold mb-2">Actions</h2>
+                    {ad?.canBid && (
+                         <div className="border rounded-lg p-4">
+                            <h4 className="text-sm font-medium mb-2">Submit a Bid</h4>
+                            <Input type="number" placeholder="Your Bid (₹)" className="mb-2"/>
+                            <Button size="sm">Submit Bid</Button>
+                             {/* TO DO: Implement bid submission logic here (Server Action) */}
+                         </div>
+                    )}
+                    {ad?.canNegotiate && (
+                        <div className="border rounded-lg p-4">
+                             <h4 className="text-sm font-medium mb-2">Negotiate Price</h4>
+                             <Input type="number" placeholder="Your Offer (₹)" className="mb-2"/>
+                             <Button size="sm">Send Offer</Button>
+                              {/* TO DO: Implement send offer logic here (Server Action) */}
+                        </div>
+                    )}
+                      <Button variant="outline">Contact Seller</Button>
+                       <Button variant="outline">Share</Button>
+                       <Button variant="destructive">Report</Button>
+
+                  {/* User Info Card */}
                  <Card className="shadow-md">
                     <CardHeader>
                         <CardTitle>Seller Information</CardTitle>
@@ -136,3 +164,4 @@
     );
 }
 
+
