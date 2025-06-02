import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

import packageJson from "./package.json"

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: [
    '@wxt-dev/module-react',
    '@wxt-dev/auto-icons',
  ],
  manifest: {
    name: 'Unofficial WGU Extension',
    description: packageJson.description,
    permissions: [
      'storage',
    ],
    web_accessible_resources: [
      {
        resources: ["assets/icon.png"],
        matches: ["https://my.wgu.edu/courses/course/*"]
      }
    ],
    host_permissions: [
      'https://raw.githubusercontent.com/*'
    ]
  },
  vite: () => ({
    plugins: [
      tailwindcss(),
    ],
  }),
});
