import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: "No image provided" });
    }

    // Detect MIME type (default jpeg if unknown)
    const match = image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!match) {
      return res.status(400).json({ error: "Invalid base64 image format" });
    }

    const mimeType = match[1] || "image/jpeg";
    const base64Data = match[2];

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      },
      {
        text: "You are a golf caddie AI. Analyze this photo of a golf hole or green and give helpful feedback.",
      },
    ]);

    const analysis = result.response.text();

    res.status(200).json({ analysis });
  } catch (error: any) {
    console.error("Error analyzing photo:", error);
    res.status(500).json({ error: "Failed to analyze photo" });
  }
}

