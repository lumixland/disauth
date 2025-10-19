/**
 * List of valid Discord OAuth2 scopes.
 * @constant {readonly string[]} DISCORD_OAUTH_SCOPES
 * @see https://discord.com/developers/docs/topics/oauth2#shared-resources-oauth2-scopes
 * @readonly
 * @type {readonly string[]}
 * @module types
 */
export const DISCORD_OAUTH_SCOPES = [
  "identify",
  "guilds",
  "guilds.channels.read",
  "rpc",
  "rpc.voice.write",
  "rpc.screenshare.read",
  "webhook.incoming",
  "applications.builds.read",
  "applications.entitlements",
  "activities.invites.write",
  "voice",
  "presences.read",
  "dm_channels.messages.read",
  "account.global_name.update",
  "sdk.social_layer",
  "applications.commands.permissions.update",
  "applications.commands.update",
  "email",
  "guilds.join",
  "gdm.join",
  "rpc.notifications.read",
  "rpc.video.read",
  "rpc.screenshare.write",
  "messages.read",
  "applications.commands",
  "activities.read",
  "relationships.read",
  "dm_channels.read",
  "presences.write",
  "dm_channels.messages.write",
  "payment_sources.country_code",
  "lobbies.write",
  "connections",
  "guilds.members.read",
  "bot",
  "rpc.voice.read",
  "rpc.video.write",
  "rpc.activities.write",
  "applications.builds.upload",
  "applications.store.update",
  "activities.write",
  "relationships.write",
  "role_connections.write",
  "openid",
  "gateway.connect",
  "sdk.social_layer_presence",
  "application_identities.write",
] as const;

/**
 * Type representing valid Discord OAuth2 scopes.
 */
export type DiscordScope = (typeof DISCORD_OAUTH_SCOPES)[number];

/**
 * Types related to OAuth configuration and token response.
 * @module types
 */
/**
 * Discord OAuth prompt behaviour.
 */
export type DiscordPrompt = "consent" | "none";

/**
 * PKCE verifier/challenge pair for enhanced security.
 */
export interface PKCEPair {
  verifier: string;
  challenge: string;
  method: "S256";
}

/**
 * Options for generating the Discord authorization URL.
 */
export interface OAuthAuthorizeOptions {
  state?: string;
  prompt?: DiscordPrompt;
  responseType?: "code" | "token";
  codeChallenge?: string;
  codeChallengeMethod?: "S256" | "plain";
  permissions?: string | number;
  disableGuildSelect?: boolean;
  guildId?: string;
  loginHint?: string;
  redirectUri?: string;
  scopes?: DiscordScope[];
}

/**
 * Options accepted when revoking a token.
 */
export interface RevokeTokenOptions {
  tokenTypeHint?: "access_token" | "refresh_token";
}

/**
 * Configuration accepted by the OAuth client.
 */
export interface OAuthConfig {
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  scopes?: DiscordScope[];
  apiBaseUrl?: string;
  oauthBaseUrl?: string;
  defaultPrompt?: DiscordPrompt;
  userAgent?: string;
  requestTimeoutMs?: number;
}

/**
 * Shape of the authenticated Discord user response.
 */
export interface DiscordUser {
  id: string;
  username: string;
  global_name: string | null;
  discriminator: string;
  avatar: string | null;
  bot?: boolean;
  system?: boolean;
  mfa_enabled?: boolean;
  banner?: string | null;
  accent_color?: number | null;
  locale?: string;
  verified?: boolean;
  email?: string | null;
  flags?: number;
  premium_type?: number;
  public_flags?: number;
}

/**
 * Shape of a linked external connection.
 */
export interface DiscordConnection {
  id: string;
  name: string;
  type: string;
  verified: boolean;
  friend_sync: boolean;
  show_activity: boolean;
  visibility: 0 | 1;
  revoked?: boolean;
}

/**
 * Partial guild object returned from `/users/@me/guilds`.
 */
export interface DiscordPartialGuild {
  id: string;
  name: string;
  icon: string | null;
  owner?: boolean;
  permissions: string;
  features: string[];
}

/**
 * Error payload returned by the OAuth endpoints.
 */
export interface OAuthErrorPayload {
  error: string;
  error_description?: string;
}

/**
 * Token response returned by Discord OAuth token endpoints.
 */
export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}
