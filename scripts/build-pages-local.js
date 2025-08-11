#!/usr/bin/env node
// Build the Pages artifact locally into the top-level `site/` folder,
// mirroring the GitHub Actions workflow logic.

const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

async function ensureDir(p) {
  await fsp.mkdir(p, { recursive: true });
}

async function copyIfExists(src, dest) {
  if (fs.existsSync(src)) {
    await ensureDir(dest);
    await fsp.cp(src, dest, { recursive: true, force: true });
  }
}

function listDir(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.map((e) => (e.isDirectory() ? { name: e.name, type: 'dir' } : { name: e.name, type: 'file' }));
}

async function main() {
  const siteDir = path.resolve(process.cwd(), 'pages-data');
  const outDirs = [
    'data/discord/raw',
    'data/discord/processed',
    'data/reddit/raw',
    'data/wgu-connect/raw',
    'data/wgu-student-groups/raw',
    'data/catalogs/parsed',
    'schemas',
  ].map((p) => path.join(siteDir, p));

  for (const d of outDirs) await ensureDir(d);

  // Copies
  await copyIfExists(path.resolve('extension/data/discord/raw'), path.join(siteDir, 'data/discord/raw'));
  await copyIfExists(path.resolve('extension/data/discord/processed'), path.join(siteDir, 'data/discord/processed'));
  await copyIfExists(path.resolve('extension/data/reddit/raw'), path.join(siteDir, 'data/reddit/raw'));
  await copyIfExists(path.resolve('extension/data/wgu-connect/raw'), path.join(siteDir, 'data/wgu-connect/raw'));
  await copyIfExists(path.resolve('extension/data/wgu-student-groups/raw'), path.join(siteDir, 'data/wgu-student-groups/raw'));
  await copyIfExists(path.resolve('extension/data/catalogs/parsed'), path.join(siteDir, 'data/catalogs/parsed'));

  // Schemas (whitelist)
  const schemaTargets = [
    'extension/data/catalogs/types/catalog-data.schema.json',
    'extension/data/discord/types/discord-community.schema.json',
    'extension/data/discord/types/discord-communities.schema.json',
    'extension/data/reddit/types/reddit-community.schema.json',
  ];
  for (const f of schemaTargets) {
    const src = path.resolve(f);
    if (fs.existsSync(src)) {
      const dest = path.join(siteDir, 'schemas', path.basename(f));
      await fsp.copyFile(src, dest);
    }
  }

  // .nojekyll
  await fsp.writeFile(path.join(siteDir, '.nojekyll'), '');

  // index.json (browsing aid)
  const tree = {};
  const bases = [
    path.join(siteDir, 'data/discord/raw'),
    path.join(siteDir, 'data/discord/processed'),
    path.join(siteDir, 'data/reddit/raw'),
    path.join(siteDir, 'data/wgu-connect/raw'),
    path.join(siteDir, 'data/wgu-student-groups/raw'),
    path.join(siteDir, 'data/catalogs/parsed'),
    path.join(siteDir, 'schemas'),
  ];
  for (const base of bases) {
  let key = base.split(path.sep)[base.split(path.sep).indexOf('pages-data') + 1]; // discord, reddit, catalogs, or schemas
    if (key === 'schemas') {
      tree.schemas = listDir(base);
      continue;
    }
    const last = base.split(path.sep).slice(-1)[0];
    if (!tree[key]) tree[key] = {};
    if (key === 'discord') {
      tree[key][last] = listDir(base);
    } else {
      tree[key] = listDir(base);
    }
  }
  const payload = {
    generatedAt: new Date().toISOString(),
    basePaths: {
      discord: { raw: '/data/discord/raw', processed: '/data/discord/processed' },
      reddit: '/data/reddit/raw',
      wguConnect: '/data/wgu-connect/raw',
      wguStudentGroups: '/data/wgu-student-groups/raw',
      catalogs: '/data/catalogs/parsed',
      schemas: '/schemas',
    },
    directories: tree,
  };
  await fsp.writeFile(path.join(siteDir, 'index.json'), JSON.stringify(payload, null, 2));

  console.log('Local Pages artifact built at ./site');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
