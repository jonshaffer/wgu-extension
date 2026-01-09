import {initializeApp} from "firebase/app";
import {getAuth, connectAuthEmulator} from "firebase/auth";
import {getAnalytics} from "firebase/analytics";
import {config} from "./config";

// Firebase configuration for WGU Extension
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-api-key",
  authDomain: config.firebase.authDomain,
  projectId: config.firebase.projectId,
  storageBucket: config.firebase.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "demo-app-id",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "demo-measurement-id",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Connect to emulator in development
if (import.meta.env.DEV) {
  try {
    connectAuthEmulator(auth, "http://localhost:9099");
  } catch (error) {
    // Emulator already connected, ignore error
  }
}

let analytics: any;
if (typeof window !== "undefined" && !import.meta.env.DEV) {
  analytics = getAnalytics(app);
}

export {app, auth, analytics};
