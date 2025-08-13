/**
 * Admin function to set admin custom claims for Firebase Auth users
 * Only callable by existing admins or during initial setup
 */
import { onRequest } from "firebase-functions/v2/https";
import { getAuth } from "firebase-admin/auth";
import { getAllowedOrigins, setCors } from "../lib/cors";
import { checkRateLimit } from "../lib/rate-limit";

export const setAdminClaims = onRequest(
  {
    cors: true,
    maxInstances: 1,
    timeoutSeconds: 30,
  },
  async (request, response) => {
    // Apply CORS
    const allowedOrigins = getAllowedOrigins(process.env.ALLOWED_ORIGINS);
    setCors(request, response, allowedOrigins);
    
    if (request.method === "OPTIONS") {
      response.status(200).send("");
      return;
    }

    // Only allow POST requests
    if (request.method !== "POST") {
      response.status(405).json({ error: "Method not allowed" });
      return;
    }

    try {
      // Apply rate limiting
      const rateLimitResult = await checkRateLimit("admin-claims", request.ip || "unknown", 3);
      if (!rateLimitResult.ok) {
        response.status(429).json({
          error: "Rate limit exceeded",
          retryAfter: rateLimitResult.retryAfter || 60
        });
        return;
      }

      const { userEmail, uid, grantAdmin = true } = request.body;

      if (!userEmail && !uid) {
        response.status(400).json({
          error: "Bad Request",
          hint: "Provide either userEmail or uid in request body"
        });
        return;
      }

      // For initial setup, allow setting admin via special setup key
      const setupKey = request.headers["x-setup-key"] as string;
      const isInitialSetup = setupKey === process.env.INITIAL_ADMIN_SETUP_KEY;
      
      if (!isInitialSetup) {
        // Verify calling user is already an admin
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          response.status(401).json({ 
            error: "Unauthorized - Firebase Auth token required",
            hint: "Include Authorization: Bearer <firebase-token> header"
          });
          return;
        }

        const idToken = authHeader.split('Bearer ')[1];
        let decodedToken;
        
        try {
          decodedToken = await getAuth().verifyIdToken(idToken);
        } catch (error: any) {
          console.error("Token verification failed:", error.message);
          response.status(401).json({ 
            error: "Invalid or expired Firebase Auth token"
          });
          return;
        }

        // Check if calling user has admin privileges
        if (!decodedToken.admin) {
          const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim()).filter(Boolean);
          if (!adminEmails.includes(decodedToken.email || "")) {
            response.status(403).json({ 
              error: "Forbidden - Admin access required to grant admin privileges"
            });
            return;
          }
        }
      }

      // Get user record
      let userRecord;
      try {
        if (uid) {
          userRecord = await getAuth().getUser(uid);
        } else {
          userRecord = await getAuth().getUserByEmail(userEmail);
        }
      } catch (error: any) {
        console.error("User not found:", error.message);
        response.status(404).json({
          error: "User not found",
          hint: "Make sure the user exists in Firebase Auth"
        });
        return;
      }

      // Set custom claims  
      let grantedBy = "initial-setup";
      if (!isInitialSetup) {
        const authHeader = request.headers.authorization!;
        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await getAuth().verifyIdToken(idToken);
        grantedBy = decodedToken.email || decodedToken.uid;
      }
      
      const customClaims = {
        ...userRecord.customClaims,
        admin: grantAdmin,
        adminGrantedAt: grantAdmin ? new Date().toISOString() : null,
        adminGrantedBy: grantedBy
      };

      await getAuth().setCustomUserClaims(userRecord.uid, customClaims);

      console.log(`🔐 Admin claims ${grantAdmin ? 'granted to' : 'revoked from'}: ${userRecord.email} (${userRecord.uid})`);

      response.status(200).json({
        success: true,
        message: `Admin privileges ${grantAdmin ? 'granted to' : 'revoked from'} ${userRecord.email}`,
        user: {
          uid: userRecord.uid,
          email: userRecord.email,
          admin: grantAdmin
        }
      });

    } catch (error: any) {
      console.error("❌ Admin claims update failed:", error);
      response.status(500).json({
        error: "Failed to update admin claims",
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
);