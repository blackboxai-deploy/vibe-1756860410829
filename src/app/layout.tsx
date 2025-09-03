import './globals.css'

export const metadata = {
  title: 'Blockchain Simulation',
  description: 'Interactive blockchain explorer and mining simulator for educational purposes',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}