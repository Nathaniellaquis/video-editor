import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import { createAllMasks } from '@/utils/createMasks';

export const maxDuration = 2700; // 45 minutes max
export const runtime = 'nodejs';

// Ensure directories exist
const uploadsDir = path.join(process.cwd(), 'uploads');
const publicDir = path.join(process.cwd(), 'public');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Ensure masks exist
if (!fs.existsSync(path.join(publicDir, 'masks', 'vertical_screen_mask.png'))) {
  createAllMasks();
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const formData = await request.formData();
        
        const screenFile = formData.get('screen') as File;
        const faceFile = formData.get('face') as File;
        const bgFile = formData.get('bg') as File | null; // Background is optional
        const bgColor = (formData.get('color') as string) || '#000000';
        const format = (formData.get('format') as string) || 'both';

        // Send initial event
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'start', message: 'Starting video processing...' })}\n\n`));

        if (!screenFile || !faceFile) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'Missing required files' })}\n\n`));
          controller.close();
          return;
        }

        // Save uploaded files
        const timestamp = Date.now();
        const screenPath = path.join(uploadsDir, `screen_${timestamp}.mp4`);
        const facePath = path.join(uploadsDir, `face_${timestamp}.mp4`);
        const bgPath = bgFile ? path.join(uploadsDir, `bg_${timestamp}.jpg`) : null;

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'progress', message: 'Saving uploaded files...', progress: 5 })}\n\n`));
        
        const screenBuffer = Buffer.from(await screenFile.arrayBuffer());
        const faceBuffer = Buffer.from(await faceFile.arrayBuffer());
        
        fs.writeFileSync(screenPath, new Uint8Array(screenBuffer));
        fs.writeFileSync(facePath, new Uint8Array(faceBuffer));
        
        if (bgFile && bgPath) {
          const bgBuffer = Buffer.from(await bgFile.arrayBuffer());
          fs.writeFileSync(bgPath, new Uint8Array(bgBuffer));
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'progress', message: 'Files saved successfully', progress: 10 })}\n\n`));

        // Get video durations
        const screenDuration = await new Promise<number>((resolve) => {
          ffmpeg.ffprobe(screenPath, (err, metadata) => {
            if (err) {
              console.error('Error probing screen video:', err);
              resolve(60); // Default to 60 seconds
            } else {
              resolve(metadata.format.duration || 60);
            }
          });
        });

        const faceDuration = await new Promise<number>((resolve) => {
          ffmpeg.ffprobe(facePath, (err, metadata) => {
            if (err) {
              console.error('Error probing face video:', err);
              resolve(60); // Default to 60 seconds
            } else {
              resolve(metadata.format.duration || 60);
            }
          });
        });

        // Use the shorter duration
        const duration = Math.min(screenDuration, faceDuration, 3600); // Max 1 hour
        console.log(`Video durations - Screen: ${screenDuration}s, Face: ${faceDuration}s, Using: ${duration}s`);

        const results: { shortForm?: string; longForm?: string } = {};

        // Process Short Form Video
        if (format === 'short' || format === 'both') {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'progress', message: 'Processing short form video...', progress: 15 })}\n\n`));
          
          const shortFormPath = path.join(publicDir, `short_form_${timestamp}.mp4`);
          
          await new Promise<void>((resolve, reject) => {
            const command = ffmpeg()
              .input(screenPath)
              .input(facePath);
              
            // Add masks as inputs
            command.input(path.join(publicDir, 'masks', 'vertical_screen_mask.png'));
            command.input(path.join(publicDir, 'masks', 'vertical_face_mask.png'));
            
            if (bgPath) {
              command.input(bgPath);
              command.input(path.join(publicDir, 'masks', 'vertical_bg_mask.png'));
            }
            
            const filterArray = [];
            
            // Create background with color
            filterArray.push(`color=c=${bgColor}:s=1080x1920:d=${duration}[bg]`);
            
            // Handle background image if present
            if (bgPath) {
              // Scale background image
              filterArray.push('[4:v]scale=1016:802:force_original_aspect_ratio=cover,crop=1016:802[bgimg_raw]');
              // Apply mask to background image
              filterArray.push('[5:v]alphaextract[bgmask]');
              filterArray.push('[bgimg_raw][bgmask]alphamerge[bgimg]');
              // Place on background
              filterArray.push('[bg][bgimg]overlay=32:1118[bg_with_img]');
            } else {
              filterArray.push('[bg]copy[bg_with_img]');
            }
            
            // Process screen recording with rounded corners - dynamic padding for any dimension
            // Calculate even dimensions for consistency
            const screenW = 1080;
            const screenH = 670; // Make even for h264 codec
            
            // Scale to target size - maintain aspect ratio and center crop
            filterArray.push('[0:v]scale=1080:670:force_original_aspect_ratio=increase,crop=1080:670,format=yuva420p[screen_raw]');
            
            // Apply mask for rounded corners
            filterArray.push('[2:v]scale=1080:670,format=rgba[screenmask]');
            filterArray.push('[screenmask]alphaextract[screenmask_alpha]');
            filterArray.push('[screen_raw][screenmask_alpha]alphamerge,format=yuva420p[screen]');
            
            // Process face recording with top rounded corners - dynamic padding for any dimension
            // Calculate even dimensions for consistency
            const faceW = 1080;
            const faceH = 940; // Make even for h264 codec
            
            // Scale to target size - maintain aspect ratio and center crop
            filterArray.push('[1:v]scale=1080:940:force_original_aspect_ratio=increase,crop=1080:940,format=yuva420p[face_raw]');
            
            // Apply mask for rounded top corners
            filterArray.push('[3:v]scale=1080:940,format=rgba[facemask]');
            filterArray.push('[facemask]alphaextract[facemask_alpha]');
            filterArray.push('[face_raw][facemask_alpha]alphamerge,format=yuva420p[face]');
            
            // Add shadow to screen
            filterArray.push('[screen]split[screen1][screen2]');
            filterArray.push('[screen2]colorchannelmixer=aa=0.5,boxblur=10:10[shadow]');
            
            // Composite everything with proper positioning
            filterArray.push('[bg_with_img][shadow]overlay=0:211[tmp0]');
            filterArray.push('[tmp0][screen1]overlay=0:211[tmp1]');
            filterArray.push('[tmp1][face]overlay=0:980[out]'); // Adjusted for even height
            
            command
              .complexFilter(filterArray)
              .outputOptions([
                '-map', '[out]',
                '-map', '1:a?', // Map face audio directly if it exists (? makes it optional)
                '-c:v', 'libx264',
                '-preset', 'ultrafast',
                '-crf', '23',
                '-c:a', 'aac',
                '-b:a', '192k',
                '-t', String(duration),  // Set explicit duration
                '-threads', '0' // Use all available CPU threads (auto-detect)
              ])
              .save(shortFormPath);

            command
              .on('start', (commandLine) => {
                console.log('FFmpeg command for short form:', commandLine);
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'progress', message: 'FFmpeg started for short form', progress: 20 })}\n\n`));
              })
              .on('stderr', (stderrLine) => {
                if (stderrLine.includes('frame=')) {
                  console.log('Short form FFmpeg:', stderrLine);
                }
              })
              .on('progress', (progress) => {
                const percent = Math.min(50, 20 + (progress.percent || 0) * 0.3);
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                  type: 'progress', 
                  message: `Short form: ${progress.timemark} processed at ${progress.currentFps} FPS`,
                  progress: percent,
                  details: progress
                })}\n\n`));
              })
              .on('end', () => {
                results.shortForm = `/short_form_${timestamp}.mp4`;
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'progress', message: 'Short form video completed', progress: 50 })}\n\n`));
                resolve();
              })
              .on('error', (err) => {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'Short form error: ' + err.message })}\n\n`));
                reject(err);
              });
          });
        }

        // Process Long Form Video
        if (format === 'long' || format === 'both') {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'progress', message: 'Processing long form video...', progress: 55 })}\n\n`));
          
          const longFormPath = path.join(publicDir, `long_form_${timestamp}.mp4`);
          
          await new Promise<void>((resolve, reject) => {
            const command = ffmpeg()
              .input(screenPath)
              .input(facePath);
              
            // Add PiP mask
            command.input(path.join(publicDir, 'masks', 'horizontal_pip_mask.png'));
            
            if (bgPath) {
              command.input(bgPath);
            }
            
            const filterArray = [];
            
            // Create a 1920x1080 canvas with background color
            filterArray.push(`color=c=${bgColor}:s=1920x1080:d=${duration}[bg]`);
            
            // Scale screen to fit horizontally
            filterArray.push('[0:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2[screen]');
            
            // Create black background for PiP
            filterArray.push('color=c=black:s=365x206[pipbg]');
            
            // Handle PiP with background
            if (bgPath) {
              // Scale background image for PiP
              filterArray.push('[3:v]scale=365:206:force_original_aspect_ratio=cover,crop=365:206[bgpip]');
              // Scale face for PiP
              filterArray.push('[1:v]scale=365:206:force_original_aspect_ratio=increase,crop=365:206[face]');
              // Composite: black bg -> bg image (50% opacity) -> face
              filterArray.push('[pipbg][bgpip]overlay=0:0:format=auto[pipbg1]');
              filterArray.push('[bgpip]format=rgba,colorchannelmixer=aa=0.5[bgpip_alpha]');
              filterArray.push('[pipbg][bgpip_alpha]overlay=0:0[pipbg2]');
              filterArray.push('[pipbg2][face]overlay=0:0[pip_raw]');
            } else {
              // Scale face for PiP
              filterArray.push('[1:v]scale=365:206:force_original_aspect_ratio=increase,crop=365:206[face]');
              filterArray.push('[pipbg][face]overlay=0:0[pip_raw]');
            }
            
            // Apply rounded corners mask to PiP
            filterArray.push('[2:v]format=rgba,scale=365:206:flags=lanczos,format=rgba[pipmask_rgba]');
            filterArray.push('[pipmask_rgba]alphaextract[pipmask]');
            filterArray.push('[pip_raw]format=yuva420p[pip_fmt]');
            filterArray.push('[pip_fmt][pipmask]alphamerge,format=yuva420p[pip_rounded]');
            
            // Add white border and shadow
            filterArray.push('[pip_rounded]split[pip1][pip2]');
            // Create shadow
            filterArray.push('[pip2]colorchannelmixer=aa=0.7,boxblur=15:15[shadow]');
            // Create thin white border by drawing on slightly larger canvas
            filterArray.push('[pip1]pad=w=iw+4:h=ih+4:x=2:y=2:color=white@0[pip_bordered]');
            
            // Composite everything: background -> screen -> shadow -> bordered PiP
            filterArray.push('[bg][screen]overlay=(W-w)/2:(H-h)/2[tmp]');
            filterArray.push('[tmp][shadow]overlay=1528:844[tmp2]');
            filterArray.push('[tmp2][pip_bordered]overlay=1530:846[out]');
            
            command
              .complexFilter(filterArray)
              .outputOptions([
                '-map', '[out]',
                '-map', '1:a?', // Map face audio directly if it exists (? makes it optional)
                '-c:v', 'libx264',
                '-preset', 'ultrafast',
                '-crf', '23',
                '-c:a', 'aac',
                '-b:a', '192k',
                '-t', String(duration),  // Set explicit duration
                '-threads', '0' // Use all available CPU threads (auto-detect)
              ])
              .save(longFormPath);

            command
              .on('start', (commandLine) => {
                console.log('FFmpeg command for long form:', commandLine);
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'progress', message: 'FFmpeg started for long form', progress: 60 })}\n\n`));
              })
              .on('stderr', (stderrLine) => {
                if (stderrLine.includes('frame=')) {
                  console.log('FFmpeg:', stderrLine);
                }
              })
              .on('progress', (progress) => {
                const percent = Math.min(95, 60 + (progress.percent || 0) * 0.35);
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                  type: 'progress', 
                  message: `Long form: ${progress.timemark} processed at ${progress.currentFps} FPS`,
                  progress: percent,
                  details: progress
                })}\n\n`));
              })
              .on('end', () => {
                results.longForm = `/long_form_${timestamp}.mp4`;
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'progress', message: 'Long form video completed', progress: 95 })}\n\n`));
                resolve();
              })
              .on('error', (err, stdout, stderr) => {
                console.error('Long form FFmpeg error:', err);
                console.error('FFmpeg stdout:', stdout);
                console.error('FFmpeg stderr:', stderr);
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'Long form error: ' + err.message })}\n\n`));
                reject(err);
              });
          });
        }

        // Clean up uploaded files
        try {
          fs.unlinkSync(screenPath);
          fs.unlinkSync(facePath);
          if (bgPath) fs.unlinkSync(bgPath);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'progress', message: 'Cleanup completed', progress: 98 })}\n\n`));
        } catch (error) {
          console.warn('Failed to clean up files:', error);
        }

        // Send completion event
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          type: 'complete', 
          message: 'Video processing completed successfully',
          progress: 100,
          results 
        })}\n\n`));
        
        controller.close();
      } catch (error) {
        console.error('Stream error:', error);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          type: 'error', 
          message: error instanceof Error ? error.message : 'Unknown error' 
        })}\n\n`));
        controller.close();
      }
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}