'use client';

import { Download, Video, Youtube } from 'lucide-react';
import { ProcessedVideo } from '@/store/videoStore';
import { useEffect, useState } from 'react';

interface DownloadSectionProps {
  shortFormVideo: ProcessedVideo | null;
  longFormVideo: ProcessedVideo | null;
}

export function DownloadSection({ shortFormVideo, longFormVideo }: DownloadSectionProps) {
  const [videoSizes, setVideoSizes] = useState<{ [key: string]: number }>({});

  // Fetch actual file sizes when videos are available
  useEffect(() => {
    const fetchVideoSizes = async () => {
      const sizes: { [key: string]: number } = {};

      if (shortFormVideo) {
        try {
          const response = await fetch(shortFormVideo.url);
          if (response.ok) {
            const blob = await response.blob();
            sizes.shortForm = blob.size;
          }
        } catch (error) {
          console.error('Error fetching short form video size:', error);
        }
      }

      if (longFormVideo) {
        try {
          const response = await fetch(longFormVideo.url);
          if (response.ok) {
            const blob = await response.blob();
            sizes.longForm = blob.size;
          }
        } catch (error) {
          console.error('Error fetching long form video size:', error);
        }
      }

      setVideoSizes(sizes);
    };

    fetchVideoSizes();
  }, [shortFormVideo, longFormVideo]);

  const handleDownload = async (video: ProcessedVideo) => {
    try {
      const response = await fetch(video.url);
      if (!response.ok) {
        throw new Error('Failed to fetch video file');
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = video.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading video:', error);
      alert('Error downloading video. Please try again.');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">
        Download Your Videos
      </h2>

      <div className="space-y-4">
        {shortFormVideo && (
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Video className="w-8 h-8 text-blue-500" />
                <div>
                  <h3 className="font-medium text-gray-900">
                    Short Form Video (Instagram Reels)
                  </h3>
                  <p className="text-sm text-gray-500">
                    {videoSizes.shortForm ? formatFileSize(videoSizes.shortForm) : 'Loading...'} • 1080x1920
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDownload(shortFormVideo)}
                className="btn-primary flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            </div>
          </div>
        )}

        {longFormVideo && (
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Youtube className="w-8 h-8 text-red-500" />
                <div>
                  <h3 className="font-medium text-gray-900">
                    Long Form Video (YouTube)
                  </h3>
                  <p className="text-sm text-gray-500">
                    {videoSizes.longForm ? formatFileSize(videoSizes.longForm) : 'Loading...'} • 1920x1080
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDownload(longFormVideo)}
                className="btn-primary flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            </div>
          </div>
        )}

        {!shortFormVideo && !longFormVideo && (
          <div className="text-center text-gray-500 py-8">
            <Download className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No videos ready for download yet</p>
          </div>
        )}
      </div>
    </div>
  );
} 