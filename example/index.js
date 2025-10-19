import "dotenv/config";
import express from 'express';
import { Client } from 'dauth';

const app = express();
const port = process.env.PORT || 3000;

const clientId = process.env.DAUTH_CLIENT_ID;
const clientSecret = process.env.DAUTH_CLIENT_SECRET;
const redirectUri = process.env.DAUTH_REDIRECT_URI;

if (!clientId || !clientSecret || !redirectUri) {
  throw new Error("Missing required environment variables.");
}

const dauthClient = new Client({
  clientId,
  clientSecret,
  redirectUri,
  scopes: ["identify", "email"],
});

app.get("/login", (_req, res) => {
  const url = dauthClient.generateAuthUrl("xyz123");
  res.redirect(url);
});

app.get("/callback", async (req, res) => {
  const code = req.query.code;
  const tokens = await dauthClient.exchangeCode(code);
  const user = await dauthClient.getUser(tokens.access_token);
  res.json({ user, tokens });
});

app.listen(port, () => console.log(`Listening on port ${port}`));