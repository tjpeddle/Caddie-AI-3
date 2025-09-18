// api/analyze-photo.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = 'Analyze this golf photo and describe what is shown.';

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: image.split(',')[1], // strip off "data:image/jpeg;base64,"
          mimeType: 'image/jpeg',
        },
      },
    ]);

    const text = result.response.text();
    return res.status(200).json({ analysis: text });
  } catch (error: any) {
    console.error('Error in analyze-photo:', error);
    return res.status(500).json({
      error: 'Failed to analyze image',
      details: error.message || error.toString(),
    });
  }
}


