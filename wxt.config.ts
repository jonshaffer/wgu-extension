import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

import packageJson from "./package.json"

import discords from "./assets/discord-whitelist.json"

const discordCommunities = Object.values(discords.communities).map((community) => (
  `https://discord.com/channels/${community.id}/*`
));

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: [
    '@wxt-dev/module-react',
    '@wxt-dev/auto-icons',
  ],
  webExt: {
    startUrls: [
      'https://my.wgu.edu'
    ]
  },
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
      },
      {
        resources: ["assets/discord-whitelist.json", "assets/discord-channels.json", "assets/icon.png"],
        matches: [...discordCommunities]
      }
    ],
    host_permissions: [
      'https://raw.githubusercontent.com/jonshaffer/wgu-extension/*'
    ]
  },
  vite: () => ({
    plugins: [
      tailwindcss(),
    ],
  }),
});
