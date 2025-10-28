#!/usr/bin/env node
import { getLiveWritingByCategory } from '../app/lib/writing.js';

function printSection({ label, entries }) {
  console.log(`\n## ${label}`);
  if (!entries.length) {
    console.log('  (no entries)');
    return;
  }

  for (const { title, href, preview } of entries) {
    const source = href.startsWith('writing/') ? 'local' : 'external';
    console.log(`- [${source}] ${title}`);
    console.log(`    → ${href}`);
    if (preview) {
      console.log(`    ${preview}`);
    }
  }
}

async function main() {
  const sections = await getLiveWritingByCategory();
  console.log('# Writing Preview');
  console.log(`Generated at ${new Date().toISOString()}`);

  for (const section of sections) {
    printSection(section);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
