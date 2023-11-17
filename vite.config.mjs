import archiver from 'archiver';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import { resolve } from 'path';
import { defineConfig } from 'vite';

/**
 * @returns {import('vite').Plugin}
 */
function updateModuleManifestPlugin() {
    return {
        name: 'update-module-manifest',
        writeBundle: async () => {
            /**
             * @type {Record<string, unknown>}
             */
            const packageJSON = JSON.parse(await fsPromises.readFile('package.json', 'utf-8'));

            /**
             * @type {Record<string, unknown>}
             */
            const manifestJSON = JSON.parse(await fsPromises.readFile('module.json', 'utf-8'));

            manifestJSON.version = packageJSON.version;
            manifestJSON.manifest = 'https://raw.githubusercontent.com/DarkLight1337/my-homebrew/master/dist/module.json';
            manifestJSON.download = 'https://raw.githubusercontent.com/DarkLight1337/my-homebrew/master/dist/module.zip';

            await fsPromises.mkdir('dist', { recursive: true });
            await fsPromises.writeFile('dist/module.json', JSON.stringify(manifestJSON, null, 4));

            const archive = archiver('zip');
            archive.pipe(fs.createWriteStream(resolve(__dirname, 'dist', 'module.zip')));
            archive.file('dist/module.json', { name: 'module.json' });
            archive.directory('build', 'src');
            archive.directory('packs', 'packs');
            await archive.finalize();
        },
    };
}

export default defineConfig({
    build: {
        sourcemap: true,
        rollupOptions: {
            input: 'src/index.mjs',
            output: {
                dir: 'build',
                entryFileNames: '[name].mjs',
                format: 'esm',
            },
        },
    },
    plugins: [updateModuleManifestPlugin()],
});
