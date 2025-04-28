
// src/lib/firebase/clientApp.ts
import { initializeApp, getApps, getApp, FirebaseApp, FirebaseOptions } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Use environment variables for Firebase config
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  // measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID // Optional
};

// Check if essential environment variables are set - Client-side check
if (typeof window !== 'undefined') {
    if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
        console.error("Essential Firebase environment variables (NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, NEXT_PUBLIC_FIREBASE_PROJECT_ID) are missing or invalid in the browser environment. Check your .env file and ensure it's correctly loaded.");
        // Display a user-friendly error, but avoid alert in production if possible
         if (process.env.NODE_ENV === 'development') {
           alert("Firebase Configuration Error: Missing essential keys. Check console and .env file.");
         }
    }
}


let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let firestore: Firestore | null = null;
let storage: FirebaseStorage | null = null;

// Initialize Firebase only on the client side
if (typeof window !== 'undefined') {
    try {
        // Check if already initialized
        app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
        console.log("Firebase initialized successfully on the client.");

        // Initialize services only if app initialization was successful
        auth = getAuth(app);
        firestore = getFirestore(app);
        storage = getStorage(app);

    } catch (error: any) {
        console.error("Firebase client initialization error:", error);
        // Provide more specific feedback if it's an API key issue during initialization
        if (error.message?.includes('api-key') || error.code === 'auth/invalid-api-key' || error.code === 'auth/invalid-credential') {
             console.error("Firebase Error: Invalid API Key or configuration. Please ensure your NEXT_PUBLIC_FIREBASE_API_KEY and other config values in the .env file are correct and the file is loaded.");
              if (process.env.NODE_ENV === 'development') {
                  alert("Firebase Configuration Error: Invalid API Key or config. Check console and .env file.");
              }
        } else {
             if (process.env.NODE_ENV === 'development') {
                 alert(`Firebase Initialization Error: ${error.message}. Check console.`);
             }
        }
         // Prevent the app from trying to use broken services
         app = null;
         auth = null;
         firestore = null;
         storage = null;
    }
} else {
     console.log("Firebase client initialization skipped on server-side.");
}

// Note: Firebase Admin SDK should be used for server-side operations, not this client SDK.

// Export Firebase services
// Components importing these should handle the possibility of them being null if init failed
export { app, auth, firestore, storage };


// Helper function remains useful for explicit checks within components
export const ensureAuthInitialized = (): Auth => {
  if (!auth) {
    // This error is more likely to be caught during development if the component logic requires auth
    throw new Error("Firebase Auth is not initialized. Check Firebase configuration and environment variables.");
  }
  return auth;
}
