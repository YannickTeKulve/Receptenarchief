// @ts-check
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

const isProduction = process.env.NODE_ENV === 'production';
const site = process.env.SITE_URL || 'https://yannicktekulve.github.io';
const base = process.env.BASE_PATH ?? (isProduction ? '/Receptenarchief' : '/');

export default defineConfig({
  output: 'static',
  site,
  base,
  trailingSlash: 'always',
  integrations: [sitemap()],
});
