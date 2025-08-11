import { promises as fs } from 'fs';
import path from 'path';

async function main() {
  const dir = path.resolve(process.cwd(), 'dist-cjs');
  const entries = await fs.readdir(dir);
  for (const file of entries) {
    if (file.endsWith('.js')) {
      const from = path.join(dir, file);
      const to = path.join(dir, file.replace(/\.js$/, '.cjs'));
      await fs.rename(from, to);
    }
  }
}

main().catch(err => {
  console.error('rename-cjs failed', err);
  process.exit(1);
});
