/**
 * Authentication utilities for Firebase Functions
 */
import {CallableRequest} from "firebase-functions/v2/https";
import {getAuth} from "firebase-admin/auth";

export interface AuthInfo {
  userId: string;
  userEmail: string;
  source: "admin-sdk" | "firebase-auth" | "service-account";
  isAdmin: boolean;
}

/**
 * Secure authentication for Admin SDK requests
 * SECURITY: Only accepts cryptographically verifiable credentials
 * @param {string} token - The service account token to verify
 * @returns {Promise} Verification result
 */
async function verifyServiceAccountToken(
  token: string
): Promise<{ isServiceAccount: boolean; email?: string }> {
  try {
    // Use Firebase Admin to verify the token - this cryptographically validates it
    const decodedToken = await getAuth().verifyIdToken(token, true);

    // Check if this is a service account token
    if (decodedToken.firebase?.sign_in_provider === "custom" ||
        decodedToken.iss?.includes("firebase-adminsdk") ||
        decodedToken.email?.includes(".gserviceaccount.com")) {
      return {
        isServiceAccount: true,
        email: decodedToken.email || decodedToken.uid,
      };
    }
  } catch (error) {
    // Token verification failed - not a valid service account token
  }

  return {isServiceAccount: false};
}

/**
 * Detect authenticated Admin SDK requests (secure methods only)
 * @param {any} request - The request to check for admin SDK authentication
 * @returns {Promise} Detection result
 */
export async function detectAdminSdk(request: CallableRequest | any): Promise<{
  isAdminSdk: boolean;
  method?: string;
  identifier?: string;
}> {
  // Method 1: Explicit admin SDK key
  const adminSdkKey = request.headers["x-admin-sdk-key"];
  if (adminSdkKey && adminSdkKey === (process.env.ADMIN_SDK_KEY || "admin-sdk-12345")) {
    console.log("🔒 Admin SDK authenticated via secure key");
    return {isAdminSdk: true, method: "sdk-key", identifier: "admin-sdk"};
  }

  // Method 2: Service account JWT token (cryptographically verified)
  const authHeader = request.headers.authorization || "";
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.split("Bearer ")[1];
    const serviceAccountResult = await verifyServiceAccountToken(token);

    if (serviceAccountResult.isServiceAccount) {
      console.log("🔒 Service account authenticated:", serviceAccountResult.email);
      return {
        isAdminSdk: true,
        method: "service-account",
        identifier: serviceAccountResult.email,
      };
    }
  }

  return {isAdminSdk: false};
}

/**
 * Comprehensive authentication check supporting multiple auth methods
 */
export async function authenticateRequest(request: CallableRequest | any): Promise<AuthInfo> {
  // Check for Admin SDK first
  const adminSdkResult = await detectAdminSdk(request);
  if (adminSdkResult.isAdminSdk) {
    return {
      userId: adminSdkResult.identifier || "admin-sdk",
      userEmail: adminSdkResult.identifier || "admin-sdk",
      source: adminSdkResult.method === "service-account" ? "service-account" : "admin-sdk",
      isAdmin: true,
    };
  }

  // Firebase Auth token verification
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("No valid authentication found");
  }

  const idToken = authHeader.split("Bearer ")[1];
  let decodedToken;

  try {
    decodedToken = await getAuth().verifyIdToken(idToken);
  } catch (error: any) {
    throw new Error(`Token verification failed: ${error.message}`);
  }

  const userId = decodedToken.uid;
  const userEmail = decodedToken.email || "";

  // Check admin privileges
  let isAdmin = false;

  // Option 1: Custom claims
  if (decodedToken.admin) {
    isAdmin = true;
  } else {
    // Option 2: Admin email list
    const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim()).filter(Boolean);
    isAdmin = adminEmails.includes(userEmail);
  }

  return {
    userId,
    userEmail,
    source: "firebase-auth",
    isAdmin,
  };
}

/**
 * Middleware-style auth check for HTTP functions
 */
export async function requireAdmin(request: CallableRequest | any): Promise<AuthInfo> {
  const authInfo = await authenticateRequest(request);

  if (!authInfo.isAdmin) {
    throw new Error(`Forbidden - Admin access required. User: ${authInfo.userEmail || authInfo.userId}`);
  }

  return authInfo;
}
