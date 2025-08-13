/**
 * Admin function to export all Firestore data
 * Provides JSON export of all collections for backup/analysis
 */
import { onRequest } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { getAllowedOrigins, setCors } from "../lib/cors";
import { checkRateLimit } from "../lib/rate-limit";
import { requireAdmin } from "../lib/auth-utils";

export const exportData = onRequest(
  {
    cors: true,
    maxInstances: 2,
    timeoutSeconds: 540, // 9 minutes - longer for large exports
    memory: "1GiB",
  },
  async (request, response) => {
    // Apply CORS
    const allowedOrigins = getAllowedOrigins(process.env.ALLOWED_ORIGINS);
    setCors(request, response, allowedOrigins);
    
    if (request.method === "OPTIONS") {
      response.status(200).send("");
      return;
    }

    // Only allow GET requests
    if (request.method !== "GET") {
      response.status(405).json({ error: "Method not allowed" });
      return;
    }

    try {
      // Apply rate limiting (stricter for admin functions)
      const rateLimitResult = await checkRateLimit("export", request.ip || "unknown", 5);
      if (!rateLimitResult.ok) {
        response.status(429).json({
          error: "Rate limit exceeded",
          retryAfter: rateLimitResult.retryAfter || 60
        });
        return;
      }

      // Authenticate and authorize admin access
      let authInfo;
      try {
        authInfo = await requireAdmin(request);
      } catch (error: any) {
        const status = error.message.includes("Forbidden") ? 403 : 401;
        response.status(status).json({
          error: error.message,
          hint: authInfo?.source === "admin-sdk" ? 
            "Admin SDK access detected but not authorized" :
            "Include Authorization: Bearer <firebase-token> header or use Admin SDK"
        });
        return;
      }

      console.log(`🔐 Admin export requested by: ${authInfo.userEmail || authInfo.userId} (${authInfo.source})`);

      const db = getFirestore();
      const exportData: any = {
        exportedAt: new Date().toISOString(),
        collections: {}
      };

      // Get format preference
      const format = request.query.format as string || "summary";
      const collections = typeof request.query.collections === "string" 
        ? request.query.collections.split(",") 
        : null;

      console.log("🚀 Starting Firestore data export...");
      console.log("📊 Format:", format);
      console.log("🗂️ Collections filter:", collections || "all");

      // List of collections to export
      const targetCollections = collections || [
        "courses",
        "academic-registry", 
        "discord-servers",
        "reddit-communities",
        "public",
        "wgu-connect-groups"
      ];

      for (const collectionName of targetCollections) {
        try {
          console.log(`📖 Exporting ${collectionName} collection...`);
          
          if (format === "summary") {
            // Summary format - just counts and metadata
            const snapshot = await db.collection(collectionName).count().get();
            const count = snapshot.data().count;
            
            exportData.collections[collectionName] = {
              documentCount: count,
              sampleDocuments: count > 0 ? await getSampleDocuments(db, collectionName, 2) : []
            };
          } else if (format === "full") {
            // Full export - all documents (use with caution!)
            const snapshot = await db.collection(collectionName).get();
            const documents: any = {};
            
            let docCount = 0;
            snapshot.forEach((doc) => {
              documents[doc.id] = doc.data();
              docCount++;
              
              // Log progress for large collections
              if (docCount % 100 === 0) {
                console.log(`   📄 Exported ${docCount} documents from ${collectionName}`);
              }
            });
            
            exportData.collections[collectionName] = {
              documentCount: docCount,
              documents
            };
          } else if (format === "metadata") {
            // Metadata only - document IDs and basic info
            const snapshot = await db.collection(collectionName).get();
            const metadata: any[] = [];
            
            snapshot.forEach((doc) => {
              const data = doc.data();
              metadata.push({
                id: doc.id,
                hasMetadata: !!data._metadata,
                lastUpdated: data._metadata?.lastUpdated || data.lastUpdated,
                fieldsCount: Object.keys(data).length
              });
            });
            
            exportData.collections[collectionName] = {
              documentCount: metadata.length,
              metadata
            };
          }
          
          console.log(`✅ Exported ${collectionName}: ${exportData.collections[collectionName].documentCount} documents`);
          
        } catch (collectionError: any) {
          console.error(`❌ Error exporting ${collectionName}:`, collectionError);
          exportData.collections[collectionName] = {
            error: collectionError.message,
            documentCount: 0
          };
        }
      }

      // Add summary statistics
      const totalDocuments = Object.values(exportData.collections)
        .reduce((sum: number, coll: any) => sum + (coll.documentCount || 0), 0);
      
      exportData.summary = {
        totalCollections: targetCollections.length,
        totalDocuments,
        exportFormat: format,
        collectionsExported: Object.keys(exportData.collections)
      };

      console.log(`🎉 Export complete: ${totalDocuments} total documents across ${targetCollections.length} collections`);

      // Set appropriate headers for download
      if (request.query.download === "true") {
        const filename = `firestore-export-${format}-${new Date().toISOString().split('T')[0]}.json`;
        response.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        response.setHeader("Content-Type", "application/json");
      }

      response.status(200).json(exportData);

    } catch (error: any) {
      console.error("❌ Export failed:", error);
      response.status(500).json({
        error: "Export failed",
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

// Helper function to get sample documents from a collection
async function getSampleDocuments(db: FirebaseFirestore.Firestore, collectionName: string, limit: number) {
  try {
    const snapshot = await db.collection(collectionName).limit(limit).get();
    const samples: any[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      // Include only essential fields for summary
      const sample: any = {
        id: doc.id,
        fieldsCount: Object.keys(data).length
      };
      
      // Add some key fields based on collection type
      if (collectionName === "courses") {
        sample.name = data.name;
        sample.code = data.code;
        sample.competencyUnits = data.competencyUnits;
      } else if (collectionName === "discord-servers") {
        sample.name = data.name;
        sample.channelCounts = data.channelCounts;
        sample.coursesCount = data.coursesMentioned?.length || 0;
      } else if (collectionName === "reddit-communities") {
        sample.name = data.name;
        sample.memberCount = data.memberCount;
        sample.isActive = data.isActive;
      } else {
        // Generic - just show first few field names
        sample.fields = Object.keys(data).slice(0, 5);
      }
      
      samples.push(sample);
    });
    
    return samples;
  } catch (error) {
    console.error(`Error getting samples for ${collectionName}:`, error);
    return [];
  }
}