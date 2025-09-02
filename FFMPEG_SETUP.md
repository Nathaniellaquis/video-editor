# FFmpeg Setup Instructions

## Why FFmpeg is Required

FFmpeg is needed for server-side video processing to:
- Handle large video files (up to 30GB)
- Create precise video layouts with exact positioning
- Apply corner radius effects
- Mix audio from multiple sources
- Generate high-quality output videos

## Installation Methods

### Method 1: Chocolatey (Recommended)

1. **Install Chocolatey** (if not already installed):
   ```powershell
   Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
   ```

2. **Install FFmpeg**:
   ```powershell
   choco install ffmpeg
   ```

3. **Verify installation**:
   ```powershell
   ffmpeg -version
   ```

### Method 2: Manual Installation

1. **Download FFmpeg**:
   - Go to https://ffmpeg.org/download.html
   - Click "Windows Builds" under "Get packages & executable files"
   - Download the latest release (choose "essentials" build)

2. **Extract and Setup**:
   - Extract the downloaded ZIP file
   - Copy the `ffmpeg.exe` file to a permanent location (e.g., `C:\ffmpeg\`)
   - Add the folder to your system PATH:
     - Open System Properties → Advanced → Environment Variables
     - Edit the "Path" variable
     - Add the folder path (e.g., `C:\ffmpeg\`)

3. **Verify installation**:
   ```cmd
   ffmpeg -version
   ```

### Method 3: Using winget

```powershell
winget install FFmpeg
```

## Verification

After installation, run this command to verify FFmpeg is working:

```bash
ffmpeg -version
```

You should see output similar to:
```
ffmpeg version 6.0 Copyright (c) 2000-2023 the FFmpeg developers
built with gcc 12.2.0 (Rev10, Built by MSYS2 project)
...
```

## Troubleshooting

### "ffmpeg is not recognized"

1. **Restart your terminal/command prompt**
2. **Check if FFmpeg is in your PATH**:
   ```cmd
   where ffmpeg
   ```
3. **If not found, manually add to PATH** (see Method 2 above)

### Permission Errors

If you get permission errors when installing:
1. **Run PowerShell as Administrator**
2. **Try the manual installation method**

### Version Issues

If you have an old version of FFmpeg:
1. **Uninstall the old version**
2. **Install the latest version** using one of the methods above

## Next Steps

Once FFmpeg is installed:

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Open the application** in your browser

3. **Upload files and test video generation**

## Alternative: Use the HTML Version

If you can't install FFmpeg, you can still use the HTML version (`index.html`) which provides a working interface for testing the layout and functionality. The HTML version simulates video processing for demonstration purposes.

## Support

If you encounter issues:
1. Check the FFmpeg documentation: https://ffmpeg.org/documentation.html
2. Verify your installation with `ffmpeg -version`
3. Check the console for error messages when processing videos 