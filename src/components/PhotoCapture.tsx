 import React, { useState, useRef, useEffect } from 'react';

interface PhotoCaptureProps {
  onPhotoTaken: (photoData: string, analysis: string) => void;
  isLoading: boolean;
}

const PhotoCapture: React.FC<PhotoCaptureProps> = ({ onPhotoTaken, isLoading }) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraError, setCameraError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startCamera = async () => {
    console.log('🔥 NUCLEAR: Starting camera...');
    setCameraError('');
    
    try {
      // Simplest possible constraints for iOS
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });
      
      console.log('🔥 NUCLEAR: Got stream with tracks:', mediaStream.getTracks().length);
      setStream(mediaStream);
      setIsCapturing(true);
      
      if (videoRef.current) {
        const video = videoRef.current;
        console.log('🔥 NUCLEAR: Setting srcObject...');
        
        video.srcObject = mediaStream;
        
        // Nuclear option: Force everything immediately
        setTimeout(async () => {
          try {
            console.log('🔥 NUCLEAR: Force playing video...');
            await video.play();
            console.log('🔥 NUCLEAR: Video should be playing now!');
          } catch (e) {
            console.log('🔥 NUCLEAR: Play failed but continuing anyway:', e);
          }
        }, 100);
      }
      
    } catch (error) {
      console.error('🔥 NUCLEAR: Camera failed:', error);
      setCameraError(`Camera failed: ${error}`);
      // Auto-fallback to file picker
      setTimeout(() => {
        fileInputRef.current?.click();
      }, 1000);
    }
  };

  const stopCamera = () => {
    console.log('🔥 NUCLEAR: Stopping camera...');
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsCapturing(false);
    setCameraError('');
  };

  const capturePhoto = () => {
    console.log('🔥 NUCLEAR: Attempting capture...');
    
    if (!videoRef.current || !canvasRef.current) {
      console.log('🔥 NUCLEAR: Missing refs');
      return;
    }
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');
    
    // Set reasonable fallback dimensions if video dimensions are 0
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    
    console.log('🔥 NUCLEAR: Video dimensions:', width, 'x', height);
    
    canvas.width = width;
    canvas.height = height;
    
    try {
      context?.drawImage(video, 0, 0, width, height);
      const photoData = canvas.toDataURL('image/jpeg', 0.8);
      
      console.log('🔥 NUCLEAR: Photo captured, size:', photoData.length);
      
      if (photoData.length < 1000) {
        throw new Error('Photo too small - probably blank');
      }
      
      stopCamera();
      onPhotoTaken(photoData, 'Photo captured for analysis');
      
    } catch (error) {
      console.error('🔥 NUCLEAR: Capture failed:', error);
      setCameraError('Capture failed - try file picker instead');
    }
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  if (isCapturing) {
    return (
      <div className="fixed inset-0 bg-black z-50">
        {/* Error display */}
        {cameraError && (
          <div className="absolute top-0 left-0 right-0 bg-red-600 text-white p-2 text-sm z-20">
            {cameraError}
          </div>
        )}
        
        {/* Video container - MAXIMUM SIMPLICITY */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          webkit-playsinline="true"
          className="w-full h-full"
          style={{
            objectFit: 'cover',
            backgroundColor: 'black'
          }}
        />
        
        {/* Hidden canvas */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        
        {/* Controls - ALWAYS VISIBLE */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-black bg-opacity-50">
          <div className="flex justify-center space-x-4">
            <button
              onClick={stopCamera}
              className="px-6 py-3 bg-red-600 text-white rounded-lg font-bold text-lg"
            >
              Cancel
            </button>
            
            <button
              onClick={() => {
                console.log('🔥 NUCLEAR: Manual file picker');
                stopCamera();
                fileInputRef.current?.click();
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold text-lg"
            >
              📁 File
            </button>
            
            <button
              onClick={capturePhoto}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-bold text-lg"
            >
              📸 Capture
            </button>
          </div>
          
          {/* Debug info */}
          <div className="text-white text-xs mt-2 text-center opacity-70">
            Stream: {stream ? '✅' : '❌'} | 
            Video: {videoRef.current?.videoWidth || 0}x{videoRef.current?.videoHeight || 0} |
            Ready: {videoRef.current?.readyState || 0}
          </div>
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
        capture="environment"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      <button
        onClick={startCamera}
        disabled={isLoading}
        className="p-2 text-gray-400 hover:text-white transition-colors mr-2"
        title="Take Photo"
      >
        📷
      </button>
    </>
  );
};

export default PhotoCapture;
