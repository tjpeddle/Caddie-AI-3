import React, { useState, useRef } from 'react';

interface PhotoCaptureProps {
  onPhotoTaken: (photoData: string, analysis: string) => void;
  isLoading: boolean;
}

const PhotoCapture: React.FC<PhotoCaptureProps> = ({ onPhotoTaken, isLoading }) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startCamera = async () => {
  console.log('Starting camera...');
  try {
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }
    });
    console.log('Got media stream:', mediaStream);
    console.log('Video tracks:', mediaStream.getVideoTracks());
    
    setStream(mediaStream);
    setIsCapturing(true);
    
    if (videoRef.current) {
      console.log('Setting video source...');
      videoRef.current.srcObject = mediaStream;
      videoRef.current.play();
      
      videoRef.current.onloadedmetadata = () => {
        console.log('Video metadata loaded');
        console.log('Video dimensions:', videoRef.current?.videoWidth, videoRef.current?.videoHeight);
      };
    }
  } catch (error) {
    console.error('Camera access failed:', error);
    fileInputRef.current?.click();
  }
};

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCapturing(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context?.drawImage(video, 0, 0);
    
    const photoData = canvas.toDataURL('image/jpeg', 0.8);
    stopCamera();
    onPhotoTaken(photoData, 'Photo captured for analysis');
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const photoData = e.target?.result as string;
        onPhotoTaken(photoData, 'Photo uploaded for analysis');
      };
      reader.readAsDataURL(file);
    }
  };

  if (isCapturing) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        <div className="flex-1 relative">
     <video
  ref={videoRef}
  autoPlay
  playsInline
  muted
  controls={false}
  style={{
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transform: 'scaleX(-1)' 
  }}
/>
          <canvas ref={canvasRef} className="hidden" />
        </div>
        <div className="p-4 flex justify-center space-x-4">
          <button
            onClick={stopCamera}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={capturePhoto}
            className="px-6 py-3 bg-green-600 text-white rounded-lg"
          >
            📸 Capture
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      <button
        onClick={startCamera}
        disabled={isLoading}
        className="p-2 text-gray-400 hover:text-white transition-colors mr-2"
        title="Take Photo of Hole"
      >
        📷
      </button>
    </>
  );
};

export default PhotoCapture;
