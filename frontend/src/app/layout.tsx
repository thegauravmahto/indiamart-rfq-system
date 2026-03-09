import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI-Powered RFQ System | IndiaMART',
  description: 'Converting vague buyer queries into structured, supplier-ready RFQs using multi-agent AI. Built with Google ADK + Gemini 2.0.',
  keywords: 'IndiaMART, RFQ, AI, multi-agent, Google ADK, Gemini, B2B marketplace',
  authors: [{ name: 'Gaurav Mahto' }],
  openGraph: {
    title: 'AI-Powered RFQ System | IndiaMART',
    description: 'Multi-agent AI system that converts vague buyer queries into structured RFQs',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-roboto bg-im-bg text-im-text-heading antialiased">
        {children}
      </body>
    </html>
  )
}
