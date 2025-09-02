'use client';

import { Loader2, Video, Youtube } from 'lucide-react';

interface ProcessingStatusProps {
  step: 'short' | 'long' | null;
  progress: number;
  estimatedTime: number;
}

export function ProcessingStatus({ step, progress, estimatedTime }: ProcessingStatusProps) {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getStepInfo = () => {
    switch (step) {
      case 'short':
        return {
          title: 'Processing Short Form Video',
          description: 'Creating Instagram reels format (1080x1920)',
          icon: Video,
        };
      case 'long':
        return {
          title: 'Processing Long Form Video',
          description: 'Creating YouTube format (1920x1080)',
          icon: Youtube,
        };
      default:
        return {
          title: 'Processing',
          description: 'Preparing your videos...',
          icon: Loader2,
        };
    }
  };

  const stepInfo = getStepInfo();
  const Icon = stepInfo.icon;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center space-x-4 mb-4">
        <div className="flex-shrink-0">
          <Icon className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {stepInfo.title}
          </h3>
          <p className="text-sm text-gray-600">
            {stepInfo.description}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {estimatedTime > 0 && (
          <div className="flex justify-between text-sm text-gray-600">
            <span>Estimated time remaining</span>
            <span>{formatTime(estimatedTime)}</span>
          </div>
        )}

        <div className="text-xs text-gray-500 text-center">
          Please don't close this tab while processing...
        </div>
      </div>
    </div>
  );
} 