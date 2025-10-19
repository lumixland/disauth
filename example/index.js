import "dotenv/config";
import express from "express";
import { Client } from "disauth";

const app = express();
const port = process.env.PORT || 3000;

const clientId = process.env.DISAUTH_CLIENT_ID;
const clientSecret = process.env.DISAUTH_CLIENT_SECRET;
const redirectUri = process.env.DISAUTH_REDIRECT_URI;

if (!clientId || !clientSecret || !redirectUri) {
  throw new Error("Missing required environment variables.");
}

const disauthClient = new Client({
  clientId,
  clientSecret,
  redirectUri,
  scopes: ["identify", "guilds"],
});

app.get("/login", (_req, res) => {
  const url = disauthClient.generateAuthUrl("xyz123");
  res.redirect(url);
});

app.get("/callback", async (req, res) => {
  const code = req.query.code;
  const tokens = await disauthClient.exchangeCode(code);
  const user = await disauthClient.getUser(tokens.access_token);
  const guilds = await disauthClient.api(
    "/users/@me/guilds",
    tokens.access_token,
  );

  res.json({ user, tokens, guilds });
});

app.listen(port, () => console.log(`Listening on port ${port}`));
