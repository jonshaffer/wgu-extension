#!/usr/bin/env npx tsx

/**
 * Single executable CLI to convert catalog PDFs to JSON using ingest strategies.
 *
 * Usage:
 *   npx tsx data/catalogs/scripts/ingest-catalogs.ts <path-or-glob> [--kind auto|legacy|modern]
 *   npm run data:ingest:catalogs -- --kind auto
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { getIngestStrategy, type IngestKind } from './lib/ingest-types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Args { input: string[]; kind: IngestKind; }

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const input: string[] = [];
  let kind: IngestKind = 'auto';

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--kind' && argv[i + 1]) {
      kind = argv[i + 1] as IngestKind;
      i++;
    } else if (!a.startsWith('--')) {
      input.push(a);
    }
  }

  return { input, kind };
}

async function expandInputs(pathsOrGlobs: string[]): Promise<string[]> {
  // Simple expansion: if directory, include all PDFs; if file, include file.
  const results: string[] = [];
  for (const p of pathsOrGlobs.length ? pathsOrGlobs : [path.join(__dirname, '..', 'pdfs')]) {
    try {
      const stat = await fs.stat(p);
      if (stat.isDirectory()) {
        const files = await fs.readdir(p);
        for (const f of files) {
          if (f.toLowerCase().endsWith('.pdf')) results.push(path.join(p, f));
        }
      } else if (p.toLowerCase().endsWith('.pdf')) {
        results.push(p);
      }
    } catch {
      // ignore missing
    }
  }
  return results;
}

async function main() {
  const { input, kind } = parseArgs();
  const files = await expandInputs(input);
  if (!files.length) {
    console.error('No PDF inputs found. Pass a file/dir or place PDFs under data/catalogs/pdfs.');
    process.exit(1);
  }

  const strategy = getIngestStrategy(kind);
  console.log(`Using ingest strategy: ${strategy.name}`);

  let ok = 0, fail = 0;
  for (const file of files) {
    console.log(`\n📖 Ingesting ${path.basename(file)} ...`);
    const res = await strategy.ingest(file);
    if (res.success) {
      console.log(`✅ Wrote ${res.outputPath}`);
      ok++;
    } else {
      console.error(`❌ Failed: ${res.error}`);
      fail++;
    }
  }

  console.log(`\nDone. Success: ${ok}  Failed: ${fail}`);
  process.exit(fail > 0 ? 1 : 0);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
