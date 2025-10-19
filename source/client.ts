import { request } from "undici";
import { OAuthConfig, TokenResponse } from "./types.js";
import { DISCORD_API } from "./constants.js";

export class Client {
  constructor(private config: OAuthConfig) {}

  /**
   * Generate the Discord OAuth2 URL
   */
  generateAuthUrl(state?: string, prompt: "consent" | "none" = "consent") {
    const params = new URLSearchParams({
      response_type: "code",
      client_id: this.config.clientId,
      scope: (this.config.scopes ?? ["identify"]).join(" "),
      redirect_uri: this.config.redirectUri,
      prompt,
    });

    if (state) params.set("state", state);

    return `https://discord.com/oauth2/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCode(code: string): Promise<TokenResponse> {
    const data = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: this.config.redirectUri,
    });

    const response = await request(`${DISCORD_API}/oauth2/token`, {
      method: "POST",
      body: data.toString(),
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    if (response.statusCode !== 200)
      throw new Error(`Token exchange failed: ${response.statusCode}`);

    return (await response.body.json()) as TokenResponse;
  }

  /**
   * Get user info using access token
   */
  async getUser(accessToken: string) {
    const res = await request(`${DISCORD_API}/users/@me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (res.statusCode !== 200)
      throw new Error(`Failed to fetch user: ${res.statusCode}`);

    return await res.body.json();
  }

  /**
   * Refresh expired token
   */
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const data = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    });

    const res = await request(`${DISCORD_API}/oauth2/token`, {
      method: "POST",
      body: data.toString(),
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    if (res.statusCode !== 200)
      throw new Error(`Failed to refresh token: ${res.statusCode}`);

    return (await res.body.json()) as TokenResponse;
  }
}
