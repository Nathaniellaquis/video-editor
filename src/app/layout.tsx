import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Video Editing Cursor',
  description: 'Create Instagram reels and YouTube format videos with screen recording and face recording',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        {children}
      </body>
    </html>
  );
} 