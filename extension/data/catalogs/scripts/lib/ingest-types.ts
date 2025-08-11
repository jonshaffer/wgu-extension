#!/usr/bin/env npx tsx

/**
 * Ingest strategy interfaces and helpers for catalog parsing.
 * We keep strategy names explicit for clarity, while delegating detection
 * to the unified parser by default.
 */

export type IngestKind = 'legacy' | 'modern' | 'auto';

export interface IngestOptions {
  kind?: IngestKind; // default: 'auto' (detect based on filename/content)
  outDir?: string;   // override output directory (not currently used)
}

export interface IngestResult {
  success: boolean;
  outputPath?: string;
  error?: string;
}

export interface IngestStrategy {
  name: IngestKind;
  ingest(filePath: string, opts?: IngestOptions): Promise<IngestResult>;
}

// We delegate the heavy lifting to the unified parser; strategies are
// kept to satisfy explicit ingest "types" and future specialization.
import path from 'path';
import { config } from './config.js';
// Import the reusable function from the unified parser
import { parseSingleCatalog } from '../catalog-parser-unified.js';

async function runUnified(filePath: string, opts?: IngestOptions): Promise<IngestResult> {
  try {
    const ok = await parseSingleCatalog(filePath);
    if (!ok) return { success: false, error: 'Parsing failed' };
    const base = path.basename(filePath, path.extname(filePath));
    const out = path.join(config.getConfig().paths.parsedDirectory, `${base}.json`);
    return { success: true, outputPath: out };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export const LegacyIngest: IngestStrategy = {
  name: 'legacy',
  ingest: (filePath, opts) => runUnified(filePath, { ...opts, kind: 'legacy' })
};

export const ModernIngest: IngestStrategy = {
  name: 'modern',
  ingest: (filePath, opts) => runUnified(filePath, { ...opts, kind: 'modern' })
};

export const AutoIngest: IngestStrategy = {
  name: 'auto',
  ingest: (filePath, opts) => runUnified(filePath, { ...opts, kind: 'auto' })
};

export function getIngestStrategy(kind?: IngestKind): IngestStrategy {
  switch (kind) {
    case 'legacy':
      return LegacyIngest;
    case 'modern':
      return ModernIngest;
    case 'auto':
    default:
      return AutoIngest;
  }
}
