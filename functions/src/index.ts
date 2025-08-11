import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
export { ingestDiscord } from "./http/ingest-discord";
export { ingestWguConnectCollection } from "./http/ingest-wgu-connect-collection";

export const searchFirestore = onCall(async (request: any) => {
  const query = request.data.query; // Access data from request.data

  if (!query) {
    // Throw an HttpsError for structured error handling
    throw new HttpsError(
      'invalid-argument',
      'Missing \'query\' in request data'
    );
  }
  logger.info("Received search query:", query);
  // TODO: Implement actual Firestore search logic here;
 // Return the result directly
  return {
    message: "Search query received and processed (dummy response)",
    query: query,
    results: [], // Sending an empty array for now
  };
});
