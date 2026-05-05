import * as admin from "firebase-admin";
import {getAuth} from "firebase-admin/auth";
import {adminDb} from "./firebase-admin-db.js";

export interface AdminUser {
  uid: string;
  email?: string;
  role: string;
  permissions: string[];
}

/**
 * Verify admin authentication token
 * This can be extended to support multiple auth methods:
 * - Firebase Auth tokens
 * - JWT tokens
 * - API keys with admin permissions
 * - mTLS certificates
 * @param {string} token - The authentication token to verify
 * @return {Promise<AdminUser>} The authenticated admin user
 */
export async function verifyAdminAuth(token: string): Promise<AdminUser> {
  // For now, we'll use Firebase Auth for admin verification
  try {
    // Initialize Firebase Admin if not already done
    if (!admin.apps.length) {
      admin.initializeApp();
    }

    // Verify the Firebase Auth token
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Check if the user has admin permissions.
    // Fast path: the decoded token already carries the canonical `admin`
    // custom claim, so we can avoid the extra `getUser` round-trip when set.
    // Otherwise fall back to the secondary `admin_users` collection check.
    const isAdmin =
      decodedToken.admin === true || (await checkAdminPermissions(decodedToken.uid));

    if (!isAdmin) {
      throw new Error("User does not have admin permissions");
    }

    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: "admin",
      permissions: ["read", "write", "delete", "ingest"],
    };
  } catch (error) {
    throw new Error(
      `Authentication failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Check if a user has admin permissions.
 *
 * Canonical signal is the Firebase Auth custom claim `admin === true`,
 * which matches `firebase/firestore-admin.rules`. The `admin_users`
 * Firestore collection is checked as a secondary mechanism for
 * collection-managed admins with an `active` flag.
 *
 * To grant admin access, set the custom claim with:
 *   admin.auth().setCustomUserClaims(uid, { admin: true })
 * @param {string} uid - The user ID to check
 * @return {Promise<boolean>} Whether the user has admin permissions
 */
async function checkAdminPermissions(uid: string): Promise<boolean> {
  // Method 1: Check Firebase Auth custom claims (canonical)
  try {
    const userRecord = await admin.auth().getUser(uid);
    if (userRecord.customClaims?.admin === true) {
      return true;
    }
  } catch (error) {
    console.warn("Failed to check custom claims:", error);
  }

  // Method 2: Check Firestore admin_users collection (in the admin database)
  try {
    const adminDoc = await adminDb
      .collection("admin_users")
      .doc(uid)
      .get();

    if (adminDoc.exists && adminDoc.data()?.active === true) {
      return true;
    }
  } catch (error) {
    console.warn("Failed to check admin users collection:", error);
  }

  return false;
}

/**
 * Verify a Firebase ID token (for public API auth)
 * @param {string} token - The ID token to verify
 * @return {Promise<admin.auth.DecodedIdToken>} The decoded token
 */
export async function verifyIdToken(token: string) {
  if (!admin.apps.length) {
    admin.initializeApp();
  }

  return await getAuth().verifyIdToken(token);
}

/**
 * Alternative auth method using API keys
 * This would be useful for server-to-server communication
 * @param {string} apiKey - The API key to verify
 * @return {Promise<AdminUser>} The authenticated admin user
 */
export async function verifyApiKeyAuth(apiKey: string): Promise<AdminUser> {
  const validApiKeys = process.env.ADMIN_API_KEYS?.split(",").map((k) => k.trim()) || [];

  if (!validApiKeys.includes(apiKey)) {
    throw new Error("Invalid API key");
  }

  return {
    uid: "api_key_user",
    role: "admin",
    permissions: ["read", "write", "delete", "ingest"],
  };
}

/**
 * Check if a user has a specific permission
 * @param {AdminUser} user - The user to check
 * @param {string} permission - The permission to check for
 * @return {boolean} Whether the user has the permission
 */
export function hasPermission(user: AdminUser, permission: string): boolean {
  return user.permissions.includes(permission);
}

/**
 * Require a specific permission (throws if not present)
 * @param {AdminUser} user - The user to check
 * @param {string} permission - The permission required
 * @return {void}
 */
export function requirePermission(user: AdminUser, permission: string): void {
  if (!hasPermission(user, permission)) {
    throw new Error(`Permission '${permission}' required`);
  }
}
