 import React, { useRef, useState, useEffect } from "react";

interface SimpleCameraProps {
  onPhotoTaken: (base64Image: string) => void;
  isLoading: boolean;
}

const SimpleCamera: React.FC<SimpleCameraProps> = ({ onPhotoTaken, isLoading }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: true });
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
      } catch (err) {
        console.error("Camera start failed:", err);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64Image = canvas.toDataURL("image/png");

    // Stop stream to prevent iOS crash
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }

    onPhotoTaken(base64Image);

    // Restart camera after short delay
    setTimeout(async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: true });
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
      } catch (err) {
        console.error("Camera restart failed:", err);
      }
    }, 300);
  };

  return (
    <div className="relative">
      <video ref={videoRef} autoPlay playsInline muted className="rounded w-32 h-24 object-cover" />
      <canvas ref={canvasRef} style={{ display: "none" }} />
      <button onClick={takePhoto} disabled={isLoading} className="mt-2 p-2 bg-blue-600 text-white rounded">
        {isLoading ? "Analyzing..." : "📷 Take Photo"}
      </button>
    </div>
  );
};

export default SimpleCamera;

