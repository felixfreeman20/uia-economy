import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'VoxBank — School Economy',
  description: 'The official school economy platform. Trade stocks, run businesses, join factions, and dominate the leaderboard.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
