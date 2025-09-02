'use client';

import React, { useEffect, useState } from 'react';
import { useVideoStore } from '@/store/videoStore';
import VerticalPreview from './VerticalPreview';
import HorizontalPreview from './HorizontalPreview';

interface VideoPreviewProps {
  isProcessing?: boolean;
}

export function VideoPreview({ isProcessing: processingFromParent = false }: VideoPreviewProps) {
  const { 
    screenRecording, 
    faceRecording, 
    backgroundImage, 
    backgroundColor,
    shortFormVideo,
    longFormVideo
  } = useVideoStore();
  
  const [screenRecSrc, setScreenRecSrc] = useState<string | null>(null);
  const [faceRecSrc, setFaceRecSrc] = useState<string | null>(null);
  const [bgImgSrc, setBgImgSrc] = useState<string | null>(null);
  const isProcessing = processingFromParent;

  useEffect(() => {
    if (screenRecording) {
      const url = URL.createObjectURL(screenRecording.file);
      setScreenRecSrc(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setScreenRecSrc(null);
    }
  }, [screenRecording]);

  useEffect(() => {
    if (faceRecording) {
      const url = URL.createObjectURL(faceRecording.file);
      setFaceRecSrc(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setFaceRecSrc(null);
    }
  }, [faceRecording]);

  useEffect(() => {
    if (backgroundImage) {
      const url = URL.createObjectURL(backgroundImage.file);
      setBgImgSrc(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setBgImgSrc(null);
    }
  }, [backgroundImage]);


  return (
    <div className="bg-white rounded-xl shadow-lg p-4">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Preview
      </h2>
      
      <div className="space-y-8">
        {/* Live Preview Section */}
        <div className="overflow-x-auto pb-2">
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-center min-w-fit">
            <VerticalPreview 
              screenRecSrc={screenRecSrc}
              faceRecSrc={faceRecSrc}
              bgImgSrc={bgImgSrc}
              bgColor={backgroundColor}
              isProcessing={isProcessing}
            />
            
            <HorizontalPreview 
              screenRecSrc={screenRecSrc}
              faceRecSrc={faceRecSrc}
              bgImgSrc={bgImgSrc}
              bgColor={backgroundColor}
              isProcessing={isProcessing}
            />
          </div>
        </div>

        {/* Processed Videos Section */}
        {(shortFormVideo || longFormVideo) && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Generated Videos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {shortFormVideo && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Short Form (Instagram Reels)</p>
                  <video
                    src={shortFormVideo.url}
                    className="w-full rounded-lg shadow-md"
                    controls
                    muted
                    preload="metadata"
                  />
                </div>
              )}
              
              {longFormVideo && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Long Form (YouTube)</p>
                  <video
                    src={longFormVideo.url}
                    className="w-full rounded-lg shadow-md"
                    controls
                    muted
                    preload="metadata"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}