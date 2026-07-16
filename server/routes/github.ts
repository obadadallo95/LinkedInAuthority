import { Router } from "express";
import fetch from "node-fetch";

const router = Router();

// GitHub OAuth Endpoints
router.get("/url", (req: any, res: any) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({ error: "GitHub Client ID not configured" });
  }
  const protocol = req.get("host")?.includes("localhost") ? "http" : "https";
  const redirectUri = `${protocol}://${req.get("host")}/api/oauth/github/callback`;
  const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=repo,user`;
  res.json({ url });
});

router.get("/", (req: any, res: any) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return res.status(500).send("GitHub Client ID not configured");
  }
  const protocol = req.get("host")?.includes("localhost") ? "http" : "https";
  const redirectUri = `${protocol}://${req.get("host")}/api/oauth/github/callback`;
  const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=repo,user`;
  res.redirect(url);
});

router.get("/callback", async (req: any, res: any) => {
  const { code } = req.query;
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).send("GitHub OAuth credentials not configured");
  }

  try {
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });
    const tokenData = await tokenRes.json() as any;
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      throw new Error("Failed to get access token");
    }

    // Fetch user data
    const userRes = await fetch("https://api.github.com/user", {
      headers: { Authorization: `token ${accessToken}` },
    });
    const userData = await userRes.json();

    res.send(`
      <script>
        if (window.opener) {
          window.opener.postMessage({
            type: 'oauth_success',
            accessToken: '${accessToken}',
            userData: ${JSON.stringify(userData)}
          }, window.location.origin);
        } else {
          document.write('Error: Parent window not found.');
        }
      </script>
    `);
  } catch (error) {
    console.error("GitHub OAuth Error:", error);
    res.send(`<script>alert('OAuth failed'); window.close();</script>`);
  }
});

export default router;
