import { Router } from "express";
import fetch from "node-fetch";

const router = Router();

// Custom LinkedIn OAuth Flow to bypass Firebase OIDC bugs
router.get("/auth/linkedin", (req: any, res: any) => {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const redirectUri = `${req.protocol}://${req.get("host")}/api/auth/linkedin/callback`;
  
  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid%20profile%20email%20w_member_social&state=auth_link`;
  res.redirect(authUrl);
});

router.get("/auth/linkedin/callback", async (req: any, res: any) => {
  const { code } = req.query;
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  const redirectUri = `${req.protocol}://${req.get("host")}/api/auth/linkedin/callback`;

  if (!code) {
    return res.status(400).send("Authorization code is missing");
  }

  try {
    // Exchange authorization code for access token using client_secret_post
    const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId || "",
        client_secret: clientSecret || "",
      }).toString(),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      throw new Error(`LinkedIn token exchange failed: ${errText}`);
    }

    const tokenData = (await tokenRes.json()) as any;
    const token = tokenData.access_token;

    // Fetch user profile info
    const profileRes = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    let profileData = { id: "", name: "" };
    if (profileRes.ok) {
      const data = (await profileRes.json()) as any;
      profileData = {
        id: data.sub || "",
        name: data.name || "LinkedIn User",
      };
    } else {
      // Fallback to legacy profile endpoint if userinfo is not available
      const legacyRes = await fetch("https://api.linkedin.com/v2/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (legacyRes.ok) {
        const legacyData = (await legacyRes.json()) as any;
        profileData = {
          id: legacyData.id || "",
          name: legacyData.localizedFirstName ? `${legacyData.localizedFirstName} ${legacyData.localizedLastName}` : "LinkedIn User",
        };
      }
    }

    // Send the credentials back to the parent React app via postMessage and close the window
    res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>Authentication Successful</title></head>
        <body>
          <p>Link connection successful. Closing window...</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: "LINKEDIN_AUTH_SUCCESS",
                token: "${token}",
                profile: ${JSON.stringify(profileData)}
              }, "*");
            }
            window.close();
          </script>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error("LinkedIn OAuth Exchange Error:", error);
    res.status(500).send(`Authentication failed: ${error.message}`);
  }
});

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

// Fetch analytics for published posts
router.post("/analytics", async (req: any, res: any) => {
  const { token, postIds } = req.body;
  if (!token) {
    return res.status(401).json({ error: "LinkedIn token missing" });
  }
  if (!postIds || !Array.isArray(postIds)) {
    return res.status(400).json({ error: "postIds array is required" });
  }

  try {
    const results: Record<string, any> = {};
    
    await Promise.allSettled(postIds.map(async (postId) => {
      try {
        const encodedUrn = encodeURIComponent(postId);
        const metricsRes = await fetch(`https://api.linkedin.com/v2/socialActions/${encodedUrn}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Restli-Protocol-Version": "2.0.0",
          }
        });
        
        if (metricsRes.ok) {
          const data = await metricsRes.json() as any;
          results[postId] = {
            likes: data?.likesSummary?.totalLikes || 0,
            comments: data?.commentsSummary?.totalFirstLevelComments || 0,
            success: true
          };
        } else {
           results[postId] = { likes: 0, comments: 0, success: false, error: await metricsRes.text() };
        }
      } catch (err) {
        results[postId] = { likes: 0, comments: 0, success: false };
      }
    }));

    return res.json({ success: true, data: results });
  } catch (error: any) {
    console.error("Failed to fetch LinkedIn analytics:", error);
    return res.status(500).json({ error: error.message || "Failed to fetch analytics" });
  }
});

export default router;
