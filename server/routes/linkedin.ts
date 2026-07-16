import { Router } from "express";
import fetch from "node-fetch";

const router = Router();

// LinkedIn Publishing Broadcast Simulator
router.post("/publish-post", async (req: any, res: any) => {
  const { token, text } = req.body;
  if (!token) {
    return res.status(401).json({ error: "LinkedIn personal access token is missing or unauthorized. Link your LinkedIn account in the settings panel." });
  }
  if (!text) {
    return res.status(400).json({ error: "Post text is empty" });
  }

  try {
    // 1. Get user profile to get the URN (ID)
    const meRes = await fetch("https://api.linkedin.com/v2/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!meRes.ok) {
      throw new Error("Failed to fetch LinkedIn profile information.");
    }

    const meData = (await meRes.json()) as any;
    const personUrn = `urn:li:person:${meData.id}`;

    // 2. Publish post using UGC Posts API
    const publishRes = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Restli-Protocol-Version": "2.0.0",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        author: personUrn,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: {
              text: text,
            },
            shareMediaCategory: "NONE",
          },
        },
        visibility: {
          "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
        },
      }),
    });

    if (!publishRes.ok) {
      const errData = await publishRes.text();
      throw new Error(`LinkedIn API Error: ${errData}`);
    }

    const publishData = (await publishRes.json()) as any;

    return res.json({
      success: true,
      postId: publishData.id,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Failed to publish post to LinkedIn:", error);
    return res.status(500).json({ error: error.message || "Failed to publish post" });
  }
});

export default router;
