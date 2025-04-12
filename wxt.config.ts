import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: [
    '@wxt-dev/module-react',
    '@wxt-dev/auto-icons',
  ],
  manifest: {
    name: 'WGU Extension',
    description: 'Adds percentage to the OA Test Report pages on both pre-assessment and assessment.',
    permissions: [
      'storage',
    ],
  },
  vite: () => ({
    plugins: [
      tailwindcss(),
    ],
  }),
});
