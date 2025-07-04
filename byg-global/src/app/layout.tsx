import './globals.css';
import type { Metadata } from 'next';
import { Providers } from './providers';
import ClientLayout from './ClientLayout';

export const metadata: Metadata = {
  title: 'CAPTYN Global',
  description: 'Bridging worlds with seamless shopping',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="w-full h-full">
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
