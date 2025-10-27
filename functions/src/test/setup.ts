import * as admin from "firebase-admin";

// Determine if we're running integration tests that need emulators
// Look for explicit integration test signal or CI environment with emulator
const isIntegrationTest = process.env.FIRESTORE_EMULATOR_HOST === "localhost:8181" && 
                          (process.env.CI === "true" || process.env.RUN_INTEGRATION_TESTS === "true");

// Set up Firebase Admin SDK with emulator configuration for integration tests
if (isIntegrationTest) {
  process.env.FIRESTORE_EMULATOR_HOST = "localhost:8181";
  process.env.FIREBASE_AUTH_EMULATOR_HOST = "localhost:9099";

  // Wait for emulator connectivity before running tests
  async function waitForEmulatorConnectivity() {
    const maxAttempts = 30;
    const delay = 2000; // 2 seconds
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const apps = admin.apps || [];
        const app = apps.length ? admin.app() : admin.initializeApp({
          projectId: "demo-test",
        });
        
        // Test Firestore connectivity with a simple operation
        const db = admin.firestore(app);
        await db.collection('_health_check').doc('test').set({
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          attempt: attempt
        });
        
        console.log(`✅ Emulator connectivity established on attempt ${attempt}`);
        return;
      } catch (error: any) {
        console.log(`⏳ Attempt ${attempt}/${maxAttempts} failed: ${error.message}`);
        if (attempt === maxAttempts) {
          throw new Error(`Failed to connect to emulators after ${maxAttempts} attempts`);
        }
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Initialize Firebase only for integration tests
  beforeAll(async () => {
    const apps = admin.apps || [];
    if (!apps.length) {
      await waitForEmulatorConnectivity();
    }
  }, 60000); // 60 second timeout for setup
} else {
  // For unit tests, just log that we're skipping Firebase setup
  console.log('ℹ️  Skipping Firebase initialization for unit tests');
}
