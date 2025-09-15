 import React, { useRef, useState, useCallback } from 'react';

interface SimpleCameraProps {
  onPhotoTaken: (base64Photo: string, description: string) => void;
  isLoading: boolean;
}

const SimpleCamera: React.FC<SimpleCameraProps> = ({ onPhotoTaken, isLoading }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Detect if running as standalone PWA
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

  const openCamera = useCallback(async () => {
    try {
      console.log('Requesting camera access...');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true, // Keep simple for iOS PWA compatibility
      });

      console.log('Camera stream obtained:', mediaStream);

      if (videoRef.current) {
        // Small delay can help with iOS PWA rendering
        setTimeout(() => {
          if ('srcObject' in videoRef.current!) {
            videoRef.current!.srcObject = mediaStream;
          } else {
            // Fallback for older Safari
            (videoRef.current as any).src = window.URL.createObjectURL(mediaStream);
          }

          videoRef.current!.play().catch(err => {
            console.error('Video play failed:', err);
          });

          setIsCameraOpen(true);
          setStream(mediaStream);
        }, 300);
      }
    } catch (error: any) {
      console.error('Camera access failed:', error);
      alert('Camera error: ' + JSON.stringify(error));
    }
  }, []);

  const closeCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

      // Close camera and send photo
      closeCamera();
      onPhotoTaken(dataUrl, 'Golf hole photo for strategic analysis');
    }
  }, [closeCamera, onPhotoTaken]);

  // --- Non-PWA fallback ---
  if (!isStandalone) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4 bg-black text-white text-center">
        <p className="text-lg mb-4">
          ⚠️ For best experience, please open this app from your home screen.
        </p>
        <p className="text-sm opacity-70">
          Camera access may not work properly in a regular browser tab.
        </p>
        <button
          onClick={openCamera}
          disabled={isLoading}
          className="mt-6 px-6 py-3 bg-blue-600 rounded-lg text-white font-semibold"
        >
          {isLoading ? '⏳ Loading...' : 'Try Camera Anyway'}
        </button>
      </div>
    );
  }

  // --- PWA camera open view ---
  if (isCameraOpen) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="flex-1 object-cover w-full"
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        <div className="absolute bottom-0 left-0 right-0 flex justify-center space-x-4 p-4 bg-black bg-opacity-75 safe-area-inset-bottom">
          <button
            onClick={closeCamera}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg text-lg font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={capturePhoto}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg text-lg font-semibold"
          >
            📸 Analyze Hole
          </button>
        </div>
      </div>
    );
  }

  // --- Default PWA button ---
  return (
    <button
      onClick={openCamera}
      disabled={isLoading}
      className="p-2 text-gray-400 hover:text-white transition-colors mr-2"
      title="Analyze Green with Camera"
    >
      {isLoading ? '⏳' : '🎯'}
    </button>
  );
};

export default SimpleCamera;

