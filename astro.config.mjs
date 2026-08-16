// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';
import icon from 'astro-icon';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  security: {
    checkOrigin: false,
  },
  vite: {
    plugins: [tailwindcss()]
  },
  adapter: vercel(),
  integrations: [icon()]
});