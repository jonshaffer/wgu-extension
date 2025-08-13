import * as admin from "firebase-admin";

// Set up Firebase Admin SDK with emulator configuration
process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST = "localhost:9099";

// Only initialize if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: "demo-test",
  });
}

// Increase test timeout for integration tests
jest.setTimeout(60000);