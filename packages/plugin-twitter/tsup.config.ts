import { defineConfig } from 'tsup';

export default defineConfig({
    entry: [
        'src/index.ts',
        'src/test/meme-tweet.test.ts'
    ],
    splitting: false,
    sourcemap: true,
    clean: true,
    format: ['esm'],
    dts: true,
    outDir: 'dist',
    onSuccess: 'node dist/test/meme-tweet.test.js'
});
