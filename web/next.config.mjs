/** @type {import('next').NextConfig} */
const config = {
  output: 'standalone',

  env: {
    PROFILE_SERVICE_URL: process.env.PROFILE_SERVICE_URL ?? 'http://localhost:8081',
    MATCHER_SERVICE_URL: process.env.MATCHER_SERVICE_URL ?? 'http://localhost:8083',
    APPLY_SERVICE_URL:   process.env.APPLY_SERVICE_URL   ?? 'http://localhost:8084',
    // Phase 1: single dev user until auth lands
    DEV_USER_ID: process.env.DEV_USER_ID ?? '00000000-0000-0000-0000-000000000001',
  },
}

export default config
