import esbuild from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { watch } from 'fs';

const isWatch = process.argv.includes('--watch');

async function build() {
  // Build plugin backend (Figma sandbox)
  await esbuild.build({
    entryPoints: ['src/code.ts'],
    bundle: true,
    outfile: 'dist/code.js',
    target: 'es6',
    format: 'iife',
  });

  // Build UI script (no DOM APIs available during build — just bundle)
  const uiResult = await esbuild.build({
    entryPoints: ['src/ui.ts'],
    bundle: true,
    write: false,
    target: 'es6',
    format: 'iife',
  });

  // Inline bundled script into HTML
  const html = readFileSync('src/ui.html', 'utf8');
  const js = uiResult.outputFiles[0].text;
  mkdirSync('dist', { recursive: true });
  writeFileSync('dist/ui.html', html.replace('</body>', `<script>${js}</script></body>`));

  console.log(`[${new Date().toLocaleTimeString()}] Build complete`);
}

if (isWatch) {
  await build().catch(console.error);
  watch('src', { recursive: true }, () => {
    build().catch(console.error);
  });
} else {
  await build().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
