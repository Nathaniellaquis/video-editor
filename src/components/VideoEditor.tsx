'use client';

import React, { useState } from 'react';
import { FileUpload } from './FileUpload';
import { ColorPicker } from './ColorPicker';
import { ProcessingStatus } from './ProcessingStatus';
import { VideoPreview } from './VideoPreview';
import { DownloadSection } from './DownloadSection';
import { useVideoStore } from '@/store/videoStore';
import { VideoProcessor } from '@/utils/VideoProcessor';
import { ProcessedVideo } from '@/store/videoStore';

const VideoEditor = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<'short' | 'long' | null>(null);
  const [progress, setProgress] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);
  
  const {
    screenRecording,
    faceRecording,
    backgroundImage,
    backgroundColor,
    shortFormVideo,
    longFormVideo,
    setShortFormVideo,
    setLongFormVideo,
  } = useVideoStore();

  const canGenerate = screenRecording && faceRecording; // Background image is now optional

  const handleGenerate = async () => {
    if (!canGenerate) return;

    setIsProcessing(true);
    setProcessingStep('short');
    setProgress(0);

    try {
      // Create FormData for API request
      const formData = new FormData();
      formData.append('screen', screenRecording.file);
      formData.append('face', faceRecording.file);
      if (backgroundImage) {
        formData.append('bg', backgroundImage.file);
      }
      formData.append('color', backgroundColor);
      formData.append('format', 'both');

      // Use streaming API for live progress
      const response = await fetch('/api/generate-stream', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No reader available');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'progress') {
                setProgress(data.progress);
                if (data.message?.includes('Long form')) {
                  setProcessingStep('long');
                }
                // Update estimated time based on actual progress
                if (data.details?.timemark) {
                  console.log('Progress:', data.message, data.details);
                }
              } else if (data.type === 'complete') {
                setProgress(100);
                
                if (data.results?.shortForm) {
                  const shortFormVideo: ProcessedVideo = {
                    url: data.results.shortForm,
                    name: 'short_form_video.mp4',
                    size: 0,
                    format: 'short'
                  };
                  setShortFormVideo(shortFormVideo);
                }

                if (data.results?.longForm) {
                  const longFormVideo: ProcessedVideo = {
                    url: data.results.longForm,
                    name: 'long_form_video.mp4',
                    size: 0,
                    format: 'long'
                  };
                  setLongFormVideo(longFormVideo);
                }
              } else if (data.type === 'error') {
                throw new Error(data.message);
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error processing videos:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Error processing videos: ${errorMessage}. Please try again.`);
    } finally {
      setIsProcessing(false);
      setProcessingStep(null);
      setProgress(0);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Left Column - Input Section (2/5 width) */}
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-white rounded-xl shadow-lg p-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Upload Your Content
            </h2>
            
            <div className="space-y-4">
              <FileUpload
                label="Screen Recording"
                description="Upload your screen recording video (max 30GB)"
                accept="video/*"
                onFileSelect={(file) => useVideoStore.getState().setScreenRecording(file)}
                selectedFile={screenRecording}
              />

              <FileUpload
                label="Face Recording (Background Removed)"
                description="Upload your face recording with background removed (max 30GB). Audio will be taken from this video only."
                accept="video/*"
                onFileSelect={(file) => useVideoStore.getState().setFaceRecording(file)}
                selectedFile={faceRecording}
              />

              <FileUpload
                label="Background Image (Optional)"
                description="Upload a static background image (optional - will use background color if not provided)"
                accept="image/*"
                onFileSelect={(file) => useVideoStore.getState().setBackgroundImage(file)}
                selectedFile={backgroundImage}
              />

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Audio Note:</strong> Only audio from your face recording will be used in the final video. 
                  Screen recording audio is automatically ignored to avoid echo and feedback issues.
                </p>
              </div>
              
              <ColorPicker
                label="Background Color"
                color={backgroundColor}
                onChange={(color) => useVideoStore.getState().setBackgroundColor(color)}
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={!canGenerate || isProcessing}
              className="w-full mt-4 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Processing...' : 'Generate Videos'}
            </button>
          </div>

          {isProcessing && (
            <ProcessingStatus
              step={processingStep}
              progress={progress}
              estimatedTime={estimatedTime}
            />
          )}
        </div>

        {/* Right Column - Preview and Download (3/5 width) */}
        <div className="xl:col-span-3 space-y-4">
          <VideoPreview isProcessing={isProcessing} />
          
          {(shortFormVideo || longFormVideo) && (
            <DownloadSection
              shortFormVideo={shortFormVideo}
              longFormVideo={longFormVideo}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export { VideoEditor }; 