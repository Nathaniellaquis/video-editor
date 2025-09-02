'use client';

import { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { ColorPicker } from '@/components/ColorPicker';
import { useVideoStore } from '@/store/videoStore';

export default function TestPage() {
  const [backgroundColor, setBackgroundColor] = useState('#000000');
  const { screenRecording, faceRecording, backgroundImage } = useVideoStore();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          Video Editor Test Page
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
          <FileUpload
            label="Screen Recording"
            description="Upload your screen recording video"
            accept="video/*"
            onFileSelect={(file) => useVideoStore.getState().setScreenRecording(file)}
            selectedFile={screenRecording}
          />

          <FileUpload
            label="Face Recording"
            description="Upload your face recording video"
            accept="video/*"
            onFileSelect={(file) => useVideoStore.getState().setFaceRecording(file)}
            selectedFile={faceRecording}
          />

          <FileUpload
            label="Background Image"
            description="Upload a background image"
            accept="image/*"
            onFileSelect={(file) => useVideoStore.getState().setBackgroundImage(file)}
            selectedFile={backgroundImage}
          />

          <ColorPicker
            label="Background Color"
            color={backgroundColor}
            onChange={setBackgroundColor}
          />

          <div className="pt-4">
            <h3 className="font-medium text-gray-900 mb-2">Upload Status:</h3>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>Screen Recording: {screenRecording ? '✅ Uploaded' : '❌ Not uploaded'}</li>
              <li>Face Recording: {faceRecording ? '✅ Uploaded' : '❌ Not uploaded'}</li>
              <li>Background Image: {backgroundImage ? '✅ Uploaded' : '❌ Not uploaded'}</li>
              <li>Background Color: {backgroundColor}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 