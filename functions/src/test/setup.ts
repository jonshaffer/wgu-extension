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
  async function waitForEmulatorConnectivity(): Promise<admin.app.App> {
    const maxAttempts = 60; // Increased for CI environment
    const delay = 1000; // 1 second delay
    
    console.log('🔌 Waiting for Firebase emulator connectivity...');
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const apps = admin.apps || [];
        const app = apps.length ? admin.app() : admin.initializeApp({
          projectId: "demo-test",
        });
        
        // Test Firestore connectivity with a simple operation
        const db = admin.firestore(app);
        
        // Use a more reliable connectivity test
        await Promise.race([
          db.collection('_health_check').doc('test').set({
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            attempt: attempt,
            pid: process.pid
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Operation timeout')), 5000)
          )
        ]);
        
        // Verify we can read back the document
        const doc = await db.collection('_health_check').doc('test').get();
        if (!doc.exists) {
          throw new Error('Document was not created successfully');
        }
        
        console.log(`✅ Emulator connectivity established on attempt ${attempt}`);
        return app;
      } catch (error: any) {
        const errorMsg = error.message || 'Unknown error';
        console.log(`⏳ Attempt ${attempt}/${maxAttempts} failed: ${errorMsg}`);
        
        if (attempt === maxAttempts) {
          console.error('❌ Failed to connect to Firebase emulators');
          console.error('Environment details:');
          console.error(`  FIRESTORE_EMULATOR_HOST: ${process.env.FIRESTORE_EMULATOR_HOST}`);
          console.error(`  FIREBASE_AUTH_EMULATOR_HOST: ${process.env.FIREBASE_AUTH_EMULATOR_HOST}`);
          console.error(`  Current working directory: ${process.cwd()}`);
          console.error(`  Node.js version: ${process.version}`);
          throw new Error(`Failed to connect to emulators after ${maxAttempts} attempts. Last error: ${errorMsg}`);
        }
        
        // Progressive backoff for CI environments
        const backoffDelay = isCI ? delay * Math.min(attempt, 5) : delay;
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
    
    // This should never be reached due to the throw above, but TypeScript needs it
    throw new Error('Unexpected end of connectivity attempts');
  }

  // Initialize Firebase only for integration tests
  beforeAll(async () => {
    const apps = admin.apps || [];
    if (!apps.length) {
      await waitForEmulatorConnectivity();
    }
  }, 120000); // 2 minute timeout for setup in CI
} else {
  // For unit tests, just log that we're skipping Firebase setup
  console.log('ℹ️  Skipping Firebase initialization for unit tests');
}
