import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { image } = req.body;

  try {
    const geminiRes = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + process.env.GOOGLE_API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: "Analyze this photo and describe it in detail:" },
                { inline_data: { mime_type: "image/jpeg", data: image.split(",")[1] } },
              ],
            },
          ],
        }),
      }
    );

    const result = await geminiRes.json();

    res.status(200).json({
      output:
        result?.candidates?.[0]?.content?.parts?.[0]?.text || "No response from Gemini",
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Something went wrong" });
  }
}
