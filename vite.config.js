import react from '@vitejs/plugin-react'
import { transformWithEsbuild } from 'vite'
import glsl from 'vite-plugin-glsl'
import basicSsl from '@vitejs/plugin-basic-ssl';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default {
    // Explicitly set root to the directory containing vite.config.js
    root: __dirname,
    publicDir: resolve(__dirname, 'public'),
    base: './',
    resolve: {
        alias: {
            '@packages': resolve(__dirname, 'packages'),
            'three': resolve(__dirname, 'node_modules/three')
        }
    },
    plugins:
    [
        // React support
        react(),

        // .js file support as if it was JSX
        {
            name: 'load+transform-js-files-as-jsx',
            async transform(code, id)
            {
                if (!id.match(/src\/.*\.js$/))
                    return null

                return transformWithEsbuild(code, id, {
                    loader: 'jsx',
                    jsx: 'automatic',
                });
            },
        },
        
        glsl(),

        // Only enable SSL plugin in dev mode, not during build
        ...(process.env.NODE_ENV !== 'production' ? [basicSsl()] : [])
    ],
    server:
    {
        host: true, // Open to local network and display URL
        open: !('SANDBOX_URL' in process.env || 'CODESANDBOX_HOST' in process.env), // Open if it's not a CodeSandbox
        https: true
    },
    build:
    {
        outDir: 'dist', // Output in the dist/ folder
        emptyOutDir: true, // Empty the folder first
        sourcemap: true, // Add sourcemap
        rollupOptions: {
            // Explicitly set the HTML entry point
            input: resolve(__dirname, 'index.html')
        }
    },
}