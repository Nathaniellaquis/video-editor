import { create } from 'zustand';

export interface VideoFile {
  file: File;
  url: string;
  name: string;
  size: number;
  duration?: number;
}

export interface ProcessedVideo {
  url: string;
  name: string;
  size: number;
  format: 'short' | 'long';
}

interface VideoStore {
  // Input files
  screenRecording: VideoFile | null;
  faceRecording: VideoFile | null;
  backgroundImage: VideoFile | null;
  backgroundColor: string;
  
  // Processed videos
  shortFormVideo: ProcessedVideo | null;
  longFormVideo: ProcessedVideo | null;
  
  // Actions
  setScreenRecording: (file: VideoFile | null) => void;
  setFaceRecording: (file: VideoFile | null) => void;
  setBackgroundImage: (file: VideoFile | null) => void;
  setBackgroundColor: (color: string) => void;
  setShortFormVideo: (video: ProcessedVideo | null) => void;
  setLongFormVideo: (video: ProcessedVideo | null) => void;
  reset: () => void;
}

export const useVideoStore = create<VideoStore>((set) => ({
  // Initial state
  screenRecording: null,
  faceRecording: null,
  backgroundImage: null,
  backgroundColor: '#161616',
  shortFormVideo: null,
  longFormVideo: null,
  
  // Actions
  setScreenRecording: (file) => set({ screenRecording: file }),
  setFaceRecording: (file) => set({ faceRecording: file }),
  setBackgroundImage: (file) => set({ backgroundImage: file }),
  setBackgroundColor: (color) => set({ backgroundColor: color }),
  setShortFormVideo: (video) => set({ shortFormVideo: video }),
  setLongFormVideo: (video) => set({ longFormVideo: video }),
  reset: () => set({
    screenRecording: null,
    faceRecording: null,
    backgroundImage: null,
    backgroundColor: '#161616',
    shortFormVideo: null,
    longFormVideo: null,
  }),
})); 