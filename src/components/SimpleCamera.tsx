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

  const openCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setIsCameraOpen(true);
      }
    } catch (error) {
      console.error('Camera access failed:', error);
      alert('Camera access denied or not available');
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
      onPhotoTaken(dataUrl, "Green photo for AI analysis");
    }
  }, [closeCamera, onPhotoTaken]);

  if (isCameraOpen) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        <video 
          ref={videoRef}
          autoPlay
          playsInline
          className="flex-1 object-cover"
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        
        <div className="flex justify-center space-x-4 p-4 bg-black">
          <button
            onClick={closeCamera}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={capturePhoto}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg"
          >
            📸 Capture Green
          </button>
        </div>
      </div>
    );
  }

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
