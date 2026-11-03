import { defineConfig } from 'cf/config'

export default defineConfig({
  worker: {
    name: 'astrologia',
    compatibilityDate: '2026-11-01',
    domains: ['astro.nudomarino.com'],
    observability: {
      enabled: true,
    },
    assets: {
      notFoundHandling: 'single-page-application',
    },
  },
})
