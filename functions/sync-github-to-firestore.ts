// Starter sync script: Syncs open source data from local repo to Firestore
// Usage: Run in CI/CD or locally after updating data files
// Notes:
//  - Keeps repo (GitHub) as source of truth; Firestore is a synchronized cache.
//  - Supports either a single aggregate JSON file or a directory of per-item JSON files.
//  - Uses dynamic imports for ESM Zod schema modules from the extension workspace while this
//    functions package remains CommonJS.

import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';
// Explicit .env loading (in case direnv didn't run). Safe no-op if already loaded.
import path from 'path';
try {
  // Dynamically require to avoid adding a prod dependency if not installed.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });
} catch {/* dotenv optional */}
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs/promises';

// Lazy-loaded Zod schemas (dynamic import to avoid ESM/CJS mismatch)
let WguConnectGroupRawSchema: any;
let RedditCommunitySchema: any;
let DiscordChannelSchema: any; // channel schema
let DiscordCommunityFileSchema: any; // community file with channels
let WguStudentGroupRawSchema: any;

// Initialize Firebase Admin with optional env-provided service account JSON
function initFirebase() {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;

  // Support pointing to a file instead of embedding JSON in .env
  if (!process.env.FIREBASE_SERVICE_ACCOUNT && process.env.FIREBASE_SERVICE_ACCOUNT_FILE) {
    try {
      const raw = require('fs').readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_FILE, 'utf8');
      process.env.FIREBASE_SERVICE_ACCOUNT = raw;
    } catch (e) {
      console.warn('Could not read FIREBASE_SERVICE_ACCOUNT_FILE:', e);
    }
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      if (!sa.project_id && projectId) sa.project_id = projectId; // ensure project id
      initializeApp({ credential: cert(sa as any), projectId: sa.project_id || projectId });
      return;
    } catch (e) {
      console.warn('Failed to parse FIREBASE_SERVICE_ACCOUNT env var. Falling back to applicationDefault()', e);
    }
  }

  initializeApp({ credential: applicationDefault(), projectId });
  if (!projectId) {
    console.warn('[firebase] No FIREBASE_PROJECT_ID set (or GOOGLE_CLOUD_PROJECT). Firestore Admin may fail.');
  }
  if (!process.env.FIREBASE_SERVICE_ACCOUNT && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.warn('[firebase] No credentials provided (FIREBASE_SERVICE_ACCOUNT or GOOGLE_APPLICATION_CREDENTIALS).');
  }
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    console.log('[firebase] Using Firestore emulator at', process.env.FIRESTORE_EMULATOR_HOST);
  }
}
initFirebase();
const db = getFirestore();

// Utility: load schemas dynamically
async function loadSchemas() {
  if (WguConnectGroupRawSchema) return; // already loaded
  let typesMod: any;
  try {
    // Prefer dynamic import (ESM) when available
    typesMod = await import('@wgu-extension/types');
  } catch (primaryErr) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      typesMod = require('@wgu-extension/types');
    } catch (cjsErr) {
      const possible = [
        path.join(__dirname, '../extension/packages/types/dist/index.js'),
      ];
      for (const p of possible) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          typesMod = require(p);
          console.log(`Loaded types module via fallback path: ${p}`);
          break;
        } catch {
          /* continue */
        }
      }
      if (!typesMod) {
        console.error('Failed to load @wgu-extension/types. Build it with: npm run types:build');
        console.error('Primary ESM error:', primaryErr);
        console.error('CJS require error:', cjsErr);
        throw primaryErr;
      }
    }
  }
  WguConnectGroupRawSchema = typesMod.WguConnectGroupRawSchema;
  RedditCommunitySchema = typesMod.RedditCommunitySchema;
  DiscordChannelSchema = typesMod.DiscordChannelSchema;
  DiscordCommunityFileSchema = typesMod.DiscordCommunityFileSchema;
  WguStudentGroupRawSchema = typesMod.WguStudentGroupRawSchema;
}

type ZodSchema = { parse: (data: unknown) => any; safeParse?: (data: unknown) => any };

async function pathExists(p: string) {
  try { await fs.access(p); return true; } catch { return false; }
}

