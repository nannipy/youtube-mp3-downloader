import { NextResponse } from "next/server";
import ytdl from 'ytdl-core';

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
      // Get video info
      const info = await ytdl.getInfo(url);
      
      // Get the best audio format
      const format = ytdl.chooseFormat(info.formats, {
        quality: 'highestaudio',
        filter: 'audioonly'
      });

      if (!format) {
        throw new Error("No suitable audio format found");
      }

      // Get sanitized filename
      const title = info.videoDetails.title.replace(/[^a-zA-Z0-9]/g, '_');

      // Create response headers
      const headers = new Headers();
      headers.set('Content-Type', 'audio/mpeg');
      headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(title)}.mp3"`);

      // Stream the audio
      const stream = ytdl(url, {
        format: format,
        filter: 'audioonly',
        quality: 'highestaudio'
      });

      return new Response(stream as any, {
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