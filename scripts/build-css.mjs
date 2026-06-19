/*
 * Compiles the library's Tailwind stylesheet.
 *
 * Output is written to projects/highstack/ui/styles.css (a generated file,
 * gitignored). ng-packagr then copies it into the published package as an
 * asset (see ng-package.json), so EVERY build includes it in dist.
 *
 * Must run BEFORE `ng build @highstack/ui` — ng-packagr cleans dist on each
 * build, so the CSS has to exist as a source asset when ng build runs.
 */
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const inputPath = resolve(root, 'projects/highstack/ui/styles/index.css');
const outputPath = resolve(root, 'projects/highstack/ui/styles.css');

const css = await readFile(inputPath, 'utf8');
const result = await postcss([tailwind()]).process(css, { from: inputPath, to: outputPath });
await writeFile(outputPath, result.css, 'utf8');
console.log(`✓ styles.css (${(result.css.length / 1024).toFixed(1)} kB)`);
