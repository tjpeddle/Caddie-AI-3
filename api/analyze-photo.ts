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

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent([
      { inlineData: { mimeType: "image/jpeg", data: image.split(",")[1] } }, // remove "data:image..." prefix
      { text: "Analyze this golf photo and describe the course details." }
    ]);

    const analysis = result.response.text();

    res.status(200).json({ analysis });
  } catch (error) {
    console.error("Error analyzing photo:", error);
    res.status(500).json({ error: "Failed to analyze photo" });
  }
}

