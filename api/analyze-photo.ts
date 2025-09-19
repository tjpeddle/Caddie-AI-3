  import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';
import sharp from 'sharp';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: 'No image provided' });

    const matches = image.match(/^data:(.*?);base64,(.+)$/);
    if (!matches) return res.status(400).json({ error: 'Invalid base64 format' });

    let mimeType = matches[1]; // e.g., image/heic
    let base64Data = matches[2];

    // Convert HEIC/HEIF to JPEG if needed
    if (mimeType === 'image/heic' || mimeType === 'image/heif') {
      const buffer = Buffer.from(base64Data, 'base64');
      const jpegBuffer = await sharp(buffer).jpeg().toBuffer();
      base64Data = jpegBuffer.toString('base64');
      mimeType = 'image/jpeg';
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = 'You are a golf caddie AI. Analyze this golf photo and describe what is shown.';

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Data, mimeType } },
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

