 import React, { useState, useRef, useEffect } from 'react';

interface PhotoCaptureProps {
  onPhotoTaken: (photoData: string, analysis: string) => void;
  isLoading: boolean;
}

const PhotoCapture: React.FC<PhotoCaptureProps> = ({ onPhotoTaken, isLoading }) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startCamera = async () => {
    console.log('Starting camera...');
    setVideoReady(false);
    
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 }
        },
        audio: false // Explicitly disable audio
      });
      
      console.log('Got media stream:', mediaStream);
      setStream(mediaStream);
      setIsCapturing(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        // Critical: Wait for loadedmetadata before trying to play
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded');
          if (videoRef.current) {
            videoRef.current.play().then(() => {
              console.log('Video playing successfully');
              setVideoReady(true);
            }).catch((playError) => {
              console.error('Play failed:', playError);
            });
          }
        };
        
        // Fallback timeout
        setTimeout(() => {
          if (videoRef.current && !videoReady) {
            console.log('Fallback: forcing video play');
            videoRef.current.play().catch(console.error);
            setVideoReady(true);
          }
        }, 2000);
      }
    } catch (error) {
      console.error('Camera access failed:', error);
      fileInputRef.current?.click();
    }
  };

  const stopCamera = () => {
    console.log('Stopping camera...');
    
    if (stream) {
      stream.getTracks().forEach(track => {
        console.log('Stopping track:', track);
        track.stop();
      });
      setStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.onloadedmetadata = null;
    }
    
    setIsCapturing(false);
    setVideoReady(false);
    console.log('Camera stopped');
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !videoReady) {
      console.log('Cannot capture: video not ready');
      return;
    }
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');
    
    // Make sure video has dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.log('Video dimensions not ready');
      return;
    }
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context?.drawImage(video, 0, 0);
    
    const photoData = canvas.toDataURL('image/jpeg', 0.8);
    console.log('Photo captured, data length:', photoData.length);
    
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
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        <div className="flex-1 relative overflow-hidden">
          {!videoReady && (
            <div className="absolute inset-0 flex items-center justify-center text-white z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                <p>Loading camera...</p>
              </div>
            </div>
          )}
          
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${!videoReady ? 'opacity-0' : 'opacity-100'}`}
            style={{
              transform: 'scaleX(-1)', // Mirror for selfie-like experience
            }}
          />
          <canvas ref={canvasRef} className="hidden" />
        </div>
        
        <div className="p-6 flex justify-center space-x-4 bg-black">
          <button
            onClick={stopCamera}
            className="px-6 py-3 bg-gray-600 text-white rounded-full font-semibold"
            style={{ touchAction: 'manipulation' }}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              const video = videoRef.current;
              if (video) {
                console.log('=== VIDEO DEBUG ===');
                console.log('ReadyState:', video.readyState);
                console.log('Dimensions:', video.videoWidth, 'x', video.videoHeight);
                console.log('CurrentTime:', video.currentTime);
                console.log('Paused:', video.paused);
                console.log('Ended:', video.ended);
                console.log('NetworkState:', video.networkState);
                console.log('SrcObject:', !!video.srcObject);
                console.log('Stream active:', stream?.active);
                console.log('Stream tracks:', stream?.getTracks().length);
                // Force it to work
                setVideoReady(true);
              }
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-full font-semibold"
            style={{ touchAction: 'manipulation' }}
          >
            Debug & Force
          </button>
          <button
            onClick={capturePhoto}
            disabled={!videoReady}
            className={`px-6 py-3 rounded-full font-semibold ${
              videoReady 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-400 text-gray-200'
            }`}
            style={{ touchAction: 'manipulation' }}
          >
            📸 {videoReady ? 'Capture' : 'Loading...'}
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
        capture="environment" // This helps on mobile
        onChange={handleFileSelect}
        className="hidden"
      />
      <button
        onClick={startCamera}
        disabled={isLoading}
        className="p-2 text-gray-400 hover:text-white transition-colors mr-2"
        title="Take Photo of Hole"
        style={{ touchAction: 'manipulation' }}
      >
        📷
      </button>
    </>
  );
};

export default PhotoCapture;
