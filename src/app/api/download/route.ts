import { NextResponse } from "next/server";
import { stream, video_info } from 'play-dl';

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
      const info = await video_info(url);
      
      // Get sanitized filename
      const title = info.video_details?.title?.replace(/[^a-zA-Z0-9]/g, '_') ?? 'unknown';

      // Create response headers
      const headers = new Headers();
      headers.set('Content-Type', 'audio/mpeg');
      headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(title)}.mp3"`);

      // Get the audio stream
      const audioStream = await stream(url, {
        quality: 140, // 140 is m4a audio only
        discordPlayerCompatibility: false
      });

      return new Response(audioStream.stream as any, {
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