import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import { createAllMasks } from '@/utils/createMasks';
import os from 'os';

// GPU-accelerated version for NVIDIA GPUs
export const maxDuration = 2700;
export const runtime = 'nodejs';

// Detect if NVIDIA GPU is available
async function checkNvidiaSupport(): Promise<boolean> {
  return new Promise((resolve) => {
    ffmpeg()
      .inputOptions(['-f', 'lavfi', '-i', 'nullsrc=s=1x1:d=1'])
      .outputOptions(['-c:v', 'h264_nvenc', '-f', 'null', '-'])
      .on('error', () => resolve(false))
      .on('end', () => resolve(true))
      .save('/dev/null');
  });
}

export async function POST(request: NextRequest) {
  try {
    console.log('Starting GPU-accelerated video processing...');
    
    // Check for NVIDIA GPU support
    const hasGPU = await checkNvidiaSupport();
    console.log(`GPU acceleration available: ${hasGPU}`);
    
    const formData = await request.formData();
    
    const screenFile = formData.get('screen') as File;
    const faceFile = formData.get('face') as File;
    const bgFile = formData.get('bg') as File;
    const bgColor = (formData.get('color') as string) || '#000000';
    const format = (formData.get('format') as string) || 'both';

    if (!screenFile || !faceFile) {
      return NextResponse.json(
        { error: 'Screen and face recordings are required' },
        { status: 400 }
      );
    }

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

    // Save uploaded files
    const timestamp = Date.now();
    const screenPath = path.join(uploadsDir, `screen_${timestamp}.mp4`);
    const facePath = path.join(uploadsDir, `face_${timestamp}.mp4`);
    const bgPath = bgFile ? path.join(uploadsDir, `bg_${timestamp}.jpg`) : null;

    const screenBuffer = Buffer.from(await screenFile.arrayBuffer());
    const faceBuffer = Buffer.from(await faceFile.arrayBuffer());

    fs.writeFileSync(screenPath, new Uint8Array(screenBuffer));
    fs.writeFileSync(facePath, new Uint8Array(faceBuffer));
    
    if (bgFile && bgPath) {
      const bgBuffer = Buffer.from(await bgFile.arrayBuffer());
      fs.writeFileSync(bgPath, new Uint8Array(bgBuffer));
    }

    // Get video durations
    const screenDuration = await new Promise<number>((resolve) => {
      ffmpeg.ffprobe(screenPath, (err, metadata) => {
        resolve(metadata?.format?.duration || 60);
      });
    });

    const faceDuration = await new Promise<number>((resolve) => {
      ffmpeg.ffprobe(facePath, (err, metadata) => {
        resolve(metadata?.format?.duration || 60);
      });
    });

    const duration = Math.min(screenDuration, faceDuration, 3600);
    console.log(`Video durations - Screen: ${screenDuration}s, Face: ${faceDuration}s, Using: ${duration}s`);

    const results: { shortForm?: string; longForm?: string } = {};

    // Process Short Form Video with GPU acceleration
    if (format === 'short' || format === 'both') {
      console.log('Processing short form video with GPU...');
      const shortFormPath = path.join(publicDir, `short_form_${timestamp}.mp4`);
      
      await new Promise<void>((resolve, reject) => {
        const command = ffmpeg();
        
        // Add hardware acceleration if available
        if (hasGPU) {
          command
            .inputOptions(['-hwaccel', 'cuda', '-hwaccel_output_format', 'cuda'])
            .input(screenPath)
            .inputOptions(['-hwaccel', 'cuda', '-hwaccel_output_format', 'cuda'])
            .input(facePath);
        } else {
          command
            .input(screenPath)
            .input(facePath);
        }
          
        // Add masks as inputs
        command.input(path.join(publicDir, 'masks', 'vertical_screen_mask.png'));
        command.input(path.join(publicDir, 'masks', 'vertical_face_mask.png'));
        
        if (bgPath) {
          command.input(bgPath);
          command.input(path.join(publicDir, 'masks', 'vertical_bg_mask.png'));
        }
        
        // Build filter complex
        const filterArray = [];
        
        // For GPU acceleration, we need to handle the filter differently
        if (hasGPU) {
          // Upload masks to GPU memory
          filterArray.push(`color=c=${bgColor}:s=1080x1920:d=${duration}[bg]`);
          filterArray.push('[bg]hwupload=extra_hw_frames=64[bg_gpu]');
          
          // Process videos on GPU
          filterArray.push('[0:v]scale_cuda=1080:670:force_original_aspect_ratio=increase[screen_scaled]');
          filterArray.push('[screen_scaled]crop=1080:670[screen_cropped]');
          filterArray.push('[1:v]scale_cuda=1080:940:force_original_aspect_ratio=increase[face_scaled]');
          filterArray.push('[face_scaled]crop=1080:940[face_cropped]');
          
          // Download from GPU for mask operations (masks still done on CPU)
          filterArray.push('[screen_cropped]hwdownload,format=yuv420p[screen_cpu]');
          filterArray.push('[face_cropped]hwdownload,format=yuv420p[face_cpu]');
          
          // Apply masks on CPU
          filterArray.push('[screen_cpu]format=yuva420p[screen_raw]');
          filterArray.push('[2:v]scale=1080:670,format=rgba[screenmask]');
          filterArray.push('[screenmask]alphaextract[screenmask_alpha]');
          filterArray.push('[screen_raw][screenmask_alpha]alphamerge,format=yuva420p[screen]');
          
          filterArray.push('[face_cpu]format=yuva420p[face_raw]');
          filterArray.push('[3:v]scale=1080:940,format=rgba[facemask]');
          filterArray.push('[facemask]alphaextract[facemask_alpha]');
          filterArray.push('[face_raw][facemask_alpha]alphamerge,format=yuva420p[face]');
        } else {
          // CPU-only processing (same as before)
          filterArray.push(`color=c=${bgColor}:s=1080x1920:d=${duration}[bg]`);
          
          if (bgPath) {
            filterArray.push('[4:v]scale=1016:802:force_original_aspect_ratio=cover,crop=1016:802[bgimg_raw]');
            filterArray.push('[5:v]alphaextract[bgmask]');
            filterArray.push('[bgimg_raw][bgmask]alphamerge[bgimg]');
            filterArray.push('[bg][bgimg]overlay=32:1118[bg_with_img]');
          } else {
            filterArray.push('[bg]copy[bg_with_img]');
          }
          
          filterArray.push('[0:v]scale=1080:670:force_original_aspect_ratio=increase,crop=1080:670,format=yuva420p[screen_raw]');
          filterArray.push('[2:v]scale=1080:670,format=rgba[screenmask]');
          filterArray.push('[screenmask]alphaextract[screenmask_alpha]');
          filterArray.push('[screen_raw][screenmask_alpha]alphamerge,format=yuva420p[screen]');
          
          filterArray.push('[1:v]scale=1080:940:force_original_aspect_ratio=increase,crop=1080:940,format=yuva420p[face_raw]');
          filterArray.push('[3:v]scale=1080:940,format=rgba[facemask]');
          filterArray.push('[facemask]alphaextract[facemask_alpha]');
          filterArray.push('[face_raw][facemask_alpha]alphamerge,format=yuva420p[face]');
        }
        
        // Composite everything
        if (bgPath) {
          if (!hasGPU) {
            filterArray.push('[screen]split[screen1][screen2]');
            filterArray.push('[screen2]colorchannelmixer=aa=0.5,boxblur=10:10[shadow]');
            filterArray.push('[bg_with_img][shadow]overlay=0:211[tmp0]');
            filterArray.push('[tmp0][screen1]overlay=0:211[tmp1]');
            filterArray.push('[tmp1][face]overlay=0:981[out]');
          }
        } else {
          filterArray.push('[screen]split[screen1][screen2]');
          filterArray.push('[screen2]colorchannelmixer=aa=0.5,boxblur=10:10[shadow]');
          filterArray.push('[bg][shadow]overlay=0:211[tmp0]');
          filterArray.push('[tmp0][screen1]overlay=0:211[tmp1]');
          filterArray.push('[tmp1][face]overlay=0:981[out]');
        }
        
        // Configure output options
        const outputOptions = [
          '-map', '[out]',
          '-map', '1:a?',
          '-c:a', 'aac',
          '-b:a', '192k',
          '-t', String(duration)
        ];
        
        // Use GPU encoder if available
        if (hasGPU) {
          outputOptions.push(
            '-c:v', 'h264_nvenc',  // NVIDIA GPU encoder
            '-preset', 'p4',        // P4 preset for balanced quality/speed
            '-rc', 'vbr',           // Variable bitrate
            '-cq', '23',            // Quality level (like CRF)
            '-b:v', '8M',           // Target bitrate
            '-maxrate', '10M',      // Max bitrate
            '-bufsize', '16M',      // Buffer size
            '-profile:v', 'high',   // H.264 profile
            '-level', '4.1',        // H.264 level
            '-gpu', '0'             // Use first GPU (your 4090)
          );
        } else {
          outputOptions.push(
            '-c:v', 'libx264',
            '-preset', 'ultrafast',
            '-crf', '23',
            '-threads', '0'
          );
        }
        
        command
          .complexFilter(filterArray)
          .outputOptions(outputOptions)
          .save(shortFormPath)
          .on('start', (commandLine) => {
            console.log('FFmpeg command for GPU short form:', commandLine);
          })
          .on('progress', (progress) => {
            console.log('Short form progress:', progress);
          })
          .on('end', () => {
            console.log('Short form video processing completed');
            results.shortForm = `/${path.basename(shortFormPath)}`;
            resolve();
          })
          .on('error', (err) => {
            console.error('Short form video error:', err);
            reject(err);
          });
      });
    }

    // Process Long Form Video with GPU acceleration
    if (format === 'long' || format === 'both') {
      console.log('Processing long form video with GPU...');
      const longFormPath = path.join(publicDir, `long_form_${timestamp}.mp4`);
      
      await new Promise<void>((resolve, reject) => {
        const command = ffmpeg();
        
        // Add hardware acceleration if available
        if (hasGPU) {
          command
            .inputOptions(['-hwaccel', 'cuda', '-hwaccel_output_format', 'cuda'])
            .input(screenPath)
            .inputOptions(['-hwaccel', 'cuda', '-hwaccel_output_format', 'cuda'])
            .input(facePath);
        } else {
          command
            .input(screenPath)
            .input(facePath);
        }
          
        command.input(path.join(publicDir, 'masks', 'horizontal_pip_mask.png'));
        
        if (bgPath) {
          command.input(bgPath);
        }
        
        const filterArray = [];
        
        // Build filters for GPU or CPU
        if (hasGPU) {
          filterArray.push(`color=c=${bgColor}:s=1920x1080:d=${duration}[bg]`);
          filterArray.push('[bg]hwupload=extra_hw_frames=64[bg_gpu]');
          
          filterArray.push('[0:v]scale_cuda=1920:1080:force_original_aspect_ratio=decrease[screen_scaled]');
          filterArray.push('[screen_scaled]pad=1920:1080:(ow-iw)/2:(oh-ih)/2[screen]');
          
          filterArray.push('color=c=black:s=365x206[pipbg]');
          
          if (bgPath) {
            filterArray.push('[2:v]scale=365:206:force_original_aspect_ratio=cover,crop=365:206[bgpip]');
            filterArray.push('[1:v]scale_cuda=365:206:force_original_aspect_ratio=increase[face_gpu]');
            filterArray.push('[face_gpu]hwdownload,format=yuv420p,crop=365:206[face]');
            filterArray.push('[pipbg][bgpip]overlay=0:0:format=auto[pipbg1]');
            filterArray.push('[bgpip]format=rgba,colorchannelmixer=aa=0.5[bgpip_alpha]');
            filterArray.push('[pipbg][bgpip_alpha]overlay=0:0[pipbg2]');
            filterArray.push('[pipbg2][face]overlay=0:0[pip_raw]');
          } else {
            filterArray.push('[1:v]scale_cuda=365:206:force_original_aspect_ratio=increase[face_gpu]');
            filterArray.push('[face_gpu]hwdownload,format=yuv420p,crop=365:206[face]');
            filterArray.push('[pipbg][face]overlay=0:0[pip_raw]');
          }
          
          // Apply mask for rounded corners
          filterArray.push('[2:v]format=rgba,scale=365:206:flags=lanczos[pipmask]');
          filterArray.push('[pipmask]alphaextract[pipmask_alpha]');
          filterArray.push('[pip_raw]format=yuva420p[pip_fmt]');
          filterArray.push('[pip_fmt][pipmask_alpha]alphamerge,format=yuva420p[pip_rounded]');
          
          // Download screen from GPU for final composite
          filterArray.push('[screen]hwdownload,format=yuv420p[screen_cpu]');
        } else {
          // CPU-only processing (same as before)
          filterArray.push(`color=c=${bgColor}:s=1920x1080:d=${duration}[bg]`);
          filterArray.push('[0:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2[screen]');
          filterArray.push('color=c=black:s=365x206[pipbg]');
          
          if (bgPath) {
            filterArray.push('[2:v]scale=365:206:force_original_aspect_ratio=cover,crop=365:206[bgpip]');
            filterArray.push('[1:v]scale=365:206:force_original_aspect_ratio=increase,crop=365:206[face]');
            filterArray.push('[pipbg][bgpip]overlay=0:0:format=auto[pipbg1]');
            filterArray.push('[bgpip]format=rgba,colorchannelmixer=aa=0.5[bgpip_alpha]');
            filterArray.push('[pipbg][bgpip_alpha]overlay=0:0[pipbg2]');
            filterArray.push('[pipbg2][face]overlay=0:0[pip_raw]');
          } else {
            filterArray.push('[1:v]scale=365:206:force_original_aspect_ratio=increase,crop=365:206[face]');
            filterArray.push('[pipbg][face]overlay=0:0[pip_raw]');
          }
          
          filterArray.push('[2:v]format=rgba,scale=365:206:flags=lanczos[pipmask]');
          filterArray.push('[pipmask]alphaextract[pipmask_alpha]');
          filterArray.push('[pip_raw]format=yuva420p[pip_fmt]');
          filterArray.push('[pip_fmt][pipmask_alpha]alphamerge,format=yuva420p[pip_rounded]');
        }
        
        // Final composite
        filterArray.push('[pip_rounded]split[pip1][pip2]');
        filterArray.push('[pip2]colorchannelmixer=aa=0.7,boxblur=15:15[shadow]');
        filterArray.push('[pip1]pad=w=iw+4:h=ih+4:x=2:y=2:color=white@0.5[pip_bordered]');
        
        if (hasGPU) {
          filterArray.push('[bg][screen_cpu]overlay=(W-w)/2:(H-h)/2[tmp]');
        } else {
          filterArray.push('[bg][screen]overlay=(W-w)/2:(H-h)/2[tmp]');
        }
        filterArray.push('[tmp][shadow]overlay=1528:844[tmp2]');
        filterArray.push('[tmp2][pip_bordered]overlay=1530:846[out]');
        
        // Configure output options
        const outputOptions = [
          '-map', '[out]',
          '-map', '1:a?',
          '-c:a', 'aac',
          '-b:a', '192k',
          '-t', String(duration)
        ];
        
        // Use GPU encoder if available
        if (hasGPU) {
          outputOptions.push(
            '-c:v', 'h264_nvenc',
            '-preset', 'p4',
            '-rc', 'vbr',
            '-cq', '23',
            '-b:v', '8M',
            '-maxrate', '10M',
            '-bufsize', '16M',
            '-profile:v', 'high',
            '-level', '4.1',
            '-gpu', '0'
          );
        } else {
          outputOptions.push(
            '-c:v', 'libx264',
            '-preset', 'ultrafast',
            '-crf', '23',
            '-threads', '0'
          );
        }
        
        command
          .complexFilter(filterArray)
          .outputOptions(outputOptions)
          .save(longFormPath)
          .on('start', (commandLine) => {
            console.log('FFmpeg command for GPU long form:', commandLine);
          })
          .on('progress', (progress) => {
            console.log('Long form progress:', progress);
          })
          .on('end', () => {
            console.log('Long form video processing completed');
            results.longForm = `/${path.basename(longFormPath)}`;
            resolve();
          })
          .on('error', (err) => {
            console.error('Long form video error:', err);
            reject(err);
          });
      });
    }

    // Clean up uploaded files
    try {
      fs.unlinkSync(screenPath);
      fs.unlinkSync(facePath);
      if (bgPath) fs.unlinkSync(bgPath);
    } catch (error) {
      console.warn('Failed to clean up uploaded files:', error);
    }

    return NextResponse.json({
      success: true,
      gpuAccelerated: hasGPU,
      ...results
    });

  } catch (error) {
    console.error('Video processing error:', error);
    return NextResponse.json(
      { error: 'Video processing failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}