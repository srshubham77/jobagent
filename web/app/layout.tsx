import type { Metadata } from 'next'
import './globals.css'
import Providers from './providers'

export const metadata: Metadata = {
  title: 'JobAgent',
  description: 'Find remote, USD-paying engineering jobs and apply on your behalf.',
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='6' fill='%23D9663E'/><text x='16' y='23' text-anchor='middle' font-family='Inter,sans-serif' font-size='20' font-weight='700' letter-spacing='-0.03em' fill='%23FAF8F3'>J</text></svg>",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body><Providers>{children}</Providers></body>
    </html>
  )
}
