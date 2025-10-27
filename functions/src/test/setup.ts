import * as admin from "firebase-admin";

// Determine if we're running integration tests that need emulators
// Check multiple signals for integration test environment
const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
const hasEmulatorHost = emulatorHost === "localhost:8181" || emulatorHost === "127.0.0.1:8181";
const isCI = process.env.CI === "true";
const explicitIntegrationFlag = process.env.RUN_INTEGRATION_TESTS === "true";
const runningIntegrationTestFiles = process.argv.some(arg => arg.includes('integration.test'));

// Only run integration tests if explicitly requested AND emulators are available
// In CI, unit tests should run without emulator dependency
const isIntegrationTest = (explicitIntegrationFlag || runningIntegrationTestFiles) && hasEmulatorHost;

// Debug logging to help troubleshoot environment detection
console.log('🔧 Test environment debug:');
console.log(`  FIRESTORE_EMULATOR_HOST: ${process.env.FIRESTORE_EMULATOR_HOST}`);
console.log(`  CI: ${process.env.CI}`);
console.log(`  RUN_INTEGRATION_TESTS: ${process.env.RUN_INTEGRATION_TESTS}`);
console.log(`  process.argv: ${process.argv.join(' ')}`);
console.log(`  hasEmulatorHost: ${hasEmulatorHost}`);
console.log(`  isCI: ${isCI}`);
console.log(`  explicitIntegrationFlag: ${explicitIntegrationFlag}`);
console.log(`  runningIntegrationTestFiles: ${runningIntegrationTestFiles}`);
console.log(`  isIntegrationTest: ${isIntegrationTest}`);

// Set up Firebase Admin SDK with emulator configuration for integration tests
if (isIntegrationTest) {
  // Use the existing emulator host or default to localhost
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    process.env.FIRESTORE_EMULATOR_HOST = "localhost:8181";
  }
  if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    process.env.FIREBASE_AUTH_EMULATOR_HOST = "localhost:9099";
  }

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
