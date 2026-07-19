import { copyFile, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';

async function copyDeclarations(sourceDirectory, targetDirectory) {
  for (const entry of await readdir(sourceDirectory, { withFileTypes: true })) {
    const source = path.join(sourceDirectory, entry.name);
    const target = path.join(targetDirectory, entry.name);
    if (entry.isDirectory()) {
      await copyDeclarations(source, target);
    } else if (entry.isFile() && entry.name.endsWith('.d.ts')) {
      await mkdir(path.dirname(target), { recursive: true });
      await copyFile(source, target);
    }
  }
}

await copyDeclarations('src', 'dist');