// Read either a single JSON file containing an array OR a directory of JSON item files.
async function ingestPath<T extends Record<string, any>>(targetPath: string, schema: ZodSchema): Promise<T[]> {
  const isDir = (await fs.stat(targetPath)).isDirectory();
  const items: T[] = [];
  if (!isDir) {
    const raw = await fs.readFile(targetPath, 'utf8');
    const data = JSON.parse(raw);
    // Allow file to be single object or array
    const normalized = Array.isArray(data) ? data : [data];
    for (const entry of normalized) {
      items.push(schema.parse(entry));
    }
    return items;
  }
  const files = await fs.readdir(targetPath);
  for (const f of files) {
    if (!f.endsWith('.json')) continue;
    const full = path.join(targetPath, f);
    const raw = await fs.readFile(full, 'utf8');
    try {
      const data = JSON.parse(raw);
      // If file contains an array, validate each
      if (Array.isArray(data)) {
        for (const entry of data) items.push(schema.parse(entry));
      } else {
        items.push(schema.parse(data));
      }
    } catch (e) {
      console.error(`Failed parsing ${full}:`, e);
      throw e;
    }
  }
  return items;
}

// Sync function for each collection
interface SyncConfig<T extends Record<string, any>> {
  collection: string;
  sourcePath: string; // file or directory
  schema: ZodSchema;
  idField: string;
  transform?: (items: T[]) => T[]; // optional transform
}

function buildSyncConfigs(): SyncConfig<any>[] {
  const root = __dirname; // dist/lib when compiled; relies on relative '../'
  return [
    // Catalogs: each parsed monthly catalog file -> one document named YYYY-MM
    {
      collection: 'catalogs',
      sourcePath: path.join(root, '../data/catalogs/parsed'),
      schema: { // custom schema parse wrapper for monthly catalog file structure
        parse: (data: any) => data, // trust file structure; could add zod if defined later
      },
      idField: '__FILENAME__',
      transform: (files: any[]) => files, // no-op; handled specially in syncCollection
    },
    {
      collection: 'wgu-connect-groups',
      sourcePath: path.join(root, '../data/wgu-connect/raw'),
      schema: WguConnectGroupRawSchema, // individual files are single objects
      idField: 'id',
    },
    {
      collection: 'reddit-communities',
      sourcePath: path.join(root, '../data/reddit/raw'),
      schema: RedditCommunitySchema,
      idField: 'subreddit',
    },
    {
      // Flatten all channels from discord community files
      collection: 'discord-channels',
      sourcePath: path.join(root, '../data/discord/raw'),
  schema: DiscordCommunityFileSchema, // validate community + channels first
      idField: 'id',
      transform: (communities: any[]) => {
        const channels: any[] = [];
        for (const community of communities) {
          if (community.channels && Array.isArray(community.channels)) {
            for (const ch of community.channels) {
              channels.push(DiscordChannelSchema.parse(ch));
            }
          }
        }
        return channels;
      },
    },
    {
      collection: 'wgu-student-groups',
      sourcePath: path.join(root, '../data/wgu-student-groups/raw'),
      schema: WguStudentGroupRawSchema,
      idField: 'id',
    },
  ];
}

async function syncCollection<T extends Record<string, any>>({ collection, sourcePath, schema, idField, transform }: SyncConfig<T>) {
  if (!(await pathExists(sourcePath))) {
    console.warn(`Skip ${collection}: source not found ${sourcePath}`);
    return;
  }
  console.log(`Syncing ${collection} from ${sourcePath}`);
  let rawItems = await ingestPath<T>(sourcePath, schema);
  // Special handling for catalogs: each file becomes a single doc, using filename pattern
  if (collection === 'catalogs') {
    const entries: T[] = [];
    const dirEntries = await fs.readdir(sourcePath);
    for (const fname of dirEntries) {
      if (!fname.startsWith('catalog-') || !fname.endsWith('.json')) continue;
      const file = path.join(sourcePath, fname);
      const raw = JSON.parse(await fs.readFile(file, 'utf8'));
      const match = fname.match(/catalog-(\d{4}-\d{2})\.json$/);
      if (!match) continue;
      const monthKey = match[1];
      entries.push({ id: monthKey, snapshot: raw, createdAt: new Date().toISOString() } as any);
    }
    rawItems = entries as any;
    idField = 'id';
  }
  if (transform) {
    rawItems = transform(rawItems);
  }
  const writer = db.bulkWriter();
  let count = 0;
  for (const item of rawItems) {
    const docId = String(item[idField]);
    if (!docId) {
      console.warn(`Skipping item missing id field '${idField}':`, item);
      continue;
    }
    writer.set(db.collection(collection).doc(docId), item, { merge: true });
    count++;
  }
  await writer.close();
  console.log(`Synced ${count} items to ${collection}`);
}

async function main() {
  await loadSchemas();
  const configs = buildSyncConfigs();
  for (const config of configs) {
    await syncCollection(config);
  }
  console.log('All collections synced.');
}

main().catch(err => {
  console.error('Sync failed:', err);
  process.exit(1);
});
