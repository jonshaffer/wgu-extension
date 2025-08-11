import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

import packageJson from "./package.json"

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: [
    '@wxt-dev/module-react',
    '@wxt-dev/auto-icons',
  ],
  publicDir: 'public',
  webExt: {
    startUrls: [
      'https://my.wgu.edu'
    ]
  },
  manifest: ({ mode }) => {
    const isDev = mode === 'development';
    const isPreview = mode === 'preview';
    
    return {
      name: `Unofficial WGU Extension${isDev ? ' (DEV)' : isPreview ? ' (PREVIEW)' : ''}`,
      description: packageJson.description,
      permissions: [
        'storage',
        'activeTab'
      ],
      host_permissions: [
        'https://raw.githubusercontent.com/jonshaffer/wgu-extension/*',
        '*://discord.com/*',
        '*://wguconnect.wgu.edu/*'
      ],
      web_accessible_resources: [
        {
          resources: ['data/communities/*.json', 'data/courses/*.json', 'data/*.json', 'data/reddit/processed/*.json', 'icons/128.png'],
          matches: ['https://my.wgu.edu/*']
        }
      ]
    };
  },
  vite: () => ({
    plugins: [
      tailwindcss(),
    ],
  }),
});
