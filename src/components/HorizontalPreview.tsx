'use client';

import React, { useRef, useEffect } from 'react';

interface HorizontalPreviewProps {
  screenRecSrc: string | null;
  faceRecSrc: string | null;
  bgImgSrc: string | null;
  bgColor: string;
  isProcessing?: boolean;
}

const PREVIEW_WIDTH = 480; // 1920 / 4
const PREVIEW_HEIGHT = 270; // 1080 / 4

const HorizontalPreview: React.FC<HorizontalPreviewProps> = ({ 
  screenRecSrc, 
  faceRecSrc, 
  bgImgSrc, 
  bgColor,
  isProcessing
}) => {
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const faceVideoRef = useRef<HTMLVideoElement>(null);

  // Sync video playback when sources change
  useEffect(() => {
    if (screenRecSrc && faceRecSrc && screenVideoRef.current && faceVideoRef.current) {
      // Reset both videos to start
      screenVideoRef.current.currentTime = 0;
      faceVideoRef.current.currentTime = 0;
      
      // Play both videos
      const playBoth = async () => {
        try {
          await Promise.all([
            screenVideoRef.current?.play(),
            faceVideoRef.current?.play()
          ]);
        } catch (e) {
          console.log('Autoplay failed:', e);
        }
      };
      playBoth();
    }
  }, [screenRecSrc, faceRecSrc]);
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Horizontal Video Preview</h3>
      <div
        className="relative shadow-lg overflow-hidden flex items-center justify-center mx-auto"
        style={{
          width: `${PREVIEW_WIDTH}px`,
          height: `${PREVIEW_HEIGHT}px`,
          backgroundColor: bgColor,
          borderRadius: '12px',
        }}
      >
        {isProcessing && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
            <svg className="animate-spin h-10 w-10 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-white mt-2">Generating...</p>
          </div>
        )}

        {/* Main Screen Recording */}
        <div className="w-full h-full flex items-center justify-center">
          {screenRecSrc ? (
            <video 
              ref={screenVideoRef}
              key={screenRecSrc} 
              src={screenRecSrc} 
              muted 
              loop 
              playsInline 
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-300/10">
              <p className="text-sm text-gray-500">Screen Recording Area</p>
            </div>
          )}
        </div>

        {/* Picture-in-Picture Face Recording */}
        <div 
          className="absolute border-2 border-white/50 shadow-xl overflow-hidden rounded-lg bg-black"
          style={{
            width: `${365 / 4}px`, // 91.25px
            height: `${206 / 4}px`, // 51.5px
            bottom: `${28 / 4}px`, // 7px
            right: `${25 / 4}px`, // 6.25px
          }}
        >
          {/* Static image as PiP background */}
          {bgImgSrc && (
            <img 
              src={bgImgSrc} 
              alt="PiP Background" 
              className="absolute inset-0 w-full h-full object-cover opacity-50" 
            />
          )}
          
          {/* Face video on top */}
          <div className="absolute inset-0 w-full h-full">
            {faceRecSrc ? (
              <video 
                ref={faceVideoRef}
                key={faceRecSrc} 
                src={faceRecSrc} 
                muted 
                loop 
                playsInline 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-300/20">
                <p className="text-[8px] text-center text-gray-500">Face Cam</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HorizontalPreview;