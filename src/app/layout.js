import './globals.css'

export const metadata = {
  title: 'BuildBot',
  description: 'AI-powered architecture and design assistant',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}