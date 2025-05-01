
'use server';

import { auth, firestore, storage, ensureFirestoreInitialized, ensureStorageInitialized, ensureAuthInitialized } from '@/lib/firebase/clientApp'; // Adjust path as needed
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { revalidatePath } from 'next/cache'; // For revalidation
import { z } from 'zod';


// Define a schema for input validation
const postSchema = z.object({
    postType: z.enum(['need', 'offer'], { required_error: 'Post type is required.' }),
    title: z.string().min(1, 'Title is required.').max(100, 'Title too long.'),
    category: z.string().min(1, 'Category is required.'),
    description: z.string().min(10, 'Description must be at least 10 characters.').max(1000, 'Description too long.'),
    location: z.string().min(1, 'Location is required.'),
    budget: z.string().min(1, 'Budget/Price is required.'),
    urgency: z.string().min(1, 'Urgency is required.'),
    imageFiles: z.array(z.instanceof(File)).min(1, "At least one image is required.").max(10, "Maximum 10 images allowed.")
        .refine(files => files.every(file => file.size <= 5 * 1024 * 1024), `Each file must be 5MB or less.`), // 5MB limit per file
});


export async function handlePostSubmitAction(formData: FormData) {
    console.log("Post form submitted (server action)");

    try {
        // 1. Ensure Firebase services are initialized
        const fs = ensureFirestoreInitialized();
        const st = ensureStorageInitialized();
        const authInstance = ensureAuthInitialized(); // Ensure auth is ready to get user ID

        // 2. Get current user ID
         const currentUser = authInstance.currentUser;
         if (!currentUser) {
             console.error("User not authenticated.");
             return { success: false, error: 'User not authenticated. Please log in.' };
         }
         const userId = currentUser.uid;


        // 3. Extract and Validate Data using Zod
        const imageFiles = formData.getAll('image') as File[];

        const validatedData = postSchema.safeParse({
            postType: formData.get('post-type'),
            title: formData.get('title'),
            category: formData.get('category'),
            description: formData.get('description'),
            location: formData.get('location'),
            budget: formData.get('budget'),
            urgency: formData.get('urgency'),
            imageFiles: imageFiles,
        });

        if (!validatedData.success) {
             console.error("Validation failed:", validatedData.error.flatten().fieldErrors);
             // Return the first error message for simplicity
             const firstError = Object.values(validatedData.error.flatten().fieldErrors)[0]?.[0];
             return { success: false, error: firstError || 'Invalid input data.' };
        }

        const { postType, title, category, description, location, budget, urgency } = validatedData.data;

        // 4. Upload Images to Firebase Storage
        const imageUrls: string[] = [];
        console.log(`Uploading ${imageFiles.length} images...`);
        for (const file of imageFiles) {
             // Create a unique file name (e.g., using timestamp and random part)
             const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${file.name}`;
             const storageRef = ref(st, `postings/${userId}/${fileName}`); // Store in user-specific folder

            try {
                const snapshot = await uploadBytes(storageRef, file);
                const downloadURL = await getDownloadURL(snapshot.ref);
                imageUrls.push(downloadURL);
                 console.log(`Uploaded ${file.name}, URL: ${downloadURL}`);
            } catch (uploadError) {
                 console.error(`Error uploading file ${file.name}:`, uploadError);
                 // Decide how to handle partial uploads: stop, or continue and save partial data?
                 // Stopping here for robustness:
                 return { success: false, error: `Failed to upload image ${file.name}.` };
            }
        }
         console.log("All images uploaded successfully.");

        // 5. Save Post Data to Firestore
        const postingsCollection = collection(fs, "postings"); // Use your collection name
        const newPostData = {
            userId: userId, // Add user ID
            postType,
            title,
            category,
            description,
            location,
            budget,
            urgency,
            imageUrls, // Save array of URLs
            createdAt: serverTimestamp(), // Use server timestamp
            status: 'active', // Default status
            views: 0, // Initial views
        };

        await addDoc(postingsCollection, newPostData);
        console.log("Post saved successfully to Firestore.");

        // 6. Revalidate relevant paths (e.g., home page)
        revalidatePath('/'); // Revalidate the home page to show the new post
         revalidatePath('/my-ads'); // Revalidate the user's ads page

        return { success: true }; // Indicate success

    } catch (error: any) {
        console.error("Error in handlePostSubmitAction:", error);
        let errorMessage = 'Failed to save post.';
         if (error.message.includes("not initialized")) {
             errorMessage = "Database or storage service connection failed.";
         } else if (error.code === 'storage/unauthorized') {
             errorMessage = "Permission denied for image upload.";
         } else if (error.code === 'permission-denied') {
              errorMessage = "Permission denied to save post data.";
         } else if (error.code === 'unavailable' || error.message.includes('offline')) {
             errorMessage = "Network error. Please check your connection and try again.";
         }

        return { success: false, error: errorMessage }; // Indicate failure
    }
}
