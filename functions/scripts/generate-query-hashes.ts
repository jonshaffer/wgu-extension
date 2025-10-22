#!/usr/bin/env tsx
/**
 * Generate SHA256 hashes for GraphQL queries in the allowlist
 * This creates the mapping needed for persisted queries
 */

import { createHash } from 'crypto';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Read the allowlist
const allowlistPath = join(__dirname, '../src/graphql/allowlist.json');
const allowlist = JSON.parse(readFileSync(allowlistPath, 'utf-8'));

// Generate hashes for each query
const hashedAllowlist: Record<string, string> = {};

Object.entries(allowlist).forEach(([key, query]) => {
  // Normalize the query (remove extra whitespace)
  const normalizedQuery = (query as string)
    .replace(/\s+/g, ' ')
    .trim();
  
  // Generate SHA256 hash
  const hash = createHash('sha256')
    .update(normalizedQuery)
    .digest('hex');
  
  hashedAllowlist[hash] = normalizedQuery;
  
  console.log(`${key}:`);
  console.log(`  Hash: ${hash}`);
  console.log(`  Query: ${normalizedQuery.substring(0, 60)}...`);
  console.log('');
});

// Write the hashed allowlist
const hashedPath = join(__dirname, '../src/graphql/allowlist-hashed.json');
writeFileSync(hashedPath, JSON.stringify(hashedAllowlist, null, 2));

console.log(`\nGenerated ${Object.keys(hashedAllowlist).length} query hashes`);
console.log(`Saved to: ${hashedPath}`);

// Also generate a mapping file for clients
const clientMapping: Record<string, string> = {};
Object.entries(allowlist).forEach(([key, query]) => {
  const normalizedQuery = (query as string).replace(/\s+/g, ' ').trim();
  const hash = createHash('sha256').update(normalizedQuery).digest('hex');
  clientMapping[key] = hash;
});

const mappingPath = join(__dirname, '../src/graphql/query-mappings.json');
writeFileSync(mappingPath, JSON.stringify(clientMapping, null, 2));
console.log(`\nClient mappings saved to: ${mappingPath}`);