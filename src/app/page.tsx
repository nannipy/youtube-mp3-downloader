"use client";

import { useState } from "react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to download video');
      }

      // Get the filename from the Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch ? decodeURIComponent(filenameMatch[1]) : 'audio.mp3';

      // Create a blob from the response
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);

      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the blob URL
      window.URL.revokeObjectURL(downloadUrl);

      setSuccess(true);
      setUrl('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-4 md:p-8 bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900 animate-fade-in">
            MP3 Downloader
          </h1>
          <p className="text-gray-600">
            Download MP3 from YouTube and other platforms quickly and easily
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg space-y-4 hover:shadow-xl transition-shadow duration-300">
          <div className="space-y-2">
            <label htmlFor="url" className="block text-sm font-medium text-gray-700">
              Enter YouTube URL
            </label>
            <input
              id="url"
              type="url"
              className="input-field text-black"
              placeholder="https://youtube.com/watch?v=..."
              value={url}
              onChange={(e) => {
                setError("");
                setUrl(e.target.value);
              }}
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm animate-pulse bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="text-green-500 text-sm bg-green-50 p-2 rounded">
              {success}
              Download completato
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <button
              type="submit"
              disabled={loading || !url}
              className="btn-primary w-full flex items-center justify-center gap-2 transform hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                "Download MP3"
              )}
            </button>
          </form>
        </div>

        <footer className="text-center text-sm text-gray-500">
          Currently supporting YouTube videos only
        </footer>
      </div>
    </main>
  );
}
