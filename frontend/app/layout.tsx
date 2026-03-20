import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import ConditionalLayout from '@/components/ConditionalLayout';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['700', '900'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Indian Reformer Organisation | Reforming India, Together',
    template: '%s | Indian Reformer Organisation',
  },
  description:
    'A citizen-led movement for transparent governance and reform across India. Join thousands of reformers working towards a better nation.',
  keywords: ['Indian Reformer Organisation', 'IRO', 'India reform', 'transparent governance'],
  metadataBase: new URL('https://iro.in'),

  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },

  openGraph: {
    siteName: 'Indian Reformer Organisation',
    title: 'Indian Reformer Organisation | Reforming India, Together',
    description: 'A citizen-led movement for transparent governance and reform across India.',
    url: 'https://iro.in',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="bg-[#F7F4EF] text-[#2C3E50] antialiased">
        <ConditionalLayout>{children}</ConditionalLayout>
      </body>
    </html>
  );
}
