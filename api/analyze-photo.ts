 import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { image } = req.body;

    // ✅ Replace this mock with your real AI call later
    const analysis = "This looks like a golf green with a bunker to the left.";

    res.status(200).json({ analysis });
  } catch (error) {
    console.error("Error in analyze-photo API:", error);
    res.status(500).json({ error: "Failed to analyze photo" });
  }
}

