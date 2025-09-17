import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { image } = req.body;

  if (!image) return res.status(400).json({ error: "No image provided" });

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: "You are a professional golf caddie. Analyze this photo of the golf shot or setup. Provide detailed, actionable advice, tips, and suggestions to improve the shot, including club choice, stance, and strategy. Be concise but thorough."
                },
                {
                  inline_data: { mime_type: "image/jpeg", data: image.split(",")[1] }
                }
              ]
            }
          ]
        })
      }
    );

    const result = await geminiRes.json();

    res.status(200).json({
      analysis: result?.candidates?.[0]?.content?.parts?.[0]?.text || "No analysis returned"
    });
  } catch (err: any) {
    console.error("Error calling Gemini API:", err);
    res.status(500).json({ error: err.message || "Something went wrong" });
  }
}
