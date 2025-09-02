'use client';

import React, { useRef, useEffect } from 'react';

interface VerticalPreviewProps {
  screenRecSrc: string | null;
  faceRecSrc: string | null;
  bgImgSrc: string | null;
  bgColor: string;
  isProcessing?: boolean;
}

// Scaled down dimensions for preview (original / 4)
const PREVIEW_WIDTH = 270; // 1080 / 4
const PREVIEW_HEIGHT = 480; // 1920 / 4

const VerticalPreview: React.FC<VerticalPreviewProps> = ({ 
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
      <h3 className="text-lg font-semibold text-gray-900">Vertical Reel Preview</h3>
      <div 
        className="relative shadow-lg overflow-hidden flex items-center justify-center mx-auto"
        style={{
          width: `${PREVIEW_WIDTH}px`,
          height: `${PREVIEW_HEIGHT}px`,
          backgroundColor: bgColor,
          borderRadius: '20px',
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
        
        {/* Background Image Layer */}
        <div 
          className="absolute bg-cover bg-center"
          style={{
            width: `${1016 / 4}px`, // 254px
            height: `${802 / 4}px`, // 200.5px
            top: `${1118 / 4}px`, // 279.5px
            left: `${(PREVIEW_WIDTH - 1016/4) / 2}px`, // (270 - 254)/2 = 8px
            borderTopLeftRadius: `${116 / 4}px`, // 29px
            borderTopRightRadius: `${116 / 4}px`, // 29px
          }}
        >
          {bgImgSrc ? (
            <img src={bgImgSrc} alt="Background" className="w-full h-full object-cover rounded-t-[29px]" />
          ) : (
            <div className="w-full h-full bg-gray-300/20 rounded-t-[29px]"></div>
          )}
        </div>

        {/* Face Recording Layer */}
        <div 
          className="absolute"
          style={{
            width: `${1080 / 4}px`, // 270px
            height: `${939 / 4}px`, // 234.75px
            top: `${981 / 4}px`, // 245.25px
            left: 0,
            borderTopLeftRadius: `${116 / 4}px`, // 29px
            borderTopRightRadius: `${116 / 4}px`, // 29px,
            overflow: 'hidden'
          }}
        >
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
            <div className="w-full h-full flex items-center justify-center bg-gray-300/10">
              <p className="text-xs text-gray-500">Face Recording</p>
            </div>
          )}
        </div>

        {/* Screen Recording Layer */}
        <div 
          className="absolute"
          style={{
            width: `${1080 / 4}px`, // 270px
            height: `${669 / 4}px`, // 167.25px
            top: `${211 / 4}px`, // 52.75px
            left: 0,
            borderRadius: `${54 / 4}px`, // 13.5px
            overflow: 'hidden',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
          }}
        >
          {screenRecSrc ? (
            <video 
              ref={screenVideoRef}
              key={screenRecSrc} 
              src={screenRecSrc} 
              muted 
              loop 
              playsInline 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-300/40">
              <p className="text-xs text-gray-500">Screen Recording</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerticalPreview;