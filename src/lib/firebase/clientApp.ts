// src/lib/firebase/clientApp.ts
import { initializeApp, getApps, getApp, FirebaseApp, FirebaseOptions } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, enableIndexedDbPersistence, CACHE_SIZE_UNLIMITED } from 'firebase/firestore'; // Added persistence and cache setting
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

// Client-side check for essential environment variables
if (typeof window !== 'undefined') {
    console.log("Firebase Config Check (Client):", {
        apiKeyExists: !!firebaseConfig.apiKey,
        authDomainExists: !!firebaseConfig.authDomain,
        projectIdExists: !!firebaseConfig.projectId,
    });
    if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
        console.error("CRITICAL Firebase Configuration Error: Essential Firebase environment variables (NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, NEXT_PUBLIC_FIREBASE_PROJECT_ID) are missing or invalid in the browser environment. Ensure they are correctly defined in your .env.local file and prefixed with NEXT_PUBLIC_. Restart your development server after changes.");
         if (process.env.NODE_ENV === 'development') {
           alert("CRITICAL Firebase Configuration Error: Missing essential keys. Check console and .env.local file. App functionality will be limited.");
         }
    }
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let firestore: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let persistenceEnabled = false; // Flag to track persistence status

// Initialize Firebase only on the client side
if (typeof window !== 'undefined') {
    try {
        // Check if already initialized to prevent reinitialization errors
        if (!getApps().length) {
            app = initializeApp(firebaseConfig);
            console.log("Firebase initialized successfully on the client.");
        } else {
            app = getApp();
            console.log("Firebase app already initialized.");
        }


        if (app) {
            // Initialize services only if app initialization was successful
            auth = getAuth(app);
            firestore = getFirestore(app);
            storage = getStorage(app);

            // Enable Offline Persistence (best effort)
            enableIndexedDbPersistence(firestore, { cacheSizeBytes: CACHE_SIZE_UNLIMITED })
                .then(() => {
                    persistenceEnabled = true;
                    console.log("Firestore offline persistence enabled.");
                })
                .catch((err) => {
                    if (err.code == 'failed-precondition') {
                        console.warn("Firestore Persistence failed: Multiple tabs open? Only one tab can have persistence enabled at a time.");
                    } else if (err.code == 'unimplemented') {
                        console.warn("Firestore Persistence failed: Browser does not support persistence.");
                    } else {
                         console.error("Firestore Persistence failed with error:", err);
                    }
                });
        }

    } catch (error: any) {
        console.error("Firebase client initialization error:", error);
        // Provide more specific feedback for common errors
        if (error.code === 'auth/invalid-api-key' || error.message?.includes('api-key')) {
             console.error("Firebase Error: Invalid API Key or configuration. Please ensure your NEXT_PUBLIC_FIREBASE_API_KEY and other config values in the .env.local file are correct and the file is loaded.");
              if (process.env.NODE_ENV === 'development') {
                  alert("Firebase Configuration Error: Invalid API Key or config. Check console and .env.local file.");
              }
        } else if (error.code === 'auth/configuration-not-found') {
             console.error("Firebase Error: Authentication configuration not found. Ensure Phone Auth (and reCAPTCHA) is enabled in your Firebase project settings.");
             if (process.env.NODE_ENV === 'development') {
                  alert("Firebase Auth Config Error: Check if Phone Auth is enabled in Firebase Console.");
             }
        } else {
             if (process.env.NODE_ENV === 'development') {
                 alert(`Firebase Initialization Error: ${error.message}. Check console.`);
             }
        }
         // Prevent the app from trying to use potentially broken services
         app = null;
         auth = null;
         firestore = null;
         storage = null;
    }
} else {
     console.log("Firebase client initialization skipped on server-side.");
}

// Export Firebase services - components should handle potential null values
export { app, auth, firestore, storage, persistenceEnabled };


// Helper function remains useful for explicit checks within components where auth is critical
export const ensureAuthInitialized = (): Auth => {
  if (!auth) {
    // This error is more likely during development if component logic requires auth but init failed
    console.error("Firebase Auth is not initialized. Cannot perform authentication operations.");
    throw new Error("Firebase Auth is not initialized. Check Firebase configuration and environment variables.");
  }
  return auth;
}

// Similarly, helper for Firestore if needed
export const ensureFirestoreInitialized = (): Firestore => {
  if (!firestore) {
    console.error("Firebase Firestore is not initialized. Cannot perform database operations.");
    throw new Error("Firebase Firestore is not initialized.");
  }
  return firestore;
}

// And for Storage
export const ensureStorageInitialized = (): FirebaseStorage => {
    if (!storage) {
         console.error("Firebase Storage is not initialized. Cannot perform storage operations.");
        throw new Error("Firebase Storage is not initialized.");
    }
    return storage;
}
