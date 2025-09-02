'use client';

import { VideoEditor } from '@/components/VideoEditor';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Video Editing Cursor
          </h1>
          <p className="text-lg text-gray-600">
            Create stunning Instagram reels and YouTube videos with screen recording and face recording
          </p>
        </header>
        
        <VideoEditor />
      </div>
    </main>
  );
} 