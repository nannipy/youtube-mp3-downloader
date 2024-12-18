import { NextResponse } from "next/server";
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import { exec } from 'child_process';

const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);
const execPromise = promisify(exec);

// Function to get the correct binary path based on the platform
const getBinaryPath = () => {
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    // In development, use the system's yt-dlp
    return 'yt-dlp';
  }

  // In production (Vercel)
  return path.join(process.cwd(), 'bin', 'yt-dlp');
};

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    try {
      const ytDlpPath = getBinaryPath();
      
      // Get video info first
      const { stdout: rawInfo } = await execPromise(
        `${ytDlpPath} "${url}" --dump-json --no-check-certificates --force-ipv4 --no-warnings`
      );

      const videoInfo = JSON.parse(rawInfo);
      const title = videoInfo.title.replace(/[^a-zA-Z0-9]/g, '_');
      const outputPath = path.join('/tmp', `${title}.mp3`);

      // Download the file
      await execPromise(
        `${ytDlpPath} "${url}" -f bestaudio --extract-audio --audio-format mp3 -o "${outputPath}"`
      );

      // Read the file
      const fileBuffer = await readFile(outputPath);

      // Delete the temporary file
      await unlink(outputPath);

      // Create response headers
      const headers = new Headers();
      headers.set('Content-Type', 'audio/mpeg');
      headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(title)}.mp3"`);
      headers.set('Content-Length', fileBuffer.length.toString());

      return new Response(fileBuffer, {
        headers,
      });

    } catch (infoError) {
      console.error("Error getting video info:", infoError);
      return NextResponse.json(
        { error: "Could not get video information: " + (infoError instanceof Error ? infoError.message : "Unknown error") },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: "Failed to process video: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 }
    );
  }
}