import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Providers } from './providers';
import ClientLayout from './ClientLayout';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'CAPTYN Global',
  description: 'Bridging worlds with seamless shopping',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  minimumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="w-full h-full">
      <head>
        <Script
          src={`https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=USD&components=buttons,card-fields&enable-funding=venmo,paylater&disable-funding=credit`}
          strategy="beforeInteractive"
        />
      </head>
      <body className="bg-black text-white w-full h-full">
        <Providers>
          <ClientLayout>
            <main className="w-full min-h-screen p-0">{children}</main>
          </ClientLayout>
        </Providers>
      </body>
    </html>
  );
}
