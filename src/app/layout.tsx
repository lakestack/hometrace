import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import SessionProviderWrapper from '@/components/SessionProviderWrapper';
import { Toaster } from 'react-hot-toast';
import LayoutWrapper from '@/components/LayoutWrapper';

export const metadata: Metadata = {
  title: 'Hometrace - Find Your Dream Home',
  description:
    'Discover the perfect property with our comprehensive real estate platform. From cozy apartments to luxury homes, we have it all.',
  keywords:
    'real estate, property, homes, apartments, buy, sell, rent, Australia',
  authors: [{ name: 'Hometrace Team' }],
  openGraph: {
    title: 'Hometrace - Find Your Dream Home',
    description:
      'Discover the perfect property with our comprehensive real estate platform.',
    type: 'website',
    locale: 'en_AU',
  },
};

const geist = Geist({
  subsets: ['latin'],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geist.className}>
      <body className="antialiased">
        <SessionProviderWrapper>
          <LayoutWrapper>{children}</LayoutWrapper>
        </SessionProviderWrapper>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </body>
    </html>
  );
}
