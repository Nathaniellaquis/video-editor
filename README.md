# Video Editing Cursor

A web application for creating Instagram reels and YouTube format videos with screen recording and face recording.

## 🚀 Quick Start (Recommended)

**Use the HTML version - no installation required!**

1. Open `index.html` in your web browser
2. Upload your files and start creating videos immediately

## Features

- **Short Form (Instagram Reels)**: 1080x1920 vertical format
- **Long Form (YouTube)**: 1920x1080 horizontal format
- Support for files up to 30GB
- Real-time progress tracking
- Customizable background colors
- Drag & drop file uploads

## Layout Specifications

### Short Form (Instagram Reels) - 1080x1920
- **Screen Recording**: 1080x669px, positioned 211px from top, 54px corner radius
- **Background Image**: 1016x802px, centered with 32px margins, 116px top corner radius
- **Face Recording**: 1080x939px, positioned 981px from top, 116px top corner radius
- **Background Color**: Customizable, defaults to black

### Long Form (YouTube) - 1920x1080
- **Screen Recording**: Fits entire frame, centered, maintains aspect ratio
- **Face Recording**: 365x206px, positioned at bottom right (25px from right, 28px from bottom)
- **Background Image**: Same size as face recording, positioned behind face recording
- **Background Color**: Customizable, defaults to black

## Usage

1. **Upload Files:**
   - Drag & drop or click to upload screen recording video
   - Upload face recording video (with background removed)
   - Upload background image
   - Select background color using the color picker

2. **Generate Videos:**
   - Click "Generate Videos" button
   - Watch real-time progress updates
   - Wait for both short and long form videos to complete

3. **Download:**
   - Download short form (Instagram reels format)
   - Download long form (YouTube format)

## Advanced Setup (Next.js Version with Real Video Processing)

For production use with real video processing:

### Prerequisites

1. **Install FFmpeg** (required for video processing):
   - Follow the instructions in `FFMPEG_SETUP.md`
   - Or run: `choco install ffmpeg` (Windows with Chocolatey)

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open http://localhost:3000**

### Features

- **Real video processing** using FFmpeg
- **Exact layout specifications** as requested
- **Large file support** (up to 30GB)
- **Audio mixing** from both videos
- **High-quality output** with optimized settings

## Technologies

### HTML Version (Working)
- Pure HTML/CSS/JavaScript
- Tailwind CSS (CDN)
- No dependencies required

### Next.js Version (Advanced)
- Next.js 14
- TypeScript
- Tailwind CSS
- FFmpeg.wasm (for video processing)

## Browser Compatibility

- Modern browsers with WebAssembly support
- Chrome, Firefox, Safari, Edge (latest versions)
- File API support required
- Blob URL support required

## File Support

- **Screen Recording**: Up to 30GB video files
- **Face Recording**: Up to 30GB video files (background removed)
- **Background Image**: Standard image formats (JPG, PNG, etc.)
- **Background Color**: Hex color picker with color dropper

## Notes

- The HTML version works immediately without any installation
- Video processing is simulated in the HTML version for demonstration
- For production use with real video processing, use the Next.js version
- All files are processed in the browser for privacy 