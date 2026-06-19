/*
 * Compiles the library's Tailwind stylesheet and wires it into the published
 * package. Run AFTER `ng build @highstack/ui` (ng-packagr) has produced
 * dist/highstack/ui.
 *
 *   1. Compile projects/highstack/ui/styles/index.css with Tailwind.
 *   2. Write the result to dist/highstack/ui/styles.css.
 *   3. Add a "./styles.css" entry to the published package.json exports.
 */
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const inputPath = resolve(root, 'projects/highstack/ui/styles/index.css');
const distDir = resolve(root, 'dist/highstack/ui');
const outputPath = resolve(distDir, 'styles.css');
const pkgPath = resolve(distDir, 'package.json');

const css = await readFile(inputPath, 'utf8');
const result = await postcss([tailwind()]).process(css, { from: inputPath, to: outputPath });
await writeFile(outputPath, result.css, 'utf8');
console.log(`✓ styles.css (${(result.css.length / 1024).toFixed(1)} kB)`);

const pkg = JSON.parse(await readFile(pkgPath, 'utf8'));
pkg.exports = {
  ...pkg.exports,
  './styles.css': { default: './styles.css' },
};
await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
console.log('✓ package.json exports patched');
