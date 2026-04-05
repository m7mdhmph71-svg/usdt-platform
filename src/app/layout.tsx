import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'USDT Platform | منصة USDT',
  description: 'Buy USDT easily via bank transfer | اشترِ USDT بتحويل بنكي',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  )
}
