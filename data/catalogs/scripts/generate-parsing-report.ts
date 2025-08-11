#!/usr/bin/env npx tsx

/**
 * Generate a parsing results report and inject it into data/catalogs/README.md
 * Scans data/catalogs/parsed/*.json produced by the unified parser.
 */

import fs from 'fs/promises';
import path from 'path';

type ParsedCatalog = {
  metadata: {
    catalogDate: string;
    parserVersion: string;
    parsedAt: string;
    totalPages: number;
    parsingTimeMs: number;
    pdf?: {
      title?: string;
      version?: string;
      pages: number;
  // pageSize and security intentionally omitted
    };
    statistics: {
      coursesFound: number;
      degreePlansFound: number;
      ccnCoverage: number;
      cuCoverage: number;
    };
  };
};

function sanitize(value?: string): string {
  if (!value) return '';
  return value.replace(/[\r\n|]+/g, ' ').replace(/\s+/g, ' ').trim();
}

async function getParsedFiles(dir: string): Promise<string[]> {
  const files = await fs.readdir(dir).catch(() => []);
  return files.filter(f => f.toLowerCase().endsWith('.json')).sort();
}

async function loadCatalog(filePath: string): Promise<ParsedCatalog | null> {
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw) as ParsedCatalog;
  } catch {
    return null;
  }
}

function buildTable(rows: Array<{ name: string; meta: ParsedCatalog['metadata']; file: string }>): string {
  const header = `| File | Date | Pages | Courses | Plans | CCN% | CU% | Parser | PDF Version | PDF Title |
|------|------|-------|---------|-------|------:|----:|--------|------------|-----------|`;

  const lines = rows.map(({ name, meta }) => {
    const pdf = meta.pdf || ({ pages: meta.totalPages } as ParsedCatalog['metadata']['pdf']);
  const pdfVersion = sanitize(pdf?.version);
  const pdfTitle = sanitize(pdf?.title);
  return `| ${name} | ${meta.catalogDate} | ${meta.totalPages} | ${meta.statistics.coursesFound} | ${meta.statistics.degreePlansFound} | ${meta.statistics.ccnCoverage} | ${meta.statistics.cuCoverage} | ${meta.parserVersion} | ${pdfVersion} | ${pdfTitle} |`;
  });

  return [header, ...lines].join('\n');
}

async function injectIntoReadme(table: string) {
  const readmePath = path.join(process.cwd(), 'data', 'catalogs', 'README.md');
  let content = await fs.readFile(readmePath, 'utf-8');

  const newSection = `\n## Parsing Results\n\n${table}\n`;

  if (content.includes('## Parsing Results')) {
    const idx = content.indexOf('## Parsing Results');
    const tail = content.slice(idx);
    const nextIdx = tail.indexOf('\n## ');
    if (nextIdx > -1) {
      const before = content.slice(0, idx);
      const after = tail.slice(nextIdx + 1);
      content = before + newSection + '\n' + after;
    } else {
      content = content.slice(0, idx) + newSection;
    }
  } else {
    if (!content.endsWith('\n')) content += '\n';
    content += newSection;
  }

  await fs.writeFile(readmePath, content);
}

async function main() {
  const parsedDir = path.join(process.cwd(), 'data', 'catalogs', 'parsed');
  const files = await getParsedFiles(parsedDir);
  const rows: Array<{ name: string; meta: ParsedCatalog['metadata']; file: string }> = [];

  for (const f of files) {
    const filePath = path.join(parsedDir, f);
    const data = await loadCatalog(filePath);
    if (!data) continue;
    rows.push({ name: f, meta: data.metadata, file: f });
  }

  if (!rows.length) {
    console.log('No parsed catalogs found. Run the ingest/parser first.');
    return;
  }

  // Sort newest first by parsedAt if present, else by name
  rows.sort((a, b) => {
    const da = Date.parse(a.meta.parsedAt || '');
    const db = Date.parse(b.meta.parsedAt || '');
    if (!isNaN(da) && !isNaN(db)) return db - da;
    return b.name.localeCompare(a.name);
  });

  const table = buildTable(rows);
  await injectIntoReadme(table);
  console.log('Parsing results section updated in data/catalogs/README.md');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
