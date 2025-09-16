 import React, { useState, ChangeEvent } from "react";

interface PhotoCaptureProps {
  onResult: (result: string) => void; // parent will receive Gemini's response
}

const PhotoCapture: React.FC<PhotoCaptureProps> = ({ onResult }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setPreview(null);

    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Image = reader.result as string;
      setPreview(base64Image);

      try {
        setLoading(true);

        // Send to Gemini API
        const response = await fetch("/api/analyze-photo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64Image }),
        });

        if (!response.ok) throw new Error("Failed to analyze image");
        const data = await response.json();

        onResult(data.output ?? "No response from AI");
      } catch (err: any) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    reader.onerror = () => {
      setError("Failed to read the file. Try again.");
    };

    reader.readAsDataURL(file);
  };

  return (
    <div style={{ margin: "20px 0" }}>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      {error && <p style={{ color: "red" }}>{error}</p>}
      {loading && <p>Analyzing image...</p>}
      {preview && (
        <div style={{ marginTop: "10px" }}>
          <p>Preview:</p>
          <img src={preview} alt="Preview" style={{ maxWidth: "300px" }} />
        </div>
      )}
    </div>
  );
};

export default PhotoCapture;


